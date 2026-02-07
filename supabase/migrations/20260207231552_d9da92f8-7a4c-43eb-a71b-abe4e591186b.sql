
-- Create shared_posts table for public shareable links
CREATE TABLE public.shared_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  share_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  platform text NOT NULL,
  caption text NOT NULL,
  text_overlay text,
  image_url text,
  cta_text text,
  format text NOT NULL DEFAULT 'single',
  brand_name text,
  feedback_score numeric,
  feedback_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shared_posts ENABLE ROW LEVEL SECURITY;

-- Owner can manage their shared posts
CREATE POLICY "Users can manage their own shared posts"
ON public.shared_posts
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Anyone can view shared posts by token (public sharing)
CREATE POLICY "Anyone can view shared posts"
ON public.shared_posts
FOR SELECT
USING (true);
