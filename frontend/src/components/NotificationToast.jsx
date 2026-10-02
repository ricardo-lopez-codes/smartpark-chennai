import React from 'react';
import { useNotification } from '../context/NotificationContext';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export default function NotificationToast() {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full px-4 pointer-events-none">
      {notifications.map((n) => {
        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />,
          warning: <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />,
          error: <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />,
          info: <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
        };

        const borderColors = {
          success: 'border-emerald-300 bg-white text-emerald-950',
          warning: 'border-amber-300 bg-white text-amber-950',
          error: 'border-rose-300 bg-white text-rose-950',
          info: 'border-blue-300 bg-white text-slate-900'
        };

        return (
          <div
            key={n.id}
            className={`pointer-events-auto p-4 rounded-2xl border shadow-xl flex items-start gap-3 transition-all duration-300 transform translate-y-0 ${borderColors[n.type] || borderColors.info}`}
          >
            {icons[n.type] || icons.info}
            <div className="flex-1 min-w-0">
              {n.title && <h4 className="text-sm font-extrabold text-[#171717]">{n.title}</h4>}
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed font-medium">{n.message}</p>
            </div>
            <button
              onClick={() => removeNotification(n.id)}
              className="text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
