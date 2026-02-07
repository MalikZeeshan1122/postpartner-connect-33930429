import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export function useSharePost() {
  const [sharing, setSharing] = useState(false);

  const sharePost = async (
    variation: {
      platform: string;
      caption: string;
      textOverlay?: string;
      imageUrl?: string;
      ctaText?: string;
      format?: string;
    },
    opts?: {
      brandName?: string;
      feedbackScore?: number;
      feedbackNotes?: string;
    }
  ): Promise<string | null> => {
    setSharing(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("shared_posts")
        .insert({
          user_id: userData.user.id,
          platform: variation.platform,
          caption: variation.caption,
          text_overlay: variation.textOverlay || null,
          image_url: variation.imageUrl || null,
          cta_text: variation.ctaText || null,
          format: variation.format || "single",
          brand_name: opts?.brandName || null,
          feedback_score: opts?.feedbackScore || null,
          feedback_notes: opts?.feedbackNotes || null,
        })
        .select("share_token")
        .single();

      if (error) throw error;

      const shareUrl = `${window.location.origin}/share/${data.share_token}`;
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: "Share link copied to clipboard!" });
      return shareUrl;
    } catch (e: any) {
      toast({ title: e.message || "Failed to create share link", variant: "destructive" });
      return null;
    } finally {
      setSharing(false);
    }
  };

  return { sharePost, sharing };
}
