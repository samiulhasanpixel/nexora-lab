import { motion } from "framer-motion";
import { Clock, Users, CheckCircle, Zap } from "lucide-react";

interface QueueStatsCardsProps {
  stats: { waiting: number; completed: number; in_progress: number; currentSerial: number };
  accentClass: string;
}

const QueueStatsCards = ({ stats, accentClass }: QueueStatsCardsProps) => {
  const cards = [
    { icon: Zap, label: "Current", value: stats.currentSerial || '-', color: accentClass },
    { icon: Users, label: "Waiting", value: stats.waiting, color: "text-accent" },
    { icon: CheckCircle, label: "Done", value: stats.completed, color: "text-green-500" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {cards.map((card, i) => (
        <motion.div key={card.label}
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="glass-elevated rounded-2xl p-4 text-center group hover:scale-[1.02] transition-transform">
          <card.icon className={`w-5 h-5 mx-auto mb-1.5 ${card.color}`} />
          <p className="text-2xl font-display font-bold text-foreground">{card.value}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{card.label}</p>
        </motion.div>
      ))}
    </div>
  );
};

export default QueueStatsCards;
