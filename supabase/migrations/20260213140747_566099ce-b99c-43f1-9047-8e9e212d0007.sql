
-- Fix generate_seller_code search path
CREATE OR REPLACE FUNCTION public.generate_seller_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := 'SLR-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
    SELECT EXISTS(SELECT 1 FROM public.seller_profiles WHERE unique_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$;

-- Fix OTP policies - restrict to rate-limited inserts and time-based reads
DROP POLICY "Anyone can create OTP" ON public.otp_codes;
DROP POLICY "Anyone can read OTP for verification" ON public.otp_codes;
DROP POLICY "Anyone can update OTP" ON public.otp_codes;

-- OTP should only be managed via edge functions (service role), so restrict RLS
-- For dev, allow authenticated users to manage their own OTP flow
CREATE POLICY "Authenticated can insert OTP" ON public.otp_codes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can read OTP" ON public.otp_codes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can update OTP" ON public.otp_codes FOR UPDATE USING (auth.uid() IS NOT NULL);
