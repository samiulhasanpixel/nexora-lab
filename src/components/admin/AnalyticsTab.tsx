import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Globe, Monitor, Smartphone, Clock, Eye, Users, MapPin,
  Search, RefreshCw, Loader2, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AnalyticsTab = () => {
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [countryFilter, setCountryFilter] = useState("all");
  const [browserFilter, setBrowserFilter] = useState("all");
  const [deviceFilter, setDeviceFilter] = useState("all");
  const [pageFilter, setPageFilter] = useState("all");
  const [daysFilter, setDaysFilter] = useState("7");
  const [searchQuery, setSearchQuery] = useState("");

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.rpc("admin_get_visitor_analytics", {
        p_country: countryFilter === "all" ? null : countryFilter,
        p_browser: browserFilter === "all" ? null : browserFilter,
        p_device_type: deviceFilter === "all" ? null : deviceFilter,
        p_page_path: pageFilter === "all" ? null : pageFilter,
        p_days: parseInt(daysFilter),
      });
      if (error) throw error;
      setData(result);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAnalytics(); }, [countryFilter, browserFilter, deviceFilter, pageFilter, daysFilter]);

  const filteredVisitors = (data?.recent_visitors || []).filter((v: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      v.ip_address?.toLowerCase().includes(q) ||
      v.country?.toLowerCase().includes(q) ||
      v.city?.toLowerCase().includes(q) ||
      v.browser?.toLowerCase().includes(q) ||
      v.page_path?.toLowerCase().includes(q)
    );
  });

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const summary = data?.summary || {};

  const summaryCards = [
    { label: "Total Visits", value: summary.total_visits || 0, icon: Eye, color: "bg-primary" },
    { label: "Unique Sessions", value: summary.unique_sessions || 0, icon: Users, color: "bg-accent" },
    { label: "Logged-in Users", value: summary.unique_users || 0, icon: Users, color: "bg-green-500" },
    { label: "Avg Duration", value: `${summary.avg_duration || 0}s`, icon: Clock, color: "bg-orange-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card rounded-xl p-4 text-center"
          >
            <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center mx-auto mb-2`}>
              <card.icon className="w-5 h-5 text-primary-foreground" />
            </div>
            <p className="text-2xl font-display font-bold text-foreground">{card.value}</p>
            <p className="text-xs text-muted-foreground">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search IP, country, page..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={daysFilter} onValueChange={setDaysFilter}>
          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Last 1 day</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
        <Select value={countryFilter} onValueChange={setCountryFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Country" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            {(data?.by_country || []).map((c: any) => (
              <SelectItem key={c.country} value={c.country}>{c.country} ({c.visits})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={browserFilter} onValueChange={setBrowserFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Browser" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Browsers</SelectItem>
            {(data?.by_browser || []).map((b: any) => (
              <SelectItem key={b.browser} value={b.browser}>{b.browser} ({b.visits})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={deviceFilter} onValueChange={setDeviceFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Device" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Devices</SelectItem>
            {(data?.by_device || []).map((d: any) => (
              <SelectItem key={d.device} value={d.device}>{d.device} ({d.visits})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={pageFilter} onValueChange={setPageFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Page" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Pages</SelectItem>
            {(data?.by_page || []).map((p: any) => (
              <SelectItem key={p.page} value={p.page}>{p.page} ({p.visits})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" onClick={loadAnalytics} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Breakdown sections side by side */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* By Country */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground text-sm">Countries</h3>
          </div>
          <div className="space-y-2 max-h-[250px] overflow-y-auto">
            {(data?.by_country || []).map((c: any) => (
              <div key={c.country} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{c.country}</span>
                <Badge variant="secondary" className="text-xs">{c.visits}</Badge>
              </div>
            ))}
            {!(data?.by_country?.length) && <p className="text-xs text-muted-foreground">No data yet</p>}
          </div>
        </div>

        {/* By Browser */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Monitor className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground text-sm">Browsers</h3>
          </div>
          <div className="space-y-2 max-h-[250px] overflow-y-auto">
            {(data?.by_browser || []).map((b: any) => (
              <div key={b.browser} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{b.browser}</span>
                <Badge variant="secondary" className="text-xs">{b.visits}</Badge>
              </div>
            ))}
            {!(data?.by_browser?.length) && <p className="text-xs text-muted-foreground">No data yet</p>}
          </div>
        </div>

        {/* By Device */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Smartphone className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground text-sm">Devices</h3>
          </div>
          <div className="space-y-2 max-h-[250px] overflow-y-auto">
            {(data?.by_device || []).map((d: any) => (
              <div key={d.device} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{d.device}</span>
                <Badge variant="secondary" className="text-xs">{d.visits}</Badge>
              </div>
            ))}
            {!(data?.by_device?.length) && <p className="text-xs text-muted-foreground">No data yet</p>}
          </div>
        </div>
      </div>

      {/* Page visits */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">Top Pages</h3>
        </div>
        <div className="space-y-2">
          {(data?.by_page || []).map((p: any) => (
            <div key={p.page} className="flex items-center justify-between text-sm">
              <span className="text-foreground font-mono text-xs">{p.page}</span>
              <div className="flex gap-3">
                <span className="text-muted-foreground text-xs">{p.avg_duration}s avg</span>
                <Badge variant="secondary" className="text-xs">{p.visits} visits</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent visitors list */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground text-sm">Recent Visitors</h3>
          </div>
          <p className="text-xs text-muted-foreground">{filteredVisitors.length} records</p>
        </div>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {filteredVisitors.map((v: any, i: number) => (
            <motion.div
              key={`${v.session_id}-${v.created_at}-${i}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.01 }}
              className="border border-border rounded-lg p-3 flex flex-wrap items-center justify-between gap-2"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${v.device_type === 'Mobile' ? 'bg-accent/15' : 'bg-primary/15'}`}>
                  {v.device_type === 'Mobile' ? (
                    <Smartphone className="w-4 h-4 text-accent" />
                  ) : (
                    <Monitor className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {v.country}{v.city && v.city !== 'Unknown' ? `, ${v.city}` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {v.browser} • {v.os} • {v.page_path}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant="outline" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />{v.duration_seconds}s
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(v.created_at).toLocaleString()}
                </span>
              </div>
            </motion.div>
          ))}
          {filteredVisitors.length === 0 && (
            <p className="text-center text-muted-foreground py-8 text-sm">No visitor data yet. Data will appear as users visit your app.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
