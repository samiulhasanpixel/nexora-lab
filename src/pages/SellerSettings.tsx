import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Clock, Users, CalendarOff, MessageSquare, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const SellerSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [timeEnabled, setTimeEnabled] = useState(false);
  const [countEnabled, setCountEnabled] = useState(false);
  const [offDaysEnabled, setOffDaysEnabled] = useState(false);
  const [form, setForm] = useState({
    booking_start_time: "08:00",
    booking_end_time: "17:00",
    max_bookings: 30,
    customer_message: "",
    alarm_message: "Almost your turn! Get ready!",
    alarm_threshold: 2,
  });
  const [offDays, setOffDays] = useState<number[]>([]);
  const [offDates, setOffDates] = useState<Date[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/"); return; }

      const { data } = await supabase
        .from("seller_profiles")
        .select("booking_start_time, booking_end_time, max_bookings, off_days, off_dates, customer_message, alarm_message, alarm_threshold")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setTimeEnabled(!!(data.booking_start_time && data.booking_end_time));
        setCountEnabled(!!data.max_bookings);
        const days = (data.off_days as number[]) || [];
        const dates = ((data.off_dates as string[]) || []).map(d => new Date(d));
        setOffDaysEnabled(days.length > 0 || dates.length > 0);
        setOffDays(days);
        setOffDates(dates);
        setForm({
          booking_start_time: data.booking_start_time?.slice(0, 5) || "08:00",
          booking_end_time: data.booking_end_time?.slice(0, 5) || "17:00",
          max_bookings: data.max_bookings || 30,
          customer_message: (data.customer_message as string) || "",
          alarm_message: (data as any).alarm_message || "Almost your turn! Get ready!",
          alarm_threshold: (data as any).alarm_threshold || 2,
        });
      }
    };
    load();
  }, [navigate]);

  const toggleDay = (day: number) => {
    setOffDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

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
          off_days: offDaysEnabled ? offDays : [],
          off_dates: offDaysEnabled ? offDates.map(d => d.toISOString().split('T')[0]) : [],
          customer_message: form.customer_message || "",
          alarm_message: form.alarm_message || "",
          alarm_threshold: form.alarm_threshold || 2,
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
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          className="glass-elevated rounded-2xl p-6 space-y-8">

          {/* Time Window */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-seller" />
                <div>
                  <p className="font-display font-semibold text-foreground">Booking Time Window</p>
                  <p className="text-xs text-muted-foreground">Accept bookings only within specific hours</p>
                </div>
              </div>
              <Switch checked={timeEnabled} onCheckedChange={setTimeEnabled} />
            </div>
            {timeEnabled && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="grid grid-cols-2 gap-4 pl-8">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Start Time</Label>
                  <Input type="time" value={form.booking_start_time} onChange={e => setForm(p => ({ ...p, booking_start_time: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">End Time</Label>
                  <Input type="time" value={form.booking_end_time} onChange={e => setForm(p => ({ ...p, booking_end_time: e.target.value }))} />
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
                  <p className="text-xs text-muted-foreground">Maximum number of bookings allowed</p>
                </div>
              </div>
              <Switch checked={countEnabled} onCheckedChange={setCountEnabled} />
            </div>
            {countEnabled && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="pl-8">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Maximum Bookings</Label>
                  <Input type="number" min={1} max={999} value={form.max_bookings} onChange={e => setForm(p => ({ ...p, max_bookings: parseInt(e.target.value) || 1 }))} />
                </div>
              </motion.div>
            )}
          </div>

          {/* Off Days */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CalendarOff className="w-5 h-5 text-seller" />
                <div>
                  <p className="font-display font-semibold text-foreground">Off Days / Dates</p>
                  <p className="text-xs text-muted-foreground">Days when bookings are closed</p>
                </div>
              </div>
              <Switch checked={offDaysEnabled} onCheckedChange={setOffDaysEnabled} />
            </div>
            {offDaysEnabled && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="pl-8 space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Weekly Off Days</Label>
                  <div className="flex flex-wrap gap-2">
                    {DAY_NAMES.map((name, i) => (
                      <label key={i} className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer border transition-all",
                        offDays.includes(i) ? "bg-seller/15 text-seller border-seller/30" : "bg-muted text-muted-foreground border-border"
                      )}>
                        <Checkbox checked={offDays.includes(i)} onCheckedChange={() => toggleDay(i)} className="w-3.5 h-3.5" />
                        {name}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Specific Off Dates</Label>
                  <Calendar mode="multiple" selected={offDates}
                    onSelect={(dates) => setOffDates(dates || [])}
                    className={cn("p-3 pointer-events-auto rounded-xl border border-border bg-card")} />
                </div>
              </motion.div>
            )}
          </div>

          {/* Customer Message */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-seller" />
              <div>
                <p className="font-display font-semibold text-foreground">Customer Message</p>
                <p className="text-xs text-muted-foreground">Real-time message for customers</p>
              </div>
            </div>
            <Textarea placeholder="Write a special notice for customers..."
              value={form.customer_message} onChange={e => setForm(p => ({ ...p, customer_message: e.target.value }))}
              className="min-h-[80px]" />
          </div>

          {/* Alarm Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-seller" />
              <div>
                <p className="font-display font-semibold text-foreground">Queue Alarm Settings</p>
                <p className="text-xs text-muted-foreground">Alert customers when their turn is near</p>
              </div>
            </div>
            <div className="pl-8 space-y-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Alert when this many people ahead</Label>
                <Input type="number" min={1} max={10} value={form.alarm_threshold}
                  onChange={e => setForm(p => ({ ...p, alarm_threshold: parseInt(e.target.value) || 2 }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Alarm Message</Label>
                <Textarea placeholder="Almost your turn! Get ready!"
                  value={form.alarm_message} onChange={e => setForm(p => ({ ...p, alarm_message: e.target.value }))}
                  className="min-h-[60px]" />
              </div>
            </div>
          </div>

          <Button onClick={handleSave} disabled={loading}
            className="w-full gradient-seller text-seller-foreground border-0 hover:opacity-90 gap-2">
            <Save className="w-4 h-4" />
            {loading ? "Saving..." : "Save Settings"}
          </Button>
        </motion.div>
      </main>
    </div>
  );
};

export default SellerSettings;
