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

const QueueAlarm = ({ peopleAhead, threshold, alarmMessage, bookingStatus }: QueueAlarmProps) => {
  const [alarmTriggered, setAlarmTriggered] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [muted, setMuted] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopSound = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (audioCtxRef.current) { audioCtxRef.current.close().catch(() => {}); audioCtxRef.current = null; }
    if ("vibrate" in navigator) navigator.vibrate(0);
  }, []);

  const playBeep = useCallback((ctx: AudioContext) => {
    try {
      if (ctx.state === 'closed') return;
      const freqs = [800, 1000, 1200, 1000, 800];
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq; osc.type = "sine";
        const start = ctx.currentTime + i * 0.25;
        gain.gain.setValueAtTime(0.4, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.2);
        osc.start(start); osc.stop(start + 0.25);
      });
    } catch (e) {}
  }, []);

  const startAlarmLoop = useCallback(() => {
    stopSound();
    if (muted) {
      if ("vibrate" in navigator) navigator.vibrate([300, 100, 300, 100, 500]);
      intervalRef.current = setInterval(() => {
        if ("vibrate" in navigator) navigator.vibrate([300, 100, 300, 100, 500]);
      }, 3000);
      return;
    }
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      if (ctx.state === 'suspended') ctx.resume();
      playBeep(ctx);
      if ("vibrate" in navigator) navigator.vibrate([300, 100, 300, 100, 500]);
      intervalRef.current = setInterval(() => {
        if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') playBeep(audioCtxRef.current);
        if ("vibrate" in navigator) navigator.vibrate([300, 100, 300, 100, 500]);
      }, 3000);
    } catch (e) {}
  }, [muted, playBeep, stopSound]);

  useEffect(() => {
    if (bookingStatus !== "waiting" && bookingStatus !== "in_progress") {
      setAlarmTriggered(false); setDismissed(false); stopSound(); return;
    }
    if (peopleAhead >= 0 && peopleAhead <= threshold && !dismissed) {
      if (!alarmTriggered) setAlarmTriggered(true);
    } else if (peopleAhead > threshold) {
      setAlarmTriggered(false); setDismissed(false); stopSound();
    }
    return () => { stopSound(); };
  }, [peopleAhead, threshold, dismissed, bookingStatus, stopSound]);

  useEffect(() => {
    if (alarmTriggered && !dismissed) startAlarmLoop();
    else stopSound();
    return () => { stopSound(); };
  }, [alarmTriggered, dismissed, muted, startAlarmLoop, stopSound]);

  const handleDismiss = () => { setDismissed(true); stopSound(); };

  return (
    <AnimatePresence>
      {alarmTriggered && !dismissed && (
        <motion.div initial={{ opacity: 0, scale: 0.8, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          className="glass-elevated rounded-2xl p-6 border-2 border-accent/50 bg-accent/5">
          <div className="flex items-center justify-between mb-3">
            <motion.div animate={{ rotate: [0, -15, 15, -15, 15, 0] }} transition={{ repeat: Infinity, duration: 1 }}>
              <BellRing className="w-8 h-8 text-accent" />
            </motion.div>
            <Button variant="ghost" size="icon" onClick={() => setMuted(!muted)} className="h-8 w-8">
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
          </div>
          <motion.p animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
            className="text-xl font-display font-bold text-foreground mb-2">
            {alarmMessage || `Only ${peopleAhead} people ahead!`}
          </motion.p>
          <p className="text-sm text-muted-foreground mb-4">Get ready, your turn is coming!</p>
          <Button onClick={handleDismiss} variant="outline" size="sm" className="w-full">
            <Bell className="w-4 h-4 mr-2" /> Got it
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QueueAlarm;
