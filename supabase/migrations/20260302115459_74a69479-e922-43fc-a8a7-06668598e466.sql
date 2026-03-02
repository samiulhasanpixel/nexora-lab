
-- Admin RPC: Get all customers with their profiles and booking stats
CREATE OR REPLACE FUNCTION public.admin_get_all_users()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'user_id', p.user_id,
        'full_name', p.full_name,
        'phone', p.phone,
        'phone_verified', p.phone_verified,
        'avatar_url', p.avatar_url,
        'created_at', p.created_at,
        'role', ur.role,
        'total_bookings', COALESCE(bc.cnt, 0),
        'active_bookings', COALESCE(bc.active, 0)
      ) ORDER BY p.created_at DESC
    ), '[]'::jsonb)
    FROM profiles p
    LEFT JOIN user_roles ur ON ur.user_id = p.user_id
    LEFT JOIN (
      SELECT customer_id, COUNT(*) as cnt,
             COUNT(*) FILTER (WHERE status IN ('waiting', 'in_progress')) as active
      FROM service_bookings GROUP BY customer_id
    ) bc ON bc.customer_id = p.user_id
  );
END;
$$;

-- Admin RPC: Get all sellers with their profiles
CREATE OR REPLACE FUNCTION public.admin_get_all_sellers()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'user_id', sp.user_id,
        'business_name', sp.business_name,
        'unique_code', sp.unique_code,
        'category', sp.category,
        'is_active', sp.is_active,
        'rating', sp.rating,
        'total_reviews', sp.total_reviews,
        'address', sp.address,
        'max_bookings', sp.max_bookings,
        'created_at', sp.created_at,
        'profile_image_url', sp.profile_image_url,
        'full_name', p.full_name,
        'phone', p.phone,
        'total_bookings', COALESCE(bc.cnt, 0),
        'active_bookings', COALESCE(bc.active, 0),
        'completed_bookings', COALESCE(bc.completed, 0)
      ) ORDER BY sp.created_at DESC
    ), '[]'::jsonb)
    FROM seller_profiles sp
    LEFT JOIN profiles p ON p.user_id = sp.user_id
    LEFT JOIN (
      SELECT seller_id, COUNT(*) as cnt,
             COUNT(*) FILTER (WHERE status IN ('waiting', 'in_progress')) as active,
             COUNT(*) FILTER (WHERE status = 'completed') as completed
      FROM service_bookings GROUP BY seller_id
    ) bc ON bc.seller_id = sp.user_id
  );
END;
$$;

-- Admin RPC: Get all bookings
CREATE OR REPLACE FUNCTION public.admin_get_all_bookings()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', sb.id,
        'token_number', sb.token_number,
        'status', sb.status,
        'created_at', sb.created_at,
        'customer_name', COALESCE(cp.full_name, 'Unknown'),
        'customer_phone', cp.phone,
        'seller_name', COALESCE(sp.business_name, 'Unknown'),
        'seller_code', sp.unique_code,
        'seller_id', sb.seller_id,
        'customer_id', sb.customer_id
      ) ORDER BY sb.created_at DESC
    ), '[]'::jsonb)
    FROM service_bookings sb
    LEFT JOIN profiles cp ON cp.user_id = sb.customer_id
    LEFT JOIN seller_profiles sp ON sp.user_id = sb.seller_id
  );
END;
$$;

-- Admin RPC: Get dashboard stats
CREATE OR REPLACE FUNCTION public.admin_get_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN jsonb_build_object(
    'total_customers', (SELECT COUNT(*) FROM user_roles WHERE role = 'customer'),
    'total_sellers', (SELECT COUNT(*) FROM user_roles WHERE role = 'seller'),
    'total_bookings', (SELECT COUNT(*) FROM service_bookings),
    'active_bookings', (SELECT COUNT(*) FROM service_bookings WHERE status IN ('waiting', 'in_progress')),
    'completed_bookings', (SELECT COUNT(*) FROM service_bookings WHERE status = 'completed'),
    'cancelled_bookings', (SELECT COUNT(*) FROM service_bookings WHERE status = 'cancelled')
  );
END;
$$;

-- Admin RPC: Block/unblock a user by toggling seller active status
CREATE OR REPLACE FUNCTION public.admin_toggle_seller_active(p_seller_user_id uuid, p_active boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE seller_profiles SET is_active = p_active WHERE user_id = p_seller_user_id;
END;
$$;
