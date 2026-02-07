import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { CalendarDays, Loader2, Clock, Linkedin, Instagram } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { format, addHours, setHours, setMinutes, startOfDay, addDays } from "date-fns";

interface BulkScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variations: Array<{
    platform: string;
    caption: string;
    textOverlay?: string;
    imageUrl?: string;
    videoUrl?: string;
    ctaText?: string;
    format?: string;
  }>;
  brandId?: string;
}

const OPTIMAL_SLOTS = [
  { hour: 8, min: 0, label: "8:00 AM", reason: "Morning commute" },
  { hour: 10, min: 30, label: "10:30 AM", reason: "Mid-morning peak" },
  { hour: 12, min: 15, label: "12:15 PM", reason: "Lunch break" },
  { hour: 15, min: 0, label: "3:00 PM", reason: "Afternoon engagement" },
  { hour: 17, min: 30, label: "5:30 PM", reason: "End of workday" },
  { hour: 19, min: 0, label: "7:00 PM", reason: "Evening scroll" },
];

export default function BulkScheduleDialog({ open, onOpenChange, variations, brandId }: BulkScheduleDialogProps) {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd"));
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  // Select all when dialog opens with variations
  useEffect(() => {
    if (open && variations.length > 0) {
      setSelected(new Set(variations.map((_, i) => i)));
    }
  }, [open, variations.length]);

  const toggleSelection = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === variations.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(variations.map((_, i) => i)));
    }
  };

  const getOptimizedSlots = () => {
    const selectedIndices = Array.from(selected).sort((a, b) => a - b);
    const base = startOfDay(new Date(startDate + "T00:00:00"));
    const slots: Array<{ index: number; date: Date; slot: typeof OPTIMAL_SLOTS[0] }> = [];

    let dayOffset = 0;
    let slotIdx = 0;

    for (const idx of selectedIndices) {
      if (slotIdx >= OPTIMAL_SLOTS.length) {
        slotIdx = 0;
        dayOffset++;
      }
      const slot = OPTIMAL_SLOTS[slotIdx];
      const date = setMinutes(setHours(addDays(base, dayOffset), slot.hour), slot.min);
      slots.push({ index: idx, date, slot });
      slotIdx++;
    }

    return slots;
  };

  const handleBulkSchedule = async () => {
    if (!user || selected.size === 0) return;
    setSaving(true);

    try {
      const slots = getOptimizedSlots();
      const inserts = slots.map(({ index, date }) => ({
        user_id: user.id,
        brand_id: brandId || null,
        platform: variations[index].platform,
        caption: variations[index].caption,
        text_overlay: variations[index].textOverlay || null,
        image_url: variations[index].imageUrl || null,
        video_url: variations[index].videoUrl || null,
        cta_text: variations[index].ctaText || null,
        format: variations[index].format || "single",
        scheduled_at: date.toISOString(),
      }));

      const { error } = await supabase.from("scheduled_posts").insert(inserts);
      if (error) throw error;

      toast({ title: `${slots.length} posts scheduled across optimized time slots!` });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const slots = getOptimizedSlots();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" /> Bulk Schedule Posts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Start Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Posts will be spread across optimal engagement times starting from this date.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Select Posts ({selected.size}/{variations.length})</label>
            <Button size="sm" variant="ghost" className="text-xs h-6" onClick={toggleAll}>
              {selected.size === variations.length ? "Deselect All" : "Select All"}
            </Button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {variations.map((v, i) => {
              const isLI = v.platform === "linkedin";
              const slot = slots.find((s) => s.index === i);

              return (
                <div
                  key={i}
                  className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                    selected.has(i) ? "border-primary/30 bg-primary/5" : "opacity-50"
                  }`}
                >
                  <Checkbox
                    checked={selected.has(i)}
                    onCheckedChange={() => toggleSelection(i)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Badge variant="secondary" className="text-[10px] gap-0.5">
                        {isLI ? <Linkedin className="h-2.5 w-2.5" /> : <Instagram className="h-2.5 w-2.5" />}
                        {v.platform}
                      </Badge>
                      {v.format && v.format !== "single" && (
                        <Badge variant="outline" className="text-[10px]">{v.format}</Badge>
                      )}
                    </div>
                    <p className="text-xs line-clamp-2">{v.caption}</p>
                  </div>
                  {slot && selected.has(i) && (
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-medium">{format(slot.date, "MMM d")}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 justify-end">
                        <Clock className="h-2.5 w-2.5" />
                        {slot.slot.label}
                      </p>
                      <p className="text-[9px] text-muted-foreground/70">{slot.slot.reason}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <Button
            onClick={handleBulkSchedule}
            disabled={saving || selected.size === 0}
            className="w-full gradient-primary gap-1"
          >
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Scheduling...</>
            ) : (
              <><CalendarDays className="h-4 w-4" /> Schedule {selected.size} Post{selected.size !== 1 ? "s" : ""}</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
