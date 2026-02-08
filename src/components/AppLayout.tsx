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
  const { signOut } = useAuth();
  const location = useLocation();

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop sidebar */}
      <AppSidebar />

      {/* Main content area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile header */}
        <header className="flex items-center justify-between border-b bg-card/80 backdrop-blur-lg px-4 py-3 md:hidden sticky top-0 z-40">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-hero">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight">PostPartner <span className="text-primary text-xs font-medium">AI</span></span>
          </Link>
          <Button variant="ghost" size="sm" onClick={signOut} className="h-8 w-8 p-0">
            <LogOut className="h-4 w-4" />
          </Button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 pb-24 md:p-8 md:pb-8 bg-dot-pattern">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t bg-card/90 backdrop-blur-lg md:hidden safe-area-inset-bottom">
          {mobileNav.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${active ? "bg-primary/10" : ""}`}>
                  <Icon className="h-[18px] w-[18px]" />
                </div>
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
