import { motion } from "framer-motion";
import { Building2, Stethoscope, CheckCircle, DollarSign, Phone, AlertTriangle } from "lucide-react";

interface HospitalTemplateProps {
  seller: any;
  templateData: Record<string, string>;
  accentClass: string;
}

const HospitalTemplate = ({ seller, templateData, accentClass }: HospitalTemplateProps) => {
  const departments = templateData.departments?.split(',').map(d => d.trim()).filter(Boolean) || [];
  const facilities = templateData.facilities?.split(',').map(f => f.trim()).filter(Boolean) || [];

  const hasAny = departments.length > 0 || facilities.length > 0 || templateData.doctors_list || templateData.visit_fee || templateData.emergency_info;
  if (!hasAny) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      {/* Departments */}
      {departments.length > 0 && (
        <div className="glass-elevated rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-400/15 px-6 py-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-500" />
              <h3 className="font-display font-semibold text-foreground text-sm">বিভাগসমূহ</h3>
            </div>
          </div>
          <div className="p-4 flex flex-wrap gap-2">
            {departments.map((d, i) => (
              <span key={i} className="px-3 py-1.5 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium">
                {d}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Facilities */}
      {facilities.length > 0 && (
        <div className="glass-elevated rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-400/15 px-6 py-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <h3 className="font-display font-semibold text-foreground text-sm">সুবিধাসমূহ</h3>
            </div>
          </div>
          <div className="p-4 grid grid-cols-2 gap-2">
            {facilities.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Doctors List */}
      {templateData.doctors_list && (
        <div className="glass-elevated rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-400/15 px-6 py-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-blue-500" />
              <h3 className="font-display font-semibold text-foreground text-sm">ডাক্তারদের তালিকা</h3>
            </div>
          </div>
          <div className="p-4 space-y-2">
            {templateData.doctors_list.split('\n').filter(Boolean).map((line, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Stethoscope className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <p className="text-sm text-foreground flex-1">{line}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fee & Emergency row */}
      <div className="grid grid-cols-2 gap-3">
        {templateData.visit_fee && (
          <div className="glass-elevated rounded-2xl p-4 text-center">
            <DollarSign className="w-5 h-5 mx-auto mb-1 text-green-500" />
            <p className="text-xs text-muted-foreground">ভিজিট ফি</p>
            <p className="text-lg font-display font-bold text-green-600 dark:text-green-400">{templateData.visit_fee}</p>
          </div>
        )}
        {templateData.emergency_info && (
          <div className="glass-elevated rounded-2xl p-4 text-center">
            <Phone className="w-5 h-5 mx-auto mb-1 text-red-500" />
            <p className="text-xs text-muted-foreground">ইমার্জেন্সি</p>
            <p className="text-sm font-display font-bold text-foreground">{templateData.emergency_info}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default HospitalTemplate;
