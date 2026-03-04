
-- Ratings table
CREATE TABLE public.ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  booking_id uuid NOT NULL REFERENCES public.service_bookings(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(booking_id)
);

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can insert own ratings" ON public.ratings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Anyone can view ratings" ON public.ratings
  FOR SELECT TO authenticated USING (true);

-- Add alarm_message to seller_profiles
ALTER TABLE public.seller_profiles ADD COLUMN IF NOT EXISTS alarm_message text DEFAULT 'আর ২ জন বাকি! প্রস্তুত হোন!';
ALTER TABLE public.seller_profiles ADD COLUMN IF NOT EXISTS alarm_threshold integer DEFAULT 2;

-- RPC to submit rating and update seller average
CREATE OR REPLACE FUNCTION public.submit_rating(
  p_customer_id uuid,
  p_seller_id uuid,
  p_booking_id uuid,
  p_rating integer,
  p_review text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_avg numeric;
  v_count integer;
BEGIN
  -- Check booking belongs to customer and is completed
  IF NOT EXISTS (
    SELECT 1 FROM service_bookings 
    WHERE id = p_booking_id AND customer_id = p_customer_id AND status = 'completed'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_booking');
  END IF;

  -- Check not already rated
  IF EXISTS (SELECT 1 FROM ratings WHERE booking_id = p_booking_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_rated');
  END IF;

  INSERT INTO ratings (customer_id, seller_id, booking_id, rating, review)
  VALUES (p_customer_id, p_seller_id, p_booking_id, p_rating, p_review);

  -- Update seller average
  SELECT AVG(rating), COUNT(*) INTO v_avg, v_count
  FROM ratings WHERE seller_id = p_seller_id;

  UPDATE seller_profiles SET rating = ROUND(v_avg, 1), total_reviews = v_count
  WHERE user_id = p_seller_id;

  RETURN jsonb_build_object('success', true, 'new_avg', ROUND(v_avg, 1), 'total', v_count);
END;
$$;
