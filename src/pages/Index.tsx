import { useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Store, ArrowRight, Shield, Zap, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();
        if (roleData?.role === 'seller') navigate('/dashboard/seller');
        else if (roleData?.role === 'customer') navigate('/dashboard/customer');
      }
    };
    checkAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl animate-pulse-glow" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-seller/5 blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-display font-bold text-foreground">QueuePro</h1>
          </motion.div>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 px-6 pt-12 pb-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-display font-bold text-foreground mb-6 leading-tight">
              Smart Queue
              <br />
              <span className="text-gradient-primary">Management</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Book services, manage queues, and connect with sellers — all with secure OTP verification.
            </p>
          </motion.div>

          {/* Role Selection Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-20">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -4 }}
              className="glass-elevated rounded-2xl p-8 cursor-pointer group"
              onClick={() => navigate('/auth/customer')}
            >
              <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-display font-bold text-foreground mb-3">Customer</h3>
              <p className="text-muted-foreground mb-6">
                Sign up to book services, track your queue position in real-time, and manage your appointments.
              </p>
              <Button className="w-full gradient-primary text-primary-foreground border-0 hover:opacity-90 gap-2">
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              whileHover={{ y: -4 }}
              className="glass-elevated rounded-2xl p-8 cursor-pointer group"
              onClick={() => navigate('/auth/seller')}
            >
              <div className="w-14 h-14 rounded-2xl gradient-seller flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Store className="w-7 h-7 text-seller-foreground" />
              </div>
              <h3 className="text-2xl font-display font-bold text-foreground mb-3">Seller</h3>
              <p className="text-muted-foreground mb-6">
                Register your business, manage your queue, and serve customers efficiently with a unique seller ID.
              </p>
              <Button className="w-full gradient-seller text-seller-foreground border-0 hover:opacity-90 gap-2">
                Start Selling <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          </div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto"
          >
            {[
              { icon: Shield, title: "Google Verified", desc: "Secure Google authentication for access" },
              { icon: Zap, title: "Real-time Queue", desc: "Live updates on your position and status" },
              { icon: Clock, title: "Smart Booking", desc: "Book services with unique seller codes" },
            ].map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="text-center p-6"
              >
                <feat.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <h4 className="font-display font-semibold text-foreground mb-1">{feat.title}</h4>
                <p className="text-sm text-muted-foreground">{feat.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Index;
