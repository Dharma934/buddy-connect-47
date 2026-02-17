import { useState, useRef, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import VideoPlayer from "@/components/VideoPlayer";
import ChatControls from "@/components/ChatControls";
import SearchingOverlay from "@/components/SearchingOverlay";
import ConnectionStatus from "@/components/ConnectionStatus";
import ReportDialog from "@/components/ReportDialog";
import { toast } from "@/hooks/use-toast";
import { Zap } from "lucide-react";

type Status = "idle" | "searching" | "connected" | "disconnected";

const Index = () => {
  const [status, setStatus] = useState<Status>("idle");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);
  const localStreamRef = useRef<MediaStream | null>(null);

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
  }, []);

  const handleStartChat = useCallback(async () => {
    const stream = await getMedia();
    if (!stream) return;
    setStatus("searching");

    // Simulate finding a match after 2-4 seconds (replace with real signaling)
    const delay = 2000 + Math.random() * 2000;
    setTimeout(() => {
      // In production, remoteStream would come from WebRTC peer connection
      setRemoteStream(null); // No real remote stream in UI-only mode
      setStatus("connected");
      toast({ title: "Stranger connected!", description: "Say hello 👋" });
    }, delay);
  }, [getMedia]);

  const handleDisconnect = useCallback(() => {
    stopMedia();
    setStatus("idle");
  }, [stopMedia]);

  const handleSkip = useCallback(async () => {
    setRemoteStream(null);
    setStatus("searching");
    toast({ title: "Skipped", description: "Finding a new stranger..." });

    const delay = 2000 + Math.random() * 2000;
    setTimeout(() => {
      setStatus("connected");
      toast({ title: "New stranger connected!" });
    }, delay);
  }, []);

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

  const isConnected = status === "connected";
  const isSearching = status === "searching";

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border bg-card/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Rand<span className="text-primary text-glow">o</span>Chat
          </h1>
        </div>
        <ConnectionStatus
          status={status}
          onlineCount={Math.floor(1200 + Math.random() * 800)}
        />
      </header>

      {/* Video grid */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 p-3 sm:p-4 min-h-0">
        {/* Remote video (or placeholder) */}
        <div className="relative min-h-0">
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
        <div className="min-h-0">
          <VideoPlayer
            stream={localStream}
            muted
            label="You"
            isLocal
            isMicMuted={!isMicOn}
          />
        </div>
      </main>

      {/* Controls */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm shrink-0">
        <ChatControls
          isConnected={isConnected}
          isSearching={isSearching}
          isCameraOn={isCameraOn}
          isMicOn={isMicOn}
          onStartChat={handleStartChat}
          onSkip={handleSkip}
          onDisconnect={handleDisconnect}
          onToggleCamera={toggleCamera}
          onToggleMic={toggleMic}
          onReport={() => setReportOpen(true)}
          onBlock={handleBlock}
        />
      </div>

      <ReportDialog open={reportOpen} onOpenChange={setReportOpen} />
    </div>
  );
};

export default Index;
