import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import AppSidebar from "@/components/AppSidebar";
import {
  Sparkles,
  Lightbulb,
  PenTool,
  CalendarDays,
  LayoutGrid,
  ImageIcon,
  Settings,
  LogOut,
} from "lucide-react";

const mobileNav = [
  { to: "/", icon: Lightbulb, label: "Ideas" },
  { to: "/generate", icon: PenTool, label: "Posts" },
  { to: "/planner", icon: CalendarDays, label: "Calendar" },
  { to: "/media", icon: ImageIcon, label: "Media" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { signOut, user } = useAuth();
  const location = useLocation();

  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop sidebar */}
      <AppSidebar />

      {/* Mobile header */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-card px-4 py-3 md:hidden">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold">PostPartner</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </header>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t bg-card md:hidden">
          {mobileNav.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-1 flex-col items-center gap-1 py-2 text-[10px] ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 overflow-auto p-4 pb-20 md:p-8 md:pb-8">{children}</main>
      </div>
    </div>
  );
}
