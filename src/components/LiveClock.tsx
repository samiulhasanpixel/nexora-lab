import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

const BANGLA_DAYS = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
const BANGLA_MONTHS = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];

const toBanglaNum = (n: number | string) =>
  String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[+d]);

const LiveClock = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  const timeStr = `${toBanglaNum(String(h12).padStart(2, '0'))}:${toBanglaNum(String(m).padStart(2, '0'))}:${toBanglaNum(String(s).padStart(2, '0'))} ${period}`;
  const dateStr = `${toBanglaNum(now.getDate())} ${BANGLA_MONTHS[now.getMonth()]} ${toBanglaNum(now.getFullYear())}`;
  const dayStr = BANGLA_DAYS[now.getDay()];

  return (
    <div className="bg-card/60 backdrop-blur-sm border-b border-border">
      <div className="max-w-5xl mx-auto px-6 py-2 flex items-center justify-center gap-2">
        <Clock className="w-3.5 h-3.5 text-primary" />
        <span className="text-sm font-display font-semibold text-primary tabular-nums">
          {timeStr}
        </span>
        <span className="text-xs text-muted-foreground">
          • {dayStr}, {dateStr}
        </span>
      </div>
    </div>
  );
};

export default LiveClock;
