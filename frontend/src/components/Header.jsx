import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Car } from 'lucide-react';
import SideMenu from './SideMenu';
import BuyCreditsModal from './BuyCreditsModal';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBuyCreditsOpen, setIsBuyCreditsOpen] = useState(false);
  const { user } = useAuth();

  const creditsCount = user ? (user.wallet_credits || Math.floor(user.wallet_balance || 0)) : 0;

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
                  PARK-A-LOT
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden xs:block">
                Smart Parking Availability System
              </p>
            </div>
          </Link>

          {/* Right: Wallet Credits Badge & Hamburger Menu */}
          <div className="flex items-center gap-3">
            {user && (
              <button
                onClick={() => setIsBuyCreditsOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-slate-900 transition-all active:scale-95 shadow-2xs group"
                title="Click to Buy Credits / Top Up"
              >
                <span className="text-sm">💳</span>
                <span className="text-xs font-black text-[#171717]">
                  {creditsCount} Credits
                </span>
                <span className="w-5 h-5 rounded-lg bg-[#FFD21F] text-[#171717] font-black text-xs flex items-center justify-center group-hover:bg-[#E5B800] ml-0.5">
                  +
                </span>
              </button>
            )}

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

      {/* Buy Credits Modal */}
      <BuyCreditsModal
        isOpen={isBuyCreditsOpen}
        onClose={() => setIsBuyCreditsOpen(false)}
      />
    </>
  );
}
