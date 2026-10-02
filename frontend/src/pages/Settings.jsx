import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, MapPin, Moon, Shield, HelpCircle, LogOut, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export default function Settings() {
  const { logout } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(true);

  const handleToggleNotification = () => {
    setNotifications(!notifications);
    addNotification({
      title: 'Settings Updated',
      message: `Push notifications ${!notifications ? 'enabled' : 'disabled'}`,
      type: 'info'
    });
  };

  const handleToggleLocation = () => {
    setLocationServices(!locationServices);
    addNotification({
      title: 'Settings Updated',
      message: `Location services ${!locationServices ? 'enabled' : 'disabled'}`,
      type: 'info'
    });
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-[#171717]">Settings</h1>
          <p className="text-xs text-slate-500 font-medium">Application preferences & system configurations</p>
        </div>
      </div>

      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md space-y-6">
        
        {/* Preference Toggles */}
        <div className="space-y-4">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Preferences</h2>
          
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-slate-700" />
              <div>
                <h3 className="text-xs font-extrabold text-[#171717]">15-Min Expiry Notifications</h3>
                <p className="text-[11px] text-slate-500 font-medium">Alerts when parking session is expiring</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={notifications}
              onChange={handleToggleNotification}
              className="w-5 h-5 accent-[#FFD21F] rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-slate-700" />
              <div>
                <h3 className="text-xs font-extrabold text-[#171717]">GPS Location Services</h3>
                <p className="text-[11px] text-slate-500 font-medium">Auto-detect nearest South Chennai parking hub</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={locationServices}
              onChange={handleToggleLocation}
              className="w-5 h-5 accent-[#FFD21F] rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-slate-700" />
              <div>
                <h3 className="text-xs font-extrabold text-[#171717]">Appearance Theme</h3>
                <p className="text-[11px] text-slate-500 font-medium">Bright Mobility Light Mode</p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-900 bg-[#FFD21F] px-2.5 py-1 rounded-full border border-amber-300">
              Light
            </span>
          </div>
        </div>

        {/* Support & Legal */}
        <div className="space-y-2 pt-4 border-t border-slate-100 text-xs font-medium">
          <h2 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">Support & Legal</h2>

          <div
            id="help"
            className="p-3.5 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between text-slate-700 cursor-pointer"
            onClick={() => addNotification({ title: 'Help & Support', message: 'GCC Helpline: 1913 or support@smartparkchennai.gov.in', type: 'info' })}
          >
            <div className="flex items-center gap-3">
              <HelpCircle className="w-4 h-4 text-slate-700" />
              <span className="font-bold text-[#171717]">Help & GCC Support Helpline</span>
            </div>
            <span className="text-[11px] text-blue-700 font-extrabold">1913</span>
          </div>

          <div
            className="p-3.5 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between text-slate-700 cursor-pointer"
            onClick={() => addNotification({ title: 'Security', message: 'JWT 256-bit authentication enabled', type: 'info' })}
          >
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-slate-700" />
              <span className="font-bold text-[#171717]">Security & Data Encryption</span>
            </div>
            <span className="text-[11px] text-emerald-700 font-extrabold">Active</span>
          </div>
        </div>

        {/* Logout */}
        <div className="pt-4 border-t border-slate-100">
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="w-full py-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <LogOut className="w-4 h-4" />
            Logout from SmartPark
          </button>
        </div>
      </div>
    </div>
  );
}
