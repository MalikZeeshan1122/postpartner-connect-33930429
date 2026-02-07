import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  Loader2,
  Clock,
  Trash2,
  CalendarDays,
  Linkedin,
  Instagram,
  CheckCircle2,
  AlertCircle,
  List,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  format,
  isAfter,
  isBefore,
  startOfDay,
  addDays,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import ScheduleTimelineView from "@/components/schedule/ScheduleTimelineView";
import ScheduleCalendarView from "@/components/schedule/ScheduleCalendarView";

export interface ScheduledPost {
  id: string;
  platform: string;
  caption: string;
  text_overlay: string | null;
  image_url: string | null;
  cta_text: string | null;
  format: string;
  scheduled_at: string;
  status: string;
  created_at: string;
  brand_id: string | null;
}

export const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  scheduled: { label: "Scheduled", color: "bg-primary/10 text-primary border-primary/20", icon: Clock },
  published: { label: "Published", color: "bg-green-500/10 text-green-600 border-green-500/20", icon: CheckCircle2 },
  failed: { label: "Failed", color: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertCircle },
};

const Schedule = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [view, setView] = useState<"timeline" | "calendar">("calendar");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading]);

  useEffect(() => {
    if (user) fetchPosts();
  }, [user]);

  const fetchPosts = async () => {
    setLoadingPosts(true);
    const { data, error } = await supabase
      .from("scheduled_posts")
      .select("*")
      .order("scheduled_at", { ascending: true });

    if (error) {
      toast({ title: error.message, variant: "destructive" });
    }
    setPosts((data as ScheduledPost[]) || []);
    setLoadingPosts(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("scheduled_posts").delete().eq("id", id);
    if (error) {
      toast({ title: error.message, variant: "destructive" });
    } else {
      setPosts((prev) => prev.filter((p) => p.id !== id));
      toast({ title: "Post removed from schedule" });
    }
  };

  const handleReschedule = useCallback(async (id: string, newDate: string) => {
    if (!newDate) return;
    const { error } = await supabase
      .from("scheduled_posts")
      .update({ scheduled_at: new Date(newDate).toISOString() })
      .eq("id", id);

    if (error) {
      toast({ title: error.message, variant: "destructive" });
    } else {
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, scheduled_at: new Date(newDate).toISOString() } : p))
      );
      toast({ title: "Post rescheduled" });
    }
  }, []);

  if (authLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Content Schedule</h1>
            <p className="text-muted-foreground">Calendar and timeline of your scheduled posts</p>
          </div>
          <Button onClick={() => navigate("/generate")} className="gradient-primary gap-1">
            <CalendarDays className="h-4 w-4" /> Create Post
          </Button>
        </div>

        {/* View toggle */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={view === "calendar" ? "default" : "outline"}
            onClick={() => setView("calendar")}
            className="gap-1"
          >
            <LayoutGrid className="h-4 w-4" /> Calendar
          </Button>
          <Button
            size="sm"
            variant={view === "timeline" ? "default" : "outline"}
            onClick={() => setView("timeline")}
            className="gap-1"
          >
            <List className="h-4 w-4" /> Timeline
          </Button>
          <span className="ml-auto text-sm text-muted-foreground self-center">
            {posts.length} post{posts.length !== 1 && "s"}
          </span>
        </div>

        {loadingPosts ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : view === "calendar" ? (
          <ScheduleCalendarView
            posts={posts}
            onDelete={handleDelete}
            onReschedule={handleReschedule}
          />
        ) : (
          <ScheduleTimelineView
            posts={posts}
            onDelete={handleDelete}
            onReschedule={handleReschedule}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default Schedule;
