import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import ProfileHero from "@/components/seller-profile/ProfileHero";
import QueueStatsCards from "@/components/seller-profile/QueueStatsCards";
import SellerInfoSection from "@/components/seller-profile/SellerInfoSection";
import DoctorTemplate from "@/components/seller-profile/DoctorTemplate";
import HospitalTemplate from "@/components/seller-profile/HospitalTemplate";
import SalonTemplate from "@/components/seller-profile/SalonTemplate";

const themeStyles: Record<string, { gradient: string; accent: string }> = {
  default: { gradient: 'gradient-primary', accent: 'text-primary' },
  seller: { gradient: 'gradient-seller', accent: 'text-[hsl(var(--seller))]' },
  warm: { gradient: 'gradient-accent', accent: 'text-accent' },
  green: { gradient: 'bg-gradient-to-br from-emerald-500 to-teal-600', accent: 'text-emerald-600' },
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

      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
      const { data: recent } = await supabase.from('service_bookings')
        .select('id').eq('customer_id', user.id).eq('seller_id', seller.user_id)
        .gte('created_at', twelveHoursAgo).in('status', ['waiting', 'in_progress']);
      if (recent && recent.length > 0) {
        toast({ title: "Already Booked!", description: "১২ ঘণ্টার মধ্যে আবার বুক করা যাবে না।", variant: "destructive" });
        setBooking(false); return;
      }

      const today = new Date();
      const offDays = (seller.off_days as number[]) || [];
      if (offDays.includes(today.getDay())) {
        toast({ title: "Closed Today!", description: "আজ বুকিং বন্ধ আছে।", variant: "destructive" });
        setBooking(false); return;
      }

      const todayStr = today.toISOString().split('T')[0];
      if ((seller.off_dates as string[] || []).includes(todayStr)) {
        toast({ title: "Closed Today!", description: "আজ বুকিং বন্ধ আছে।", variant: "destructive" });
        setBooking(false); return;
      }

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
      toast({ title: "Booked! 🎉", description: `Token #${res.token_number}` });
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
  const category = (seller.category || '').toLowerCase();

  return (
    <div className="min-h-screen bg-background">
      <ProfileHero seller={seller} themeGradient={theme.gradient} />

      <main className="max-w-3xl mx-auto px-6 -mt-10 pb-8 space-y-4 relative z-10">
        <QueueStatsCards stats={queueStats} accentClass={theme.accent} />

        {/* Live notice */}
        {seller.customer_message && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="glass-elevated rounded-2xl p-4 flex items-start gap-3 border-l-4 border-accent">
            <MessageSquare className="w-4 h-4 text-accent mt-0.5 shrink-0" />
            <p className="text-sm text-foreground">{seller.customer_message}</p>
          </motion.div>
        )}

        <SellerInfoSection seller={seller} accentClass={theme.accent} />

        {/* Category-specific templates */}
        {category.includes('doctor') && (
          <DoctorTemplate seller={seller} templateData={templateData} accentClass={theme.accent} />
        )}
        {category.includes('hospital') && (
          <HospitalTemplate seller={seller} templateData={templateData} accentClass={theme.accent} />
        )}
        {category.includes('salon') && (
          <SalonTemplate seller={seller} templateData={templateData} accentClass={theme.accent} type="salon" />
        )}
        {category.includes('parlor') && (
          <SalonTemplate seller={seller} templateData={templateData} accentClass={theme.accent} type="parlor" />
        )}

        {/* Book Now */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-4">
          <Button onClick={handleBook} disabled={booking}
            className={`w-full ${theme.gradient} text-white border-0 hover:opacity-90 h-14 text-base font-display font-bold rounded-2xl shadow-lg`}>
            {booking ? <Loader2 className="w-5 h-5 animate-spin" /> : '📋 Book Now'}
          </Button>
        </motion.div>
      </main>
    </div>
  );
};

export default SellerPublicProfile;
