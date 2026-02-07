import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Loader2, MessageCircle, Send, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ShareComment {
  id: string;
  author_name: string;
  comment: string;
  created_at: string;
}

interface ShareCommentsProps {
  sharedPostId: string;
}

export default function ShareComments({ sharedPostId }: ShareCommentsProps) {
  const [comments, setComments] = useState<ShareComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [sharedPostId]);

  const fetchComments = async () => {
    const { data } = await supabase
      .from("share_comments")
      .select("*")
      .eq("shared_post_id", sharedPostId)
      .order("created_at", { ascending: true });

    setComments((data as ShareComment[]) || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) {
      toast({ title: "Please enter your name and comment", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("share_comments")
        .insert({
          shared_post_id: sharedPostId,
          author_name: name.trim(),
          comment: text.trim(),
        })
        .select()
        .single();

      if (error) throw error;
      setComments((prev) => [...prev, data as ShareComment]);
      setText("");
      toast({ title: "Comment added!" });
    } catch (e: any) {
      toast({ title: e.message || "Failed to add comment", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold flex items-center gap-2">
        <MessageCircle className="h-4 w-4" />
        Stakeholder Feedback ({comments.length})
      </h2>

      {/* Comment list */}
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          No feedback yet. Be the first to comment!
        </p>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="rounded-lg border bg-card p-3 space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-3 w-3 text-primary" />
                </div>
                <span className="text-xs font-medium">{c.author_name}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm pl-8">{c.comment}</p>
            </div>
          ))}
        </div>
      )}

      {/* Comment form */}
      <form onSubmit={handleSubmit} className="space-y-2 rounded-lg border bg-card p-3">
        <Input
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-8 text-sm"
        />
        <div className="flex gap-2">
          <Textarea
            placeholder="Leave your feedback..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            className="text-sm"
          />
          <Button
            type="submit"
            size="icon"
            disabled={submitting || !name.trim() || !text.trim()}
            className="shrink-0 self-end"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
}
