import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Palette, CalendarDays, PenTool } from "lucide-react";

const actions = [
  {
    title: "Setup Brand",
    description: "AI analyzes your brand",
    icon: Palette,
    path: "/brands",
    iconBg: "bg-violet-500/10 group-hover:bg-violet-500/20",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  {
    title: "Plan Content",
    description: "Calendar & scheduling",
    icon: CalendarDays,
    path: "/planner",
    iconBg: "bg-emerald-500/10 group-hover:bg-emerald-500/20",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    title: "Generate Posts",
    description: "AI-powered creation",
    icon: PenTool,
    path: "/generate",
    iconBg: "bg-amber-500/10 group-hover:bg-amber-500/20",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid gap-3 sm:grid-cols-3"
    >
      {actions.map(({ title, description, icon: Icon, path, iconBg, iconColor }) => (
        <motion.div key={path} variants={item}>
          <Card
            className="group cursor-pointer card-shine transition-all hover:shadow-glow hover:-translate-y-1 duration-300 border-border/60"
            onClick={() => navigate(path)}
          >
            <CardContent className="relative flex items-center gap-3.5 p-4">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg} transition-all duration-300`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default QuickActions;
