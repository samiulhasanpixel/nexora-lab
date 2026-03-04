import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellRing, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QueueAlarmProps {
  peopleAhead: number;
  threshold: number;
  alarmMessage: string;
  bookingStatus: string;
}

const ALARM_SOUNDS = [
  { id: "default", label: "ডিফল্ট", freq: [800, 1000, 1200] },
  { id: "gentle", label: "জেন্টেল", freq: [500, 600, 700] },
  { id: "urgent", label: "আর্জেন্ট", freq: [1000, 1200, 1400] },
];

const QueueAlarm = ({ peopleAhead, threshold, alarmMessage, bookingStatus }: QueueAlarmProps) => {
  const [alarmTriggered, setAlarmTriggered] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [muted, setMuted] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const playAlarmSound = useCallback(() => {
    if (muted) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      
      const freqs = ALARM_SOUNDS[0].freq;
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = "sine";
        gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.3);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.3 + 0.25);
        osc.start(ctx.currentTime + i * 0.3);
        osc.stop(ctx.currentTime + i * 0.3 + 0.3);
      });
    } catch (e) {
      console.log("Audio not supported");
    }
  }, [muted]);

  const triggerVibration = useCallback(() => {
    if ("vibrate" in navigator) {
      navigator.vibrate([300, 100, 300, 100, 500]);
    }
  }, []);

  useEffect(() => {
    if (bookingStatus !== "waiting" && bookingStatus !== "in_progress") {
      setAlarmTriggered(false);
      setDismissed(false);
      return;
    }

    if (peopleAhead >= 0 && peopleAhead <= threshold && !dismissed) {
      if (!alarmTriggered) {
        setAlarmTriggered(true);
        playAlarmSound();
        triggerVibration();
        // Repeat alarm every 10 seconds
        intervalRef.current = setInterval(() => {
          playAlarmSound();
          triggerVibration();
        }, 10000);
      }
    } else if (peopleAhead > threshold) {
      setAlarmTriggered(false);
      setDismissed(false);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [peopleAhead, threshold, dismissed, alarmTriggered, bookingStatus, playAlarmSound, triggerVibration]);

  const handleDismiss = () => {
    setDismissed(true);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (audioCtxRef.current) audioCtxRef.current.close();
  };

  return (
    <AnimatePresence>
      {alarmTriggered && !dismissed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          className="glass-elevated rounded-2xl p-6 border-2 border-accent/50 bg-accent/5"
        >
          <div className="flex items-center justify-between mb-3">
            <motion.div
              animate={{ rotate: [0, -15, 15, -15, 15, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <BellRing className="w-8 h-8 text-accent" />
            </motion.div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMuted(!muted)}
                className="h-8 w-8"
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          
          <motion.p
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-xl font-display font-bold text-foreground mb-2"
          >
            {alarmMessage || `আর ${peopleAhead} জন বাকি!`}
          </motion.p>
          <p className="text-sm text-muted-foreground mb-4">প্রস্তুত হোন, আপনার পালা আসছে!</p>
          
          <Button onClick={handleDismiss} variant="outline" size="sm" className="w-full">
            <Bell className="w-4 h-4 mr-2" /> বুঝেছি, ধন্যবাদ
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QueueAlarm;
