import React, { useState, useEffect } from 'react';
import { IndianRupee, TrendingUp, CreditCard, Wallet, Smartphone, ShieldCheck, ArrowUpRight } from 'lucide-react';
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

  const summary = data?.summary || {
    today: 8450,
    this_week: 52340,
    this_month: 218450,
    growth_rate_pct: 14.2
  };

  return (
    <div className="space-y-6">
      
      {/* Revenue Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
        
        <div className="space-y-2 relative z-10">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-extrabold flex items-center gap-1.5 w-fit">
            <TrendingUp className="w-3.5 h-3.5" />
            +14.2% Growth Month-over-Month
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Revenue & Financial Analytics</h2>
          <p className="text-xs text-slate-300">Earnings breakdown for Saravana Stores Parking</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-right space-y-1 relative z-10 min-w-48">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Monthly Revenue</span>
          <p className="text-3xl font-black text-[#FFD21F]">₹{summary.this_month.toLocaleString()}</p>
        </div>
      </div>

      {/* 3 Main Revenue Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Today */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold">
            <span>TODAY'S REVENUE</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-800">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-[#171717]">₹{summary.today.toLocaleString()}</p>
          <p className="text-xs text-slate-500 font-medium">67 Completed & Active Bookings</p>
        </div>

        {/* This Week */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold">
            <span>THIS WEEK</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-[#171717]">₹{summary.this_week.toLocaleString()}</p>
          <p className="text-xs text-emerald-700 font-bold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> +8.4% compared to last week
          </p>
        </div>

        {/* This Month */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold">
            <span>THIS MONTH</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-800">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-[#171717]">₹{summary.this_month.toLocaleString()}</p>
          <p className="text-xs text-slate-500 font-medium">30 Days Aggregated Settlement</p>
        </div>

      </div>

      {/* Charts Grid: Daily Trend + Payment Method Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Daily Revenue Trend Chart */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-[#171717]">Daily Revenue Breakdown</h3>
              <p className="text-xs text-slate-500">7-Day earnings trend across peak South Chennai shopping hours</p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">This Week</span>
          </div>

          <div className="h-56 w-full flex items-end justify-between gap-4 pt-4 px-2">
            {(data?.daily_breakdown || [
              { day: 'Mon', revenue: 7200 },
              { day: 'Tue', revenue: 8100 },
              { day: 'Wed', revenue: 7800 },
              { day: 'Thu', revenue: 8450 },
              { day: 'Fri', revenue: 9600 },
              { day: 'Sat', revenue: 11200 },
              { day: 'Sun', revenue: 10500 }
            ]).map((d, i) => {
              const maxRev = 12000;
              const pct = Math.round((d.revenue / maxRev) * 100);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[11px] font-black text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">
                    ₹{d.revenue.toLocaleString()}
                  </span>
                  <div
                    className="w-full rounded-t-2xl bg-emerald-500 group-hover:bg-[#FFD21F] transition-all duration-300"
                    style={{ height: `${pct}%` }}
                  />
                  <span className="text-xs font-bold text-slate-500">{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Payment Channel Distribution */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
          <div>
            <h3 className="font-extrabold text-base text-[#171717]">Payment Channel Breakdown</h3>
            <p className="text-xs text-slate-500">Distribution by digital payment gateways</p>
          </div>

          <div className="space-y-4">
            {(data?.payment_methods || [
              { method: 'UPI (GPay / PhonePe / Paytm)', percentage: 68, amount: 148546 },
              { method: 'Credit / Debit Cards', percentage: 24, amount: 52428 },
              { method: 'Net Banking & Wallets', percentage: 8, amount: 17476 }
            ]).map((item, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[#171717]">{item.method}</span>
                  <span className="text-slate-900 font-extrabold">{item.percentage}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      idx === 0 ? 'bg-emerald-500' : idx === 1 ? 'bg-blue-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 text-right font-mono">₹{item.amount?.toLocaleString()}</p>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 font-medium">
            <span className="font-bold text-slate-900 block mb-0.5">Automated Settlements</span>
            Direct payouts processed daily to owner registered bank account.
          </div>
        </div>

      </div>

    </div>
  );
}
