
-- Add off-days and customer message columns to seller_profiles
ALTER TABLE public.seller_profiles 
ADD COLUMN IF NOT EXISTS off_days integer[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS off_dates date[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS customer_message text DEFAULT '';

-- Allow customers to delete their own bookings
CREATE POLICY "Customers can delete own bookings" 
ON public.service_bookings 
FOR DELETE 
USING (auth.uid() = customer_id);
