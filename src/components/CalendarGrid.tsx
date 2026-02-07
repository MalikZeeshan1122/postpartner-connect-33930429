import { useState, useCallback, useRef } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PlanItem {
  id: string;
  intent: string;
  platform: string;
  scheduled_date: string | null;
  status: string;
  tone?: string | null;
}

interface CalendarGridProps {
  items: PlanItem[];
  onDayClick?: (date: Date) => void;
  onItemClick?: (item: PlanItem) => void;
  onItemDrop?: (itemId: string, newDate: string) => void;
}

const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export default function CalendarGrid({ items, onDayClick, onItemClick, onItemDrop }: CalendarGridProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dragItemId, setDragItemId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getItemsForDay = (day: Date) =>
    items.filter((item) => item.scheduled_date && isSameDay(new Date(item.scheduled_date), day));

  const platformColor = (platform: string) => {
    const colors: Record<string, string> = {
      instagram: "bg-pink-500",
      facebook: "bg-blue-600",
      twitter: "bg-zinc-700",
      linkedin: "bg-blue-500",
      tiktok: "bg-zinc-800",
      youtube: "bg-red-500",
      both: "bg-primary",
    };
    return colors[platform] || "bg-primary";
  };

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDragItemId(itemId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", itemId);
    // Make the drag image slightly transparent
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDragItemId(null);
    setDropTarget(null);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
  };

  const handleDragOver = (e: React.DragEvent, dayKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget(dayKey);
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = (e: React.DragEvent, day: Date) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData("text/plain");
    if (itemId && onItemDrop) {
      onItemDrop(itemId, format(day, "yyyy-MM-dd"));
    }
    setDragItemId(null);
    setDropTarget(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(new Date())}
          >
            Today
          </Button>
          <h2 className="text-xl font-bold">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="rounded-lg border overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b bg-muted/50">
          {DAY_LABELS.map((day) => (
            <div
              key={day}
              className="px-2 py-2 text-center text-xs font-semibold text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayItems = getItemsForDay(day);
            const inMonth = isSameMonth(day, currentMonth);
            const today = isToday(day);
            const dayKey = day.toISOString();
            const isDropping = dropTarget === dayKey;

            return (
              <div
                key={dayKey}
                className={`min-h-[100px] border-b border-r p-1.5 transition-colors cursor-pointer hover:bg-muted/30 ${
                  !inMonth ? "bg-muted/20 text-muted-foreground/50" : ""
                } ${isDropping ? "bg-primary/10 ring-2 ring-inset ring-primary/40" : ""}`}
                onClick={() => onDayClick?.(day)}
                onDragOver={(e) => handleDragOver(e, dayKey)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, day)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-medium leading-none ${
                      today
                        ? "flex h-6 w-6 items-center justify-center rounded-full gradient-primary text-primary-foreground"
                        : ""
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                  {!inMonth && (
                    <span className="text-[10px] text-muted-foreground">
                      {format(day, "MMM")}
                    </span>
                  )}
                </div>
                <div className="space-y-0.5">
                  {dayItems.slice(0, 3).map((item) => (
                    <button
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.id)}
                      onDragEnd={handleDragEnd}
                      onClick={(e) => {
                        e.stopPropagation();
                        onItemClick?.(item);
                      }}
                      className={`w-full truncate rounded px-1.5 py-0.5 text-left text-[10px] font-medium text-white ${platformColor(
                        item.platform
                      )} hover:opacity-80 transition-opacity cursor-grab active:cursor-grabbing ${
                        dragItemId === item.id ? "opacity-50" : ""
                      }`}
                    >
                      {item.intent}
                    </button>
                  ))}
                  {dayItems.length > 3 && (
                    <p className="text-[10px] text-muted-foreground px-1">
                      +{dayItems.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
