import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Clock,
  Trash2,
  Linkedin,
  Instagram,
  ChevronLeft,
  ChevronRight,
  GripVertical,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isBefore,
  startOfDay,
} from "date-fns";
import type { ScheduledPost } from "@/pages/Schedule";
import { statusConfig } from "@/pages/Schedule";

interface ScheduleCalendarViewProps {
  posts: ScheduledPost[];
  onDelete: (id: string) => void;
  onReschedule: (id: string, newDate: string) => void;
}

export default function ScheduleCalendarView({ posts, onDelete, onReschedule }: ScheduleCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [draggedPost, setDraggedPost] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const now = new Date();

  const getPostsForDay = (day: Date) =>
    posts.filter((p) => isSameDay(new Date(p.scheduled_at), day));

  const handleDragStart = (e: React.DragEvent, postId: string) => {
    e.dataTransfer.setData("postId", postId);
    setDraggedPost(postId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, day: Date) => {
    e.preventDefault();
    const postId = e.dataTransfer.getData("postId");
    if (!postId) return;

    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    // Keep the same time, change the date
    const oldDate = new Date(post.scheduled_at);
    const newDate = new Date(day);
    newDate.setHours(oldDate.getHours(), oldDate.getMinutes(), 0, 0);

    onReschedule(postId, newDate.toISOString());
    setDraggedPost(null);
  };

  const handleDragEnd = () => {
    setDraggedPost(null);
  };

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const selectedDayPosts = selectedDay
    ? posts.filter((p) => format(new Date(p.scheduled_at), "yyyy-MM-dd") === selectedDay)
    : [];

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button size="sm" variant="ghost" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
        <Button size="sm" variant="ghost" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 border rounded-lg overflow-hidden">
        {/* Header */}
        {weekDays.map((d) => (
          <div key={d} className="border-b bg-muted/50 p-2 text-center text-xs font-semibold text-muted-foreground">
            {d}
          </div>
        ))}

        {/* Day cells */}
        {days.map((day) => {
          const dayPosts = getPostsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, now);
          const isPast = isBefore(day, startOfDay(now));
          const dayKey = format(day, "yyyy-MM-dd");
          const isSelected = selectedDay === dayKey;

          return (
            <div
              key={dayKey}
              className={`min-h-[80px] border-b border-r p-1 transition-colors cursor-pointer ${
                !isCurrentMonth ? "bg-muted/20 opacity-40" : ""
              } ${isToday ? "bg-primary/5" : ""} ${isSelected ? "ring-2 ring-primary ring-inset" : ""} ${
                draggedPost ? "hover:bg-accent/30" : "hover:bg-accent/10"
              }`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, day)}
              onClick={() => setSelectedDay(isSelected ? null : dayKey)}
            >
              <div className="flex items-center justify-between px-1">
                <span
                  className={`text-xs font-medium ${
                    isToday
                      ? "flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                      : isPast
                      ? "text-muted-foreground"
                      : ""
                  }`}
                >
                  {format(day, "d")}
                </span>
                {dayPosts.length > 0 && (
                  <Badge variant="secondary" className="h-4 px-1 text-[9px]">
                    {dayPosts.length}
                  </Badge>
                )}
              </div>

              {/* Post pills */}
              <div className="mt-0.5 space-y-0.5">
                {dayPosts.slice(0, 3).map((post) => {
                  const isLI = post.platform === "linkedin";
                  return (
                    <div
                      key={post.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, post.id)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center gap-1 rounded px-1 py-0.5 text-[9px] truncate cursor-grab active:cursor-grabbing transition-opacity ${
                        draggedPost === post.id ? "opacity-30" : ""
                      } ${isLI ? "bg-blue-500/10 text-blue-700 dark:text-blue-300" : "bg-pink-500/10 text-pink-700 dark:text-pink-300"}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <GripVertical className="h-2.5 w-2.5 shrink-0 opacity-40" />
                      {isLI ? <Linkedin className="h-2 w-2 shrink-0" /> : <Instagram className="h-2 w-2 shrink-0" />}
                      <span className="truncate">{format(new Date(post.scheduled_at), "h:mm a")}</span>
                    </div>
                  );
                })}
                {dayPosts.length > 3 && (
                  <div className="text-[9px] text-muted-foreground px-1">+{dayPosts.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected day detail */}
      {selectedDay && selectedDayPosts.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-semibold">
              {format(new Date(selectedDay + "T00:00:00"), "EEEE, MMMM d")} — {selectedDayPosts.length} post{selectedDayPosts.length !== 1 ? "s" : ""}
            </h3>
            {selectedDayPosts.map((post) => {
              const status = statusConfig[post.status] || statusConfig.scheduled;
              const StatusIcon = status.icon;
              const isLI = post.platform === "linkedin";

              return (
                <div key={post.id} className="flex items-start gap-3 rounded-lg border p-3">
                  <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 via-accent/20 to-primary/10">
                    {post.image_url ? (
                      <img src={post.image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        {isLI ? <Linkedin className="h-4 w-4 text-muted-foreground/40" /> : <Instagram className="h-4 w-4 text-muted-foreground/40" />}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Badge variant="secondary" className="text-[10px] gap-0.5">
                        {isLI ? <Linkedin className="h-2.5 w-2.5" /> : <Instagram className="h-2.5 w-2.5" />}
                        {post.platform}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] ${status.color}`}>
                        <StatusIcon className="h-2.5 w-2.5 mr-0.5" />
                        {status.label}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        {format(new Date(post.scheduled_at), "h:mm a")}
                      </span>
                    </div>
                    <p className="text-xs line-clamp-2">{post.caption}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Input
                      type="datetime-local"
                      className="h-7 text-xs w-36"
                      defaultValue={format(new Date(post.scheduled_at), "yyyy-MM-dd'T'HH:mm")}
                      onChange={(e) => onReschedule(post.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive/70 hover:text-destructive"
                      onClick={() => onDelete(post.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Drag and drop posts between days to reschedule them
      </p>
    </div>
  );
}
