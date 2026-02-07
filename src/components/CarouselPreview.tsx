import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Linkedin, Instagram } from "lucide-react";

interface CarouselSlide {
  textOverlay: string;
  imageUrl?: string;
}

interface CarouselPreviewProps {
  slides: CarouselSlide[];
  platform: string;
  caption: string;
  brandName?: string;
}

export default function CarouselPreview({ slides, platform, caption, brandName }: CarouselPreviewProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const isLinkedIn = platform === "linkedin";

  return (
    <Card className="overflow-hidden">
      {/* Platform badge */}
      <div className="flex items-center gap-2 px-3 py-2 border-b">
        <Badge variant="secondary" className="gap-1">
          {isLinkedIn ? <Linkedin className="h-3 w-3" /> : <Instagram className="h-3 w-3" />}
          {platform} carousel
        </Badge>
        <span className="text-xs text-muted-foreground ml-auto">
          {currentSlide + 1} / {slides.length}
        </span>
      </div>

      {/* Slide viewer */}
      <div className="relative aspect-square overflow-hidden">
        {slides[currentSlide]?.imageUrl ? (
          <img
            src={slides[currentSlide].imageUrl}
            alt={`Slide ${currentSlide + 1}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 via-accent/20 to-primary/10" />
        )}

        <div className="absolute inset-0 flex items-center justify-center bg-black/20 p-8">
          <p className="text-center text-xl font-bold leading-tight text-primary-foreground drop-shadow-lg">
            {slides[currentSlide]?.textOverlay}
          </p>
        </div>

        {/* Nav arrows */}
        {currentSlide > 0 && (
          <Button
            size="icon"
            variant="secondary"
            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-card/80 backdrop-blur-sm"
            onClick={() => setCurrentSlide((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        {currentSlide < slides.length - 1 && (
          <Button
            size="icon"
            variant="secondary"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-card/80 backdrop-blur-sm"
            onClick={() => setCurrentSlide((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        {/* Dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === currentSlide ? "w-4 bg-primary-foreground" : "w-1.5 bg-primary-foreground/50"
              }`}
              onClick={() => setCurrentSlide(i)}
            />
          ))}
        </div>
      </div>

      <CardContent className="p-3">
        <p className="text-xs text-muted-foreground line-clamp-2">{caption}</p>
      </CardContent>
    </Card>
  );
}
