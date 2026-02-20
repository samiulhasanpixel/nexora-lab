import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Clock, LogOut, User, Hash, Star, Users, CheckCircle, Loader2, ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { signOut } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchCode, setSearchCode] = useState("");
  const [sellers, setSellers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [sellerMap, setSellerMap] = useState<Record<string, any>>({});
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [queueStats, setQueueStats] = useState<Record<string, { completed: number; waiting: number; in_progress: number; currentSerial: number }>>({});

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/'); return; }

      const { data: profileData } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
      setProfile(profileData);

      const { data: bookingData } = await supabase.from('service_bookings').select('*').eq('customer_id', user.id).order('created_at', { ascending: false });
      setBookings(bookingData || []);

      const { data: sellerData } = await supabase.from('seller_profiles').select('*').eq('is_active', true);
      setSellers(sellerData || []);

      // Build seller map for showing seller name in bookings
      const map: Record<string, any> = {};
      (sellerData || []).forEach(s => { map[s.user_id] = s; });
      setSellerMap(map);

      // Fetch queue stats for each seller the customer has bookings with
      const sellerIds = [...new Set((bookingData || []).map(b => b.seller_id))];
      const statsMap: Record<string, any> = {};
      for (const sid of sellerIds) {
        const { data: allBookings } = await supabase.from('service_bookings')
          .select('status, token_number')
          .eq('seller_id', sid);
        const completed = (allBookings || []).filter(b => b.status === 'completed').length;
        const waiting = (allBookings || []).filter(b => b.status === 'waiting').length;
        const in_progress = (allBookings || []).filter(b => b.status === 'in_progress').length;
        const currentSerial = (allBookings || []).filter(b => b.status === 'in_progress')[0]?.token_number || 0;
        statsMap[sid] = { completed, waiting, in_progress, currentSerial };
      }
      setQueueStats(statsMap);
    };
    loadData();

    const channel = supabase.channel('bookings-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_bookings' }, () => {
        loadData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [navigate]);

  const handleBook = async (seller: any) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check duplicate booking within 12 hours for same seller
      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
      const { data: recentBookings } = await supabase.from('service_bookings')
        .select('id')
        .eq('customer_id', user.id)
        .eq('seller_id', seller.user_id)
        .gte('created_at', twelveHoursAgo)
        .in('status', ['waiting', 'in_progress']);

      if (recentBookings && recentBookings.length > 0) {
        toast({ title: "Already Booked!", description: "আপনি ইতোমধ্যে এই সেলারে বুক করেছেন। ১২ ঘণ্টার মধ্যে আবার বুক করা যাবে না।", variant: "destructive" });
        setLoading(false);
        return;
      }

      // Check off-days (weekly)
      const today = new Date();
      const dayOfWeek = today.getDay();
      const sellerOffDays = (seller.off_days as number[]) || [];
      if (sellerOffDays.includes(dayOfWeek)) {
        toast({ title: "Closed Today!", description: "আজ এই সেলারের বুকিং বন্ধ আছে।", variant: "destructive" });
        setLoading(false);
        return;
      }

      // Check off-dates (specific dates)
      const todayStr = today.toISOString().split('T')[0];
      const sellerOffDates = (seller.off_dates as string[]) || [];
      if (sellerOffDates.includes(todayStr)) {
        toast({ title: "Closed Today!", description: "আজ এই সেলারের বুকিং বন্ধ আছে।", variant: "destructive" });
        setLoading(false);
        return;
      }

      // Check seller time window
      if (seller.booking_start_time && seller.booking_end_time) {
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
        if (currentTime < seller.booking_start_time || currentTime > seller.booking_end_time) {
          toast({ title: "Time's Up!", description: `বুকিং শুধুমাত্র ${seller.booking_start_time.slice(0, 5)} - ${seller.booking_end_time.slice(0, 5)} এর মধ্যে সম্ভব।`, variant: "destructive" });
          setLoading(false);
          return;
        }
      }

      // Check max bookings (seat limit)
      if (seller.max_bookings) {
        const { data: activeBookings } = await supabase.from('service_bookings')
          .select('id')
          .eq('seller_id', seller.user_id)
          .in('status', ['waiting', 'in_progress']);
        if (activeBookings && activeBookings.length >= seller.max_bookings) {
          toast({ title: "Seat Full!", description: `সিট শেষ! সর্বোচ্চ ${seller.max_bookings} জন বুক করতে পারে।`, variant: "destructive" });
          setLoading(false);
          return;
        }
      }

      // Get next token number
      const { data: existing } = await supabase.from('service_bookings')
        .select('token_number')
        .eq('seller_id', seller.user_id)
        .eq('status', 'waiting')
        .order('token_number', { ascending: false })
        .limit(1);

      const nextToken = (existing && existing.length > 0 ? existing[0].token_number : 0) + 1;

      const { error } = await supabase.from('service_bookings').insert({
        customer_id: user.id,
        seller_id: seller.user_id,
        token_number: nextToken,
      });

      if (error) throw error;
      toast({ title: "Booked!", description: `Your token number is #${nextToken}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filteredSellers = sellers.filter(s =>
    s.unique_code.toLowerCase().includes(searchCode.toLowerCase()) ||
    s.business_name.toLowerCase().includes(searchCode.toLowerCase())
  );

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const clearAllBookings = async () => {
    setClearing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from('service_bookings').delete().eq('customer_id', user.id);
      if (error) throw error;
      toast({ title: "Cleared!", description: "সব কুপন মুছে ফেলা হয়েছে।" });
      setBookings([]);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setClearing(false);
    }
  };

  const statusColors: Record<string, string> = {
    waiting: 'bg-accent/15 text-accent',
    in_progress: 'bg-primary/15 text-primary',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-destructive/15 text-destructive',
  };

  const statusLabels: Record<string, string> = {
    waiting: 'Waiting',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <User className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold text-foreground">Hi, {profile?.full_name || 'Customer'}</h1>
              <p className="text-xs text-muted-foreground">{profile?.phone}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-muted-foreground">
            <LogOut className="w-4 h-4" /> Logout
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* My Bookings with detailed queue info */}
        {bookings.length > 0 && (
          <>
          <section>
            <h2 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> My Queue
            </h2>
            <div className="grid gap-3">
              {bookings.map((b, i) => {
                const stats = queueStats[b.seller_id];
                const sellerInfo = sellerMap[b.seller_id];
                return (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-card rounded-xl p-4 cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all"
                    onClick={() => navigate(`/queue/${b.id}`)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                          <Hash className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <div>
                          <p className="font-display font-semibold text-foreground">Token #{b.token_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {sellerInfo?.business_name || 'Unknown Seller'} • {sellerInfo?.unique_code}
                          </p>
                          <p className="text-xs text-muted-foreground">{new Date(b.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[b.status] || ''}`}>
                          {statusLabels[b.status] || b.status}
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                    {/* Queue stats */}
                    {stats && b.status !== 'completed' && b.status !== 'cancelled' && (
                      <div className="grid grid-cols-3 gap-2 mt-2 pt-3 border-t border-border/50">
                        <div className="text-center">
                          <p className="text-sm font-bold text-primary">{stats.currentSerial || '-'}</p>
                          <p className="text-[10px] text-muted-foreground">Current Serial</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-accent">{stats.waiting}</p>
                          <p className="text-[10px] text-muted-foreground">Waiting</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-green-600">{stats.completed}</p>
                          <p className="text-[10px] text-muted-foreground">Completed</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* Clear all bookings */}
          <div className="glass-card rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-destructive" />
              <div>
                <p className="font-display font-semibold text-foreground text-sm">Clear All My Coupons</p>
                <p className="text-xs text-muted-foreground">সব কুপন ডিলিট হয়ে যাবে</p>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={clearing || bookings.length === 0}>
                  {clearing ? "Clearing..." : "Clear All"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>আপনি কি নিশ্চিত?</AlertDialogTitle>
                  <AlertDialogDescription>
                    এটি আপনার সব কুপন permanently ডিলিট করবে। এটি আর undo করা যাবে না।
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={clearAllBookings} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          </>
        )}

        {/* Search & Book */}
        <section>
          <h2 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" /> Find a Seller
          </h2>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input className="pl-10" placeholder="Search by seller code or name..." value={searchCode} onChange={e => setSearchCode(e.target.value)} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {filteredSellers.map((seller, i) => (
              <motion.div
                key={seller.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card rounded-xl p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-display font-bold text-foreground">{seller.business_name}</h3>
                    <p className="text-xs text-muted-foreground font-mono">{seller.unique_code}</p>
                  </div>
                  <div className="flex items-center gap-1 text-accent">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-semibold">{seller.rating || '0.0'}</span>
                  </div>
                </div>
                {seller.category && (
                  <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium mb-3">
                    {seller.category}
                  </span>
                )}
                {seller.description && <p className="text-sm text-muted-foreground mb-2">{seller.description}</p>}
                {/* Time & seat info */}
                <div className="flex flex-wrap gap-2 mb-3 text-[11px] text-muted-foreground">
                  {seller.booking_start_time && seller.booking_end_time && (
                    <span className="bg-muted px-2 py-0.5 rounded-full">
                      🕐 {seller.booking_start_time.slice(0, 5)} - {seller.booking_end_time.slice(0, 5)}
                    </span>
                  )}
                  {seller.max_bookings && (
                    <span className="bg-muted px-2 py-0.5 rounded-full">
                      💺 Max {seller.max_bookings} seats
                    </span>
                  )}
                </div>
                <Button onClick={() => handleBook(seller)} disabled={loading} className="w-full gradient-primary text-primary-foreground border-0 hover:opacity-90" size="sm">
                  Book Service
                </Button>
              </motion.div>
            ))}
            {filteredSellers.length === 0 && (
              <p className="text-muted-foreground text-sm col-span-2 text-center py-8">No sellers found.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default CustomerDashboard;
