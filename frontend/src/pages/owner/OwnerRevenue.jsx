import React, { useState, useEffect } from 'react';
import { IndianRupee, TrendingUp, CreditCard, Wallet, Smartphone, ShieldCheck } from 'lucide-react';
import api from '../../services/api';

export default function OwnerRevenue() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/owner/revenue');
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch owner revenue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const todayRev = data?.today_revenue ?? data?.summary?.today ?? 0;
  const weeklyRev = data?.weekly_revenue ?? data?.summary?.this_week ?? 0;
  const monthlyRev = data?.monthly_revenue ?? data?.summary?.this_month ?? 0;
  const dailyTrend = data?.daily_trend || [];

  return (
    <div className="space-y-6">
      
      {/* Revenue Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        
        <div className="space-y-2 relative z-10">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-extrabold flex items-center gap-1.5 w-fit">
            <TrendingUp className="w-3.5 h-3.5" />
            Live Database Financial Stream
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Revenue & Financial Analytics</h2>
          <p className="text-xs text-slate-300">Earnings calculated from central database bookings</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-right space-y-1 relative z-10 min-w-48">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Monthly Revenue</span>
          <p className="text-3xl font-black text-[#FFD21F]">₹{monthlyRev.toLocaleString()}</p>
        </div>
      </div>

      {/* 3 Main Revenue Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Today */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold">
            <span>TODAY'S REVENUE</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-[#171717]">₹{todayRev.toLocaleString()}</p>
          <span className="text-xs text-slate-500 font-medium block">Calculated from today's bookings</span>
        </div>

        {/* Weekly */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold">
            <span>THIS WEEK</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-[#171717]">₹{weeklyRev.toLocaleString()}</p>
          <span className="text-xs text-slate-500 font-medium block">Last 7 days revenue</span>
        </div>

        {/* Monthly */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold">
            <span>THIS MONTH</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-[#171717]">₹{monthlyRev.toLocaleString()}</p>
          <span className="text-xs text-slate-500 font-medium block">Last 30 days total</span>
        </div>

      </div>

      {/* Feature 6: Early Exits & Partial Refunds Financial Summary */}
      {data?.early_exits_summary && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-base text-[#171717]">Early Exit & Partial Refunds Financial Analytics</h3>
              <p className="text-xs text-slate-500">Breakdown of original bookings, used time, retained 30% fee, and refunded amounts</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-extrabold text-xs">
              {data.early_exits_summary.count} Sessions Processed
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block font-medium">Original Booking</span>
              <span className="text-lg font-extrabold text-slate-900">₹{data.early_exits_summary.original_booking_amount}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-100">
              <span className="text-blue-700 block font-medium">Used Time Amount</span>
              <span className="text-lg font-extrabold text-blue-950">₹{data.early_exits_summary.used_amount}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-100">
              <span className="text-amber-800 block font-medium">Retained Fee (30%)</span>
              <span className="text-lg font-extrabold text-amber-950">₹{data.early_exits_summary.cancellation_fee}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100">
              <span className="text-rose-700 block font-medium">Refunded Amount</span>
              <span className="text-lg font-extrabold text-rose-950">₹{data.early_exits_summary.refunded_amount}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
              <span className="text-emerald-800 block font-medium">Final Earned Revenue</span>
              <span className="text-lg font-extrabold text-emerald-950">₹{data.early_exits_summary.final_earned_amount}</span>
            </div>
          </div>
        </div>
      )}

      {/* Daily Trend Chart */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
        <div>
          <h3 className="font-extrabold text-base text-[#171717]">Daily Revenue Trend (Last 7 Days)</h3>
          <p className="text-xs text-slate-500">Live booking financial metrics</p>
        </div>

        <div className="pt-4 pb-2">
          <div className="h-44 w-full flex items-end justify-between gap-3 sm:gap-6 px-2">
            {dailyTrend.length > 0 ? (
              dailyTrend.map((item, idx) => {
                const maxRev = Math.max(...dailyTrend.map(d => d.revenue), 1);
                const heightPct = Math.max(10, Math.round((item.revenue / maxRev) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[11px] font-extrabold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                      ₹{item.revenue}
                    </span>
                    <div
                      className="w-full rounded-t-xl bg-slate-900 group-hover:bg-[#FFD21F] transition-all duration-300"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[11px] font-bold text-slate-500">{item.day}</span>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 italic mx-auto">No booking financial records found.</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
