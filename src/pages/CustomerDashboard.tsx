import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Clock, LogOut, User, Hash, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { signOut } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchCode, setSearchCode] = useState("");
  const [sellers, setSellers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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
    };
    loadData();

    // Realtime subscription for booking updates
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

      // Get next token number for this seller
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

  const statusColors: Record<string, string> = {
    waiting: 'bg-accent/15 text-accent',
    in_progress: 'bg-primary/15 text-primary',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-destructive/15 text-destructive',
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
        {/* My Bookings */}
        {bookings.length > 0 && (
          <section>
            <h2 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> My Queue
            </h2>
            <div className="grid gap-3">
              {bookings.map((b, i) => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                      <Hash className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-display font-semibold text-foreground">Token #{b.token_number}</p>
                      <p className="text-xs text-muted-foreground">{new Date(b.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[b.status] || ''}`}>
                    {b.status}
                  </span>
                </motion.div>
              ))}
            </div>
          </section>
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
                {seller.description && <p className="text-sm text-muted-foreground mb-4">{seller.description}</p>}
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
