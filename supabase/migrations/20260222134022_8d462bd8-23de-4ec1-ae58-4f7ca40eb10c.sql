
-- Create storage bucket for seller profile images
INSERT INTO storage.buckets (id, name, public) VALUES ('seller-images', 'seller-images', true);

-- Allow anyone to view seller images
CREATE POLICY "Public can view seller images"
ON storage.objects FOR SELECT
USING (bucket_id = 'seller-images');

-- Sellers can upload their own images
CREATE POLICY "Sellers can upload own images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'seller-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Sellers can update their own images
CREATE POLICY "Sellers can update own images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'seller-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Sellers can delete their own images
CREATE POLICY "Sellers can delete own images"
ON storage.objects FOR DELETE
USING (bucket_id = 'seller-images' AND auth.uid()::text = (storage.foldername(name))[1]);
