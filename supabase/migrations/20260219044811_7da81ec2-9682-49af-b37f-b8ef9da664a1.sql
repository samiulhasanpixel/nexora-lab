
-- 1. Add seller settings columns for time window and seat limit
ALTER TABLE public.seller_profiles 
ADD COLUMN IF NOT EXISTS booking_start_time time DEFAULT NULL,
ADD COLUMN IF NOT EXISTS booking_end_time time DEFAULT NULL,
ADD COLUMN IF NOT EXISTS max_bookings integer DEFAULT NULL;

-- 2. Add DELETE policy on service_bookings for sellers (for queue clear)
CREATE POLICY "Sellers can delete their bookings"
ON public.service_bookings
FOR DELETE
USING (auth.uid() = seller_id);
