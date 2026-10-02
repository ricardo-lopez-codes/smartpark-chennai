import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Car, Cpu } from 'lucide-react';
import SideMenu from './SideMenu';
import { useBooking } from '../context/BookingContext';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { demoMode } = useBooking();

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 py-3.5 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Left: Branding */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#FFD21F] flex items-center justify-center text-[#171717] font-extrabold shadow-sm group-hover:scale-105 transition-transform">
              <Car className="w-5 h-5 text-[#171717]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-[#171717]">
                  SMARTPARK
                </span>
                {demoMode && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 rounded-full">
                    <Cpu className="w-3 h-3 text-amber-700 animate-pulse" />
                    Demo IoT Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium hidden xs:block">
                Smart Parking Availability System
              </p>
            </div>
          </Link>

          {/* Right: Status & Hamburger Menu */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-full px-3 py-1.5 text-xs text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="font-bold text-emerald-700">Live IoT Gateway Sync</span>
            </div>

            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#171717] border border-slate-200 transition-all active:scale-95 flex items-center justify-center"
              aria-label="Open navigation menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Slide-over Side Menu */}
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
}
