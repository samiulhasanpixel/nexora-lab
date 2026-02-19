import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const SellerSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [timeEnabled, setTimeEnabled] = useState(false);
  const [countEnabled, setCountEnabled] = useState(false);
  const [form, setForm] = useState({
    booking_start_time: "08:00",
    booking_end_time: "17:00",
    max_bookings: 30,
  });

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/"); return; }

      const { data } = await supabase
        .from("seller_profiles")
        .select("booking_start_time, booking_end_time, max_bookings")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setTimeEnabled(!!(data.booking_start_time && data.booking_end_time));
        setCountEnabled(!!data.max_bookings);
        setForm({
          booking_start_time: data.booking_start_time?.slice(0, 5) || "08:00",
          booking_end_time: data.booking_end_time?.slice(0, 5) || "17:00",
          max_bookings: data.max_bookings || 30,
        });
      }
    };
    load();
  }, [navigate]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("seller_profiles")
        .update({
          booking_start_time: timeEnabled ? form.booking_start_time + ":00" : null,
          booking_end_time: timeEnabled ? form.booking_end_time + ":00" : null,
          max_bookings: countEnabled ? form.max_bookings : null,
        })
        .eq("user_id", user.id);

      if (error) throw error;
      toast({ title: "Saved!", description: "Settings updated successfully" });
      navigate("/dashboard/seller");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/seller")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display font-bold text-foreground">Booking Settings</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-elevated rounded-2xl p-6 space-y-8"
        >
          {/* Time Window */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-seller" />
                <div>
                  <p className="font-display font-semibold text-foreground">Booking Time Window</p>
                  <p className="text-xs text-muted-foreground">নির্দিষ্ট সময়ের মধ্যেই বুকিং নেবেন</p>
                </div>
              </div>
              <Switch checked={timeEnabled} onCheckedChange={setTimeEnabled} />
            </div>
            {timeEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="grid grid-cols-2 gap-4 pl-8"
              >
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Start Time</Label>
                  <Input
                    type="time"
                    value={form.booking_start_time}
                    onChange={e => setForm(p => ({ ...p, booking_start_time: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">End Time</Label>
                  <Input
                    type="time"
                    value={form.booking_end_time}
                    onChange={e => setForm(p => ({ ...p, booking_end_time: e.target.value }))}
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Max Bookings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-seller" />
                <div>
                  <p className="font-display font-semibold text-foreground">Max Seat Limit</p>
                  <p className="text-xs text-muted-foreground">সর্বোচ্চ কতজন বুক করতে পারবে</p>
                </div>
              </div>
              <Switch checked={countEnabled} onCheckedChange={setCountEnabled} />
            </div>
            {countEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="pl-8"
              >
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Maximum Bookings</Label>
                  <Input
                    type="number"
                    min={1}
                    max={999}
                    value={form.max_bookings}
                    onChange={e => setForm(p => ({ ...p, max_bookings: parseInt(e.target.value) || 1 }))}
                  />
                </div>
              </motion.div>
            )}
          </div>

          <Button
            onClick={handleSave}
            disabled={loading}
            className="w-full gradient-seller text-seller-foreground border-0 hover:opacity-90 gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? "Saving..." : "Save Settings"}
          </Button>
        </motion.div>
      </main>
    </div>
  );
};

export default SellerSettings;
