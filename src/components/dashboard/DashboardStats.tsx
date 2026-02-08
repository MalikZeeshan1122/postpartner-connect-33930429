import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { PenTool, Sparkles, CalendarDays, Palette } from "lucide-react";

interface DashboardStatsProps {
  stats: {
    totalPosts: number;
    approvedPosts: number;
    scheduledThisWeek: number;
    brands: number;
  };
}

const statConfig = [
  { key: "totalPosts", label: "Total Posts", icon: PenTool, gradient: "from-primary/20 to-primary/5" },
  { key: "approvedPosts", label: "Approved", icon: Sparkles, gradient: "from-accent/20 to-accent/5" },
  { key: "scheduledThisWeek", label: "This Week", icon: CalendarDays, gradient: "from-amber-500/20 to-amber-500/5" },
  { key: "brands", label: "Brands", icon: Palette, gradient: "from-primary/20 to-primary/5" },
] as const;

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const DashboardStats = ({ stats }: DashboardStatsProps) => {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 sm:grid-cols-4 gap-3"
    >
      {statConfig.map(({ key, label, icon: Icon, gradient }) => (
        <motion.div key={key} variants={item}>
          <Card className="group relative overflow-hidden transition-all hover:shadow-glow hover:-translate-y-0.5">
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            <CardContent className="relative flex items-center gap-3 p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{stats[key]}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default DashboardStats;
