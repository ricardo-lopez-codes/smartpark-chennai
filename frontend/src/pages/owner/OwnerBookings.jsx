import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Search,
  Filter,
  User,
  Clock,
  Car,
  IndianRupee,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock3,
  X
} from 'lucide-react';
import api from '../../services/api';

export default function OwnerBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/owner/bookings', {
        params: {
          status: statusFilter,
          date: dateFilter.toLowerCase(),
          search: search || undefined
        }
      });
      setBookings(res.data);
    } catch (err) {
      console.error('Failed to fetch owner bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [dateFilter, statusFilter, search]);

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
      case 'EXTENDED':
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold flex items-center gap-1 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>
        );
      case 'UPCOMING':
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-extrabold flex items-center gap-1 w-fit">
            <Clock3 className="w-3 h-3 text-amber-700" />
            Upcoming
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 text-[11px] font-extrabold flex items-center gap-1 w-fit">
            <CheckCircle className="w-3 h-3 text-blue-700" />
            Completed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-extrabold flex items-center gap-1 w-fit">
            <XCircle className="w-3 h-3 text-rose-700" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-extrabold w-fit">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Search / Filters */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-[#171717]">Bookings Management</h2>
            <p className="text-xs text-slate-500">Monitor live civilian reservations for your parking facility</p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID, customer, slot..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-[#171717] focus:outline-none focus:border-[#FFD21F]"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs">
          
          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500">Date:</span>
            <div className="flex items-center gap-1">
              {['ALL', 'TODAY', 'TOMORROW', 'WEEK'].map(d => (
                <button
                  key={d}
                  onClick={() => setDateFilter(d)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    dateFilter === d
                      ? 'bg-[#171717] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500">Status:</span>
            <div className="flex items-center gap-1">
              {['ALL', 'UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    statusFilter === s
                      ? 'bg-[#FFD21F] text-[#171717]'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Bookings Table */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden space-y-4">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-4 border-[#FFD21F] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-500">Loading bookings list...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <CalendarCheck className="w-12 h-12 mx-auto stroke-1 text-slate-300" />
            <p className="text-sm font-bold text-slate-600">No bookings match the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px] bg-slate-50/50">
                  <th className="py-3 px-4">Booking ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Slot</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Schedule</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#171717]">{b.booking_id}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#171717]">{b.customer_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{b.vehicle_number}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#171717]">{b.slot_number}</td>
                    <td className="py-3.5 px-4 text-slate-600">{b.booking_date}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {b.start_time} – {b.end_time}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">₹{b.amount}</td>
                    <td className="py-3.5 px-4">{getStatusBadge(b.status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedBooking(b)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#FFD21F] text-[#171717] font-extrabold text-[11px] transition-all"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Booking Receipt</span>
                <h3 className="font-mono font-black text-lg text-[#171717]">{selectedBooking.booking_id}</h3>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Customer Name</span>
                  <span className="font-bold text-[#171717]">{selectedBooking.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Vehicle Number</span>
                  <span className="font-mono font-bold text-[#171717]">{selectedBooking.vehicle_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Reserved Slot</span>
                  <span className="font-bold text-[#171717]">{selectedBooking.slot_number}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Booking Date</span>
                  <span className="font-bold text-[#171717]">{selectedBooking.booking_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Time Window</span>
                  <span className="font-bold text-[#171717]">{selectedBooking.start_time} – {selectedBooking.end_time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Duration</span>
                  <span className="font-bold text-[#171717]">{selectedBooking.duration_hours} Hours</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-emerald-800 font-bold uppercase block">Total Amount Paid</span>
                  <span className="text-xl font-black text-emerald-950">₹{selectedBooking.amount}</span>
                </div>
                {getStatusBadge(selectedBooking.status)}
              </div>
            </div>

            <button
              onClick={() => setSelectedBooking(null)}
              className="w-full py-3 rounded-xl bg-slate-900 text-white font-extrabold text-xs hover:bg-slate-800 transition-all"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
