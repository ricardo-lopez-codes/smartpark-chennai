import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Clock, Layers, Award, Percent, ChevronRight } from 'lucide-react';
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
          <p className="text-xs text-slate-300">Data-driven insights for Saravana Stores Parking</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 text-center min-w-36">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Peak Window</span>
            <span className="text-sm font-black text-[#FFD21F]">6:00 PM – 8:00 PM</span>
          </div>
        </div>
      </div>

      {/* 6 Key Analytics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 block">Avg Occupancy</span>
          <p className="text-2xl font-black text-[#171717]">74.5%</p>
          <span className="text-[10px] text-emerald-600 font-bold">+5.2% vs last week</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 block">Avg Duration</span>
          <p className="text-2xl font-black text-[#171717]">2.4 hrs</p>
          <span className="text-[10px] text-slate-400 font-medium">Per vehicle stay</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 block">Revenue / Slot</span>
          <p className="text-2xl font-black text-[#171717]">₹1,735</p>
          <span className="text-[10px] text-slate-400 font-medium">Monthly yield/bay</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 block">Cancellation Rate</span>
          <p className="text-2xl font-black text-slate-800">3.8%</p>
          <span className="text-[10px] text-emerald-600 font-bold">Low churn rate</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 block">No-Show Rate</span>
          <p className="text-2xl font-black text-slate-800">1.9%</p>
          <span className="text-[10px] text-slate-400 font-medium">Protected by buffer</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFD21F]/20 border border-[#FFD21F] shadow-xs space-y-1">
          <span className="text-[11px] font-extrabold text-[#171717] block">Efficiency Score</span>
          <p className="text-2xl font-black text-[#171717]">94 / 100</p>
          <span className="text-[10px] text-[#171717] font-bold">High performance</span>
        </div>

      </div>

      {/* Main Grid: Occupancy by Period + Top Used Slots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Occupancy by Time Period */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
          <div>
            <h3 className="font-extrabold text-base text-[#171717]">Occupancy Load by Time Period</h3>
            <p className="text-xs text-slate-500">Average bay utilization across day cycles</p>
          </div>

          <div className="space-y-4 pt-2">
            {[
              { period: 'Morning (06:00 - 12:00)', pct: 32, color: 'bg-emerald-500' },
              { period: 'Afternoon (12:00 - 17:00)', pct: 54, color: 'bg-blue-500' },
              { period: 'Evening (17:00 - 21:00)', pct: 89, color: 'bg-rose-500' },
              { period: 'Night (21:00 - 06:00)', pct: 42, color: 'bg-amber-500' }
            ].map((item, i) => (
              <div key={i} className="space-y-1.5 text-xs font-bold">
                <div className="flex items-center justify-between text-[#171717]">
                  <span>{item.period}</span>
                  <span className="font-extrabold">{item.pct}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color} transition-all duration-500`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top 5 Most Used Slots */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-[#171717]">Most Utilized Parking Bays</h3>
              <p className="text-xs text-slate-500">Top 5 bays by turnover frequency</p>
            </div>
            <Award className="w-5 h-5 text-amber-500" />
          </div>

          <div className="space-y-3">
            {[
              { slot: 'Slot A-01', turnover: 42, pct: 92, zone: 'Ground Floor • Near Entrance' },
              { slot: 'Slot A-02', turnover: 39, pct: 88, zone: 'Ground Floor • Near Entrance' },
              { slot: 'Slot A-05', turnover: 37, pct: 85, zone: 'Ground Floor • Express Bay' },
              { slot: 'Slot B-03', turnover: 35, pct: 81, zone: '1st Floor • Covered' },
              { slot: 'Slot B-08', turnover: 33, pct: 78, zone: '1st Floor • Covered' }
            ].map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-[#FFD21F] text-[#171717] font-black text-xs flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <div>
                    <span className="font-bold text-[#171717] block">{item.slot}</span>
                    <span className="text-[10px] text-slate-500">{item.zone}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-extrabold text-slate-900 block">{item.turnover} Turnovers</span>
                  <span className="text-[10px] font-bold text-emerald-600">{item.pct}% Occupancy</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
