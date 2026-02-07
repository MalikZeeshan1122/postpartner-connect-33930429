
-- Add unique constraint for upsert support
ALTER TABLE public.social_connections ADD CONSTRAINT social_connections_user_platform_unique UNIQUE (user_id, platform);
