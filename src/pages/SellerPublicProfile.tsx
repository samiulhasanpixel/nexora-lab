import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Clock, Users, Star, Phone, Mail, GraduationCap, Stethoscope, Scissors, Building2, DollarSign, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const themeStyles: Record<string, { gradient: string; accent: string; bg: string }> = {
  default: { gradient: 'gradient-primary', accent: 'text-primary', bg: 'bg-primary/10' },
  seller: { gradient: 'gradient-seller', accent: 'text-[hsl(262,60%,55%)]', bg: 'bg-[hsl(262,60%,55%)]/10' },
  warm: { gradient: 'gradient-accent', accent: 'text-accent', bg: 'bg-accent/10' },
  green: { gradient: 'bg-gradient-to-br from-emerald-500 to-teal-600', accent: 'text-emerald-600', bg: 'bg-emerald-50' },
};

const categoryFields: Record<string, { label: string; key: string; icon: any }[]> = {
  'Doctor': [
    { label: 'Qualifications', key: 'qualifications', icon: GraduationCap },
    { label: 'Specialization', key: 'specialization', icon: Stethoscope },
    { label: 'Visit Fee', key: 'visit_fee', icon: DollarSign },
    { label: 'Chamber Location', key: 'chamber_location', icon: MapPin },
    { label: 'Experience', key: 'experience', icon: Star },
  ],
  'Hospital': [
    { label: 'Departments', key: 'departments', icon: Building2 },
    { label: 'Facilities', key: 'facilities', icon: CheckCircle },
    { label: 'Doctors List', key: 'doctors_list', icon: Stethoscope },
    { label: 'Visit Fee Range', key: 'visit_fee', icon: DollarSign },
    { label: 'Emergency', key: 'emergency_info', icon: Phone },
  ],
  'Salon': [
    { label: 'Services', key: 'services_list', icon: Scissors },
    { label: 'Price Range', key: 'price_range', icon: DollarSign },
    { label: 'Opening Hours', key: 'opening_hours', icon: Clock },
  ],
  'Parlor': [
    { label: 'Services', key: 'services_list', icon: Scissors },
    { label: 'Price Range', key: 'price_range', icon: DollarSign },
    { label: 'Opening Hours', key: 'opening_hours', icon: Clock },
  ],
};

const SellerPublicProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { sellerId } = useParams();
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [queueStats, setQueueStats] = useState({ waiting: 0, completed: 0, in_progress: 0, currentSerial: 0 });

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('seller_profiles')
        .select('*').eq('user_id', sellerId).single();
      setSeller(data);

      // Get queue stats via RPC
      if (data) {
        const { data: queueData } = await supabase.rpc('get_queue_data', { p_seller_id: data.user_id });
        const all = (queueData as any[]) || [];
        setQueueStats({
          waiting: all.filter(b => b.status === 'waiting').length,
          completed: all.filter(b => b.status === 'completed').length,
          in_progress: all.filter(b => b.status === 'in_progress').length,
          currentSerial: all.find(b => b.status === 'in_progress')?.token_number || 0,
        });
      }
      setLoading(false);
    };
    load();
  }, [sellerId]);

  const handleBook = async () => {
    setBooking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/auth/customer'); return; }

      // Duplicate check
      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
      const { data: recent } = await supabase.from('service_bookings')
        .select('id').eq('customer_id', user.id).eq('seller_id', seller.user_id)
        .gte('created_at', twelveHoursAgo).in('status', ['waiting', 'in_progress']);
      if (recent && recent.length > 0) {
        toast({ title: "Already Booked!", description: "১২ ঘণ্টার মধ্যে আবার বুক করা যাবে না।", variant: "destructive" });
        setBooking(false); return;
      }

      // Off-day check
      const today = new Date();
      const offDays = (seller.off_days as number[]) || [];
      if (offDays.includes(today.getDay())) {
        toast({ title: "Closed Today!", description: "আজ বুকিং বন্ধ আছে।", variant: "destructive" });
        setBooking(false); return;
      }

      // Off-date check
      const todayStr = today.toISOString().split('T')[0];
      if ((seller.off_dates as string[] || []).includes(todayStr)) {
        toast({ title: "Closed Today!", description: "আজ বুকিং বন্ধ আছে।", variant: "destructive" });
        setBooking(false); return;
      }

      // Time window check
      if (seller.booking_start_time && seller.booking_end_time) {
        const now = new Date();
        const ct = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
        if (ct < seller.booking_start_time || ct > seller.booking_end_time) {
          toast({ title: "Time's Up!", description: `বুকিং ${seller.booking_start_time.slice(0, 5)} - ${seller.booking_end_time.slice(0, 5)} এর মধ্যে।`, variant: "destructive" });
          setBooking(false); return;
        }
      }

      const { data: result, error } = await supabase.rpc('create_booking', {
        p_customer_id: user.id, p_seller_id: seller.user_id,
      });
      if (error) throw error;
      const res = result as any;
      if (!res.success) {
        if (res.error === 'seat_full') {
          toast({ title: "Seat Full!", description: `সর্বোচ্চ ${res.max} জন বুক করতে পারে।`, variant: "destructive" });
          setBooking(false); return;
        }
        throw new Error(res.error);
      }
      toast({ title: "Booked!", description: `Token #${res.token_number}` });
      navigate(`/queue/${res.booking_id}`);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Seller not found</p>
      </div>
    );
  }

  const theme = themeStyles[seller.theme] || themeStyles.default;
  const templateData = (seller.template_data || {}) as Record<string, string>;
  const matchedCategory = Object.keys(categoryFields).find(
    c => seller.category?.toLowerCase().includes(c.toLowerCase())
  );
  const fields = matchedCategory ? categoryFields[matchedCategory] : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className={`${theme.gradient} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-3xl mx-auto px-6 pt-6 pb-16">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-white/80 hover:text-white hover:bg-white/10 mb-4">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-4">
            {seller.profile_image_url ? (
              <img src={seller.profile_image_url} alt={seller.business_name} className="w-20 h-20 rounded-2xl object-cover border-2 border-white/30" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center">
                <span className="text-3xl font-bold text-white">{seller.business_name?.[0] || 'S'}</span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-display font-bold text-white">{seller.business_name}</h1>
              <p className="text-white/70 text-sm font-mono">{seller.unique_code}</p>
              {seller.category && (
                <span className="inline-block mt-1 px-3 py-0.5 bg-white/20 rounded-full text-xs text-white font-medium">
                  {seller.category}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 -mt-8 pb-8 space-y-4">
        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-3">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-elevated rounded-xl p-4 text-center">
            <Clock className={`w-5 h-5 mx-auto mb-1 ${theme.accent}`} />
            <p className="text-xl font-display font-bold text-foreground">{queueStats.currentSerial || '-'}</p>
            <p className="text-[10px] text-muted-foreground">Current Serial</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-elevated rounded-xl p-4 text-center">
            <Users className="w-5 h-5 mx-auto mb-1 text-accent" />
            <p className="text-xl font-display font-bold text-foreground">{queueStats.waiting}</p>
            <p className="text-[10px] text-muted-foreground">Waiting</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-elevated rounded-xl p-4 text-center">
            <CheckCircle className="w-5 h-5 mx-auto mb-1 text-green-500" />
            <p className="text-xl font-display font-bold text-foreground">{queueStats.completed}</p>
            <p className="text-[10px] text-muted-foreground">Completed</p>
          </motion.div>
        </div>

        {/* Customer message */}
        {seller.customer_message && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`glass-elevated rounded-2xl p-4 border-l-4 ${theme.accent.replace('text-', 'border-')}`}>
            <p className="text-sm text-foreground">{seller.customer_message}</p>
          </motion.div>
        )}

        {/* Details */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-elevated rounded-2xl p-6 space-y-4">
          {seller.description && (
            <div>
              <h3 className="font-display font-semibold text-foreground mb-1">About</h3>
              <p className="text-sm text-muted-foreground">{seller.description}</p>
            </div>
          )}

          {seller.address && (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
              <p className="text-sm text-muted-foreground">{seller.address}</p>
            </div>
          )}

          {seller.booking_start_time && seller.booking_end_time && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Booking: {seller.booking_start_time.slice(0, 5)} - {seller.booking_end_time.slice(0, 5)}
              </p>
            </div>
          )}

          {seller.max_bookings && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Max {seller.max_bookings} seats per session</p>
            </div>
          )}

          {seller.rating > 0 && (
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-accent fill-current" />
              <p className="text-sm text-foreground font-medium">{seller.rating} ({seller.total_reviews} reviews)</p>
            </div>
          )}
        </motion.div>

        {/* Category-specific template fields */}
        {fields.length > 0 && Object.keys(templateData).some(k => templateData[k]) && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-elevated rounded-2xl p-6 space-y-3">
            <h3 className="font-display font-semibold text-foreground mb-2">Details</h3>
            {fields.map(f => {
              const val = templateData[f.key];
              if (!val) return null;
              return (
                <div key={f.key} className="flex items-start gap-3">
                  <f.icon className={`w-4 h-4 mt-0.5 ${theme.accent}`} />
                  <div>
                    <p className="text-xs text-muted-foreground">{f.label}</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{val}</p>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Book Button */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Button onClick={handleBook} disabled={booking} className={`w-full ${theme.gradient} text-white border-0 hover:opacity-90 h-12 text-base font-display font-semibold`}>
            {booking ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Book Now'}
          </Button>
        </motion.div>
      </main>
    </div>
  );
};

export default SellerPublicProfile;
