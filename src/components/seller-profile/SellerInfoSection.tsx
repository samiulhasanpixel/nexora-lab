import { motion } from "framer-motion";
import { MapPin, Clock, Users, Phone, Mail, MessageSquare } from "lucide-react";

interface SellerInfoSectionProps {
  seller: any;
  accentClass: string;
}

const SellerInfoSection = ({ seller, accentClass }: SellerInfoSectionProps) => {
  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
      className="glass-elevated rounded-2xl p-6 space-y-4">

      {seller.description && (
        <div>
          <h3 className="font-display font-semibold text-foreground mb-1 text-sm">সম্পর্কে</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{seller.description}</p>
        </div>
      )}

      {seller.address && (
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">ঠিকানা</p>
            <p className="text-sm text-foreground">{seller.address}</p>
          </div>
        </div>
      )}

      {seller.booking_start_time && seller.booking_end_time && (
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">বুকিং সময়</p>
            <p className="text-sm text-foreground">{seller.booking_start_time.slice(0, 5)} - {seller.booking_end_time.slice(0, 5)}</p>
          </div>
        </div>
      )}

      {seller.max_bookings && (
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">সর্বোচ্চ সীট</p>
            <p className="text-sm text-foreground">প্রতি সেশনে {seller.max_bookings} জন</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default SellerInfoSection;
