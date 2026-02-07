import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Linkedin, Instagram, Star, ExternalLink } from "lucide-react";

const SharedPost = () => {
  const { token } = useParams<{ token: string }>();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (token) fetchPost(token);
  }, [token]);

  const fetchPost = async (shareToken: string) => {
    const { data, error } = await supabase
      .from("shared_posts")
      .select("*")
      .eq("share_token", shareToken)
      .single();

    if (error || !data) {
      setNotFound(true);
    } else {
      setPost(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4">
        <ExternalLink className="h-12 w-12 text-muted-foreground/30" />
        <h1 className="text-xl font-semibold">Post not found</h1>
        <p className="text-muted-foreground text-sm">This share link may have expired or been removed.</p>
      </div>
    );
  }

  const isLinkedIn = post.platform === "linkedin";

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          {post.brand_name && (
            <p className="text-sm font-medium text-muted-foreground">{post.brand_name}</p>
          )}
          <h1 className="text-lg font-semibold">Post Preview for Review</h1>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="secondary" className="gap-1">
              {isLinkedIn ? <Linkedin className="h-3 w-3" /> : <Instagram className="h-3 w-3" />}
              {post.platform}
            </Badge>
            <Badge variant="outline">{post.format}</Badge>
            {post.feedback_score && (
              <Badge variant="outline" className="gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {post.feedback_score}/10
              </Badge>
            )}
          </div>
        </div>

        {/* Post card */}
        <Card>
          <div className="relative aspect-square overflow-hidden rounded-t-lg">
            {post.image_url ? (
              <img src={post.image_url} alt="Post" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary/20 via-accent/20 to-primary/10" />
            )}
            {post.text_overlay && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 p-6">
                <p className="text-center text-lg font-bold leading-tight text-primary-foreground drop-shadow-lg">
                  {post.text_overlay}
                </p>
              </div>
            )}
          </div>
          <CardContent className="space-y-3 p-6">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.caption}</p>
            {post.cta_text && (
              <p className="text-xs font-semibold text-primary">{post.cta_text}</p>
            )}
            {post.feedback_notes && (
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">AI Feedback:</span> {post.feedback_notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Shared for stakeholder review • Powered by Lovable
        </p>
      </div>
    </div>
  );
};

export default SharedPost;
