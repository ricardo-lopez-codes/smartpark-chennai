import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, ArrowLeft, MapPin } from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatDate, formatTime } from '../utils/formatters';

export default function PastBookings() {
  const [bookings, setBookings] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const res = await api.get('/bookings', {
          params: { status: filterStatus }
        });
        setBookings(res.data);
      } catch (err) {
        console.warn('Error loading booking history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [filterStatus]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'UPCOMING':
        return <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold">UPCOMING</span>;
      case 'ACTIVE':
        return <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-extrabold">ACTIVE</span>;
      case 'COMPLETED':
        return <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-300 text-[10px] font-extrabold">COMPLETED</span>;
      case 'EXTENDED':
        return <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-300 text-[10px] font-extrabold">EXTENDED</span>;
      case 'CANCELLED':
        return <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-extrabold">CANCELLED</span>;
      case 'EXPIRED':
      default:
        return <span className="px-3 py-1 rounded-full bg-slate-200 text-slate-700 border border-slate-300 text-[10px] font-extrabold">EXPIRED</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-[#171717]">Bookings History</h1>
          <p className="text-xs text-slate-500 font-medium">Your upcoming, active, and past parking reservations</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white border border-slate-200 text-xs overflow-x-auto shadow-xs">
        {['ALL', 'UPCOMING', 'ACTIVE', 'COMPLETED', 'EXTENDED', 'CANCELLED', 'EXPIRED'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterStatus(tab)}
            className={`px-4 py-2 rounded-xl font-extrabold uppercase tracking-wider transition-all ${
              filterStatus === tab
                ? 'bg-[#FFD21F] text-[#171717] shadow-xs'
                : 'text-slate-600 hover:text-[#171717] hover:bg-slate-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 rounded-3xl bg-slate-200 animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 text-slate-500 space-y-3 shadow-xs">
          <History className="w-10 h-10 mx-auto text-slate-400" />
          <p className="text-sm font-bold">No bookings found for filter '{filterStatus}'</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div
              key={b.id}
              onClick={() => navigate(`/view-booking/${b.id}`)}
              className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-[#FFD21F] cursor-pointer transition-all duration-200 space-y-3 shadow-xs hover:shadow-md"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 border border-amber-200 flex items-center justify-center font-extrabold text-lg">
                    🅿️
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[#171717] text-base">{b.parking_lot_name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                      <MapPin className="w-3 h-3 text-blue-600" />
                      {b.area_name}
                    </p>
                  </div>
                </div>
                {getStatusBadge(b.status)}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-medium">
                <div>
                  <span className="text-slate-500 block">Date</span>
                  <span className="font-bold text-slate-800">{b.booking_date || formatDate(b.created_at)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Time Slot</span>
                  <span className="font-bold text-slate-800">{formatTime(b.start_time)} - {formatTime(b.paid_end_time)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Booking ID</span>
                  <span className="font-mono text-blue-700 font-bold">{b.booking_id}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Amount Paid</span>
                  <span className="font-extrabold text-emerald-700">{formatCurrency(b.amount)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
