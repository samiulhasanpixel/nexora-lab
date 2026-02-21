import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Hash, Users, CheckCircle, Clock, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";

const QueueDetailPage = () => {
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const [booking, setBooking] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [customerNames, setCustomerNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/'); return; }

    // Get this booking (own booking via RLS)
    const { data: bookingData } = await supabase.from('service_bookings')
      .select('*').eq('id', bookingId).single();
    if (!bookingData) { navigate('/dashboard/customer'); return; }
    setBooking(bookingData);

    // Get seller info
    const { data: sellerData } = await supabase.from('seller_profiles')
      .select('*').eq('user_id', bookingData.seller_id).single();
    setSeller(sellerData);

    // Get ALL bookings for this seller using security definer function (bypasses RLS)
    const { data: queueData } = await supabase.rpc('get_queue_data', {
      p_seller_id: bookingData.seller_id,
    });

    const allData = (queueData as any[] || []);
    setAllBookings(allData);

    // Build name map from returned data
    const nameMap: Record<string, string> = {};
    allData.forEach((b: any) => { nameMap[b.customer_id] = b.customer_name; });
    setCustomerNames(nameMap);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const channel = supabase.channel(`queue-detail-${bookingId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_bookings' }, () => {
        loadData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const waiting = allBookings.filter((b: any) => b.status === 'waiting');
  const inProgress = allBookings.filter((b: any) => b.status === 'in_progress');
  const completed = allBookings.filter((b: any) => b.status === 'completed');
  const currentSerial = inProgress[0]?.token_number || 0;
  const myPosition = waiting.findIndex(b => b.id === booking?.id);

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
      <header className="border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/customer')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-display font-bold text-foreground">{seller?.business_name || 'Queue Details'}</h1>
            <p className="text-xs text-muted-foreground">{seller?.unique_code}</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Seller message */}
        {seller?.customer_message && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="glass-elevated rounded-2xl p-4 border-l-4 border-primary">
            <p className="text-sm text-foreground">{seller.customer_message}</p>
          </motion.div>
        )}

        {/* My Token */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          className="glass-elevated rounded-2xl p-6 text-center">
          <p className="text-sm text-muted-foreground mb-1">Your Token</p>
          <p className="text-5xl font-display font-bold text-primary">#{booking?.token_number}</p>
          <span className={`inline-block mt-3 px-4 py-1.5 rounded-full text-sm font-semibold ${statusColors[booking?.status] || ''}`}>
            {statusLabels[booking?.status] || booking?.status}
          </span>
          {myPosition >= 0 && (
            <p className="mt-3 text-sm text-muted-foreground">
              আপনার আগে <span className="font-bold text-foreground">{myPosition}</span> জন আছে
            </p>
          )}
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card rounded-xl p-4 text-center">
            <Clock className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-xl font-display font-bold text-foreground">{currentSerial || '-'}</p>
            <p className="text-[10px] text-muted-foreground">Current Serial</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <Users className="w-5 h-5 mx-auto mb-1 text-accent" />
            <p className="text-xl font-display font-bold text-foreground">{waiting.length}</p>
            <p className="text-[10px] text-muted-foreground">Waiting</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <CheckCircle className="w-5 h-5 mx-auto mb-1 text-green-500" />
            <p className="text-xl font-display font-bold text-foreground">{completed.length}</p>
            <p className="text-[10px] text-muted-foreground">Completed</p>
          </div>
        </div>

        {/* All tokens list */}
        <section>
          <h2 className="font-display font-bold text-foreground mb-3 flex items-center gap-2">
            <Hash className="w-5 h-5 text-primary" /> All Tokens
          </h2>
          <div className="space-y-2">
            {allBookings.filter(b => b.status !== 'cancelled').map((b, i) => {
              const isMe = b.id === booking?.id;
              return (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`glass-card rounded-xl p-3 flex items-center justify-between ${isMe ? 'ring-2 ring-primary' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isMe ? 'gradient-primary' : 'bg-muted'}`}>
                      <span className={`text-sm font-bold ${isMe ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                        #{b.token_number}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {customerNames[b.customer_id] || 'Customer'}
                        {isMe && <span className="text-primary text-xs ml-1">(You)</span>}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(b.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[b.status] || ''}`}>
                    {statusLabels[b.status] || b.status}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};

export default QueueDetailPage;
