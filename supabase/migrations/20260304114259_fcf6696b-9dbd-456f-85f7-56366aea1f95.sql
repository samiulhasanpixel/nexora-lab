
-- Visitor logs table to track all page visits
CREATE TABLE public.visitor_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  session_id text NOT NULL,
  ip_address text NULL,
  country text NULL,
  city text NULL,
  browser text NULL,
  device_type text NULL,
  os text NULL,
  page_path text NOT NULL,
  referrer text NULL,
  duration_seconds integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.visitor_logs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (tracking works for anonymous too)
CREATE POLICY "Anyone can insert visitor logs"
  ON public.visitor_logs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins read via RPC, no direct select
CREATE POLICY "No direct select on visitor_logs"
  ON public.visitor_logs FOR SELECT
  USING (false);

-- Index for admin queries
CREATE INDEX idx_visitor_logs_created_at ON public.visitor_logs (created_at DESC);
CREATE INDEX idx_visitor_logs_country ON public.visitor_logs (country);
CREATE INDEX idx_visitor_logs_session ON public.visitor_logs (session_id);

-- Admin RPC to get visitor analytics with filters
CREATE OR REPLACE FUNCTION public.admin_get_visitor_analytics(
  p_country text DEFAULT NULL,
  p_browser text DEFAULT NULL,
  p_device_type text DEFAULT NULL,
  p_page_path text DEFAULT NULL,
  p_days integer DEFAULT 7
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT jsonb_build_object(
    'summary', (
      SELECT jsonb_build_object(
        'total_visits', COUNT(*),
        'unique_sessions', COUNT(DISTINCT session_id),
        'unique_users', COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL),
        'avg_duration', ROUND(AVG(duration_seconds))
      )
      FROM visitor_logs
      WHERE created_at >= now() - (p_days || ' days')::interval
        AND (p_country IS NULL OR country = p_country)
        AND (p_browser IS NULL OR browser = p_browser)
        AND (p_device_type IS NULL OR device_type = p_device_type)
        AND (p_page_path IS NULL OR page_path = p_page_path)
    ),
    'by_country', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('country', country, 'visits', cnt) ORDER BY cnt DESC), '[]'::jsonb)
      FROM (
        SELECT COALESCE(country, 'Unknown') as country, COUNT(*) as cnt
        FROM visitor_logs
        WHERE created_at >= now() - (p_days || ' days')::interval
        GROUP BY country ORDER BY cnt DESC LIMIT 20
      ) sub
    ),
    'by_browser', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('browser', browser, 'visits', cnt) ORDER BY cnt DESC), '[]'::jsonb)
      FROM (
        SELECT COALESCE(browser, 'Unknown') as browser, COUNT(*) as cnt
        FROM visitor_logs
        WHERE created_at >= now() - (p_days || ' days')::interval
          AND (p_country IS NULL OR country = p_country)
        GROUP BY browser ORDER BY cnt DESC LIMIT 10
      ) sub
    ),
    'by_device', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('device', device_type, 'visits', cnt) ORDER BY cnt DESC), '[]'::jsonb)
      FROM (
        SELECT COALESCE(device_type, 'Unknown') as device_type, COUNT(*) as cnt
        FROM visitor_logs
        WHERE created_at >= now() - (p_days || ' days')::interval
          AND (p_country IS NULL OR country = p_country)
        GROUP BY device_type ORDER BY cnt DESC
      ) sub
    ),
    'by_page', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('page', page_path, 'visits', cnt, 'avg_duration', avg_dur) ORDER BY cnt DESC), '[]'::jsonb)
      FROM (
        SELECT page_path, COUNT(*) as cnt, ROUND(AVG(duration_seconds)) as avg_dur
        FROM visitor_logs
        WHERE created_at >= now() - (p_days || ' days')::interval
          AND (p_country IS NULL OR country = p_country)
        GROUP BY page_path ORDER BY cnt DESC LIMIT 20
      ) sub
    ),
    'recent_visitors', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'session_id', session_id,
        'user_id', user_id,
        'ip_address', ip_address,
        'country', country,
        'city', city,
        'browser', browser,
        'device_type', device_type,
        'os', os,
        'page_path', page_path,
        'duration_seconds', duration_seconds,
        'created_at', created_at
      ) ORDER BY created_at DESC), '[]'::jsonb)
      FROM (
        SELECT * FROM visitor_logs
        WHERE created_at >= now() - (p_days || ' days')::interval
          AND (p_country IS NULL OR country = p_country)
          AND (p_browser IS NULL OR browser = p_browser)
          AND (p_device_type IS NULL OR device_type = p_device_type)
          AND (p_page_path IS NULL OR page_path = p_page_path)
        ORDER BY created_at DESC
        LIMIT 100
      ) sub
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;
