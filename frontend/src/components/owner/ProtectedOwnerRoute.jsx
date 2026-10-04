import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert as ShieldIcon } from 'lucide-react';

export default function ProtectedOwnerRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-[#FFD21F] border-t-transparent animate-spin" />
          <span className="text-xs font-bold text-slate-500">Loading Owner Portal...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'owner' && user.role !== 'esp32') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7] p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldIcon className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#171717]">Access Restricted</h2>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            The Owner Portal is restricted to registered parking lot business owners. Your current account (<code className="font-bold text-slate-900">{user.email}</code>) is registered as a <span className="uppercase font-bold text-amber-700">{user.role}</span>.
          </p>
          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
            <a
              href="/"
              className="w-full py-3 rounded-xl bg-[#FFD21F] hover:bg-[#E5B800] text-[#171717] font-extrabold text-xs transition-all shadow-xs"
            >
              Return to Civilian Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
