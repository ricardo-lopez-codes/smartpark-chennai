import React, { useState, useEffect } from 'react';
import { formatDurationSeconds, formatTime, parseCleanDate } from '../utils/formatters';
import { Clock, AlertTriangle, CalendarCheck } from 'lucide-react';

export default function CountdownTimer({
  startTime,
  paidEndTime,
  status,
  onExpiringWarning,
  onExpired
}) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const startMs = startTime ? parseCleanDate(startTime).getTime() : 0;
  const paidEndMs = paidEndTime ? parseCleanDate(paidEndTime).getTime() : 0;

  const isUpcoming = startMs > 0 && now < startMs;
  const isExpired = paidEndMs > 0 && now >= paidEndMs;
  const isActive = startMs > 0 && now >= startMs && now < paidEndMs;

  const secondsUntilStart = isUpcoming ? Math.max(0, Math.floor((startMs - now) / 1000)) : 0;
  const secondsLeftPaid = isActive ? Math.max(0, Math.floor((paidEndMs - now) / 1000)) : 0;

  useEffect(() => {
    if (isActive && secondsLeftPaid > 0 && secondsLeftPaid <= 900) {
      if (onExpiringWarning) onExpiringWarning(secondsLeftPaid);
    }
    if (isActive && secondsLeftPaid === 0) {
      if (onExpired) onExpired();
    }
  }, [isActive, secondsLeftPaid, onExpiringWarning, onExpired]);

  const isExpiringSoon = isActive && secondsLeftPaid > 0 && secondsLeftPaid <= 900;

  // UPCOMING RESERVATION STATE
  if (isUpcoming) {
    return (
      <div className="p-6 rounded-3xl bg-white border border-blue-200 text-slate-900 shadow-md text-center">
        <div className="flex items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-wider mb-2 text-blue-700">
          <CalendarCheck className="w-4 h-4 text-blue-600" />
          <span>UPCOMING RESERVATION • STARTS IN</span>
        </div>

        <div className="font-mono text-5xl sm:text-6xl font-extrabold tracking-tight text-[#171717] my-2">
          {formatDurationSeconds(secondsUntilStart)}
        </div>

        <p className="text-xs text-slate-500 font-medium mt-1">
          Scheduled to start at {startTime ? formatTime(startTime) : ''}. Parking countdown will begin automatically.
        </p>
      </div>
    );
  }

  // EXPIRED STATE
  if (isExpired || status === 'EXPIRED') {
    return (
      <div className="p-6 rounded-3xl bg-rose-50 border border-rose-300 text-rose-950 shadow-md text-center">
        <div className="flex items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-wider mb-2 text-rose-800">
          <Clock className="w-4 h-4 text-rose-700" />
          <span>PAID PARKING SESSION ENDED</span>
        </div>

        <div className="font-mono text-5xl sm:text-6xl font-extrabold tracking-tight text-rose-950 my-2">
          00:00:00
        </div>

        <p className="text-xs text-slate-600 font-medium mt-1">
          Paid time expired at {paidEndTime ? formatTime(paidEndTime) : ''}. Slot vacancy verified via IoT sensor.
        </p>
      </div>
    );
  }

  // ACTIVE RESERVATION STATE
  return (
    <div className={`p-6 rounded-3xl border transition-all text-center ${
      isExpiringSoon
        ? 'bg-amber-50 border-amber-300 text-amber-950 shadow-md'
        : 'bg-white border-slate-200 text-slate-900 shadow-md'
    }`}>
      <div className="flex items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-wider mb-2">
        {isExpiringSoon ? (
          <AlertTriangle className="w-4 h-4 text-amber-600 animate-bounce" />
        ) : (
          <Clock className="w-4 h-4 text-emerald-600" />
        )}
        <span className={isExpiringSoon ? 'text-amber-800' : 'text-emerald-800'}>
          {isExpiringSoon ? 'EXPIRING IN LESS THAN 15 MINS' : 'PARKING ACTIVE • TIME REMAINING'}
        </span>
      </div>

      <div className="font-mono text-5xl sm:text-6xl font-extrabold tracking-tight text-[#171717] my-2">
        {formatDurationSeconds(secondsLeftPaid)}
      </div>

      <p className="text-xs text-slate-500 font-medium mt-1">
        {isExpiringSoon
          ? 'Final 15 minutes of paid time. Extend +1 hour before buffer period.'
          : `Paid until ${paidEndTime ? formatTime(paidEndTime) : ''}`}
      </p>
    </div>
  );
}
