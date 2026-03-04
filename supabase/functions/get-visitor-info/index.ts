import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get IP from headers
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || req.headers.get('x-real-ip') 
      || 'unknown';

    // Try to get country/city from free IP API
    let country = 'Unknown';
    let city = 'Unknown';

    if (ip && ip !== 'unknown' && ip !== '127.0.0.1') {
      try {
        const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=country,city`);
        if (geoRes.ok) {
          const geo = await geoRes.json();
          country = geo.country || 'Unknown';
          city = geo.city || 'Unknown';
        }
      } catch {
        // Geo lookup failed, use defaults
      }
    }

    return new Response(JSON.stringify({ ip, country, city }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ ip: 'unknown', country: 'Unknown', city: 'Unknown' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
