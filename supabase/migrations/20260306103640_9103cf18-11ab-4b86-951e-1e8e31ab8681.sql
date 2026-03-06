
CREATE OR REPLACE FUNCTION public.admin_upgrade_seller(p_seller_user_id uuid, p_active boolean, p_days integer DEFAULT 30)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_active THEN
    UPDATE seller_profiles 
    SET plan_status = 'active', 
        subscription_end = now() + (p_days || ' days')::interval,
        is_active = true
    WHERE user_id = p_seller_user_id;
  ELSE
    UPDATE seller_profiles 
    SET plan_status = 'expired',
        is_active = false
    WHERE user_id = p_seller_user_id;
  END IF;
END;
$function$;
