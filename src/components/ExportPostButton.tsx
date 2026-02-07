import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ExportPostButtonProps {
  variation: {
    platform: string;
    caption: string;
    textOverlay?: string;
    imageUrl?: string;
    ctaText?: string;
  };
  brandName?: string;
}

export default function ExportPostButton({ variation, brandName }: ExportPostButtonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleExportImage = async () => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const size = 1080;
      canvas.width = size;
      canvas.height = size;

      // Background
      if (variation.imageUrl) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Failed to load image"));
          img.src = variation.imageUrl!;
        });
        ctx.drawImage(img, 0, 0, size, size);
      } else {
        // Gradient fallback
        const grad = ctx.createLinearGradient(0, 0, size, size);
        grad.addColorStop(0, "#7c3aed33");
        grad.addColorStop(0.5, "#14b8a633");
        grad.addColorStop(1, "#7c3aed1a");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);
      }

      // Overlay
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(0, 0, size, size);

      // Text overlay
      if (variation.textOverlay) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 64px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 10;

        const words = variation.textOverlay.split(" ");
        const lines: string[] = [];
        let line = "";
        for (const word of words) {
          const test = line ? `${line} ${word}` : word;
          if (ctx.measureText(test).width > size * 0.8) {
            lines.push(line);
            line = word;
          } else {
            line = test;
          }
        }
        if (line) lines.push(line);

        const lineHeight = 80;
        const startY = size / 2 - ((lines.length - 1) * lineHeight) / 2;
        lines.forEach((l, i) => {
          ctx.fillText(l, size / 2, startY + i * lineHeight);
        });
      }

      // CTA at bottom
      if (variation.ctaText) {
        ctx.font = "bold 36px sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 8;
        ctx.fillText(variation.ctaText, size / 2, size - 80);
      }

      // Brand watermark
      if (brandName) {
        ctx.font = "24px sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.shadowBlur = 0;
        ctx.textAlign = "left";
        ctx.fillText(brandName, 40, size - 40);
      }

      // Download
      const link = document.createElement("a");
      link.download = `${variation.platform}-post-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      toast({ title: "Image exported!" });
    } catch (e: any) {
      toast({ title: e.message || "Export failed", variant: "destructive" });
    }
  };

  const handleExportCaption = () => {
    const text = [
      variation.caption,
      "",
      variation.ctaText ? `CTA: ${variation.ctaText}` : "",
      `Platform: ${variation.platform}`,
      brandName ? `Brand: ${brandName}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const blob = new Blob([text], { type: "text/plain" });
    const link = document.createElement("a");
    link.download = `${variation.platform}-caption-${Date.now()}.txt`;
    link.href = URL.createObjectURL(blob);
    link.click();
    toast({ title: "Caption exported!" });
  };

  return (
    <div className="flex gap-1">
      <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={handleExportImage}>
        <Download className="h-3 w-3" /> Image
      </Button>
      <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={handleExportCaption}>
        <Download className="h-3 w-3" /> Caption
      </Button>
    </div>
  );
}
