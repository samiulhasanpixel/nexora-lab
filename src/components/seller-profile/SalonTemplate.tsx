import { motion } from "framer-motion";
import { Scissors, DollarSign, Clock, Sparkles } from "lucide-react";

interface SalonTemplateProps {
  seller: any;
  templateData: Record<string, string>;
  accentClass: string;
  type: 'salon' | 'parlor';
}

const SalonTemplate = ({ seller, templateData, accentClass, type }: SalonTemplateProps) => {
  const services = templateData.services_list?.split('\n').filter(Boolean) || [];
  const hasAny = services.length > 0 || templateData.price_range || templateData.opening_hours;
  if (!hasAny) return null;

  const isParlor = type === 'parlor';
  const gradientFrom = isParlor ? 'from-pink-500/10' : 'from-amber-500/10';
  const gradientTo = isParlor ? 'to-rose-400/10' : 'to-orange-400/10';
  const darkGradientFrom = isParlor ? 'dark:from-pink-500/20' : 'dark:from-amber-500/20';
  const darkGradientTo = isParlor ? 'dark:to-rose-400/15' : 'dark:to-orange-400/15';
  const iconColor = isParlor ? 'text-pink-500' : 'text-amber-500';
  const tagBg = isParlor ? 'bg-pink-500/10 text-pink-700 dark:text-pink-300' : 'bg-amber-500/10 text-amber-700 dark:text-amber-300';

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      {/* Services */}
      {services.length > 0 && (
        <div className="glass-elevated rounded-2xl overflow-hidden">
          <div className={`bg-gradient-to-r ${gradientFrom} ${gradientTo} ${darkGradientFrom} ${darkGradientTo} px-6 py-3 border-b border-border/50`}>
            <div className="flex items-center gap-2">
              {isParlor ? <Sparkles className={`w-4 h-4 ${iconColor}`} /> : <Scissors className={`w-4 h-4 ${iconColor}`} />}
              <h3 className="font-display font-semibold text-foreground text-sm">
                {isParlor ? 'সার্ভিস ও প্যাকেজ' : 'সার্ভিস মেনু'}
              </h3>
            </div>
          </div>
          <div className="p-4 space-y-2">
            {services.map((s, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                <div className={`w-2 h-2 rounded-full ${isParlor ? 'bg-pink-400' : 'bg-amber-400'}`} />
                <p className="text-sm text-foreground flex-1">{s}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Price & Hours */}
      <div className="grid grid-cols-2 gap-3">
        {templateData.price_range && (
          <div className="glass-elevated rounded-2xl p-4 text-center">
            <DollarSign className={`w-5 h-5 mx-auto mb-1 ${iconColor}`} />
            <p className="text-xs text-muted-foreground">মূল্য পরিসীমা</p>
            <p className="text-sm font-display font-bold text-foreground">{templateData.price_range}</p>
          </div>
        )}
        {templateData.opening_hours && (
          <div className="glass-elevated rounded-2xl p-4 text-center">
            <Clock className={`w-5 h-5 mx-auto mb-1 ${iconColor}`} />
            <p className="text-xs text-muted-foreground">সময়সূচি</p>
            <p className="text-sm font-display font-bold text-foreground">{templateData.opening_hours}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SalonTemplate;
