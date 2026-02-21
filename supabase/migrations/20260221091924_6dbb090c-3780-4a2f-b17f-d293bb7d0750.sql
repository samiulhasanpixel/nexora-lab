
CREATE OR REPLACE FUNCTION public.create_booking(p_customer_id uuid, p_seller_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_max_bookings integer;
  v_active_count integer;
  v_next_token integer;
  v_booking_id uuid;
BEGIN
  -- Get seller's max_bookings
  SELECT max_bookings INTO v_max_bookings
  FROM seller_profiles WHERE user_id = p_seller_id;

  -- Count all active bookings for this seller (bypasses RLS)
  SELECT COUNT(*) INTO v_active_count
  FROM service_bookings
  WHERE seller_id = p_seller_id AND status IN ('waiting', 'in_progress');

  -- Check seat limit
  IF v_max_bookings IS NOT NULL AND v_active_count >= v_max_bookings THEN
    RETURN jsonb_build_object('success', false, 'error', 'seat_full', 'max', v_max_bookings);
  END IF;

  -- Get next token number (from ALL bookings for this seller, not just current user's)
  SELECT COALESCE(MAX(token_number), 0) + 1 INTO v_next_token
  FROM service_bookings
  WHERE seller_id = p_seller_id AND status IN ('waiting', 'in_progress');

  -- Insert booking
  INSERT INTO service_bookings (customer_id, seller_id, token_number)
  VALUES (p_customer_id, p_seller_id, v_next_token)
  RETURNING id INTO v_booking_id;

  RETURN jsonb_build_object('success', true, 'token_number', v_next_token, 'booking_id', v_booking_id);
END;
$function$;
