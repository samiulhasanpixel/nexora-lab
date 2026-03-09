import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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
  const timeStr = `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} ${period}`;
  const dateStr = `${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  const dayStr = DAYS[now.getDay()];

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
