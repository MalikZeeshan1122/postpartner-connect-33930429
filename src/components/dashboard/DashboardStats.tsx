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
  {
    key: "totalPosts",
    label: "Total Posts",
    icon: PenTool,
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  {
    key: "approvedPosts",
    label: "Approved",
    icon: Sparkles,
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    key: "scheduledThisWeek",
    label: "This Week",
    icon: CalendarDays,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    key: "brands",
    label: "Brands",
    icon: Palette,
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
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
      {statConfig.map(({ key, label, icon: Icon, iconBg, iconColor }) => (
        <motion.div key={key} variants={item}>
          <Card className="group transition-all hover:shadow-glow hover:-translate-y-0.5 duration-300 border-border/60">
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg} transition-colors`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums tracking-tight">{stats[key]}</p>
                <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default DashboardStats;
