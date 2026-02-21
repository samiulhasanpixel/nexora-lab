
CREATE OR REPLACE FUNCTION public.get_queue_data(p_seller_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_bookings jsonb;
  v_seller jsonb;
BEGIN
  -- Get all non-cancelled bookings for this seller with customer names
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', sb.id,
      'token_number', sb.token_number,
      'status', sb.status,
      'customer_id', sb.customer_id,
      'created_at', sb.created_at,
      'customer_name', COALESCE(p.full_name, 'Customer')
    ) ORDER BY sb.token_number ASC
  )
  INTO v_bookings
  FROM service_bookings sb
  LEFT JOIN profiles p ON p.user_id = sb.customer_id
  WHERE sb.seller_id = p_seller_id
    AND sb.status != 'cancelled';

  RETURN COALESCE(v_bookings, '[]'::jsonb);
END;
$function$;
