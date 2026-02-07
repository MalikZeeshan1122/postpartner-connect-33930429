
-- 1. Team Collaboration: User roles enum and table
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'editor', 'viewer');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'viewer',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Owners/admins can view all roles
CREATE POLICY "Users can view roles"
ON public.user_roles
FOR SELECT
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'owner')
  OR public.has_role(auth.uid(), 'admin')
);

-- Only owners can manage roles
CREATE POLICY "Owners can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'owner'))
WITH CHECK (public.has_role(auth.uid(), 'owner'));

-- 2. Team invitations table
CREATE TABLE public.team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invited_by uuid NOT NULL,
  email text NOT NULL,
  role app_role NOT NULL DEFAULT 'editor',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  accepted_at timestamp with time zone
);

ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invitations"
ON public.team_invitations
FOR SELECT
USING (
  auth.uid() = invited_by
  OR public.has_role(auth.uid(), 'owner')
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can create invitations"
ON public.team_invitations
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'owner')
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update invitations"
ON public.team_invitations
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'owner')
  OR public.has_role(auth.uid(), 'admin')
);

-- 3. Post analytics table
CREATE TABLE public.post_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_post_id uuid REFERENCES public.scheduled_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  views integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  likes integer NOT NULL DEFAULT 0,
  comments integer NOT NULL DEFAULT 0,
  shares integer NOT NULL DEFAULT 0,
  engagement_rate numeric DEFAULT 0,
  recorded_at date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (scheduled_post_id, recorded_at)
);

ALTER TABLE public.post_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analytics"
ON public.post_analytics
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics"
ON public.post_analytics
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analytics"
ON public.post_analytics
FOR UPDATE
USING (auth.uid() = user_id);

-- Auto-assign owner role to existing users who have profiles
-- (via trigger for new signups)
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'owner')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();
