import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Instagram } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface StoryPreviewProps {
  textOverlay: string;
  imageUrl?: string;
  brandName?: string;
  ctaText?: string;
}

export default function StoryPreview({ textOverlay, imageUrl, brandName = "Brand", ctaText }: StoryPreviewProps) {
  return (
    <Card className="overflow-hidden mx-auto" style={{ maxWidth: 270 }}>
      {/* Story aspect ratio 9:16 */}
      <div className="relative overflow-hidden" style={{ aspectRatio: "9/16" }}>
        {imageUrl ? (
          <img src={imageUrl} alt="Story" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-b from-primary/30 via-accent/20 to-primary/40" />
        )}

        {/* Story overlay */}
        <div className="absolute inset-0 flex flex-col">
          {/* Top bar */}
          <div className="flex items-center gap-2 p-3">
            <div className="h-1 flex-1 rounded-full bg-primary-foreground/60" />
          </div>

          {/* Account info */}
          <div className="flex items-center gap-2 px-3 pb-2">
            <Avatar className="h-7 w-7 border-2 border-primary-foreground/50">
              <AvatarFallback className="text-[9px] font-bold bg-muted">
                {brandName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-semibold text-primary-foreground drop-shadow">
              {brandName.toLowerCase().replace(/\s/g, "")}
            </span>
            <Badge variant="secondary" className="ml-auto gap-1 text-[9px] bg-card/50 backdrop-blur-sm">
              <Instagram className="h-2.5 w-2.5" /> Story
            </Badge>
          </div>

          {/* Center text */}
          <div className="flex-1 flex items-center justify-center px-6">
            <p className="text-center text-xl font-bold leading-tight text-primary-foreground drop-shadow-lg">
              {textOverlay}
            </p>
          </div>

          {/* CTA swipe up */}
          {ctaText && (
            <div className="pb-6 pt-2 flex flex-col items-center gap-1">
              <div className="h-5 w-5 border-2 border-primary-foreground/70 rounded-full flex items-center justify-center">
                <svg className="h-3 w-3 text-primary-foreground/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </div>
              <span className="text-[10px] font-semibold text-primary-foreground/80 tracking-wide uppercase">
                {ctaText}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
