import { motion } from "framer-motion";
import { Users, Wifi, WifiOff } from "lucide-react";

interface ConnectionStatusProps {
  status: "idle" | "searching" | "connected" | "disconnected";
  onlineCount?: number;
}

const statusConfig = {
  idle: { color: "text-muted-foreground", icon: WifiOff, label: "Ready to connect" },
  searching: { color: "text-primary", icon: Wifi, label: "Searching..." },
  connected: { color: "text-primary", icon: Wifi, label: "Connected" },
  disconnected: { color: "text-destructive", icon: WifiOff, label: "Disconnected" },
};

const ConnectionStatus = ({ status, onlineCount = 0 }: ConnectionStatusProps) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-4 text-sm">
      <motion.div
        className={`flex items-center gap-1.5 ${config.color}`}
        animate={status === "searching" ? { opacity: [1, 0.5, 1] } : {}}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <Icon className="w-4 h-4" />
        <span className="font-mono text-xs">{config.label}</span>
      </motion.div>

      {onlineCount > 0 && (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Users className="w-4 h-4" />
          <span className="font-mono text-xs">{onlineCount.toLocaleString()} online</span>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;
