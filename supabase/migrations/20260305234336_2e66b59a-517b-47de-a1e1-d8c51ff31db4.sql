
-- Add trial/subscription fields to seller_profiles
ALTER TABLE public.seller_profiles
  ADD COLUMN IF NOT EXISTS trial_start_date timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS trial_end_date timestamptz DEFAULT (now() + interval '60 days'),
  ADD COLUMN IF NOT EXISTS plan_status text DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS subscription_end timestamptz DEFAULT NULL;

-- Update existing sellers to have trial dates
UPDATE public.seller_profiles
SET trial_start_date = created_at,
    trial_end_date = created_at + interval '60 days',
    plan_status = 'trial'
WHERE trial_start_date IS NULL;

-- Create admin function to manage subscriptions
CREATE OR REPLACE FUNCTION public.admin_upgrade_seller(p_seller_user_id uuid, p_active boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_active THEN
    UPDATE seller_profiles 
    SET plan_status = 'active', 
        subscription_end = now() + interval '30 days',
        is_active = true
    WHERE user_id = p_seller_user_id;
  ELSE
    UPDATE seller_profiles 
    SET plan_status = 'expired',
        is_active = false
    WHERE user_id = p_seller_user_id;
  END IF;
END;
$$;

-- Update admin_get_all_sellers to include trial info
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
        'completed_bookings', COALESCE(bc.completed, 0),
        'trial_start_date', sp.trial_start_date,
        'trial_end_date', sp.trial_end_date,
        'plan_status', sp.plan_status,
        'subscription_end', sp.subscription_end
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
