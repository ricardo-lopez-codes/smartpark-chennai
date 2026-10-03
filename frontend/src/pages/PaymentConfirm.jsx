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
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('FASTAG'); // 'FASTAG', 'RAZORPAY', or 'WALLET'
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
        const userRes = await api.get('/auth/me');
        setUserData(userRes.data);
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
  const earnedCredits = duration * 10;

  // Format 12-hour time
  const format12Hour = (tStr) => {
    if (!tStr) return '';
    const [h, m] = tStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH}:${m < 10 ? '0' + m : m} ${ampm}`;
  };

  const handleWalletPayment = async () => {
    if ((userData?.wallet_balance || 0) < totalAmount) {
      addNotification({
        title: 'Insufficient Wallet Balance',
        message: `Your wallet balance is ${formatCurrency(userData?.wallet_balance || 0)}. Total payable is ${formatCurrency(totalAmount)}. Please select FASTag or Razorpay.`,
        type: 'error',
        duration: 7000
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
        payment_method: 'WALLET'
      });

      const newBooking = bookingRes.data;
      await fetchActiveBooking();

      addNotification({
        title: '✓ Paid via Wallet',
        message: `₹${totalAmount} paid from Wallet. ${earnedCredits} reward credits added to your wallet!`,
        type: 'success',
        duration: 8000
      });

      navigate(`/booking-confirmation/${newBooking.id}`);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Wallet payment failed.';
      addNotification({
        title: 'Wallet Payment Error',
        message: errorMsg,
        type: 'error',
        duration: 7000
      });
    } finally {
      setSubmitting(false);
    }
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
        message: fastagRes.data.message || `₹${totalAmount} debited via NETC FASTag. Position will be assigned on arrival. ${earnedCredits} reward credits added!`,
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

          {/* Reward Credits Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-300 text-emerald-950 flex items-center justify-between text-xs font-extrabold shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-base">🎁</span>
              <div>
                <span>Reward Credits: Earn +{earnedCredits} Credits!</span>
                <p className="text-[10px] text-emerald-800 font-medium">1 Hour = 10 Credits (₹10 value credited to your wallet)</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-black uppercase">
              +{earnedCredits} Credits
            </span>
          </div>

          {/* PAYMENT METHOD SELECTOR (FASTag, Razorpay, PARK-A-LOT Wallet) */}
          <div className="space-y-3">
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
              Select Payment Method
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* FASTag */}
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
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">NETC</span>
                </div>
                <span className="text-[11px] text-slate-500 mt-2 font-medium">RFID lane deduction</span>
              </button>

              {/* Razorpay */}
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
                <span className="text-[11px] text-slate-500 mt-2 font-medium">UPI & Cards</span>
              </button>

              {/* PARK-A-LOT Wallet */}
              <button
                type="button"
                onClick={() => setPaymentMethod('WALLET')}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  paymentMethod === 'WALLET'
                    ? 'border-[#171717] bg-emerald-50/90 ring-2 ring-emerald-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-extrabold text-slate-900 text-sm">My Wallet</span>
                  <span className="text-base">💳</span>
                </div>
                <div>
                  <span className="text-xs font-black text-emerald-800 block mt-1">
                    {formatCurrency(userData?.wallet_balance || 0)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium block">
                    {userData?.wallet_credits || 0} Credits Available
                  </span>
                </div>
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
              {paymentMethod === 'WALLET'
                ? 'PARK-A-LOT Wallet Encrypted Instant Checkout'
                : paymentMethod === 'FASTAG'
                ? 'NETC FASTag Encrypted Sandbox Gateway'
                : 'Encrypted Razorpay Checkout Structure • Demo Mode Active'}
            </span>
          </div>

          {/* PAY BUTTON */}
          {paymentMethod === 'WALLET' ? (
            <button
              disabled={submitting}
              onClick={handleWalletPayment}
              className="w-full py-4 rounded-2xl bg-[#171717] hover:bg-slate-800 text-[#FFD21F] font-extrabold text-base shadow-md flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
            >
              <span>💳</span>
              {submitting ? 'Processing Wallet Checkout...' : `Pay ${formatCurrency(totalAmount)} via Wallet`}
            </button>
          ) : paymentMethod === 'FASTAG' ? (
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
