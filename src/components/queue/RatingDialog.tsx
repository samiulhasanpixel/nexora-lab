import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RatingDialogProps {
  bookingId: string;
  sellerId: string;
  sellerName: string;
  onRated?: () => void;
}

const RatingDialog = ({ bookingId, sellerId, sellerName, onRated }: RatingDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({ title: "Rating দিন", description: "অন্তত ১ স্টার দিন", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('submit_rating', {
        p_customer_id: user.id,
        p_seller_id: sellerId,
        p_booking_id: bookingId,
        p_rating: rating,
        p_review: review || null,
      });

      if (error) throw error;
      const res = data as any;
      if (!res.success) {
        if (res.error === 'already_rated') {
          toast({ title: "ইতোমধ্যে রেটিং দিয়েছেন!", variant: "destructive" });
        } else {
          toast({ title: "Error", description: res.error, variant: "destructive" });
        }
        setOpen(false);
        return;
      }

      toast({ title: "ধন্যবাদ! ⭐", description: `আপনার রেটিং: ${rating}/5` });
      setOpen(false);
      onRated?.();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2 border-accent/30 text-accent hover:bg-accent/10">
          <Star className="w-4 h-4 fill-current" /> রেটিং দিন
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{sellerName} কে রেটিং দিন</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.button
                key={star}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(star)}
                className="p-1"
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    star <= (hover || rating)
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-muted-foreground"
                  }`}
                />
              </motion.button>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground">
            {rating === 0 ? "স্টার সিলেক্ট করুন" : `${rating}/5 স্টার`}
          </p>
          <Textarea
            placeholder="আপনার মতামত লিখুন (ঐচ্ছিক)..."
            value={review}
            onChange={(e) => setReview(e.target.value)}
            className="min-h-[80px]"
          />
          <Button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="w-full gradient-primary text-primary-foreground border-0 gap-2"
          >
            <Send className="w-4 h-4" />
            {submitting ? "Submitting..." : "জমা দিন"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RatingDialog;
