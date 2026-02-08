import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, ImageIcon } from "lucide-react";

interface VideoPreviewProps {
  imageUrl?: string;
  videoUrl?: string;
  textOverlay: string;
  platform: string;
  onGenerateVideo?: () => Promise<void>;
}

export default function VideoPreview({ imageUrl, videoUrl, textOverlay, platform, onGenerateVideo }: VideoPreviewProps) {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!onGenerateVideo) return;
    setGenerating(true);
    try {
      await onGenerateVideo();
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b">
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3 w-3" />
          {platform} cinematic
        </Badge>
        <span className="text-[10px] text-muted-foreground ml-auto">AI-styled image</span>
      </div>

      <div className="relative aspect-square overflow-hidden">
        {videoUrl ? (
          <img
            src={videoUrl}
            alt="AI-styled cinematic post"
            className="h-full w-full object-cover"
          />
        ) : imageUrl ? (
          <>
            <img src={imageUrl} alt="Source image" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="rounded-full bg-card/80 p-3 backdrop-blur-sm">
                <Sparkles className="h-8 w-8 text-foreground" />
              </div>
            </div>
          </>
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 via-accent/20 to-primary/10 flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}

        {!videoUrl && (
          <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
            <p className="text-center text-xl font-bold leading-tight text-primary-foreground drop-shadow-lg">
              {textOverlay}
            </p>
          </div>
        )}
      </div>

      <CardContent className="p-3">
        {onGenerateVideo && !videoUrl && (
          <Button
            size="sm"
            variant="outline"
            className="w-full gap-1"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <><Loader2 className="h-3 w-3 animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="h-3 w-3" /> Generate Cinematic Style</>
            )}
          </Button>
        )}
        {videoUrl && (
          <p className="text-xs text-muted-foreground text-center">Cinematic image generated ✓</p>
        )}
      </CardContent>
    </Card>
  );
}
