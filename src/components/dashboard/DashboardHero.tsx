import { motion } from "framer-motion";
import { Sparkles, Zap } from "lucide-react";

const DashboardHero = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl gradient-hero p-8 text-white"
    >
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-10 -right-10 h-44 w-44 rounded-full bg-white/10 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 15, 0], scale: [1, 1.3, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-white/10 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, 15, 0], y: [0, 10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-1/2 left-1/3 h-28 w-28 rounded-full bg-white/5 blur-2xl"
        />
        {/* Mesh grid overlay for depth */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="h-8 w-8 drop-shadow-lg" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">PostPartner AI</h1>
              <div className="h-0.5 w-16 mt-1 rounded-full bg-white/30" />
            </div>
          </div>
          <p className="text-sm opacity-85 max-w-lg leading-relaxed mt-2">
            Your AI companion for creating on-brand social media content. From brand
            analysis to published posts — at machine speed.
          </p>
        </div>
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="hidden sm:flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm border border-white/10"
        >
          <Zap className="h-8 w-8 drop-shadow-lg" />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DashboardHero;
