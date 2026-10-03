import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Layers, IndianRupee, TrendingUp } from 'lucide-react';
import api from '../../services/api';
import { getLocalDateISO } from '../../utils/formatters';

export default function OwnerCalendar() {
  const [selectedDate, setSelectedDate] = useState(getLocalDateISO());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/owner/calendar', {
        params: { date: selectedDate }
      });
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch calendar metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, [selectedDate]);

  const lot = data?.parking_lot || {};
  const metrics = data?.metrics || {
    total_bookings: 0,
    expected_occupancy_pct: 0,
    available_slots: lot.total_slots || 0,
    expected_revenue: 0,
    peak_hours: 'No bookings'
  };

  const hourlyDensity = data?.hourly_density || [
    { hour: '06:00 - 09:00', bookings: 0, occupancy: 0, revenue: 0 },
    { hour: '09:00 - 12:00', bookings: 0, occupancy: 0, revenue: 0 },
    { hour: '12:00 - 15:00', bookings: 0, occupancy: 0, revenue: 0 },
    { hour: '15:00 - 18:00', bookings: 0, occupancy: 0, revenue: 0 },
    { hour: '18:00 - 21:00', bookings: 0, occupancy: 0, revenue: 0 },
    { hour: '21:00 - 00:00', bookings: 0, occupancy: 0, revenue: 0 }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Calendar Header & Date Pickers */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#171717]">Occupancy & Revenue Schedule</h2>
          <p className="text-xs text-slate-500">
            {lot.name || 'Registered Parking Space'} {lot.address ? `• ${lot.address}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-slate-600 font-extrabold flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4 text-[#171717]" />
            Select Calendar Date:
          </span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#171717] focus:outline-none focus:border-[#FFD21F]"
          />
        </div>
      </div>

      {/* Selected Date Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        {/* Total Bookings */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Total Bookings</span>
          <p className="text-2xl font-black text-[#171717]">{metrics.total_bookings}</p>
          <span className="text-[10px] text-slate-400 font-medium">Reservations for {selectedDate}</span>
        </div>

        {/* Expected Occupancy */}
        <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-amber-900 block">Expected Occupancy</span>
          <p className="text-2xl font-black text-amber-950">{metrics.expected_occupancy_pct}%</p>
          <span className="text-[10px] text-amber-800 font-medium">Capacity load</span>
        </div>

        {/* Available Bays */}
        <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-emerald-900 block">Available Bays</span>
          <p className="text-2xl font-black text-emerald-950">{metrics.available_slots}</p>
          <span className="text-[10px] text-emerald-800 font-medium">Unreserved out of {lot.total_slots || 0}</span>
        </div>

        {/* Expected Revenue */}
        <div className="p-5 rounded-2xl bg-slate-900 text-white shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-300 block">Expected Revenue</span>
          <p className="text-2xl font-black text-[#FFD21F]">₹{metrics.expected_revenue.toLocaleString()}</p>
          <span className="text-[10px] text-slate-400 font-medium">Peak window: {metrics.peak_hours}</span>
        </div>

      </div>

      {/* Hourly Density Schedule Table */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-base text-[#171717]">Hourly Density Breakdown ({selectedDate})</h3>
          <span className="text-xs font-bold text-slate-500">
            {lot.name || 'Facility'} • {lot.total_slots || 0} Registered Slots
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-4 border-[#FFD21F] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-500">Fetching live database metrics for {selectedDate}...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {hourlyDensity.map((item, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center">
                    <Clock className="w-4 h-4 text-[#FFD21F]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#171717]">{item.hour}</h4>
                    <span className="text-xs text-slate-500">{item.bookings} Bookings Expected</span>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs">
                  <div className="w-36 space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-700">
                      <span>Occupancy</span>
                      <span>{item.occupancy}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.occupancy > 85 ? 'bg-rose-500' : item.occupancy > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${item.occupancy}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-right min-w-24">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Revenue</span>
                    <span className="font-extrabold text-sm text-[#171717]">₹{item.revenue}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
