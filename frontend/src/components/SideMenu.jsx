import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, User, History, Settings, HelpCircle, LogOut, ChevronRight, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SideMenu({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/login');
  };

  const menuItems = [
    { label: 'Account', icon: User, path: '/account', desc: 'Manage vehicle & profile' },
    { label: 'Past Bookings', icon: History, path: '/past-bookings', desc: 'Booking history & receipts' },
    { label: 'Settings', icon: Settings, path: '/settings', desc: 'Notifications & preferences' },
    { label: 'Help & Support', icon: HelpCircle, path: '/settings#help', desc: 'FAQs & GCC helpline' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-sm bg-white border-l border-slate-200 h-full p-6 flex flex-col justify-between z-10 shadow-2xl overflow-y-auto">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#FFD21F] flex items-center justify-center text-[#171717] font-extrabold text-xl shadow-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h3 className="font-extrabold text-[#171717] text-base">{user?.name || 'Civilian User'}</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{user?.vehicle_number || 'TN-09-AB-1234'}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Civilian Dashboard Badge */}
          <div className="my-6 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3">
            <Shield className="w-5 h-5 text-amber-700 flex-shrink-0" />
            <div>
              <p className="text-xs font-extrabold text-amber-950">Civilian Portal</p>
              <p className="text-[11px] text-amber-800">South Chennai Smart City Hubs</p>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={onClose}
                  className="flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 transition-all text-slate-800 hover:text-[#171717] group border border-transparent hover:border-slate-200"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-[#FFD21F] text-slate-600 group-hover:text-[#171717] transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-sm block text-[#171717]">{item.label}</span>
                      <span className="text-xs text-slate-500">{item.desc}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-transform group-hover:translate-x-0.5" />
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Logout */}
        <div className="pt-6 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-sm transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
