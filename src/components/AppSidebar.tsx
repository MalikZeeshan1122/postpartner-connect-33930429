import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import {
  Lightbulb,
  PenTool,
  CalendarDays,
  LayoutGrid,
  ImageIcon,
  Settings,
  LogOut,
  Bell,
  HelpCircle,
  Moon,
  Sun,
  Clock,
  BarChart3,
  Users,
  Sparkles,
} from "lucide-react";

const mainNav = [
  { to: "/", label: "Ideas", icon: Lightbulb },
  { to: "/generate", label: "Posts", icon: PenTool },
  { to: "/schedule", label: "Schedule", icon: Clock },
  { to: "/planner", label: "Calendar", icon: CalendarDays },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/brands", label: "Brand Grid", icon: LayoutGrid },
  { to: "/media", label: "Media Library", icon: ImageIcon },
];

const toolsNav = [
  { to: "/team", label: "Team", icon: Users },
  { to: "/settings", label: "Settings", icon: Settings },
];

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark") setDark(true);
    else if (stored === "light") setDark(false);
    else if (window.matchMedia("(prefers-color-scheme: dark)").matches) setDark(true);
  }, []);

  return [dark, setDark] as const;
}

export default function AppSidebar() {
  const { signOut, user } = useAuth();
  const { profile } = useProfile();
  const location = useLocation();
  const [dark, setDark] = useDarkMode();

  const isActive = (path: string) => location.pathname === path;

  const userInitial = user?.email?.charAt(0).toUpperCase() || "U";
  const displayName = user?.email?.split("@")[0] || "User";

  return (
    <aside className="hidden md:flex w-[260px] flex-col border-r bg-sidebar-background text-sidebar-foreground">
      {/* Brand header */}
      <div className="border-b px-5 py-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-hero shadow-glow">
            <Sparkles className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight">PostPartner</span>
            <span className="ml-1 text-xs font-medium text-primary">AI</span>
          </div>
        </Link>
      </div>

      {/* User card */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center gap-3 rounded-xl bg-sidebar-accent/60 px-3 py-2.5">
          <Avatar className="h-8 w-8 ring-2 ring-primary/20">
            {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
            <AvatarFallback className="gradient-primary text-primary-foreground text-xs font-bold">
              {userInitial}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{displayName}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
          Workspace
        </p>
        {mainNav.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
              isActive(to)
                ? "bg-primary/10 text-primary shadow-sm sidebar-link-active"
                : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            }`}
          >
            <Icon className={`h-[18px] w-[18px] shrink-0 ${isActive(to) ? "text-primary" : ""}`} />
            {label}
          </Link>
        ))}

        <div className="pt-5 pb-2">
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            Tools
          </p>
        </div>

        {toolsNav.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
              isActive(to)
                ? "bg-primary/10 text-primary shadow-sm sidebar-link-active"
                : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            }`}
          >
            <Icon className={`h-[18px] w-[18px] shrink-0 ${isActive(to) ? "text-primary" : ""}`} />
            {label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t px-3 py-3 space-y-0.5">
        <button
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[13px] text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200"
          onClick={() => setDark(!dark)}
        >
          {dark ? <Sun className="h-[18px] w-[18px] shrink-0" /> : <Moon className="h-[18px] w-[18px] shrink-0" />}
          {dark ? "Light Mode" : "Dark Mode"}
        </button>
        <button
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[13px] text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200"
          onClick={() => {}}
        >
          <HelpCircle className="h-[18px] w-[18px] shrink-0" />
          Support
        </button>
        <button
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[13px] text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200"
          onClick={() => {}}
        >
          <Bell className="h-[18px] w-[18px] shrink-0" />
          Notifications
        </button>
        <div className="my-1 border-t" />
        <button
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[13px] text-destructive/70 hover:bg-destructive/8 hover:text-destructive transition-all duration-200"
          onClick={signOut}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          Log out
        </button>
      </div>
    </aside>
  );
}
