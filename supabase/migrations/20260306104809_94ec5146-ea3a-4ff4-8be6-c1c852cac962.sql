-- Ensure sellers can always view their own seller profile even when expired/blocked
DROP POLICY IF EXISTS "Anyone can view active sellers" ON public.seller_profiles;

CREATE POLICY "Public active or seller own profile view"
ON public.seller_profiles
AS PERMISSIVE
FOR SELECT
USING (
  is_active = true OR auth.uid() = user_id
);

-- Keep plan status in sync with dates every time admin loads sellers
CREATE OR REPLACE FUNCTION public.admin_get_all_sellers()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.seller_profiles
  SET plan_status = 'expired',
      is_active = false
  WHERE plan_status <> 'expired'
    AND (
      (plan_status = 'trial' AND trial_end_date IS NOT NULL AND now() > trial_end_date)
      OR (plan_status = 'active' AND subscription_end IS NOT NULL AND now() > subscription_end)
    );

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
    FROM public.seller_profiles sp
    LEFT JOIN public.profiles p ON p.user_id = sp.user_id
    LEFT JOIN (
      SELECT seller_id, COUNT(*) as cnt,
             COUNT(*) FILTER (WHERE status IN ('waiting', 'in_progress')) as active,
             COUNT(*) FILTER (WHERE status = 'completed') as completed
      FROM public.service_bookings GROUP BY seller_id
    ) bc ON bc.seller_id = sp.user_id
  );
END;
$function$;