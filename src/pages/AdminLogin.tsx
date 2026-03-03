import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const ADMIN_EMAIL = "sumimrs463@gmail.com";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const ensureAdminAndRedirect = async (session: any) => {
    if (!session) return false;

    const email = session.user.email;
    if (email !== ADMIN_EMAIL) return false;

    await supabase
      .from('user_roles')
      .upsert({ user_id: session.user.id, role: 'admin' as any }, { onConflict: 'user_id,role' });

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (!profile) {
      await supabase.from('profiles').insert({
        user_id: session.user.id,
        full_name: session.user.user_metadata?.full_name || 'Admin',
        phone: '',
      });
    }

    navigate('/admin/dashboard');
    return true;
  };

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const ok = await ensureAdminAndRedirect(session);
      if (!ok) setChecking(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        const ok = await ensureAdminAndRedirect(session);
        if (!ok) {
          toast({ title: "Access Denied", description: "এই account এর admin access নেই।", variant: "destructive" });
          await supabase.auth.signOut();
          setLoading(false);
          setChecking(false);
        }
      }
    });

    checkAdmin();
    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error, redirected } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/admin/login",
        extraParams: {
          login_hint: ADMIN_EMAIL,
          prompt: "select_account",
        },
      });
      if (error) throw error;

      // Fallback: if provider doesn't redirect, verify current session immediately
      if (!redirected) {
        const { data: { session } } = await supabase.auth.getSession();
        const ok = await ensureAdminAndRedirect(session);
        if (!ok) {
          toast({ title: "Access Denied", description: "এই account এর admin access নেই।", variant: "destructive" });
          await supabase.auth.signOut();
        }
      }
    } catch (err: any) {
      toast({ title: "Login Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-elevated rounded-2xl p-8 max-w-sm w-full text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <Shield className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="font-display font-bold text-2xl text-foreground mb-2">Admin Access</h1>
        <p className="text-sm text-muted-foreground mb-8">Authorized personnel only</p>

        <Button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full gap-2"
          size="lg"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          Continue with Google
        </Button>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
