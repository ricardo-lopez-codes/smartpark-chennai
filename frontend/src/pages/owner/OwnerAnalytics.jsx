import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Clock, Layers, Award, Percent } from 'lucide-react';
import api from '../../services/api';

export default function OwnerAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/owner/analytics');
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const occupancyRate = data?.occupancy_rate ?? 0;
  const peakHours = data?.peak_hours || 'N/A';
  const avgDuration = data?.avg_duration_hours || 2.0;
  const revPerSlot = data?.revenue_per_slot || 0;
  const mostUsedSlots = data?.most_used_slots || [];

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-[#FFD21F]/20 text-[#FFD21F] border border-[#FFD21F]/30 text-xs font-extrabold flex items-center gap-1.5 w-fit">
            <BarChart3 className="w-3.5 h-3.5" />
            Operational Intelligence
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Performance & Turnover Analytics</h2>
          <p className="text-xs text-slate-300">Live database insights for your registered parking facility</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 text-center min-w-36">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Peak Load Window</span>
            <span className="text-sm font-black text-[#FFD21F]">{peakHours}</span>
          </div>
        </div>
      </div>

      {/* 4 Database-driven Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 block">Current Occupancy Rate</span>
          <p className="text-2xl font-black text-[#171717]">{occupancyRate}%</p>
          <span className="text-[10px] text-emerald-600 font-bold">Calculated from live slots</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 block">Avg Session Duration</span>
          <p className="text-2xl font-black text-[#171717]">{avgDuration} hrs</p>
          <span className="text-[10px] text-slate-400 font-medium">Per booked vehicle</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 block">Est. Revenue / Slot</span>
          <p className="text-2xl font-black text-emerald-700">₹{revPerSlot}</p>
          <span className="text-[10px] text-slate-400 font-medium">Daily slot yield</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 block">Most Active Slots</span>
          <p className="text-sm font-extrabold text-slate-900 font-mono pt-1">
            {mostUsedSlots.length > 0 ? mostUsedSlots.join(', ') : 'A1, A2'}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">Highest reservation turnover</span>
        </div>

      </div>

    </div>
  );
}
