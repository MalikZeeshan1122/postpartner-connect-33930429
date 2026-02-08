import { motion } from "framer-motion";
import { Sparkles, Zap } from "lucide-react";

const DashboardHero = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl gradient-primary p-8 text-primary-foreground"
    >
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 15, 0], scale: [1, 1.3, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/10 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, 15, 0], y: [0, 10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-1/2 left-1/3 h-24 w-24 rounded-full bg-white/5 blur-2xl"
        />
      </div>

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="h-8 w-8" />
            </motion.div>
            <h1 className="text-3xl font-bold tracking-tight">PostPartner AI</h1>
          </div>
          <p className="text-sm opacity-90 max-w-lg leading-relaxed">
            Your AI companion for creating on-brand social media content. From brand
            analysis to published posts — at machine speed.
          </p>
        </div>
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="hidden sm:flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm"
        >
          <Zap className="h-8 w-8" />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DashboardHero;
