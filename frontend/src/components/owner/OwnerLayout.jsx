import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Bell, User, Car, Shield, Wifi } from 'lucide-react';
import OwnerSidebar from './OwnerSidebar';
import { useAuth } from '../../context/AuthContext';

export default function OwnerLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/owner') return 'Overview Dashboard';
    if (path.includes('/live-parking')) return 'Live Parking Occupancy';
    if (path.includes('/bookings')) return 'Parking Bookings';
    if (path.includes('/calendar')) return 'Schedule & Occupancy Calendar';
    if (path.includes('/revenue')) return 'Revenue & Financial Analytics';
    if (path.includes('/slots')) return 'Parking Slot Management';
    if (path.includes('/analytics')) return 'Performance Analytics';
    if (path.includes('/notifications')) return 'Operational Alerts & Notifications';
    if (path.includes('/settings')) return 'Parking Lot Settings';
    if (path.includes('/account')) return 'Owner Profile & Security';
    return 'Owner Portal';
  };

  return (
    <div className="min-h-screen flex bg-[#F7F7F7] text-[#171717] font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Sidebar Navigation */}
      <OwnerSidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        unreadNotifsCount={2}
        selectedLotName="Saravana Stores Parking"
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 shadow-xs flex items-center justify-between">
          
          {/* Left Header Title & Mobile Hamburger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#171717] transition-all"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-lg font-extrabold text-[#171717] tracking-tight flex items-center gap-2">
                {getPageTitle()}
              </h1>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                Saravana Stores Parking • Anna Nagar, South Chennai
              </p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            
            {/* Notifications Shortcut */}
            <Link
              to="/owner/notifications"
              className="relative p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
            </Link>

            {/* Profile Avatar */}
            <Link
              to="/owner/account"
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all"
            >
              <div className="w-7 h-7 rounded-lg bg-[#FFD21F] text-[#171717] flex items-center justify-center font-extrabold text-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'O'}
              </div>
              <span className="text-xs font-extrabold text-[#171717] hidden sm:inline">
                {user?.name?.split(' ')[0] || 'Owner'}
              </span>
            </Link>
          </div>
        </header>

        {/* View Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
