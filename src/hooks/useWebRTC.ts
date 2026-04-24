import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface WebRTCOptions {
    localStream: MediaStream | null;
    onRemoteStream: (stream: MediaStream) => void;
    onMessage: (message: string) => void;
    onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
}

export const useWebRTC = ({ localStream, onRemoteStream, onMessage, onConnectionStateChange }: WebRTCOptions) => {
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const dataChannel = useRef<RTCDataChannel | null>(null);
    const [roomName, setRoomName] = useState<string | null>(null);
    const [isInitiator, setIsInitiator] = useState(false);
    const roomNameRef = useRef<string | null>(null);
    const isInitiatorRef = useRef(false);

    const setupDataChannel = useCallback((channel: RTCDataChannel) => {
        channel.onmessage = (event) => {
            onMessage(event.data);
        };
        dataChannel.current = channel;
    }, [onMessage]);

    const createPeerConnection = useCallback(() => {
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
            ],
        });

        pc.onicecandidate = (event) => {
            if (event.candidate && roomNameRef.current) {
                supabase.channel(roomNameRef.current).send({
                    type: "broadcast",
                    event: "ice-candidate",
                    payload: event.candidate,
                });
            }
        };

        pc.ontrack = (event) => {
            if (event.streams && event.streams[0]) {
                onRemoteStream(event.streams[0]);
            }
        };

        pc.onconnectionstatechange = () => {
            if (onConnectionStateChange) {
                onConnectionStateChange(pc.connectionState);
            }
        };

        pc.ondatachannel = (event) => {
            setupDataChannel(event.channel);
        };

        if (localStream) {
            localStream.getTracks().forEach((track) => {
                pc.addTrack(track, localStream);
            });
        }

        peerConnection.current = pc;
        return pc;
    }, [localStream, onRemoteStream, onConnectionStateChange, setupDataChannel]);

    const handleOffer = useCallback(async (offer: RTCSessionDescriptionInit) => {
        if (!peerConnection.current) createPeerConnection();
        const pc = peerConnection.current!;
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        if (roomNameRef.current) {
            supabase.channel(roomNameRef.current).send({
                type: "broadcast",
                event: "answer",
                payload: answer,
            });
        }
    }, [createPeerConnection]);

    const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
        if (peerConnection.current) {
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
        }
    }, []);

    const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
        if (peerConnection.current) {
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
    }, []);

    useEffect(() => {
        if (!roomName) return;
        roomNameRef.current = roomName;
        isInitiatorRef.current = isInitiator;

        const channel = supabase.channel(roomName);

        channel
            .on("broadcast", { event: "offer" }, ({ payload }) => {
                if (!isInitiatorRef.current) handleOffer(payload);
            })
            .on("broadcast", { event: "answer" }, ({ payload }) => {
                if (isInitiatorRef.current) handleAnswer(payload);
            })
            .on("broadcast", { event: "ice-candidate" }, ({ payload }) => {
                handleIceCandidate(payload);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomName, isInitiator, handleOffer, handleAnswer, handleIceCandidate]);

    const startConnection = async (room: string, isOffer: boolean) => {
        setRoomName(room);
        setIsInitiator(isOffer);
        roomNameRef.current = room;
        isInitiatorRef.current = isOffer;

        const pc = createPeerConnection();

        if (isOffer) {
            const chatChannel = pc.createDataChannel("chat");
            setupDataChannel(chatChannel);

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            // Wait for subscription to be ready before sending
            setTimeout(() => {
                supabase.channel(room).send({
                    type: "broadcast",
                    event: "offer",
                    payload: offer,
                });
            }, 1000);
        }
    };

    const stopConnection = () => {
        if (dataChannel.current) {
            dataChannel.current.close();
            dataChannel.current = null;
        }
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        setRoomName(null);
        setIsInitiator(false);
    };

    const sendMessage = (message: string) => {
        if (dataChannel.current && dataChannel.current.readyState === "open") {
            dataChannel.current.send(message);
        }
    };

    return { startConnection, stopConnection, sendMessage };
};
