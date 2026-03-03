import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Loader2, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const ADMIN_EMAIL = "sumimrs463@gmail.com";
const ADMIN_PASSWORD = "920$@sizo?#50..SAMIULHASANZIM";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const checkExisting = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: role } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('role', 'admin')
          .maybeSingle();
        if (role) {
          navigate('/admin/dashboard');
          return;
        }
      }
      setChecking(false);
    };
    checkExisting();
  }, [navigate]);

  const handleLogin = async () => {
    if (password !== ADMIN_PASSWORD) {
      toast({ title: "Access Denied", description: "ভুল password দিয়েছ।", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Sign in with email/password
      const { data, error } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      });

      if (error) {
        // If user doesn't exist, create it
        if (error.message.includes('Invalid login credentials')) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            options: { data: { full_name: 'Admin' } },
          });
          if (signUpError) throw signUpError;
          
          if (signUpData.session) {
            await setupAdmin(signUpData.session.user.id);
            navigate('/admin/dashboard');
          } else {
            toast({ title: "Check Email", description: "Email verification needed. Auto-confirm চালু না থাকলে verify করো।" });
          }
          return;
        }
        throw error;
      }

      if (data.session) {
        await setupAdmin(data.session.user.id);
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const setupAdmin = async (userId: string) => {
    await supabase
      .from('user_roles')
      .upsert({ user_id: userId, role: 'admin' as any }, { onConflict: 'user_id,role' });

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!profile) {
      await supabase.from('profiles').insert({
        user_id: userId,
        full_name: 'Admin',
        phone: '',
      });
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

        <div className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Enter admin password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="pl-10 pr-10"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <Button
            onClick={handleLogin}
            disabled={loading || !password}
            className="w-full gap-2"
            size="lg"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            Login
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
