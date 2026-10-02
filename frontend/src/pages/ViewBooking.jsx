import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Navigation, AlertTriangle, XCircle, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import CountdownTimer from '../components/CountdownTimer';
import RazorpayModal from '../components/RazorpayModal';
import { useBooking } from '../context/BookingContext';
import { useNotification } from '../context/NotificationContext';
import { formatCurrency, formatTime } from '../utils/formatters';

export default function ViewBooking() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [showExpiringWarning, setShowExpiringWarning] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const { fetchActiveBooking } = useBooking();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  const loadBooking = useCallback(async () => {
    try {
      const res = await api.get(`/bookings/${id}`);
      setBooking(res.data);
    } catch (err) {
      console.warn('Error loading booking:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBooking();
    const timer = setInterval(loadBooking, 10000);
    return () => clearInterval(timer);
  }, [loadBooking]);

  const handleExpiringWarning = (secondsLeft) => {
    if (!showExpiringWarning) {
      setShowExpiringWarning(true);
      addNotification({
        title: '⏰ PARKING EXPIRING SOON',
        message: 'You have less than 15 minutes remaining. Would you like to extend your parking?',
        type: 'warning',
        duration: 8000
      });
    }
  };

  const handleExpired = () => {
    addNotification({
      title: 'PARKING SESSION ENDED',
      message: 'Your booking has expired. Slot vacancy is being verified by IoT sensors.',
      type: 'error'
    });
    loadBooking();
  };

  const handleConfirmCancel = async () => {
    setCancelling(true);
    try {
      const res = await api.post(`/bookings/${id}/cancel`);
      addNotification({
        title: 'Booking Cancelled',
        message: `Refund of ${formatCurrency(res.data.refund_amount)} processed.`,
        type: 'info'
      });
      setIsCancelModalOpen(false);
      await fetchActiveBooking();
      loadBooking();
    } catch (err) {
      addNotification({
        title: 'Cancellation Error',
        message: err.response?.data?.detail || 'Failed to cancel booking.',
        type: 'error'
      });
    } finally {
      setCancelling(false);
    }
  };

  const handlePaymentOutcome = async (success) => {
    setIsExtendModalOpen(false);
    if (!success) {
      addNotification({
        title: 'Extension Payment Failed',
        message: 'Payment simulation failed. Parking was not extended.',
        type: 'error'
      });
      return;
    }

    try {
      await api.post(`/bookings/${id}/extend`, { additional_hours: 1 });
      addNotification({
        title: '✓ PARKING EXTENDED',
        message: 'Parking extended by +1 hour successfully!',
        type: 'success'
      });
      setShowExpiringWarning(false);
      await fetchActiveBooking();
      loadBooking();
    } catch (err) {
      addNotification({
        title: 'Extension Error',
        message: err.response?.data?.detail || 'Failed to extend parking.',
        type: 'error'
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto p-12 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-amber-400 border-t-transparent animate-spin mx-auto" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center text-slate-500">
        Booking record not found.
      </div>
    );
  }

  const isBookingActive = ['UPCOMING', 'ACTIVE', 'EXTENDED'].includes(booking.status);
  const cancellationFee = 40;
  const estimatedRefund = Math.max(0, booking.amount - cancellationFee);

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-[#171717]">View Booking</h1>
          <p className="text-xs text-slate-500 font-medium">ID: {booking.booking_id}</p>
        </div>
      </div>

      {/* Countdown Timer Widget */}
      {isBookingActive && (
        <CountdownTimer
          startTime={booking.start_time}
          paidEndTime={booking.paid_end_time}
          status={booking.status}
          onExpiringWarning={handleExpiringWarning}
          onExpired={handleExpired}
        />
      )}

      {/* 15-MINUTE WARNING EXPIRATION BANNER */}
      {showExpiringWarning && isBookingActive && (
        <div className="p-6 rounded-3xl bg-amber-50 border border-amber-300 text-amber-950 shadow-md space-y-4 animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <AlertTriangle className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-amber-950">⏰ PARKING EXPIRING SOON</h3>
              <p className="text-xs text-amber-900 mt-0.5 leading-relaxed font-medium">
                You have 15 minutes remaining. Would you like to extend your parking using your protected 1-hour buffer?
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => setIsExtendModalOpen(true)}
              className="flex-1 py-3 rounded-xl bg-[#FFD21F] hover:bg-[#E5B800] text-[#171717] font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95"
            >
              Extend 1 Hour
            </button>
            <button
              onClick={() => setShowExpiringWarning(false)}
              className="py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition-colors"
            >
              No, I'm Leaving
            </button>
          </div>
        </div>
      )}

      {/* Booking Details Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md space-y-6">
        
        {/* Slot & Location Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Parking Location</span>
            <h2 className="text-xl font-extrabold text-[#171717]">{booking.parking_lot_name}</h2>
            <p className="text-xs text-slate-500 font-medium">{booking.area_name} • {booking.parking_address}</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 font-medium block">Reserved Bay</span>
            <span className="text-2xl font-extrabold text-blue-700">{booking.slot_number}</span>
          </div>
        </div>

        {/* Timings */}
        <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium">
          <div>
            <span className="text-slate-500 block">Start Time</span>
            <span className="font-bold text-slate-900">{formatTime(booking.start_time)}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Paid End Time</span>
            <span className="font-bold text-slate-900">{formatTime(booking.paid_end_time)}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Extension Buffer</span>
            <span className="font-bold text-emerald-700">{formatTime(booking.buffer_end_time)}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Status</span>
            <span className="font-extrabold text-blue-700">{booking.status}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${booking.latitude},${booking.longitude}`}
            target="_blank"
            rel="noreferrer"
            className="w-full py-3.5 rounded-xl bg-[#FFD21F] hover:bg-[#E5B800] text-[#171717] font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
          >
            <Navigation className="w-4 h-4" />
            Open Directions
          </a>

          {isBookingActive && (
            <button
              onClick={() => setIsExtendModalOpen(true)}
              className="w-full py-3.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Clock className="w-4 h-4 text-amber-700" />
              Extend 1 Hour
            </button>
          )}

          {isBookingActive && (
            <button
              onClick={() => setIsCancelModalOpen(true)}
              className="w-full py-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <XCircle className="w-4 h-4" />
              Cancel Booking
            </button>
          )}
        </div>
      </div>

      {/* CANCELLATION MODAL */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-5">
            <h3 className="font-extrabold text-lg text-[#171717]">Cancel Booking?</h3>
            <p className="text-xs text-slate-500 font-medium">
              Are you sure you want to cancel your parking reservation for slot {booking.slot_number}?
            </p>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-700 font-medium">
              <div className="flex justify-between">
                <span className="text-slate-500">Original Paid Amount:</span>
                <span className="font-bold text-slate-900">{formatCurrency(booking.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cancellation Fee (1 hr fee):</span>
                <span className="font-bold text-rose-700">-{formatCurrency(cancellationFee)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 font-extrabold text-[#171717]">
                <span>Estimated Refund:</span>
                <span className="text-emerald-700">{formatCurrency(estimatedRefund)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                disabled={cancelling}
                onClick={handleConfirmCancel}
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-xs transition-all disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Booking'}
              </button>
              <button
                disabled={cancelling}
                onClick={() => setIsCancelModalOpen(false)}
                className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 transition-colors"
              >
                Keep Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXTENSION PAY MODAL */}
      <RazorpayModal
        isOpen={isExtendModalOpen}
        onClose={() => setIsExtendModalOpen(false)}
        lot={{ name: booking.parking_lot_name }}
        slot={{ slot_number: booking.slot_number }}
        duration={1}
        totalAmount={40}
        onPaymentComplete={handlePaymentOutcome}
      />
    </div>
  );
}
