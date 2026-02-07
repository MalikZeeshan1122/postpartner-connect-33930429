
-- Brands table to store brand profiles
CREATE TABLE public.brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  website_url TEXT,
  brand_voice JSONB DEFAULT '{}',
  visual_identity JSONB DEFAULT '{}',
  sample_posts TEXT[] DEFAULT '{}',
  guidelines TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own brands" ON public.brands FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Content plans table
CREATE TABLE public.content_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.content_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own content plans" ON public.content_plans FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Content plan items
CREATE TABLE public.plan_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.content_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  intent TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'instagram', 'both')),
  scheduled_date DATE,
  tone TEXT,
  cta TEXT,
  extra_context TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'review', 'approved', 'published')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.plan_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own plan items" ON public.plan_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Generated post variations
CREATE TABLE public.post_variations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_item_id UUID NOT NULL REFERENCES public.plan_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'instagram')),
  caption TEXT NOT NULL,
  image_prompt TEXT,
  image_url TEXT,
  text_overlay TEXT,
  feedback_score NUMERIC,
  feedback_notes JSONB DEFAULT '[]',
  iteration INTEGER NOT NULL DEFAULT 1,
  is_selected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.post_variations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own post variations" ON public.post_variations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON public.brands FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
