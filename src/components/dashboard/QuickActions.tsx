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
    gradient: "from-primary/15 to-transparent",
  },
  {
    title: "Plan Content",
    description: "Calendar & scheduling",
    icon: CalendarDays,
    path: "/planner",
    gradient: "from-accent/15 to-transparent",
  },
  {
    title: "Generate Posts",
    description: "AI-powered creation",
    icon: PenTool,
    path: "/generate",
    gradient: "from-amber-500/15 to-transparent",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};
const item = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4 } },
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
      {actions.map(({ title, description, icon: Icon, path, gradient }) => (
        <motion.div key={path} variants={item}>
          <Card
            className="group cursor-pointer relative overflow-hidden transition-all hover:shadow-glow hover:-translate-y-1 duration-300"
            onClick={() => navigate(path)}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            <CardContent className="relative flex items-center gap-3 p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 group-hover:scale-110 transition-transform duration-300">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform duration-300" />
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default QuickActions;
