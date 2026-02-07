import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Linkedin, Instagram, Star } from "lucide-react";

interface PostPreviewProps {
  variation: {
    platform: string;
    caption: string;
    textOverlay: string;
    imagePrompt?: string;
    ctaText?: string;
  };
  index: number;
  isSelected: boolean;
  feedbackItem?: {
    score?: number;
    feedback?: string;
  };
  onSelect: () => void;
  onApprove: () => void;
}

export default function PostPreview({
  variation,
  index,
  isSelected,
  feedbackItem,
  onSelect,
  onApprove,
}: PostPreviewProps) {
  const isLinkedIn = variation.platform === "linkedin";

  return (
    <Card
      className={`cursor-pointer transition-all ${
        isSelected ? "ring-2 ring-primary shadow-glow" : "hover:shadow-md"
      }`}
      onClick={onSelect}
    >
      {/* Mock post image area */}
      <div className="relative aspect-square overflow-hidden rounded-t-lg bg-gradient-to-br from-primary/20 via-accent/20 to-primary/10">
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <p className="text-center text-lg font-bold leading-tight tracking-tight">
            {variation.textOverlay}
          </p>
        </div>
        <div className="absolute left-3 top-3">
          <Badge variant="secondary" className="gap-1">
            {isLinkedIn ? <Linkedin className="h-3 w-3" /> : <Instagram className="h-3 w-3" />}
            {variation.platform}
          </Badge>
        </div>
        {feedbackItem?.score && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-card/90 px-2 py-1 text-xs font-semibold backdrop-blur-sm">
            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
            {feedbackItem.score}/10
          </div>
        )}
      </div>

      <CardContent className="space-y-3 p-4">
        <p className="line-clamp-4 text-sm leading-relaxed">{variation.caption}</p>

        {variation.ctaText && (
          <p className="text-xs font-semibold text-primary">{variation.ctaText}</p>
        )}

        {feedbackItem?.feedback && (
          <div className="rounded-lg bg-muted p-2">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">AI Feedback:</span> {feedbackItem.feedback}
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            className="flex-1 gradient-primary gap-1"
            onClick={(e) => {
              e.stopPropagation();
              onApprove();
            }}
          >
            <Check className="h-3 w-3" /> Approve
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
