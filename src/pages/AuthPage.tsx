import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, User, Store, Mail, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AuthPage = () => {
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isSeller = role === "seller";
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);

  useEffect(() => {
    const handleSession = async (session: any) => {
      if (!session) return;
      try {
        const { data: existingRole } = await supabase
          .from('user_roles').select('role').eq('user_id', session.user.id).single();
        const desiredRole = isSeller ? 'seller' : 'customer';
        if (!existingRole) {
          await supabase.from('user_roles').insert({ user_id: session.user.id, role: desiredRole as 'customer' | 'seller' });
          const { data: existingProfile } = await supabase.from('profiles').select('id').eq('user_id', session.user.id).single();
          if (!existingProfile) {
            await supabase.from('profiles').insert({
              user_id: session.user.id,
              full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
              phone: '',
            });
          }
          if (isSeller) {
            const { data: codeData } = await supabase.rpc('generate_seller_code');
            await supabase.from('seller_profiles').insert({
              user_id: session.user.id,
              unique_code: codeData || `SLR-${Math.floor(100000 + Math.random() * 900000)}`,
              business_name: session.user.user_metadata?.full_name || 'My Business',
            });
          }
        } else if (existingRole.role !== desiredRole) {
          await supabase.from('user_roles').update({ role: desiredRole as 'customer' | 'seller' }).eq('user_id', session.user.id);
          if (desiredRole === 'seller') {
            const { data: sellerProfile } = await supabase.from('seller_profiles').select('id').eq('user_id', session.user.id).single();
            if (!sellerProfile) {
              const { data: codeData } = await supabase.rpc('generate_seller_code');
              await supabase.from('seller_profiles').insert({
                user_id: session.user.id,
                unique_code: codeData || `SLR-${Math.floor(100000 + Math.random() * 900000)}`,
                business_name: session.user.user_metadata?.full_name || 'My Business',
              });
            }
          }
        }
        if (desiredRole === 'seller') navigate('/dashboard/seller');
        else navigate('/dashboard/customer');
      } catch (err) {
        console.error('Auth flow error:', err);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => { handleSession(session); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) { handleSession(session); }
    });
    return () => subscription.unsubscribe();
  }, [navigate, isSeller]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/auth/${role}`,
      });
      if (error) {
        toast({ title: "Login Failed", description: String(error), variant: "destructive" });
        setLoading(false);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email.trim()) {
      toast({ title: "Enter Email", description: "Please enter your email address", variant: "destructive" });
      return;
    }
    setMagicLinkLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/auth/${role}` },
      });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        setMagicLinkSent(true);
        toast({ title: "✅ Magic Link Sent!", description: "Check your email and click the link to login" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setMagicLinkLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl animate-pulse-glow ${isSeller ? 'bg-seller/8' : 'bg-primary/8'}`} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="glass-elevated rounded-2xl p-8">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${isSeller ? 'gradient-seller' : 'gradient-primary'}`}>
            {isSeller ? <Store className="w-6 h-6 text-primary-foreground" /> : <User className="w-6 h-6 text-primary-foreground" />}
          </div>

          <h2 className="text-2xl font-display font-bold text-foreground mb-1">
            {isSeller ? 'Seller Login' : 'Customer Login'}
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Sign in with Email or Google
          </p>

          {magicLinkSent ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center p-6 rounded-xl border border-primary/20 bg-primary/5 mb-6">
              <CheckCircle className="w-12 h-12 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-1">Magic Link Sent!</h3>
              <p className="text-sm text-muted-foreground mb-3">
                A link has been sent to <span className="font-medium text-foreground">{email}</span>. Check your email and click the link to login.
              </p>
              <Button variant="ghost" size="sm" onClick={() => { setMagicLinkSent(false); setEmail(""); }} className="text-muted-foreground">
                Use a different email
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-3 mb-6">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="email" placeholder="Enter your email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleMagicLink()}
                  className="pl-10 py-6" />
              </div>
              <Button onClick={handleMagicLink} disabled={magicLinkLoading}
                className={`w-full border-0 text-primary-foreground gap-2 text-base py-6 ${isSeller ? 'gradient-seller' : 'gradient-primary'}`}>
                <Mail className="w-5 h-5" />
                {magicLinkLoading ? "Sending..." : "Login with Magic Link"}
              </Button>
            </div>
          )}

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <Button onClick={handleGoogleLogin} disabled={loading} variant="outline" className="w-full gap-3 text-base py-6">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {loading ? "Connecting..." : "Login with Google"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
