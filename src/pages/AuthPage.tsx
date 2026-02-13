import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mail, Phone, Lock, User, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StepIndicator from "@/components/StepIndicator";
import { signUp, signIn, generateMockOTP } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AuthPage = () => {
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isSeller = role === "seller";

  const [isLogin, setIsLogin] = useState(false);
  const [step, setStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mockOtp, setMockOtp] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    otp: "",
    businessName: "",
    category: "",
    address: "",
    description: "",
  });

  const steps = isLogin ? ["Login"] : ["Info", "OTP", "Done"];

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Check role and redirect
        supabase.from('user_roles').select('role').eq('user_id', session.user.id).single()
          .then(({ data }) => {
            if (data?.role === 'seller') navigate('/dashboard/seller');
            else navigate('/dashboard/customer');
          });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSignUp = async () => {
    setLoading(true);
    try {
      // Generate mock OTP
      const otp = generateMockOTP();
      setMockOtp(otp);
      toast({
        title: "OTP Sent (Mock)",
        description: `Your verification code is: ${otp}`,
      });
      setStep(1);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (form.otp !== mockOtp) {
      toast({ title: "Invalid OTP", description: "Please enter the correct code.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const roleType = isSeller ? 'seller' : 'customer';
      const data = await signUp(form.email, form.password, form.fullName, form.phone, roleType as 'customer' | 'seller');
      
      // If seller, create seller profile
      if (isSeller && data.user) {
        const { data: codeData } = await supabase.rpc('generate_seller_code');
        await supabase.from('seller_profiles').insert({
          user_id: data.user.id,
          unique_code: codeData || `SLR-${Math.floor(100000 + Math.random() * 900000)}`,
          business_name: form.businessName,
          category: form.category,
          address: form.address,
          description: form.description,
        });
      }

      // Update phone verification
      if (data.user) {
        await supabase.from('profiles').update({ phone_verified: true }).eq('user_id', data.user.id);
      }

      setStep(2);
      toast({ title: "Account Created!", description: "Please check your email to verify your account." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signIn(form.email, form.password);
    } catch (err: any) {
      toast({ title: "Login Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl animate-pulse-glow ${isSeller ? 'bg-seller/8' : 'bg-primary/8'}`} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="glass-elevated rounded-2xl p-8">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${isSeller ? 'gradient-seller' : 'gradient-primary'}`}>
            {isSeller ? <User className="w-6 h-6 text-primary-foreground" /> : <User className="w-6 h-6 text-primary-foreground" />}
          </div>

          <h2 className="text-2xl font-display font-bold text-foreground mb-1">
            {isLogin ? "Welcome Back" : `${isSeller ? 'Seller' : 'Customer'} Sign Up`}
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            {isLogin ? "Sign in to your account" : "Create your account to get started"}
          </p>

          {!isLogin && <StepIndicator steps={steps} currentStep={step} variant={isSeller ? 'seller' : 'customer'} />}

          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.div key="login" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <Label className="text-foreground">Email</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input className="pl-10" placeholder="your@email.com" value={form.email} onChange={e => update('email', e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label className="text-foreground">Password</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input className="pl-10 pr-10" type={showPassword ? "text" : "password"} placeholder="••••••••" value={form.password} onChange={e => update('password', e.target.value)} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button onClick={handleLogin} disabled={loading} className={`w-full border-0 text-primary-foreground ${isSeller ? 'gradient-seller' : 'gradient-primary'}`}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </motion.div>
            ) : step === 0 ? (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <Label className="text-foreground">Full Name</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input className="pl-10" placeholder="John Doe" value={form.fullName} onChange={e => update('fullName', e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label className="text-foreground">Email</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input className="pl-10" placeholder="your@email.com" value={form.email} onChange={e => update('email', e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label className="text-foreground">Phone Number</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input className="pl-10" placeholder="+880 1XXX-XXXXXX" value={form.phone} onChange={e => update('phone', e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label className="text-foreground">Password</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input className="pl-10 pr-10" type={showPassword ? "text" : "password"} placeholder="Min 6 characters" value={form.password} onChange={e => update('password', e.target.value)} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {isSeller && (
                  <>
                    <div>
                      <Label className="text-foreground">Business Name</Label>
                      <Input placeholder="Your Business" value={form.businessName} onChange={e => update('businessName', e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-foreground">Category</Label>
                      <Input placeholder="e.g. Salon, Clinic, Restaurant" value={form.category} onChange={e => update('category', e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-foreground">Address</Label>
                      <Input placeholder="Your business address" value={form.address} onChange={e => update('address', e.target.value)} />
                    </div>
                  </>
                )}
                <Button onClick={handleSignUp} disabled={loading || !form.fullName || !form.email || !form.phone || !form.password} className={`w-full border-0 text-primary-foreground ${isSeller ? 'gradient-seller' : 'gradient-primary'}`}>
                  {loading ? "Sending OTP..." : "Send OTP"}
                </Button>
              </motion.div>
            ) : step === 1 ? (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="text-center mb-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${isSeller ? 'gradient-seller' : 'gradient-primary'}`}>
                    <Phone className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Enter the 4-digit code sent to</p>
                  <p className="font-semibold text-foreground">{form.phone}</p>
                </div>
                <div>
                  <Label className="text-foreground">OTP Code</Label>
                  <Input className="text-center text-2xl tracking-[0.5em] font-display" maxLength={4} placeholder="• • • •" value={form.otp} onChange={e => update('otp', e.target.value.replace(/\D/g, ''))} />
                </div>
                <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 text-sm text-accent">
                  <strong>Dev Mode:</strong> OTP is <span className="font-mono font-bold">{mockOtp}</span>
                </div>
                <Button onClick={handleVerifyOTP} disabled={loading || form.otp.length !== 4} className={`w-full border-0 text-primary-foreground ${isSeller ? 'gradient-seller' : 'gradient-primary'}`}>
                  {loading ? "Verifying..." : "Verify & Create Account"}
                </Button>
              </motion.div>
            ) : (
              <motion.div key="step2" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
                <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}>
                    <svg className="w-10 h-10 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                </div>
                <h3 className="text-xl font-display font-bold text-foreground mb-2">Account Created!</h3>
                <p className="text-muted-foreground text-sm mb-6">Please check your email to verify your account, then sign in.</p>
                <Button onClick={() => setIsLogin(true)} className={`w-full border-0 text-primary-foreground ${isSeller ? 'gradient-seller' : 'gradient-primary'}`}>
                  Go to Sign In
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 text-center">
            <button onClick={() => { setIsLogin(!isLogin); setStep(0); }} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
