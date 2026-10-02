import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-6 px-4 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#FFD21F]"></span>
          <span className="font-medium text-slate-700">© 2026 PARK-A-LOT — South Chennai Smart City Platform</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-700 font-medium">Smart Parking Availability System</span>
        </div>
      </div>
    </footer>
  );
}
