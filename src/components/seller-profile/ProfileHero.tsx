import { motion } from "framer-motion";
import { ArrowLeft, Star, MapPin, Clock, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ProfileHeroProps {
  seller: any;
  themeGradient: string;
}

const ProfileHero = ({ seller, themeGradient }: ProfileHeroProps) => {
  const navigate = useNavigate();

  return (
    <div className={`${themeGradient} relative overflow-hidden`}>
      <div className="absolute inset-0 bg-black/20" />
      {/* Decorative shapes */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

      <div className="relative max-w-3xl mx-auto px-6 pt-6 pb-20">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}
          className="text-white/80 hover:text-white hover:bg-white/10 mb-4">
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-4">
          {seller.profile_image_url ? (
            <img src={seller.profile_image_url} alt={seller.business_name}
              className="w-24 h-24 rounded-2xl object-cover border-3 border-white/30 shadow-lg" />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <span className="text-4xl font-bold text-white">{seller.business_name?.[0] || 'S'}</span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-display font-bold text-white truncate">{seller.business_name}</h1>
            <p className="text-white/60 text-xs font-mono mt-0.5">{seller.unique_code}</p>
            {seller.category && (
              <span className="inline-block mt-1.5 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs text-white font-medium">
                {seller.category}
              </span>
            )}
            <div className="flex items-center gap-3 mt-2">
              {seller.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
                  <span className="text-white text-xs font-medium">{seller.rating} ({seller.total_reviews})</span>
                </div>
              )}
              {seller.address && (
                <div className="flex items-center gap-1 text-white/70">
                  <MapPin className="w-3 h-3" />
                  <span className="text-xs truncate max-w-[140px]">{seller.address}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfileHero;
