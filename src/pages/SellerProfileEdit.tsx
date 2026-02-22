import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Store, MapPin, Tag, FileText, Palette, Camera, Stethoscope, Building2, Scissors, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const categoryTemplates: Record<string, { label: string; key: string; placeholder: string; type: 'input' | 'textarea' }[]> = {
  'Doctor': [
    { label: 'যোগ্যতা (MBBS, FCPS...)', key: 'qualifications', placeholder: 'MBBS, FCPS (Medicine)', type: 'input' },
    { label: 'বিশেষজ্ঞ', key: 'specialization', placeholder: 'Cardiology, Medicine', type: 'input' },
    { label: 'ভিজিট ফি', key: 'visit_fee', placeholder: '৳500', type: 'input' },
    { label: 'চেম্বার লোকেশন', key: 'chamber_location', placeholder: 'Room 301, ABC Hospital', type: 'input' },
    { label: 'অভিজ্ঞতা', key: 'experience', placeholder: '10 years', type: 'input' },
  ],
  'Hospital': [
    { label: 'বিভাগসমূহ (কমা দিয়ে)', key: 'departments', placeholder: 'Cardiology, Neurology, Orthopedics', type: 'textarea' },
    { label: 'সুবিধাসমূহ (কমা দিয়ে)', key: 'facilities', placeholder: 'ICU, Emergency, Lab, Pharmacy', type: 'textarea' },
    { label: 'ডাক্তারদের তালিকা (প্রতি লাইনে একজন)', key: 'doctors_list', placeholder: 'Dr. A (Cardiology) - ৳800\nDr. B (Medicine) - ৳600', type: 'textarea' },
    { label: 'ভিজিট ফি রেঞ্জ', key: 'visit_fee', placeholder: '৳300 - ৳1500', type: 'input' },
    { label: 'ইমার্জেন্সি কন্টাক্ট', key: 'emergency_info', placeholder: '01XXXXXXXXX', type: 'input' },
  ],
  'Salon': [
    { label: 'সার্ভিস তালিকা (প্রতি লাইনে একটি)', key: 'services_list', placeholder: 'Haircut - ৳200\nShaving - ৳100\nFacial - ৳500', type: 'textarea' },
    { label: 'মূল্য পরিসীমা', key: 'price_range', placeholder: '৳100 - ৳2000', type: 'input' },
    { label: 'সময়সূচি', key: 'opening_hours', placeholder: '10:00 AM - 9:00 PM', type: 'input' },
  ],
  'Parlor': [
    { label: 'সার্ভিস ও প্যাকেজ (প্রতি লাইনে একটি)', key: 'services_list', placeholder: 'Facial - ৳500\nMakeup - ৳3000\nHair Treatment - ৳1500', type: 'textarea' },
    { label: 'মূল্য পরিসীমা', key: 'price_range', placeholder: '৳200 - ৳5000', type: 'input' },
    { label: 'সময়সূচি', key: 'opening_hours', placeholder: '10:00 AM - 8:00 PM', type: 'input' },
  ],
};

const themes = [
  { value: 'default', label: '🟢 Teal (Default)' },
  { value: 'seller', label: '🟣 Purple' },
  { value: 'warm', label: '🟠 Warm Orange' },
  { value: 'green', label: '🌿 Green' },
];

const categories = ['Doctor', 'Hospital', 'Salon', 'Parlor', 'Restaurant', 'Workshop', 'Other'];

const SellerProfileEdit = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [form, setForm] = useState({
    business_name: "", category: "", address: "", description: "",
    profile_image_url: "", theme: "default",
  });
  const [templateData, setTemplateData] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/"); return; }
      setUserId(user.id);

      const { data } = await supabase
        .from("seller_profiles")
        .select("business_name, category, address, description, profile_image_url, theme, template_data")
        .eq("user_id", user.id).single();

      if (data) {
        setForm({
          business_name: data.business_name || "",
          category: data.category || "",
          address: data.address || "",
          description: data.description || "",
          profile_image_url: (data as any).profile_image_url || "",
          theme: (data as any).theme || "default",
        });
        setTemplateData(((data as any).template_data as Record<string, string>) || {});
      }
    };
    load();
  }, [navigate]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Too Large", description: "ফাইল ৫MB এর কম হতে হবে", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${userId}/profile.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('seller-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('seller-images')
        .getPublicUrl(filePath);

      setForm(p => ({ ...p, profile_image_url: publicUrl }));
      toast({ title: "Uploaded! ✅", description: "ছবি আপলোড হয়েছে" });
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.business_name.trim()) {
      toast({ title: "Required", description: "Business name is required", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("seller_profiles")
        .update({
          business_name: form.business_name.trim(),
          category: form.category.trim(),
          address: form.address.trim(),
          description: form.description.trim(),
          profile_image_url: form.profile_image_url.trim(),
          theme: form.theme,
          template_data: templateData,
        } as any)
        .eq("user_id", user.id);

      if (error) throw error;
      toast({ title: "Saved! ✅", description: "প্রোফাইল আপডেট হয়েছে" });
      navigate("/dashboard/seller");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const matchedCategory = Object.keys(categoryTemplates).find(
    c => form.category.toLowerCase().includes(c.toLowerCase())
  );
  const templateFields = matchedCategory ? categoryTemplates[matchedCategory] : [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/seller")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display font-bold text-foreground">Edit Profile</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Profile Image Upload */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          className="glass-elevated rounded-2xl p-6 flex flex-col items-center gap-4">
          <div className="relative">
            {form.profile_image_url ? (
              <img src={form.profile_image_url} alt="Profile"
                className="w-28 h-28 rounded-2xl object-cover border-2 border-border shadow-lg" />
            ) : (
              <div className="w-28 h-28 rounded-2xl bg-muted flex items-center justify-center">
                <Camera className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          <p className="text-xs text-muted-foreground">ফোন থেকে ছবি আপলোড করুন (সর্বোচ্চ ৫MB)</p>
        </motion.div>

        {/* Basic Info */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="glass-elevated rounded-2xl p-6 space-y-5">
          <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" /> Basic Info
          </h2>

          <div className="space-y-2">
            <Label className="text-foreground font-medium">Business Name *</Label>
            <Input placeholder="আপনার ব্যবসার নাম" value={form.business_name}
              onChange={e => setForm(p => ({ ...p, business_name: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground font-medium flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary" /> Category
            </Label>
            <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
              <SelectTrigger><SelectValue placeholder="ক্যাটাগরি সিলেক্ট করুন" /></SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> Address
            </Label>
            <Input placeholder="আপনার ঠিকানা" value={form.address}
              onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground font-medium flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Description
            </Label>
            <Textarea placeholder="আপনার সেবা সম্পর্কে লিখুন..." className="min-h-[80px]"
              value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
        </motion.div>

        {/* Theme */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-elevated rounded-2xl p-6 space-y-5">
          <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" /> থিম কাস্টমাইজ
          </h2>
          <div className="space-y-2">
            <Label className="text-foreground font-medium">প্রোফাইল থিম</Label>
            <Select value={form.theme} onValueChange={v => setForm(p => ({ ...p, theme: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {themes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Category-specific template */}
        {templateFields.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="glass-elevated rounded-2xl p-6 space-y-5">
            <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
              {matchedCategory === 'Doctor' && <Stethoscope className="w-5 h-5 text-primary" />}
              {matchedCategory === 'Hospital' && <Building2 className="w-5 h-5 text-primary" />}
              {(matchedCategory === 'Salon' || matchedCategory === 'Parlor') && <Scissors className="w-5 h-5 text-primary" />}
              {matchedCategory} টেমপ্লেট
            </h2>

            {templateFields.map(f => (
              <div key={f.key} className="space-y-2">
                <Label className="text-foreground font-medium">{f.label}</Label>
                {f.type === 'textarea' ? (
                  <Textarea placeholder={f.placeholder} className="min-h-[80px]"
                    value={templateData[f.key] || ''}
                    onChange={e => setTemplateData(p => ({ ...p, [f.key]: e.target.value }))} />
                ) : (
                  <Input placeholder={f.placeholder}
                    value={templateData[f.key] || ''}
                    onChange={e => setTemplateData(p => ({ ...p, [f.key]: e.target.value }))} />
                )}
              </div>
            ))}
          </motion.div>
        )}

        <Button onClick={handleSave} disabled={loading}
          className="w-full gradient-primary text-primary-foreground border-0 hover:opacity-90 gap-2 h-12 font-display font-bold rounded-2xl">
          <Save className="w-4 h-4" />
          {loading ? "Saving..." : "Save Changes ✅"}
        </Button>
      </main>
    </div>
  );
};

export default SellerProfileEdit;
