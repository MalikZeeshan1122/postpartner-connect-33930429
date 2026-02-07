import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThumbsUp, MessageCircle, Repeat2, Send, Heart, MessageSquare, Bookmark, Share } from "lucide-react";

interface LinkedInMockupProps {
  caption: string;
  textOverlay: string;
  imageUrl?: string;
  brandName?: string;
}

export default function LinkedInMockup({ caption, textOverlay, imageUrl, brandName = "Your Brand" }: LinkedInMockupProps) {
  return (
    <div className="mx-auto max-w-[480px] rounded-lg border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="gradient-primary text-primary-foreground text-xs font-bold">
            {brandName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{brandName}</p>
          <p className="text-xs text-muted-foreground">1,234 followers • 1h</p>
        </div>
        <span className="text-xs text-muted-foreground">•••</span>
      </div>

      {/* Caption */}
      <div className="px-3 pb-2">
        <p className="text-sm whitespace-pre-wrap leading-relaxed">
          {caption.length > 200 ? caption.slice(0, 200) + "... see more" : caption}
        </p>
      </div>

      {/* Image */}
      <div className="relative aspect-[1.91/1] w-full bg-gradient-to-br from-primary/20 via-accent/20 to-primary/10">
        {imageUrl ? (
          <img src={imageUrl} alt="Post" className="h-full w-full object-cover" />
        ) : null}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 p-8">
          <p className="text-center text-xl font-bold text-primary-foreground drop-shadow-lg leading-tight">
            {textOverlay}
          </p>
        </div>
      </div>

      {/* Engagement bar */}
      <div className="px-3 py-1.5">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-0.5">👍❤️ 42</span>
          <span className="ml-auto">3 comments • 2 reposts</span>
        </div>
      </div>

      <div className="border-t mx-3" />

      {/* Actions */}
      <div className="flex justify-between px-3 py-1.5">
        {[
          { icon: ThumbsUp, label: "Like" },
          { icon: MessageCircle, label: "Comment" },
          { icon: Repeat2, label: "Repost" },
          { icon: Send, label: "Send" },
        ].map(({ icon: Icon, label }) => (
          <button key={label} className="flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface InstagramMockupProps {
  caption: string;
  textOverlay: string;
  imageUrl?: string;
  brandName?: string;
}

export function InstagramMockup({ caption, textOverlay, imageUrl, brandName = "Your Brand" }: InstagramMockupProps) {
  return (
    <div className="mx-auto max-w-[480px] rounded-lg border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-500 p-[2px]">
          <Avatar className="h-full w-full border-2 border-card">
            <AvatarFallback className="text-[10px] font-bold bg-muted">
              {brandName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        <p className="text-sm font-semibold flex-1">{brandName.toLowerCase().replace(/\s/g, "")}</p>
        <span className="text-muted-foreground">•••</span>
      </div>

      {/* Image */}
      <div className="relative aspect-square w-full bg-gradient-to-br from-primary/20 via-accent/20 to-primary/10">
        {imageUrl ? (
          <img src={imageUrl} alt="Post" className="h-full w-full object-cover" />
        ) : null}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 p-8">
          <p className="text-center text-2xl font-bold text-primary-foreground drop-shadow-lg leading-tight">
            {textOverlay}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 px-3 py-2.5">
        <Heart className="h-6 w-6 cursor-pointer" />
        <MessageSquare className="h-6 w-6 cursor-pointer" />
        <Send className="h-6 w-6 cursor-pointer" />
        <Bookmark className="ml-auto h-6 w-6 cursor-pointer" />
      </div>

      {/* Likes */}
      <div className="px-3 pb-1">
        <p className="text-sm font-semibold">128 likes</p>
      </div>

      {/* Caption */}
      <div className="px-3 pb-3">
        <p className="text-sm">
          <span className="font-semibold">{brandName.toLowerCase().replace(/\s/g, "")}</span>{" "}
          {caption.length > 120 ? caption.slice(0, 120) + "... more" : caption}
        </p>
      </div>
    </div>
  );
}
