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
} from "lucide-react";

const mainNav = [
  { to: "/", label: "Ideas", icon: Lightbulb },
  { to: "/generate", label: "Posts", icon: PenTool },
  { to: "/planner", label: "Calendar", icon: CalendarDays },
  { to: "/brands", label: "Instagram Grid", icon: LayoutGrid },
  { to: "/media", label: "Media Library", icon: ImageIcon },
];

const toolsNav = [
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

  // Initialize from localStorage on mount
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
    <aside className="hidden md:flex w-60 flex-col border-r bg-sidebar-background text-sidebar-foreground">
      {/* User header */}
      <div className="border-b p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
            <AvatarFallback className="gradient-primary text-primary-foreground text-sm font-bold">
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
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {mainNav.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive(to)
                ? "bg-sidebar-accent text-sidebar-primary"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}

        <div className="pt-4 pb-1">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tools</p>
        </div>

        {toolsNav.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive(to)
                ? "bg-sidebar-accent text-sidebar-primary"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t p-3 space-y-1">
        <button
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          onClick={() => setDark(!dark)}
        >
          {dark ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
          {dark ? "Light Mode" : "Dark Mode"}
        </button>
        <button
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          onClick={() => {}}
        >
          <HelpCircle className="h-4 w-4 shrink-0" />
          Support
        </button>
        <button
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          onClick={() => {}}
        >
          <Bell className="h-4 w-4 shrink-0" />
          Notifications
        </button>
        <button
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-colors"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Log out
        </button>
      </div>
    </aside>
  );
}
