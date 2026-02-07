
-- Create storage bucket for post assets
INSERT INTO storage.buckets (id, name, public) VALUES ('post-assets', 'post-assets', true);

-- Allow public read access
CREATE POLICY "Post assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-assets');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload post assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'post-assets');

-- Allow service role to manage (for edge functions)
CREATE POLICY "Service role can manage post assets"
ON storage.objects FOR ALL
USING (bucket_id = 'post-assets');
