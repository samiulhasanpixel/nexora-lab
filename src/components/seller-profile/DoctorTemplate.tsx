import { motion } from "framer-motion";
import { GraduationCap, Stethoscope, DollarSign, MapPin, Star, Clock, AlertCircle } from "lucide-react";

interface DoctorTemplateProps {
  seller: any;
  templateData: Record<string, string>;
  accentClass: string;
}

const DoctorTemplate = ({ seller, templateData, accentClass }: DoctorTemplateProps) => {
  const fields = [
    { icon: GraduationCap, label: "যোগ্যতা", value: templateData.qualifications },
    { icon: Stethoscope, label: "বিশেষজ্ঞ", value: templateData.specialization },
    { icon: DollarSign, label: "ভিজিট ফি", value: templateData.visit_fee, highlight: true },
    { icon: MapPin, label: "চেম্বার", value: templateData.chamber_location },
    { icon: Star, label: "অভিজ্ঞতা", value: templateData.experience },
  ];

  const hasAny = fields.some(f => f.value);
  if (!hasAny) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
      className="glass-elevated rounded-2xl overflow-hidden">
      {/* Professional header bar */}
      <div className="bg-gradient-to-r from-blue-600/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-400/15 px-6 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-blue-500" />
          <h3 className="font-display font-semibold text-foreground text-sm">Doctor Information</h3>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {fields.map(f => {
          if (!f.value) return null;
          return (
            <div key={f.label} className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${f.highlight ? 'bg-green-500/10' : 'bg-muted'}`}>
                <f.icon className={`w-4 h-4 ${f.highlight ? 'text-green-500' : accentClass}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{f.label}</p>
                <p className={`text-sm text-foreground ${f.highlight ? 'font-bold text-green-600 dark:text-green-400 text-lg' : ''}`}>
                  {f.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default DoctorTemplate;
