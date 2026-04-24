import { useState, useRef, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import VideoPlayer from "@/components/VideoPlayer";
import ChatControls from "@/components/ChatControls";
import SearchingOverlay from "@/components/SearchingOverlay";
import ConnectionStatus from "@/components/ConnectionStatus";
import ReportDialog from "@/components/ReportDialog";
import { toast } from "@/hooks/use-toast";
import { Zap, Send } from "lucide-react";
import { useWebRTC } from "@/hooks/useWebRTC";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Status = "idle" | "searching" | "connected" | "disconnected";

interface Message {
  id: string;
  text: string;
  sender: "me" | "stranger" | "system";
  timestamp: Date;
}

const MY_ID = Math.random().toString(36).substring(7);

const Index = () => {
  const [status, setStatus] = useState<Status>("idle");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const localStreamRef = useRef<MediaStream | null>(null);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const currentRoomRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    currentRoomRef.current = currentRoom;
  }, [currentRoom]);

  const addMessage = useCallback((text: string, sender: "me" | "stranger" | "system") => {
    setMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        text,
        sender,
        timestamp: new Date(),
      },
    ]);
  }, []);

  const onRemoteStream = useCallback((stream: MediaStream) => {
    setRemoteStream(stream);
    setStatus("connected");
    toast({ title: "Stranger connected!", description: "Say hello 👋" });
    addMessage("You are now chatting with a random stranger. Say hi!", "system");
  }, [addMessage]);

  const onMessage = useCallback((text: string) => {
    addMessage(text, "stranger");
    setIsChatOpen(true); // Pop up chat when message received
  }, [addMessage]);

  const onConnectionStateChange = useCallback((state: RTCPeerConnectionState) => {
    if (state === "disconnected" || state === "failed" || state === "closed") {
      setStatus("disconnected");
      setRemoteStream(null);
      addMessage("Stranger has disconnected.", "system");
    }
  }, [addMessage]);

  const { startConnection, stopConnection, sendMessage } = useWebRTC({
    localStream,
    onRemoteStream,
    onMessage,
    onConnectionStateChange,
  });

  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim()) return;
    sendMessage(inputValue);
    addMessage(inputValue, "me");
    setInputValue("");
  }, [inputValue, sendMessage, addMessage]);

  const getMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch {
      toast({
        title: "Camera access denied",
        description: "Please allow camera and microphone access to use video chat.",
        variant: "destructive",
      });
      return null;
    }
  }, []);

  const stopMedia = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    stopConnection();
  }, [stopConnection]);

  const handleStartChat = useCallback(async () => {
    const stream = await getMedia();
    if (!stream) return;
    setStatus("searching");
    setMessages([]);

    // Matchmaking logic
    const lobby = supabase.channel("matchmaking-lobby", {
      config: {
        presence: {
          key: MY_ID,
        },
      },
    });

    lobby
      .on("presence", { event: "sync" }, () => {
        const state = lobby.presenceState();
        const otherUsers = Object.keys(state).filter((id) => id !== MY_ID);

        if (otherUsers.length > 0) {
          // Found someone! Deterministically choose who initiates based on ID
          const partnerId = otherUsers[0];
          const roomId = [MY_ID, partnerId].sort().join("-");
          const isInitiator = MY_ID < partnerId;

          lobby.send({
            type: "broadcast",
            event: "match-found",
            payload: { roomId, users: [MY_ID, partnerId], initiator: isInitiator ? MY_ID : partnerId },
          });
        }
      })
      .on("broadcast", { event: "match-found" }, ({ payload }) => {
        if (payload.users.includes(MY_ID) && !currentRoomRef.current) {
          setCurrentRoom(payload.roomId);
          const isOfferer = payload.initiator === MY_ID;
          startConnection(payload.roomId, isOfferer);
          supabase.removeChannel(lobby);
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await lobby.track({ online_at: new Date().toISOString() });
        }
      });
  }, [getMedia, startConnection]);

  const handleDisconnect = useCallback(() => {
    stopMedia();
    setStatus("idle");
    if (currentRoom) {
      supabase.removeChannel(supabase.channel(currentRoom));
      setCurrentRoom(null);
    }
  }, [stopMedia, currentRoom]);

  const handleSkip = useCallback(async () => {
    handleDisconnect();
    handleStartChat();
  }, [handleDisconnect, handleStartChat]);

  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  }, []);

  const toggleMic = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  }, []);

  const handleBlock = useCallback(() => {
    toast({
      title: "User blocked",
      description: "You won't be matched with this user again.",
    });
    handleSkip();
  }, [handleSkip]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const isConnected = status === "connected";
  const isSearching = status === "searching";

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border bg-card/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Buddy<span className="text-primary text-glow">C</span>hat
          </h1>
        </div>
        <ConnectionStatus
          status={status}
        />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* Video grid */}
        <div className="flex-[2] grid grid-cols-1 md:grid-cols-2 gap-3 p-3 sm:p-4 min-h-0 overflow-auto">
          {/* Remote video (or placeholder) */}
          <div className="relative aspect-video md:aspect-auto min-h-[200px]">
            <AnimatePresence>
              {isSearching && <SearchingOverlay />}
            </AnimatePresence>

            {!isConnected && !isSearching ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full h-full rounded-xl bg-secondary border border-border flex flex-col items-center justify-center gap-4 p-6 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
                  <Zap className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-1">
                    Meet Random Strangers
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Click <span className="text-primary font-medium">Start Chat</span> to connect with someone new from around the world.
                  </p>
                </div>
              </motion.div>
            ) : (
              <VideoPlayer
                stream={remoteStream}
                label="Stranger"
              />
            )}
          </div>

          {/* Local video */}
          <div className="aspect-video md:aspect-auto min-h-[200px]">
            <VideoPlayer
              stream={localStream}
              muted
              label="You"
              isLocal
              isMicMuted={!isMicOn}
            />
          </div>
        </div>

        {/* Chat Panel */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, x: 20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: "auto" }}
              exit={{ opacity: 0, x: 20, width: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 120 }}
              className="flex-1 border-l border-border bg-card/30 flex flex-col min-h-0 w-full md:max-w-md overflow-hidden"
            >
              <div className="p-3 border-b border-border text-sm font-semibold text-muted-foreground">
                Chat
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.sender === "me"
                        ? "items-end"
                        : msg.sender === "system"
                          ? "items-center"
                          : "items-start"
                        }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${msg.sender === "me"
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : msg.sender === "system"
                            ? "bg-secondary/50 text-muted-foreground italic text-xs"
                            : "bg-secondary text-secondary-foreground rounded-tl-none"
                          }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1 px-1">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              <div className="p-4 border-t border-border bg-card/50">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    placeholder={isConnected ? "Type a message..." : "Connect to chat"}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={!isConnected}
                    className="bg-background/50 border-border focus:ring-primary"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!isConnected || !inputValue.trim()}
                    className="shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Controls */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm shrink-0">
        <ChatControls
          isConnected={isConnected}
          isSearching={isSearching}
          isCameraOn={isCameraOn}
          isMicOn={isMicOn}
          isChatOpen={isChatOpen}
          onStartChat={handleStartChat}
          onSkip={handleSkip}
          onDisconnect={handleDisconnect}
          onToggleCamera={toggleCamera}
          onToggleMic={toggleMic}
          onToggleChat={() => setIsChatOpen((prev) => !prev)}
          onReport={() => setReportOpen(true)}
          onBlock={handleBlock}
        />
      </div>

      <ReportDialog open={reportOpen} onOpenChange={setReportOpen} />
    </div>
  );
};

export default Index;

