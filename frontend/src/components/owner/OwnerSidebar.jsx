import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Grid,
  CalendarCheck,
  Calendar,
  IndianRupee,
  Layers,
  BarChart3,
  Cpu,
  Bell,
  Settings,
  User,
  LogOut,
  Car,
  X,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function OwnerSidebar({ mobileOpen, setMobileOpen, unreadNotifsCount = 2, selectedLotName = "Saravana Stores Parking" }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Overview', icon: LayoutDashboard, path: '/owner', end: true },
    { label: 'Live Parking', icon: Grid, path: '/owner/live-parking' },
    { label: 'Bookings', icon: CalendarCheck, path: '/owner/bookings' },
    { label: 'Calendar', icon: Calendar, path: '/owner/calendar' },
    { label: 'Revenue', icon: IndianRupee, path: '/owner/revenue' },
    { label: 'Parking Slots', icon: Layers, path: '/owner/slots' },
    { label: 'Analytics', icon: BarChart3, path: '/owner/analytics' },
    { label: 'Notifications', icon: Bell, path: '/owner/notifications', badge: unreadNotifsCount },
    { label: 'Lot Settings', icon: Settings, path: '/owner/settings' },
    { label: 'Account', icon: User, path: '/owner/account' },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#111827] text-slate-300 w-64 border-r border-slate-800">
      
      {/* Header / Brand */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFD21F] flex items-center justify-center text-[#171717] font-extrabold shadow-md">
            <Car className="w-5 h-5 text-[#171717]" />
          </div>
          <div>
            <span className="font-extrabold text-lg text-white tracking-tight block leading-none">
              PARK-A-LOT
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#FFD21F]">
              Owner Portal
            </span>
          </div>
        </div>
        
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Lot Status Card */}
      <div className="px-4 py-3.5 mx-3 my-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
        <div className="overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              Lot Online
            </span>
          </div>
          <p className="text-xs font-bold text-white truncate mt-0.5" title={selectedLotName}>
            {selectedLotName}
          </p>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.label}
              to={item.path}
              end={item.end}
              onClick={() => mobileOpen && setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${
                  isActive
                    ? 'bg-[#FFD21F] text-[#171717] font-extrabold shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </div>

              {item.badge > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold shadow-xs">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Owner Profile & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-[#FFD21F] flex items-center justify-center text-[#171717] font-extrabold text-sm flex-shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'O'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'Owner'}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-300 text-xs font-bold transition-all border border-slate-700/60"
        >
          <LogOut className="w-3.5 h-3.5" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block h-screen sticky top-0 flex-shrink-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex-1 max-w-xs w-full bg-[#111827] h-full z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
