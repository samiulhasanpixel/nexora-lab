import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LogOut, Users, Copy, Check, ChevronRight, Hash, User, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { signOut } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const SellerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/'); return; }

    const { data: profileData } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
    setProfile(profileData);

    const { data: sellerData } = await supabase.from('seller_profiles').select('*').eq('user_id', user.id).single();
    setSellerProfile(sellerData);

    const { data: bookingData } = await supabase.from('service_bookings').select('*').eq('seller_id', user.id).order('token_number', { ascending: true });
    setBookings(bookingData || []);
  };

  useEffect(() => {
    loadData();

    const channel = supabase.channel('seller-bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_bookings' }, () => {
        loadData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [navigate]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('service_bookings').update({ status }).eq('id', id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Updated", description: `Booking marked as ${status}` });
  };

  const copyCode = () => {
    if (sellerProfile?.unique_code) {
      navigator.clipboard.writeText(sellerProfile.unique_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const waitingCount = bookings.filter(b => b.status === 'waiting').length;
  const inProgressCount = bookings.filter(b => b.status === 'in_progress').length;
  const completedCount = bookings.filter(b => b.status === 'completed').length;

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
            <div className="w-9 h-9 rounded-xl gradient-seller flex items-center justify-center">
              <User className="w-5 h-5 text-seller-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold text-foreground">{sellerProfile?.business_name || 'Seller'}</h1>
              <p className="text-xs text-muted-foreground">{profile?.full_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/seller/edit')} className="gap-2 text-muted-foreground">
              <Pencil className="w-4 h-4" /> Edit Profile
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-muted-foreground">
              <LogOut className="w-4 h-4" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Seller ID Card */}
        {sellerProfile && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-elevated rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div>
              <p className="text-sm text-muted-foreground mb-1">Your Unique Seller Code</p>
              <p className="text-3xl font-display font-bold text-foreground tracking-wider">{sellerProfile.unique_code}</p>
              <p className="text-xs text-muted-foreground mt-1">Share this code with customers to receive bookings</p>
            </div>
            <Button onClick={copyCode} variant="outline" className="gap-2 shrink-0">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy Code"}
            </Button>
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Waiting", value: waitingCount, color: "gradient-accent" },
            { label: "In Progress", value: inProgressCount, color: "gradient-primary" },
            { label: "Completed", value: completedCount, color: "bg-green-500" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-xl p-4 text-center"
            >
              <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Queue */}
        <section>
          <h2 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-seller" /> Queue ({bookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled').length})
          </h2>
          <div className="space-y-3">
            {bookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled').map((booking, i) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl gradient-seller flex items-center justify-center">
                    <Hash className="w-6 h-6 text-seller-foreground" />
                  </div>
                  <div>
                    <p className="font-display font-semibold text-foreground">Token #{booking.token_number}</p>
                    <p className="text-xs text-muted-foreground">{new Date(booking.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[booking.status]}`}>
                    {booking.status}
                  </span>
                  {booking.status === 'waiting' && (
                    <Button size="sm" onClick={() => updateStatus(booking.id, 'in_progress')} className="gradient-primary text-primary-foreground border-0 gap-1">
                      Start <ChevronRight className="w-3 h-3" />
                    </Button>
                  )}
                  {booking.status === 'in_progress' && (
                    <Button size="sm" onClick={() => updateStatus(booking.id, 'completed')} className="bg-green-500 text-primary-foreground border-0 hover:bg-green-600 gap-1">
                      Done <Check className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
            {bookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled').length === 0 && (
              <p className="text-center text-muted-foreground py-12">No customers in queue yet.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default SellerDashboard;
