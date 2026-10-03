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

  const [isEarlyExitModalOpen, setIsEarlyExitModalOpen] = useState(false);
  const [earlyExitPreview, setEarlyExitPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [processingExit, setProcessingExit] = useState(false);
  const [selectedRefundOption, setSelectedRefundOption] = useState('WALLET'); // 'WALLET' or 'ORIGINAL_PAYMENT'

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

  const handleOpenEarlyExit = async () => {
    setIsEarlyExitModalOpen(true);
    setLoadingPreview(true);
    try {
      const res = await api.get(`/bookings/${id}/early-exit/preview`);
      setEarlyExitPreview(res.data);
    } catch (err) {
      console.error('Error fetching early exit preview:', err);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleConfirmEarlyExit = async () => {
    setProcessingExit(true);
    try {
      const res = await api.post(`/bookings/${id}/early-exit`, { refund_option: selectedRefundOption });
      addNotification({
        title: '✓ EARLY EXIT CONFIRMED',
        message: res.data.message || `Refund of ${formatCurrency(res.data.refund_amount)} processed. Reference: ${res.data.refund_reference}`,
        type: 'success',
        duration: 9000
      });
      setIsEarlyExitModalOpen(false);
      await fetchActiveBooking();
      loadBooking();
    } catch (err) {
      addNotification({
        title: 'Early Exit Error',
        message: err.response?.data?.detail || 'Failed to process early exit.',
        type: 'error'
      });
    } finally {
      setProcessingExit(false);
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

      {/* Early Exit Refund Receipt Banner (Feature 6) */}
      {['EARLY_EXIT', 'CANCELLED'].includes(booking.status) && (
        <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-300 text-slate-900 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-emerald-950 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              EARLY EXIT SESSION CLOSED
            </h3>
            <span className="px-3 py-1 rounded-full bg-emerald-200 text-emerald-900 font-extrabold text-xs">
              {booking.refund_status || "REFUNDED"}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-emerald-200 space-y-1.5 text-xs font-medium">
            <div className="flex justify-between">
              <span className="text-slate-500">Unused Parking Amount:</span>
              <span className="font-bold text-slate-900">{formatCurrency(booking.unused_amount || 0)}</span>
            </div>
            <div className="flex justify-between text-rose-700">
              <span>Cancellation Fee (30%):</span>
              <span className="font-bold">-{formatCurrency(booking.cancellation_fee || 0)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-100 font-black text-sm text-emerald-700">
              <span>Partial Refund Issued:</span>
              <span>{formatCurrency(booking.refund_amount || 0)}</span>
            </div>
            {booking.refund_id && (
              <div className="pt-2 text-[10px] text-slate-500 font-mono flex justify-between">
                <span>Refund Ref:</span>
                <span className="font-bold">{booking.refund_id}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Check-In Vehicle Entry Simulation Card */}
      {isBookingActive && !booking.assigned_position_name && (
        <div className="p-6 rounded-3xl bg-amber-50 border border-amber-300 text-slate-800 shadow-md space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#FFD21F] text-[#171717] font-bold text-lg">
              🚗
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Vehicle Arrival Verification</h3>
              <p className="text-xs text-slate-600 font-medium">Your physical parking position will be assigned upon lot entry.</p>
            </div>
          </div>
          <button
            onClick={async () => {
              try {
                const res = await api.post(`/bookings/${id}/check-in`);
                addNotification({
                  title: 'Position Assigned!',
                  message: res.data.message || `Assigned to ${res.data.assigned_position_name}`,
                  type: 'success'
                });
                loadBooking();
              } catch (err) {
                addNotification({
                  title: 'Check-In Error',
                  message: err.response?.data?.detail || 'Failed to assign position.',
                  type: 'error'
                });
              }
            }}
            className="w-full py-3.5 rounded-xl bg-[#171717] hover:bg-slate-800 text-[#FFD21F] font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98"
          >
            Simulate Vehicle Entry & Assign Physical Position
          </button>
        </div>
      )}

      {/* 15-MINUTE WARNING EXPIRATION BANNER (Feature 2) */}
      {(showExpiringWarning || booking.overstay_status === "WARNING_15MIN" || booking.overstay_status === "GRACE_PERIOD") && isBookingActive && (
        <div className="p-6 rounded-3xl bg-amber-50 border border-amber-300 text-amber-950 shadow-md space-y-4 animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <AlertTriangle className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-amber-950">⏰ PARKING SESSION ENDS IN 15 MINUTES</h3>
              <p className="text-xs text-amber-900 mt-0.5 leading-relaxed font-medium">
                Your parking session is expiring soon. Extend now to continue your session normally and avoid overstay alerts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => setIsExtendModalOpen(true)}
              className="flex-1 py-3 rounded-xl bg-[#FFD21F] hover:bg-[#E5B800] text-[#171717] font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95"
            >
              Extend Session (+1 Hour)
            </button>
            <button
              onClick={() => setShowExpiringWarning(false)}
              className="py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition-colors"
            >
              Dismiss
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
            <span className="text-xs text-slate-500 font-medium block">Physical Bay</span>
            <span className="text-xl font-extrabold text-blue-700">{booking.slot_number}</span>
          </div>
        </div>

        {/* Vehicle & Payment Metadata */}
        <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-amber-50/50 border border-amber-200 text-xs font-medium">
          <div>
            <span className="text-slate-500 block">Vehicle VRN</span>
            <span className="font-extrabold text-slate-900 uppercase tracking-wider">{booking.vehicle_number || "TN-09-SP-2026"}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Payment Method</span>
            <span className="font-extrabold text-emerald-700">{booking.payment_method || "RAZORPAY"}</span>
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
            <span className="text-slate-500 block">Grace Period End</span>
            <span className="font-bold text-emerald-700">{formatTime(booking.grace_end_time || booking.buffer_end_time)}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Session Status</span>
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
              onClick={handleOpenEarlyExit}
              className="w-full py-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <XCircle className="w-4 h-4 text-emerald-700" />
              End Parking Early
            </button>
          )}
        </div>
      </div>

      {/* EARLY EXIT / PARTIAL REFUND MODAL (Feature 6) */}
      {isEarlyExitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-lg text-[#171717]">END PARKING EARLY?</h3>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold uppercase">
                Partial Refund
              </span>
            </div>

            {loadingPreview ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-8 h-8 rounded-full border-4 border-amber-400 border-t-transparent animate-spin mx-auto" />
                <p className="text-xs text-slate-500 font-bold">Calculating server refund options...</p>
              </div>
            ) : earlyExitPreview ? (
              <div className="space-y-4">
                
                {/* Unused Time Summary */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs font-medium">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Booked until: {earlyExitPreview.booked_until}</span>
                    <span className="font-bold text-blue-700">Remaining: {earlyExitPreview.unused_hours} hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Unused parking amount:</span>
                    <span className="font-extrabold text-slate-900">{formatCurrency(earlyExitPreview.unused_amount)}</span>
                  </div>
                </div>

                {/* Refund Method Selector Title */}
                <span className="text-xs font-extrabold text-slate-800 block">Select Refund Method:</span>

                {/* OPTION 2: FULL WALLET REFUND (RECOMMENDED) */}
                <button
                  type="button"
                  onClick={() => setSelectedRefundOption('WALLET')}
                  className={`w-full p-4 rounded-2xl border text-left transition-all flex items-start gap-3 relative ${
                    selectedRefundOption === 'WALLET'
                      ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="absolute top-2.5 right-3 px-2 py-0.5 rounded-md bg-emerald-600 text-white font-black text-[9px] uppercase tracking-wider">
                    Recommended • 0% Fee
                  </span>
                  <div className={`p-2.5 rounded-xl shrink-0 ${selectedRefundOption === 'WALLET' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    💳
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-xs text-slate-900">Option 2: Full Wallet Refund (100% Refund)</h4>
                    <p className="text-[11px] text-slate-600 font-medium">
                      Zero cancellation fee! Get full <strong>{formatCurrency(earlyExitPreview.wallet_refund_amount || earlyExitPreview.unused_amount)}</strong> credited to your PARK-A-LOT Wallet.
                    </p>
                    <div className="text-[10px] text-emerald-800 font-bold flex items-center gap-1 pt-0.5">
                      <span>✓ 0% Cancellation Fee</span>
                      <span>• Instant Wallet Credit</span>
                    </div>
                  </div>
                </button>

                {/* OPTION 1: CASH / ORIGINAL PAYMENT REFUND */}
                <button
                  type="button"
                  onClick={() => setSelectedRefundOption('ORIGINAL_PAYMENT')}
                  className={`w-full p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                    selectedRefundOption === 'ORIGINAL_PAYMENT'
                      ? 'bg-amber-50/90 border-amber-500 ring-2 ring-amber-500/20 shadow-sm'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl shrink-0 ${selectedRefundOption === 'ORIGINAL_PAYMENT' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    💵
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-xs text-slate-900">Option 1: Cash / Original Payment Refund</h4>
                    <p className="text-[11px] text-slate-600 font-medium">
                      Standard refund with 30% cancellation fee ({formatCurrency(earlyExitPreview.cash_cancellation_fee || earlyExitPreview.cancellation_fee)}).
                    </p>
                    <div className="text-[10px] text-slate-700 font-extrabold pt-0.5">
                      Refund Amount: <strong className="text-amber-900">{formatCurrency(earlyExitPreview.cash_refund_amount || earlyExitPreview.refund_amount)}</strong> (30% fee applies)
                    </div>
                  </div>
                </button>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    disabled={processingExit}
                    onClick={handleConfirmEarlyExit}
                    className="w-full py-3.5 rounded-xl bg-[#171717] hover:bg-slate-800 text-[#FFD21F] font-extrabold text-xs shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {processingExit ? 'Processing Refund...' : `Confirm Early Exit (${selectedRefundOption === 'WALLET' ? 'Full Wallet Refund' : 'Cash Refund'})`}
                  </button>
                  <button
                    disabled={processingExit}
                    onClick={() => setIsEarlyExitModalOpen(false)}
                    className="w-full py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 transition-colors"
                  >
                    Continue Parking
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-rose-600 font-medium">Failed to calculate early exit breakdown.</p>
            )}
          </div>
        </div>
      )}

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
