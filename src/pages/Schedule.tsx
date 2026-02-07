import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import { format, isAfter, isBefore, startOfDay, addDays } from "date-fns";

interface ScheduledPost {
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

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  scheduled: { label: "Scheduled", color: "bg-primary/10 text-primary border-primary/20", icon: Clock },
  published: { label: "Published", color: "bg-green-500/10 text-green-600 border-green-500/20", icon: CheckCircle2 },
  failed: { label: "Failed", color: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertCircle },
};

const Schedule = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");

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

  const handleReschedule = async (id: string, newDate: string) => {
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
  };

  const now = new Date();
  const filteredPosts = posts.filter((p) => {
    if (filter === "upcoming") return isAfter(new Date(p.scheduled_at), now);
    if (filter === "past") return isBefore(new Date(p.scheduled_at), now);
    return true;
  });

  // Group by day
  const grouped = filteredPosts.reduce<Record<string, ScheduledPost[]>>((acc, post) => {
    const dayKey = format(new Date(post.scheduled_at), "yyyy-MM-dd");
    if (!acc[dayKey]) acc[dayKey] = [];
    acc[dayKey].push(post);
    return acc;
  }, {});

  const sortedDays = Object.keys(grouped).sort();

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
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Schedule Queue</h1>
            <p className="text-muted-foreground">Timeline of upcoming and past scheduled posts</p>
          </div>
          <Button onClick={() => navigate("/generate")} className="gradient-primary gap-1">
            <CalendarDays className="h-4 w-4" /> Create Post
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {(["upcoming", "all", "past"] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
          <span className="ml-auto text-sm text-muted-foreground self-center">
            {filteredPosts.length} post{filteredPosts.length !== 1 && "s"}
          </span>
        </div>

        {loadingPosts ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground mb-3">No scheduled posts yet</p>
              <Button size="sm" onClick={() => navigate("/generate")} className="gap-1">
                Generate & Schedule Posts
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-6">
              {sortedDays.map((day) => {
                const dayDate = new Date(day + "T00:00:00");
                const isToday = format(now, "yyyy-MM-dd") === day;
                const isPast = isBefore(dayDate, startOfDay(now));

                return (
                  <div key={day} className="relative pl-12">
                    {/* Timeline dot */}
                    <div
                      className={`absolute left-3.5 top-1 h-3 w-3 rounded-full border-2 ${
                        isToday
                          ? "border-primary bg-primary"
                          : isPast
                          ? "border-muted-foreground/30 bg-muted"
                          : "border-primary/50 bg-card"
                      }`}
                    />

                    {/* Day header */}
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-sm font-semibold">
                        {isToday ? "Today" : format(dayDate, "EEEE, MMM d")}
                      </h3>
                      {isToday && (
                        <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                          Today
                        </Badge>
                      )}
                    </div>

                    {/* Posts for this day */}
                    <div className="space-y-3">
                      {grouped[day].map((post) => {
                        const status = statusConfig[post.status] || statusConfig.scheduled;
                        const StatusIcon = status.icon;
                        const isLI = post.platform === "linkedin";

                        return (
                          <Card key={post.id} className="overflow-hidden">
                            <CardContent className="flex gap-4 p-4">
                              {/* Image thumbnail */}
                              <div className="h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 via-accent/20 to-primary/10">
                                {post.image_url ? (
                                  <img src={post.image_url} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center">
                                    {isLI ? (
                                      <Linkedin className="h-5 w-5 text-muted-foreground/40" />
                                    ) : (
                                      <Instagram className="h-5 w-5 text-muted-foreground/40" />
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <Badge variant="secondary" className="gap-1 text-[10px]">
                                    {isLI ? <Linkedin className="h-2.5 w-2.5" /> : <Instagram className="h-2.5 w-2.5" />}
                                    {post.platform}
                                  </Badge>
                                  <Badge variant="outline" className={`text-[10px] ${status.color}`}>
                                    <StatusIcon className="h-2.5 w-2.5 mr-0.5" />
                                    {status.label}
                                  </Badge>
                                  <Badge variant="outline" className="text-[10px]">
                                    {post.format}
                                  </Badge>
                                  <span className="text-[11px] text-muted-foreground">
                                    {format(new Date(post.scheduled_at), "h:mm a")}
                                  </span>
                                </div>
                                <p className="text-sm line-clamp-2">{post.caption}</p>
                                {post.cta_text && (
                                  <p className="text-xs text-primary font-medium mt-1">{post.cta_text}</p>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex flex-col gap-1 shrink-0">
                                <Input
                                  type="datetime-local"
                                  className="h-7 text-xs w-40"
                                  defaultValue={format(new Date(post.scheduled_at), "yyyy-MM-dd'T'HH:mm")}
                                  onChange={(e) => handleReschedule(post.id, e.target.value)}
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive/70 hover:text-destructive h-7 text-xs"
                                  onClick={() => handleDelete(post.id)}
                                >
                                  <Trash2 className="h-3 w-3 mr-1" /> Remove
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Schedule;
