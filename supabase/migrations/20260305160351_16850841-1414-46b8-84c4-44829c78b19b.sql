
-- Fix ratings RLS policies: change from RESTRICTIVE to PERMISSIVE
DROP POLICY IF EXISTS "Anyone can view ratings" ON public.ratings;
DROP POLICY IF EXISTS "Customers can insert own ratings" ON public.ratings;

CREATE POLICY "Anyone can view ratings"
ON public.ratings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Customers can insert own ratings"
ON public.ratings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = customer_id);
