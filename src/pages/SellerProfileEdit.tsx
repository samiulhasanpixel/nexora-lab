import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Store, MapPin, Tag, FileText, Palette, Image, Stethoscope, Building2, Scissors, GraduationCap, DollarSign, Clock, Phone, CheckCircle, Star } from "lucide-react";
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
    { label: 'Qualifications (MBBS, FCPS...)', key: 'qualifications', placeholder: 'MBBS, FCPS (Medicine)', type: 'input' },
    { label: 'Specialization', key: 'specialization', placeholder: 'Cardiology, Medicine', type: 'input' },
    { label: 'Visit Fee', key: 'visit_fee', placeholder: '৳500', type: 'input' },
    { label: 'Chamber Location', key: 'chamber_location', placeholder: 'Room 301, ABC Hospital', type: 'input' },
    { label: 'Experience', key: 'experience', placeholder: '10 years', type: 'input' },
  ],
  'Hospital': [
    { label: 'Departments', key: 'departments', placeholder: 'Cardiology, Neurology, Orthopedics...', type: 'textarea' },
    { label: 'Facilities', key: 'facilities', placeholder: 'ICU, Emergency, Lab, Pharmacy...', type: 'textarea' },
    { label: 'Doctors List', key: 'doctors_list', placeholder: 'Dr. A (Cardiology) - ৳800\nDr. B (Medicine) - ৳600', type: 'textarea' },
    { label: 'Visit Fee Range', key: 'visit_fee', placeholder: '৳300 - ৳1500', type: 'input' },
    { label: 'Emergency Contact', key: 'emergency_info', placeholder: '01XXXXXXXXX', type: 'input' },
  ],
  'Salon': [
    { label: 'Services', key: 'services_list', placeholder: 'Haircut - ৳200\nShaving - ৳100\nFacial - ৳500', type: 'textarea' },
    { label: 'Price Range', key: 'price_range', placeholder: '৳100 - ৳2000', type: 'input' },
    { label: 'Opening Hours', key: 'opening_hours', placeholder: '10:00 AM - 9:00 PM', type: 'input' },
  ],
  'Parlor': [
    { label: 'Services', key: 'services_list', placeholder: 'Facial - ৳500\nMakeup - ৳3000\nHair Treatment - ৳1500', type: 'textarea' },
    { label: 'Price Range', key: 'price_range', placeholder: '৳200 - ৳5000', type: 'input' },
    { label: 'Opening Hours', key: 'opening_hours', placeholder: '10:00 AM - 8:00 PM', type: 'input' },
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
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    business_name: "",
    category: "",
    address: "",
    description: "",
    profile_image_url: "",
    theme: "default",
  });
  const [templateData, setTemplateData] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/"); return; }

      const { data } = await supabase
        .from("seller_profiles")
        .select("business_name, category, address, description, profile_image_url, theme, template_data")
        .eq("user_id", user.id)
        .single();

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
      toast({ title: "Saved!", description: "Profile updated successfully" });
      navigate("/dashboard/seller");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Get template fields for selected category
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
        {/* Basic Info */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          className="glass-elevated rounded-2xl p-6 space-y-5">
          <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
            <Store className="w-5 h-5 text-seller" /> Basic Info
          </h2>

          <div className="space-y-2">
            <Label className="text-foreground font-medium">Business Name *</Label>
            <Input placeholder="Your business name" value={form.business_name}
              onChange={e => setForm(p => ({ ...p, business_name: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground font-medium flex items-center gap-2">
              <Tag className="w-4 h-4 text-seller" /> Category
            </Label>
            <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4 text-seller" /> Address
            </Label>
            <Input placeholder="Your business address" value={form.address}
              onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground font-medium flex items-center gap-2">
              <FileText className="w-4 h-4 text-seller" /> Description
            </Label>
            <Textarea placeholder="Tell customers about your services..." className="min-h-[80px]"
              value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
        </motion.div>

        {/* Appearance */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-elevated rounded-2xl p-6 space-y-5">
          <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
            <Palette className="w-5 h-5 text-seller" /> Appearance
          </h2>

          <div className="space-y-2">
            <Label className="text-foreground font-medium">Theme</Label>
            <Select value={form.theme} onValueChange={v => setForm(p => ({ ...p, theme: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {themes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground font-medium flex items-center gap-2">
              <Image className="w-4 h-4 text-seller" /> Profile Image URL
            </Label>
            <Input placeholder="https://example.com/photo.jpg" value={form.profile_image_url}
              onChange={e => setForm(p => ({ ...p, profile_image_url: e.target.value }))} />
            {form.profile_image_url && (
              <img src={form.profile_image_url} alt="Preview" className="w-16 h-16 rounded-xl object-cover mt-2" />
            )}
          </div>
        </motion.div>

        {/* Category-specific template */}
        {templateFields.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="glass-elevated rounded-2xl p-6 space-y-5">
            <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
              {matchedCategory === 'Doctor' && <Stethoscope className="w-5 h-5 text-seller" />}
              {matchedCategory === 'Hospital' && <Building2 className="w-5 h-5 text-seller" />}
              {(matchedCategory === 'Salon' || matchedCategory === 'Parlor') && <Scissors className="w-5 h-5 text-seller" />}
              {matchedCategory} Template
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
          className="w-full gradient-seller text-seller-foreground border-0 hover:opacity-90 gap-2 h-12">
          <Save className="w-4 h-4" />
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </main>
    </div>
  );
};

export default SellerProfileEdit;
