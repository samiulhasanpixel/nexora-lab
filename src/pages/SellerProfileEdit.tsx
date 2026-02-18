import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Store, MapPin, Tag, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const SellerProfileEdit = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    business_name: "",
    category: "",
    address: "",
    description: "",
  });

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/"); return; }

      const { data } = await supabase
        .from("seller_profiles")
        .select("business_name, category, address, description")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setForm({
          business_name: data.business_name || "",
          category: data.category || "",
          address: data.address || "",
          description: data.description || "",
        });
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
        })
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

  const fields = [
    { key: "business_name", label: "Business Name", icon: Store, placeholder: "Your business name", type: "input" },
    { key: "category", label: "Category", icon: Tag, placeholder: "e.g. Salon, Clinic, Workshop", type: "input" },
    { key: "address", label: "Address", icon: MapPin, placeholder: "Your business address", type: "input" },
    { key: "description", label: "Description", icon: FileText, placeholder: "Tell customers about your services...", type: "textarea" },
  ] as const;

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

      <main className="max-w-2xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-elevated rounded-2xl p-6 space-y-6"
        >
          {fields.map((f, i) => (
            <motion.div
              key={f.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="space-y-2"
            >
              <Label className="flex items-center gap-2 text-foreground font-medium">
                <f.icon className="w-4 h-4 text-seller" />
                {f.label}
              </Label>
              {f.type === "textarea" ? (
                <Textarea
                  placeholder={f.placeholder}
                  value={form[f.key]}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  className="min-h-[100px]"
                />
              ) : (
                <Input
                  placeholder={f.placeholder}
                  value={form[f.key]}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                />
              )}
            </motion.div>
          ))}

          <Button
            onClick={handleSave}
            disabled={loading}
            className="w-full gradient-seller text-seller-foreground border-0 hover:opacity-90 gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </motion.div>
      </main>
    </div>
  );
};

export default SellerProfileEdit;
