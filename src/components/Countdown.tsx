import { useState, useEffect } from 'react';
import { differenceInSeconds } from 'date-fns';

export function Countdown({ expiresAt, variant = 'text' }: { expiresAt: string, variant?: 'text' | 'ring' }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [percentage, setPercentage] = useState(100);
  const [secondsLeft, setSecondsLeft] = useState(24 * 3600);

  useEffect(() => {
    const update = () => {
      const diff = differenceInSeconds(new Date(expiresAt), new Date());
      if (diff <= 0) {
        setTimeLeft('Expired');
        setPercentage(0);
        setSecondsLeft(0);
        return;
      }
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setTimeLeft(`${h}h ${m}m ${s}s`);
      setSecondsLeft(diff);
      
      const totalSeconds = 24 * 3600; // 24 hours
      setPercentage(Math.max(0, Math.min(100, (diff / totalSeconds) * 100)));
    };
    
    update();
    const int = setInterval(update, 1000);
    return () => clearInterval(int);
  }, [expiresAt]);

  const isCritical = secondsLeft < 900; // < 15 mins
  const isWarning = secondsLeft < 3600; // < 1 hour

  if (variant === 'ring') {
    const radius = 5;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    const colorClass = isCritical ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-neutral-400';

    return (
      <div title={`Expires in ${timeLeft}`} className="flex items-center justify-center">
        <svg width="12" height="12" viewBox="0 0 12 12" className="transform -rotate-90">
          <circle
            cx="6"
            cy="6"
            r={radius}
            className="stroke-neutral-800"
            strokeWidth="1.5"
            fill="none"
          />
          <circle
            cx="6"
            cy="6"
            r={radius}
            className={colorClass}
            strokeWidth="1.5"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
          />
        </svg>
      </div>
    );
  }

  const textColorClass = isCritical ? 'text-red-500 font-medium' : isWarning ? 'text-amber-500 font-medium' : 'text-white';
  return <span className={`font-mono tabular-nums tracking-tighter opacity-80 transition-colors duration-500 ${textColorClass}`}>{timeLeft}</span>;
}

