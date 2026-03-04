import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "visitor_session_id";

function getSessionId(): string {
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

function getBrowserInfo() {
  const ua = navigator.userAgent;
  let browser = "Unknown";
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edg")) browser = "Edge";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari")) browser = "Safari";
  else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";

  let os = "Unknown";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua);
  const deviceType = isMobile ? "Mobile" : "Desktop";

  return { browser, os, deviceType };
}

const VisitorTracker = () => {
  const location = useLocation();
  const pageEnterTime = useRef(Date.now());
  const lastPath = useRef(location.pathname);
  const visitorInfo = useRef<{ ip: string; country: string; city: string } | null>(null);
  const infoFetched = useRef(false);

  // Fetch IP/country once per session
  useEffect(() => {
    if (infoFetched.current) return;
    infoFetched.current = true;

    const fetchInfo = async () => {
      try {
        const { data } = await supabase.functions.invoke("get-visitor-info");
        visitorInfo.current = data || { ip: "unknown", country: "Unknown", city: "Unknown" };
      } catch {
        visitorInfo.current = { ip: "unknown", country: "Unknown", city: "Unknown" };
      }
    };
    fetchInfo();
  }, []);

  // Log page visit on route change
  useEffect(() => {
    const logPreviousPage = async () => {
      const duration = Math.round((Date.now() - pageEnterTime.current) / 1000);
      if (duration < 1) return; // skip instant redirects

      const { browser, os, deviceType } = getBrowserInfo();
      const info = visitorInfo.current || { ip: "unknown", country: "Unknown", city: "Unknown" };
      const sessionId = getSessionId();

      const { data: { session } } = await supabase.auth.getSession();

      await supabase.from("visitor_logs").insert({
        session_id: sessionId,
        user_id: session?.user?.id || null,
        ip_address: info.ip,
        country: info.country,
        city: info.city,
        browser,
        device_type: deviceType,
        os,
        page_path: lastPath.current,
        referrer: document.referrer || null,
        duration_seconds: duration,
      } as any);
    };

    // Log the previous page when path changes
    if (lastPath.current !== location.pathname) {
      logPreviousPage();
      lastPath.current = location.pathname;
      pageEnterTime.current = Date.now();
    }
  }, [location.pathname]);

  // Log on page unload
  useEffect(() => {
    const handleUnload = () => {
      const duration = Math.round((Date.now() - pageEnterTime.current) / 1000);
      if (duration < 1) return;

      const { browser, os, deviceType } = getBrowserInfo();
      const info = visitorInfo.current || { ip: "unknown", country: "Unknown", city: "Unknown" };
      const sessionId = getSessionId();

      const payload = JSON.stringify({
        session_id: sessionId,
        ip_address: info.ip,
        country: info.country,
        city: info.city,
        browser,
        device_type: deviceType,
        os,
        page_path: lastPath.current,
        referrer: document.referrer || null,
        duration_seconds: duration,
      });

      // Use sendBeacon for reliable unload logging
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/visitor_logs`;
      navigator.sendBeacon(
        url,
        new Blob([payload], { type: "application/json" })
      );
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  return null;
};

export default VisitorTracker;
