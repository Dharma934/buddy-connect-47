import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { VideoOff, Mic, MicOff } from "lucide-react";

interface VideoPlayerProps {
  stream: MediaStream | null;
  muted?: boolean;
  label: string;
  isLocal?: boolean;
  isMicMuted?: boolean;
}

const VideoPlayer = ({ stream, muted = false, label, isLocal = false, isMicMuted = false }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative w-full h-full rounded-xl overflow-hidden bg-secondary border border-border"
    >
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className={`w-full h-full object-cover ${isLocal ? "scale-x-[-1]" : ""}`}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3">
          <VideoOff className="w-12 h-12 text-muted-foreground" />
          <span className="text-sm text-muted-foreground font-mono">No video</span>
        </div>
      )}

      {/* Label badge */}
      <div className="absolute top-3 left-3 flex items-center gap-2">
        <span className="px-2.5 py-1 rounded-md bg-background/70 backdrop-blur-sm text-xs font-medium text-foreground border border-border">
          {label}
        </span>
        {isLocal && (
          <span className="p-1.5 rounded-md bg-background/70 backdrop-blur-sm border border-border">
            {isMicMuted ? (
              <MicOff className="w-3.5 h-3.5 text-destructive" />
            ) : (
              <Mic className="w-3.5 h-3.5 text-primary" />
            )}
          </span>
        )}
      </div>

      {/* Live indicator for remote */}
      {!isLocal && stream && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-destructive/80 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-foreground animate-pulse" />
          <span className="text-xs font-mono font-medium text-destructive-foreground">LIVE</span>
        </div>
      )}
    </motion.div>
  );
};

export default VideoPlayer;
