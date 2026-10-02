import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-6 px-4 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#FFD21F]"></span>
          <span className="font-medium text-slate-700">© 2026 SMARTPARK — South Chennai Smart City Platform</span>
        </div>
        <div className="flex items-center gap-4">
          <span>IoT Magnetometer Gateway v1.0</span>
          <span>•</span>
          <span className="text-slate-900 font-bold">Civilian Dashboard</span>
        </div>
      </div>
    </footer>
  );
}
