
-- Add template-related columns to seller_profiles
ALTER TABLE public.seller_profiles 
ADD COLUMN IF NOT EXISTS template_data jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS profile_image_url text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS theme text DEFAULT 'default';
