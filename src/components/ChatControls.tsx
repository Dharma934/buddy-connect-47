import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  SkipForward,
  Phone,
  PhoneOff,
  Flag,
  Ban,
  MessageSquare,
} from "lucide-react";

interface ChatControlsProps {
  isConnected: boolean;
  isSearching: boolean;
  isCameraOn: boolean;
  isMicOn: boolean;
  isChatOpen: boolean;
  onStartChat: () => void;
  onSkip: () => void;
  onDisconnect: () => void;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onToggleChat: () => void;
  onReport: () => void;
  onBlock: () => void;
}

const ChatControls = ({
  isConnected,
  isSearching,
  isCameraOn,
  isMicOn,
  isChatOpen,
  onStartChat,
  onSkip,
  onDisconnect,
  onToggleCamera,
  onToggleMic,
  onToggleChat,
  onReport,
  onBlock,
}: ChatControlsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center justify-center gap-3 p-4"
    >
      {/* Media controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="icon"
          onClick={onToggleCamera}
          className={`rounded-full w-12 h-12 ${!isCameraOn ? "bg-destructive/20 border-destructive/50 text-destructive" : ""}`}
        >
          {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={onToggleMic}
          className={`rounded-full w-12 h-12 ${!isMicOn ? "bg-destructive/20 border-destructive/50 text-destructive" : ""}`}
        >
          {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={onToggleChat}
          className={`rounded-full w-12 h-12 ${isChatOpen ? "bg-primary/20 border-primary/50 text-primary" : ""}`}
        >
          <MessageSquare className="w-5 h-5" />
        </Button>
      </div>

      {/* Primary action */}
      {!isConnected && !isSearching && (
        <Button
          onClick={onStartChat}
          className="rounded-full h-12 px-8 text-base font-semibold glow-primary bg-primary text-primary-foreground hover:bg-primary/80"
        >
          <Phone className="w-5 h-5 mr-2" />
          Start Chat
        </Button>
      )}

      {isSearching && (
        <Button
          onClick={onDisconnect}
          variant="outline"
          className="rounded-full h-12 px-8 text-base font-semibold"
        >
          Cancel
        </Button>
      )}

      {isConnected && (
        <>
          <Button
            onClick={onSkip}
            className="rounded-full h-12 px-8 text-base font-semibold bg-accent text-accent-foreground hover:bg-accent/80 glow-accent"
          >
            <SkipForward className="w-5 h-5 mr-2" />
            Next
          </Button>
          <Button
            onClick={onDisconnect}
            variant="destructive"
            className="rounded-full w-12 h-12 glow-destructive"
            size="icon"
          >
            <PhoneOff className="w-5 h-5" />
          </Button>
        </>
      )}

      {/* Report/Block */}
      {isConnected && (
        <div className="flex items-center gap-2 ml-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onReport}
            className="rounded-full w-10 h-10 text-muted-foreground hover:text-destructive"
          >
            <Flag className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onBlock}
            className="rounded-full w-10 h-10 text-muted-foreground hover:text-destructive"
          >
            <Ban className="w-4 h-4" />
          </Button>
        </div>
      )}
    </motion.div>
  );
};

export default ChatControls;
