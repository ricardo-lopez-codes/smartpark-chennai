import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CreditCard, ArrowLeft, MapPin, Lock, Calendar, Clock } from 'lucide-react';
import api from '../services/api';
import { useBooking } from '../context/BookingContext';
import { useNotification } from '../context/NotificationContext';
import RazorpayModal from '../components/RazorpayModal';
import { formatCurrency } from '../utils/formatters';

export default function PaymentConfirm() {
  const [searchParams] = useSearchParams();
  const lotId = searchParams.get('lot_id');
  const slotId = searchParams.get('slot_id');
  const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const timeStr = searchParams.get('time') || '10:00';
  const duration = parseInt(searchParams.get('duration') || '2', 10);

  const [lot, setLot] = useState(null);
  const [slot, setSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('FASTAG'); // 'FASTAG' or 'RAZORPAY'
  const [vehicleNumber, setVehicleNumber] = useState('TN-09-SP-2026');
  const [isRazorpayOpen, setIsRazorpayOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { fetchActiveBooking } = useBooking();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const lotRes = await api.get(`/parking-lots/${lotId}`);
        setLot(lotRes.data);
        if (slotId && slotId !== 'null' && slotId !== 'undefined') {
          const slotRes = await api.get(`/slots/${slotId}`);
          setSlot(slotRes.data);
        }
      } catch (err) {
        console.warn('Error fetching payment confirmation details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [lotId, slotId]);

  const parkingFee = lot ? lot.price_per_hour * duration : 0;
  const serviceFee = 10;
  const totalAmount = parkingFee + serviceFee;

  // Format 12-hour time
  const format12Hour = (tStr) => {
    if (!tStr) return '';
    const [h, m] = tStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH}:${m < 10 ? '0' + m : m} ${ampm}`;
  };

  const handleFastagPayment = async () => {
    setSubmitting(true);
    try {
      // 1. Create backend booking
      const bookingRes = await api.post('/bookings', {
        parking_lot_id: parseInt(lotId, 10),
        slot_id: (slotId && slotId !== 'null') ? parseInt(slotId, 10) : null,
        booking_date: dateStr,
        start_time_str: timeStr,
        duration_hours: duration,
        vehicle_number: vehicleNumber.toUpperCase().trim(),
        payment_method: 'FASTAG'
      });

      const newBooking = bookingRes.data;

      // 2. Process FASTag deduction via NETC Sandbox service
      const fastagRes = await api.post('/payments/fastag/pay', null, {
        params: {
          booking_id: newBooking.id,
          amount: totalAmount,
          vehicle_number: vehicleNumber.toUpperCase().trim()
        }
      });

      await fetchActiveBooking();

      addNotification({
        title: 'FASTag Payment Successful',
        message: fastagRes.data.message || `₹${totalAmount} debited via NETC FASTag. Position will be assigned on arrival.`,
        type: 'success'
      });

      navigate(`/booking-confirmation/${newBooking.id}`);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'FASTag payment failed.';
      addNotification({
        title: 'FASTag Error',
        message: errorMsg,
        type: 'error',
        duration: 7000
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentOutcome = async (success) => {
    setIsRazorpayOpen(false);
    
    if (!success) {
      addNotification({
        title: 'Payment Failed',
        message: 'Payment was cancelled or failed. Booking was not created.',
        type: 'error'
      });
      return;
    }

    setSubmitting(true);
    try {
      const bookingRes = await api.post('/bookings', {
        parking_lot_id: parseInt(lotId, 10),
        slot_id: (slotId && slotId !== 'null') ? parseInt(slotId, 10) : null,
        booking_date: dateStr,
        start_time_str: timeStr,
        duration_hours: duration,
        vehicle_number: vehicleNumber.toUpperCase().trim(),
        payment_method: 'RAZORPAY'
      });

      const newBooking = bookingRes.data;

      const payOrderRes = await api.post('/payments/create', {
        booking_id: newBooking.id,
        amount: totalAmount
      });

      await api.post('/payments/verify', {
        razorpay_order_id: payOrderRes.data.order_id,
        razorpay_payment_id: `pay_mock_${Date.now()}`,
        simulate_success: true
      });

      await fetchActiveBooking();

      addNotification({
        title: 'Booking Confirmed',
        message: `Successfully reserved parking capacity for ${dateStr} at ${format12Hour(timeStr)}!`,
        type: 'success'
      });

      navigate(`/booking-confirmation/${newBooking.id}`);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to complete booking reservation.';
      addNotification({
        title: 'Booking Conflict',
        message: errorMsg,
        type: 'error',
        duration: 7000
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-[#171717]">Confirm Booking</h1>
          <p className="text-xs text-slate-500 font-medium">Review reservation details & select payment method</p>
        </div>
      </div>

      {loading ? (
        <div className="h-64 rounded-3xl bg-slate-200 animate-pulse border border-slate-200" />
      ) : (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md space-y-6">
          
          {/* Summary Details */}
          <div className="space-y-4 pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-[#171717]">{lot?.name}</h2>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  {lot?.address}
                </p>
              </div>
              <div className="px-4 py-2 rounded-2xl bg-amber-100 border border-amber-300 text-[#171717] font-extrabold text-xs">
                {slot ? `Slot ${slot.slot_number}` : 'Assigned on Arrival'}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium">
              <div>
                <span className="text-slate-500 block">Date</span>
                <span className="font-extrabold text-slate-900">{dateStr}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Start Time</span>
                <span className="font-extrabold text-slate-900">{format12Hour(timeStr)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Duration</span>
                <span className="font-extrabold text-slate-900">{duration} Hours</span>
              </div>
              <div>
                <span className="text-slate-500 block">Protected Buffer</span>
                <span className="font-bold text-emerald-700">2 Spaces</span>
              </div>
            </div>
          </div>

          {/* Vehicle Registration Number Input */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
              Vehicle Registration Number (VRN)
            </label>
            <input
              type="text"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
              placeholder="e.g. TN-09-SP-2026"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 font-extrabold text-slate-900 tracking-wider text-sm focus:ring-2 focus:ring-[#FFD21F] focus:border-transparent outline-none uppercase"
            />
          </div>

          {/* Feature 1: PAYMENT METHOD SELECTOR (FASTag vs Razorpay) */}
          <div className="space-y-3">
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
              Select Payment Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('FASTAG')}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  paymentMethod === 'FASTAG'
                    ? 'border-[#171717] bg-amber-50/80 ring-2 ring-[#FFD21F]'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-extrabold text-slate-900 text-sm">FASTag</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">NETC</span>
                </div>
                <span className="text-[11px] text-slate-500 mt-2 font-medium">Automatic toll lane RFID deduction</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('RAZORPAY')}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  paymentMethod === 'RAZORPAY'
                    ? 'border-[#171717] bg-amber-50/80 ring-2 ring-[#FFD21F]'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-extrabold text-slate-900 text-sm">Razorpay</span>
                  <CreditCard className="w-4 h-4 text-slate-700" />
                </div>
                <span className="text-[11px] text-slate-500 mt-2 font-medium">UPI, Net Banking, Cards & Wallets</span>
              </button>
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="space-y-2.5 text-xs text-slate-600 font-medium">
            <h3 className="font-extrabold text-slate-400 uppercase tracking-wider text-[10px]">Payment Summary</h3>
            <div className="flex justify-between">
              <span className="text-slate-500">Parking Fee ({duration} hrs @ {formatCurrency(lot?.price_per_hour)}/hr):</span>
              <span className="font-bold text-slate-900">{formatCurrency(parkingFee)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Service Fee:</span>
              <span className="font-bold text-slate-900">{formatCurrency(serviceFee)}</span>
            </div>

            <div className="flex justify-between pt-3 border-t border-slate-200 text-base font-extrabold text-[#171717]">
              <span>Total Payable Amount:</span>
              <span className="text-emerald-700">{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          {/* Security badge */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 font-medium">
            <Lock className="w-4 h-4 text-slate-700 flex-shrink-0" />
            <span>
              {paymentMethod === 'FASTAG'
                ? 'NETC FASTag Encrypted Sandbox Gateway'
                : 'Encrypted Razorpay Checkout Structure • Demo Mode Active'}
            </span>
          </div>

          {/* PAY BUTTON */}
          {paymentMethod === 'FASTAG' ? (
            <button
              disabled={submitting}
              onClick={handleFastagPayment}
              className="w-full py-4 rounded-2xl bg-[#FFD21F] hover:bg-[#E5B800] text-[#171717] font-extrabold text-base shadow-md flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
            >
              <CreditCard className="w-5 h-5" />
              {submitting ? 'Debiting FASTag...' : `Pay ${formatCurrency(totalAmount)} via FASTag`}
            </button>
          ) : (
            <button
              disabled={submitting}
              onClick={() => setIsRazorpayOpen(true)}
              className="w-full py-4 rounded-2xl bg-[#FFD21F] hover:bg-[#E5B800] text-[#171717] font-extrabold text-base shadow-md flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
            >
              <CreditCard className="w-5 h-5" />
              {submitting ? 'Creating Booking...' : `Pay ${formatCurrency(totalAmount)} via Razorpay`}
            </button>
          )}
        </div>
      )}

      {/* Razorpay Demo Payment Modal */}
      <RazorpayModal
        isOpen={isRazorpayOpen}
        onClose={() => setIsRazorpayOpen(false)}
        lot={lot}
        slot={slot}
        duration={duration}
        totalAmount={totalAmount}
        onPaymentComplete={handlePaymentOutcome}
      />
    </div>
  );
}
