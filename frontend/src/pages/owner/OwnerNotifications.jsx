import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, ShieldCheck, CheckCircle2, Info, Check, CheckCheck } from 'lucide-react';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

export default function OwnerNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotification();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/owner/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.post('/owner/notifications/read', { notification_id: id });
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/owner/notifications/read', {});
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      addNotification({
        title: 'Notifications Cleared',
        message: 'All notifications marked as read.',
        type: 'success'
      });
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'sensor_offline':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'occupancy_alert':
        return <Info className="w-5 h-5 text-blue-600" />;
      case 'new_booking':
      case 'payment_received':
        return <ShieldCheck className="w-5 h-5 text-emerald-600" />;
      default:
        return <Bell className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#171717]">Operational Notifications</h2>
          <p className="text-xs text-slate-500">Real-time alerts, sensor warnings, and reservation logs</p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#171717] font-extrabold text-xs flex items-center gap-2 transition-all w-fit"
        >
          <CheckCheck className="w-4 h-4 text-emerald-600" />
          Mark All as Read
        </button>
      </div>

      {/* Notifications List */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        {loading ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-4 border-[#FFD21F] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-500">Fetching notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p className="text-sm font-bold text-slate-600">No active notifications.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                  n.is_read
                    ? 'bg-slate-50/60 border-slate-100 opacity-75'
                    : 'bg-white border-amber-200 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className={`p-2.5 rounded-xl flex-shrink-0 ${
                    n.severity === 'warning' ? 'bg-amber-100' :
                    n.severity === 'success' ? 'bg-emerald-100' : 'bg-blue-100'
                  }`}>
                    {getIcon(n.type)}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-[#171717]">{n.title}</h4>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 font-medium">{n.message}</p>
                    <span className="text-[10px] text-slate-400 font-mono block pt-1">{n.timestamp}</span>
                  </div>
                </div>

                {!n.is_read && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex-shrink-0"
                    title="Mark as Read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
