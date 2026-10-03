import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Calendar, Clock, MapPin, ShieldCheck, ChevronRight } from 'lucide-react';
import api from '../services/api';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import SlotGrid from '../components/SlotGrid';
import { formatCurrency, getLocalDateISO } from '../utils/formatters';

export default function SlotSelection() {
  const [searchParams] = useSearchParams();
  const lotId = searchParams.get('lot_id');
  const todayISO = getLocalDateISO();
  const rawDate = searchParams.get('date');
  const dateStr = (!rawDate || rawDate < todayISO) ? todayISO : rawDate;
  const timeStr = searchParams.get('time') || '10:00';
  const duration = parseInt(searchParams.get('duration') || '2', 10);

  const [availabilityData, setAvailabilityData] = useState(null);
  const [lot, setLot] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const {
    selectedSlot, setSelectedSlot,
    setSelectedDate, setSelectedTime, setSelectedDuration
  } = useBooking();

  const navigate = useNavigate();

  useEffect(() => {
    setSelectedDate(dateStr);
    setSelectedTime(timeStr);
    setSelectedDuration(duration);
  }, [dateStr, timeStr, duration, setSelectedDate, setSelectedTime, setSelectedDuration]);

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!lotId) return;
      setLoading(true);
      try {
        const [lotRes, availRes] = await Promise.all([
          api.get(`/parking-lots/${lotId}`),
          api.get(`/parking-lots/${lotId}/availability`, {
            params: { date: dateStr, start_time: timeStr, duration }
          })
        ]);
        setLot(lotRes.data);
        setAvailabilityData(availRes.data);
        setSlots(availRes.data.slots);

        // Select first available slot
        const firstAvail = availRes.data.slots.find(s => s.status === 'available');
        if (firstAvail) setSelectedSlot(firstAvail);
      } catch (err) {
        console.warn('Error fetching slot availability:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAvailability();
  }, [lotId, dateStr, timeStr, duration, setSelectedSlot]);

  // Format 12-hour time
  const format12Hour = (tStr) => {
    if (!tStr) return '';
    const [h, m] = tStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH}:${m < 10 ? '0' + m : m} ${ampm}`;
  };

  // Format date display (e.g. October 5, 2026)
  const formatDateDisplay = (dStr) => {
    if (!dStr) return '';
    const [y, m, d] = dStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  // Calculate Paid Until & Extension Buffer Until
  const getEndTimes = () => {
    if (!timeStr) return { paidEnd: '', bufferEnd: '' };
    const [h, m] = timeStr.split(':').map(Number);
    const paidMins = h * 60 + m + (duration * 60);
    const bufferMins = paidMins + 60;

    const fmt = (mins) => {
      const hh = Math.floor(mins / 60) % 24;
      const mm = mins % 60;
      const ampm = hh >= 12 ? 'PM' : 'AM';
      const displayH = hh % 12 === 0 ? 12 : hh % 12;
      return `${displayH}:${mm < 10 ? '0' + mm : mm} ${ampm}`;
    };

    return { paidEnd: fmt(paidMins), bufferEnd: fmt(bufferMins) };
  };

  const { paidEnd, bufferEnd } = getEndTimes();
  const hourlyRate = user?.vehicle_type === 'BIKE'
    ? (lot?.bike_price_per_hour || 20.0)
    : (lot?.car_price_per_hour || lot?.price_per_hour || 40.0);
  const parkingFee = lot ? hourlyRate * duration : 0;
  const serviceFee = 10;
  const totalAmount = parkingFee + serviceFee;

  const handleProceedToPayment = () => {
    if (!selectedSlot) return;
    navigate(`/payment-confirm?lot_id=${lot.id}&slot_id=${selectedSlot.id}&date=${dateStr}&time=${timeStr}&duration=${duration}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-[#171717]">Select Parking Slot</h1>
          <p className="text-xs text-slate-500 font-medium">
            {lot?.name} • {formatDateDisplay(dateStr)} at {format12Hour(timeStr)}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="h-64 rounded-3xl bg-slate-200 animate-pulse border border-slate-200" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Dynamic Slot Assignment Notice & Lot Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
              <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div>
                  <h2 className="font-extrabold text-[#171717] text-base">
                    Facility Reservable Capacity for {formatDateDisplay(dateStr)} at {format12Hour(timeStr)}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">Real-time facility capacity reservation</p>
                </div>
                <span className="text-xs text-emerald-700 font-extrabold px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full">
                  Available Capacity: {availabilityData?.available_slots || lot?.total_slots} Slots
                </span>
              </div>

              {/* Dynamic Assignment Highlight Card */}
              <div className="p-6 rounded-2xl bg-amber-50/80 border border-amber-200 text-slate-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FFD21F] flex items-center justify-center font-bold text-[#171717] text-xl shadow-xs">
                    🅿️
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[#171717] text-base">Dynamic Physical Position Assignment</h3>
                    <p className="text-xs text-slate-600 font-medium">No slot selection required during booking!</p>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-medium bg-white/70 p-3 rounded-xl border border-amber-100">
                  <strong className="text-amber-900 font-bold">How it works:</strong> You are reserving parking capacity and time at <strong>{lot?.name}</strong>. Your physical parking position will be automatically assigned by our smart sensor system when your vehicle enters the lot upon arrival.
                </p>
              </div>

              {/* Protected Buffer Space Protection Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3 text-xs">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold text-emerald-950 block">Protected Buffer Guarantee Enabled</span>
                  <span className="text-emerald-800 font-medium">This facility protects your prepaid reservation with 2 dedicated buffer spaces. Even if an earlier vehicle overstays, your reservation is guaranteed!</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Booking Summary Card */}
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6 sticky top-24">
              
              {/* Selected Slot Badge */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-amber-900 font-bold block">Assigned Position</span>
                  <span className="text-sm font-extrabold text-[#171717]">Assigned on Arrival</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#FFD21F] text-[#171717] flex items-center justify-center font-bold text-lg">
                  ⚡
                </div>
              </div>

              {/* BOOKING DETAILS SUMMARY */}
              <div className="space-y-3 text-xs font-medium text-slate-700">
                <h3 className="font-extrabold text-[#171717] uppercase tracking-wider text-[10px] pb-2 border-b border-slate-100">
                  BOOKING DETAILS
                </h3>

                <div className="flex justify-between">
                  <span className="text-slate-500">Parking Location:</span>
                  <span className="font-bold text-[#171717]">{lot?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date:</span>
                  <span className="font-bold text-slate-900">{formatDateDisplay(dateStr)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Start Time:</span>
                  <span className="font-bold text-slate-900">{format12Hour(timeStr)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Duration:</span>
                  <span className="font-bold text-slate-900">{duration} Hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Paid Until:</span>
                  <span className="font-bold text-slate-900">{paidEnd}</span>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Parking Fee ({duration} hrs @ {formatCurrency(hourlyRate)}/hr):</span>
                    <span className="font-bold text-slate-900">{formatCurrency(parkingFee)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-extrabold text-[#171717]">
                    <span>Total Amount:</span>
                    <span className="text-emerald-700 text-base">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={handleProceedToPayment}
                className="w-full py-4 rounded-2xl bg-[#FFD21F] hover:bg-[#E5B800] text-[#171717] font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <CreditCard className="w-4 h-4" />
                CONTINUE TO PAYMENT
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
