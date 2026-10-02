import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Navigation, Clock } from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatTime } from '../utils/formatters';

export default function BookingConfirmation() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await api.get(`/bookings/${id}`);
        setBooking(res.data);
      } catch (err) {
        console.warn('Error loading confirmation booking:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto p-12 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-amber-400 border-t-transparent animate-spin mx-auto" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-md mx-auto p-8 text-center text-slate-500">
        Booking confirmation not found.
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-12 animate-in zoom-in-95 duration-300">
      
      {/* Success Hero Card */}
      <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-4 shadow-md">
        <div className="w-20 h-20 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-10 h-10 animate-bounce" />
        </div>

        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-700">Reservation Success</span>
          <h1 className="text-3xl font-extrabold text-[#171717] mt-1">Booking Confirmed</h1>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Slot <span className="font-extrabold text-blue-700">{booking.slot_number}</span> is reserved for your vehicle.
          </p>
        </div>

        {/* Details Card */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-3 text-xs font-medium">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="text-slate-500">Parking Lot:</span>
            <span className="font-extrabold text-[#171717] text-sm">{booking.parking_lot_name}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500">Area:</span>
            <span className="font-bold text-slate-800">{booking.area_name}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500">Parking Slot:</span>
            <span className="font-mono font-bold text-blue-700 text-sm">{booking.slot_number}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500">Start Time:</span>
            <span className="font-bold text-slate-800">{formatTime(booking.start_time)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500">Paid End Time:</span>
            <span className="font-bold text-slate-800">{formatTime(booking.paid_end_time)}</span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-200">
            <span className="text-slate-500">Booking ID:</span>
            <span className="font-mono text-blue-700 font-extrabold">{booking.booking_id}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500">Total Paid:</span>
            <span className="font-extrabold text-emerald-700 text-sm">{formatCurrency(booking.amount)}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={() => navigate(`/view-booking/${booking.id}`)}
            className="w-full py-3.5 rounded-xl bg-[#FFD21F] hover:bg-[#E5B800] text-[#171717] font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
          >
            <Clock className="w-4 h-4" />
            View Booking
          </button>

          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${booking.latitude},${booking.longitude}`}
            target="_blank"
            rel="noreferrer"
            className="w-full py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200 transition-all"
          >
            <Navigation className="w-4 h-4 text-blue-600" />
            Get Directions
          </a>
        </div>
      </div>
    </div>
  );
}
