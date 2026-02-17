import { motion } from "framer-motion";

const SearchingOverlay = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 bg-background/80 backdrop-blur-md rounded-xl"
    >
      {/* Pulsing rings */}
      <div className="relative flex items-center justify-center">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute w-20 h-20 rounded-full border-2 border-primary/40"
            animate={{
              scale: [1, 2.5],
              opacity: [0.6, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.6,
              ease: "easeOut",
            }}
          />
        ))}
        <div className="w-14 h-14 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
          <motion.div
            className="w-4 h-4 rounded-full bg-primary"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
      </div>

      <div className="text-center">
        <p className="text-lg font-semibold text-foreground text-glow">
          Looking for someone...
        </p>
        <p className="text-sm text-muted-foreground mt-1 font-mono">
          Connecting you with a random stranger
        </p>
      </div>
    </motion.div>
  );
};

export default SearchingOverlay;
