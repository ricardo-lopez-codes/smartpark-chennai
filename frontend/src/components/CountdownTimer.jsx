import React, { useState, useEffect } from 'react';
import { formatDurationSeconds } from '../utils/formatters';
import { Clock, AlertTriangle } from 'lucide-react';

export default function CountdownTimer({ targetIsoTime, onExpiringWarning, onExpired }) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!targetIsoTime) return;

    const calculateRemaining = () => {
      const now = new Date().getTime();
      const target = new Date(targetIsoTime).getTime();
      const diffSeconds = Math.max(0, Math.floor((target - now) / 1000));
      
      setSecondsLeft(diffSeconds);

      if (diffSeconds > 0 && diffSeconds <= 900) {
        if (onExpiringWarning) onExpiringWarning(diffSeconds);
      }

      if (diffSeconds === 0) {
        if (onExpired) onExpired();
      }
    };

    calculateRemaining();
    const timer = setInterval(calculateRemaining, 1000);
    return () => clearInterval(timer);
  }, [targetIsoTime, onExpiringWarning, onExpired]);

  const isExpiringSoon = secondsLeft > 0 && secondsLeft <= 900;
  const isExpired = secondsLeft === 0;

  return (
    <div className={`p-6 rounded-3xl border transition-all text-center ${
      isExpiringSoon
        ? 'bg-amber-50 border-amber-300 text-amber-950 shadow-md'
        : isExpired
        ? 'bg-rose-50 border-rose-300 text-rose-950 shadow-md'
        : 'bg-white border-slate-200 text-slate-900 shadow-md'
    }`}>
      <div className="flex items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-wider mb-2">
        {isExpiringSoon ? (
          <AlertTriangle className="w-4 h-4 text-amber-600 animate-bounce" />
        ) : (
          <Clock className="w-4 h-4 text-slate-800" />
        )}
        <span className={isExpiringSoon ? 'text-amber-800' : isExpired ? 'text-rose-800' : 'text-slate-800'}>
          {isExpired ? 'PARKING SESSION ENDED' : isExpiringSoon ? 'EXPIRING IN LESS THAN 15 MINS' : 'TIME REMAINING'}
        </span>
      </div>

      <div className="font-mono text-5xl sm:text-6xl font-extrabold tracking-tight text-[#171717] my-2">
        {formatDurationSeconds(secondsLeft)}
      </div>

      <p className="text-xs text-slate-500 font-medium mt-1">
        {isExpired ? 'Sensor verification in progress' : 'Live IoT countdown synchronized with GCC backend'}
      </p>
    </div>
  );
}
