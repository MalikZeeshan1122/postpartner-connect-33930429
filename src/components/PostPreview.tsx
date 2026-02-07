import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Linkedin, Instagram, Star, ImageIcon, Loader2 } from "lucide-react";

interface PostPreviewProps {
  variation: {
    platform: string;
    caption: string;
    textOverlay: string;
    imagePrompt?: string;
    imageUrl?: string;
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
  onGenerateImage?: (index: number) => Promise<void>;
}

export default function PostPreview({
  variation,
  index,
  isSelected,
  feedbackItem,
  onSelect,
  onApprove,
  onGenerateImage,
}: PostPreviewProps) {
  const isLinkedIn = variation.platform === "linkedin";
  const [generatingImg, setGeneratingImg] = useState(false);

  const handleGenerateImage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onGenerateImage) return;
    setGeneratingImg(true);
    try {
      await onGenerateImage(index);
    } finally {
      setGeneratingImg(false);
    }
  };

  return (
    <Card
      className={`cursor-pointer transition-all ${
        isSelected ? "ring-2 ring-primary shadow-glow" : "hover:shadow-md"
      }`}
      onClick={onSelect}
    >
      {/* Post image area */}
      <div className="relative aspect-square overflow-hidden rounded-t-lg">
        {variation.imageUrl ? (
          <img
            src={variation.imageUrl}
            alt="Generated post background"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 via-accent/20 to-primary/10" />
        )}

        {/* Text overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 p-6">
          <p className="text-center text-lg font-bold leading-tight tracking-tight text-primary-foreground drop-shadow-lg">
            {variation.textOverlay}
          </p>
        </div>

        {/* Platform badge */}
        <div className="absolute left-3 top-3">
          <Badge variant="secondary" className="gap-1 bg-card/80 backdrop-blur-sm">
            {isLinkedIn ? <Linkedin className="h-3 w-3" /> : <Instagram className="h-3 w-3" />}
            {variation.platform}
          </Badge>
        </div>

        {/* Score */}
        {feedbackItem?.score && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-card/90 px-2 py-1 text-xs font-semibold backdrop-blur-sm">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {feedbackItem.score}/10
          </div>
        )}

        {/* Generate image button */}
        {!variation.imageUrl && onGenerateImage && (
          <div className="absolute bottom-3 right-3">
            <Button
              size="sm"
              variant="secondary"
              className="gap-1 bg-card/80 backdrop-blur-sm text-xs"
              onClick={handleGenerateImage}
              disabled={generatingImg}
            >
              {generatingImg ? (
                <><Loader2 className="h-3 w-3 animate-spin" /> Generating...</>
              ) : (
                <><ImageIcon className="h-3 w-3" /> Gen Image</>
              )}
            </Button>
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
