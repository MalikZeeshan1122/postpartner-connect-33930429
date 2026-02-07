import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Clock,
  Trash2,
  Linkedin,
  Instagram,
} from "lucide-react";
import { format, isAfter, isBefore, startOfDay } from "date-fns";
import type { ScheduledPost } from "@/pages/Schedule";
import { statusConfig } from "@/pages/Schedule";

interface ScheduleTimelineViewProps {
  posts: ScheduledPost[];
  onDelete: (id: string) => void;
  onReschedule: (id: string, newDate: string) => void;
}

export default function ScheduleTimelineView({ posts, onDelete, onReschedule }: ScheduleTimelineViewProps) {
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");
  const now = new Date();

  const filteredPosts = posts.filter((p) => {
    if (filter === "upcoming") return isAfter(new Date(p.scheduled_at), now);
    if (filter === "past") return isBefore(new Date(p.scheduled_at), now);
    return true;
  });

  const grouped = filteredPosts.reduce<Record<string, ScheduledPost[]>>((acc, post) => {
    const dayKey = format(new Date(post.scheduled_at), "yyyy-MM-dd");
    if (!acc[dayKey]) acc[dayKey] = [];
    acc[dayKey].push(post);
    return acc;
  }, {});

  const sortedDays = Object.keys(grouped).sort();

  return (
    <div className="space-y-4">
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

      {filteredPosts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No posts in this view</p>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-6">
            {sortedDays.map((day) => {
              const dayDate = new Date(day + "T00:00:00");
              const isToday = format(now, "yyyy-MM-dd") === day;
              const isPast = isBefore(dayDate, startOfDay(now));

              return (
                <div key={day} className="relative pl-12">
                  <div
                    className={`absolute left-3.5 top-1 h-3 w-3 rounded-full border-2 ${
                      isToday
                        ? "border-primary bg-primary"
                        : isPast
                        ? "border-muted-foreground/30 bg-muted"
                        : "border-primary/50 bg-card"
                    }`}
                  />
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
                  <div className="space-y-3">
                    {grouped[day].map((post) => {
                      const status = statusConfig[post.status] || statusConfig.scheduled;
                      const StatusIcon = status.icon;
                      const isLI = post.platform === "linkedin";

                      return (
                        <Card key={post.id} className="overflow-hidden">
                          <CardContent className="flex gap-4 p-4">
                            <div className="h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 via-accent/20 to-primary/10">
                              {post.image_url ? (
                                <img src={post.image_url} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                  {isLI ? <Linkedin className="h-5 w-5 text-muted-foreground/40" /> : <Instagram className="h-5 w-5 text-muted-foreground/40" />}
                                </div>
                              )}
                            </div>
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
                                <Badge variant="outline" className="text-[10px]">{post.format}</Badge>
                                <span className="text-[11px] text-muted-foreground">
                                  {format(new Date(post.scheduled_at), "h:mm a")}
                                </span>
                              </div>
                              <p className="text-sm line-clamp-2">{post.caption}</p>
                              {post.cta_text && (
                                <p className="text-xs text-primary font-medium mt-1">{post.cta_text}</p>
                              )}
                            </div>
                            <div className="flex flex-col gap-1 shrink-0">
                              <Input
                                type="datetime-local"
                                className="h-7 text-xs w-40"
                                defaultValue={format(new Date(post.scheduled_at), "yyyy-MM-dd'T'HH:mm")}
                                onChange={(e) => onReschedule(post.id, e.target.value)}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive/70 hover:text-destructive h-7 text-xs"
                                onClick={() => onDelete(post.id)}
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
  );
}
