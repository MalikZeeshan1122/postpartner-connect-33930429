
-- Create share_comments table for stakeholder feedback
CREATE TABLE public.share_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shared_post_id uuid NOT NULL REFERENCES public.shared_posts(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  comment text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.share_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can view comments on shared posts (public)
CREATE POLICY "Anyone can view share comments"
ON public.share_comments
FOR SELECT
USING (true);

-- Anyone can insert comments (no auth required for stakeholder review)
CREATE POLICY "Anyone can add share comments"
ON public.share_comments
FOR INSERT
WITH CHECK (true);
