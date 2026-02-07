import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { CalendarDays, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variation: {
    platform: string;
    caption: string;
    textOverlay?: string;
    imageUrl?: string;
    videoUrl?: string;
    ctaText?: string;
    format?: string;
  };
  brandId?: string;
}

export default function ScheduleDialog({ open, onOpenChange, variation, brandId }: ScheduleDialogProps) {
  const { user } = useAuth();
  const [scheduledAt, setScheduledAt] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSchedule = async () => {
    if (!scheduledAt || !user) {
      toast({ title: "Select a date and time", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("scheduled_posts").insert({
        user_id: user.id,
        brand_id: brandId || null,
        platform: variation.platform,
        caption: variation.caption,
        text_overlay: variation.textOverlay || null,
        image_url: variation.imageUrl || null,
        video_url: variation.videoUrl || null,
        cta_text: variation.ctaText || null,
        format: variation.format || "single",
        scheduled_at: new Date(scheduledAt).toISOString(),
      });

      if (error) throw error;
      toast({ title: "Post scheduled successfully!" });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" /> Schedule Post
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Date & Time</label>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Platform</label>
            <Input value={variation.platform} disabled />
          </div>
          <p className="text-xs text-muted-foreground line-clamp-3">{variation.caption}</p>
          <Button onClick={handleSchedule} disabled={saving} className="w-full gradient-primary gap-1">
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Scheduling...</>
            ) : (
              <><CalendarDays className="h-4 w-4" /> Schedule Post</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
