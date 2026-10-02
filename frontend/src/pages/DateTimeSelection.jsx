import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft, Plus, Minus, CheckCircle, AlertTriangle, MapPin, ChevronRight } from 'lucide-react';
import api from '../services/api';
import { useBooking } from '../context/BookingContext';
import { formatCurrency } from '../utils/formatters';

export default function DateTimeSelection() {
  const [searchParams] = useSearchParams();
  const lotId = searchParams.get('lot_id');

  const [lot, setLot] = useState(null);
  const [loading, setLoading] = useState(true);

  const {
    selectedDate, setSelectedDate,
    selectedTime, setSelectedTime,
    selectedDuration, setSelectedDuration,
    setSelectedLot
  } = useBooking();

  const navigate = useNavigate();

  useEffect(() => {
    const fetchLot = async () => {
      if (!lotId) return;
      try {
        const res = await api.get(`/parking-lots/${lotId}`);
        setLot(res.data);
        setSelectedLot(res.data);
      } catch (err) {
        console.warn('Error loading parking lot details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLot();
  }, [lotId, setSelectedLot]);

  // Generate Quick Date Chips (Today, Tomorrow, + Next 3 Days)
  const generateDateChips = () => {
    const chips = [];
    const today = new Date();
    for (let i = 0; i < 4; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const isoStr = d.toISOString().split('T')[0];
      
      let label = '';
      if (i === 0) label = 'TODAY';
      else if (i === 1) label = 'TOMORROW';
      else label = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

      const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      chips.push({
        iso: isoStr,
        label,
        monthDay
      });
    }
    return chips;
  };

  const dateChips = generateDateChips();
  const todayISO = new Date().toISOString().split('T')[0];

  // Helper to calculate max allowed date (30 days in advance)
  const getMaxDateISO = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  };

  // Generate Time Chips dynamically based on lot operating hours
  const generateTimeSlots = () => {
    if (!lot) return [];
    
    const openH = parseInt(lot.opening_time.split(':')[0], 10);
    const openM = parseInt(lot.opening_time.split(':')[1], 10);
    const closeH = parseInt(lot.closing_time.split(':')[0], 10);
    const closeM = parseInt(lot.closing_time.split(':')[1], 10);

    const slots = [];
    const now = new Date();
    const isTodaySelected = selectedDate === todayISO;
    const currentMinutesFromMidnight = now.getHours() * 60 + now.getMinutes();

    let currMinutes = openH * 60 + openM;
    const endMinutes = closeH * 60 + closeM - 60; // Must leave at least 1 hour for minimum duration

    while (currMinutes <= endMinutes) {
      const h = Math.floor(currMinutes / 60);
      const m = currMinutes % 60;
      const hh = h < 10 ? `0${h}` : `${h}`;
      const mm = m < 10 ? `0${m}` : `${m}`;
      const timeStr = `${hh}:${mm}`;

      // Calculate 12-hour display string
      const ampm = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 === 0 ? 12 : h % 12;
      const displayTime = `${displayH}:${mm} ${ampm}`;

      // Determine category (Morning, Afternoon, Evening, Night)
      let category = 'Morning';
      if (h >= 12 && h < 17) category = 'Afternoon';
      else if (h >= 17 && h < 20) category = 'Evening';
      else if (h >= 20) category = 'Night';

      // Check if time slot is in the past for TODAY
      const isPast = isTodaySelected && (currMinutes <= currentMinutesFromMidnight + 15);

      slots.push({
        timeStr,
        displayTime,
        category,
        isPast
      });

      currMinutes += 30; // 30-minute intervals
    }

    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Filter time slots by category
  const categories = ['Morning', 'Afternoon', 'Evening', 'Night'];
  const slotsByCategory = categories.map(cat => ({
    category: cat,
    items: timeSlots.filter(t => t.category === cat)
  })).filter(c => c.items.length > 0);

  // Validate selected start time & duration against closing time
  const isDurationValid = () => {
    if (!lot || !selectedTime) return true;
    const closeH = parseInt(lot.closing_time.split(':')[0], 10);
    const closeM = parseInt(lot.closing_time.split(':')[1], 10);
    const closeTotal = closeH * 60 + closeM;

    const [startH, startM] = selectedTime.split(':').map(Number);
    const endTotal = startH * 60 + startM + (selectedDuration * 60);

    return endTotal <= closeTotal;
  };

  const durationValid = isDurationValid();

  const handleProceedToSlots = () => {
    if (!durationValid) return;
    navigate(`/slot-selection?lot_id=${lot.id}&date=${selectedDate}&time=${selectedTime}&duration=${selectedDuration}`);
  };

  // Format 12-hour time display
  const format12Hour = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH}:${m < 10 ? '0' + m : m} ${ampm}`;
  };

  // Calculate Paid Until & Extension Buffer Until
  const getEndTimesDisplay = () => {
    if (!selectedTime) return { paidEnd: '', bufferEnd: '' };
    const [h, m] = selectedTime.split(':').map(Number);
    
    const paidEndMinutes = h * 60 + m + (selectedDuration * 60);
    const bufferEndMinutes = paidEndMinutes + 60;

    const formatMins = (mins) => {
      const hh = Math.floor(mins / 60) % 24;
      const mm = mins % 60;
      const ampm = hh >= 12 ? 'PM' : 'AM';
      const displayH = hh % 12 === 0 ? 12 : hh % 12;
      return `${displayH}:${mm < 10 ? '0' + mm : mm} ${ampm}`;
    };

    return {
      paidEnd: formatMins(paidEndMinutes),
      bufferEnd: formatMins(bufferEndMinutes)
    };
  };

  const { paidEnd, bufferEnd } = getEndTimesDisplay();
  const parkingFee = lot ? lot.price_per_hour * selectedDuration : 0;
  const serviceFee = 10;
  const totalAmount = parkingFee + serviceFee;

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
          <h1 className="text-2xl font-extrabold text-[#171717]">Select Date & Time</h1>
          <p className="text-xs text-slate-500 font-medium">
            {lot?.name} • Operating Hours: <span className="font-bold text-slate-800">{format12Hour(lot?.opening_time)} – {format12Hour(lot?.closing_time)}</span>
          </p>
        </div>
      </div>

      {loading ? (
        <div className="h-64 rounded-3xl bg-slate-200 animate-pulse border border-slate-200" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Date & Time Selectors */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. DATE SELECTION */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="font-extrabold text-[#171717] text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#171717]" />
                  Select Date
                </h2>
                <span className="text-xs text-slate-500 font-medium">Book up to 30 days ahead</span>
              </div>

              {/* Quick Date Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {dateChips.map((chip) => {
                  const isSelected = selectedDate === chip.iso;
                  return (
                    <button
                      key={chip.iso}
                      onClick={() => setSelectedDate(chip.iso)}
                      className={`p-3.5 rounded-2xl border transition-all text-center flex flex-col items-center justify-center ${
                        isSelected
                          ? 'bg-[#FFD21F] border-[#FFD21F] text-[#171717] font-extrabold shadow-sm scale-102'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800 font-bold'
                      }`}
                    >
                      <span className="text-[10px] tracking-wider uppercase font-extrabold opacity-75">{chip.label}</span>
                      <span className="text-sm font-extrabold mt-0.5">{chip.monthDay}</span>
                    </button>
                  );
                })}
              </div>

              {/* Calendar Custom Date Picker */}
              <div className="pt-2 flex items-center gap-3">
                <span className="text-xs text-slate-500 font-medium">Choose another date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  min={todayISO}
                  max={getMaxDateISO()}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#171717] focus:outline-none focus:border-[#FFD21F]"
                />
              </div>
            </div>

            {/* 2. TIME SELECTION */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="font-extrabold text-[#171717] text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#171717]" />
                  Select Start Time
                </h2>
                <span className="text-xs text-slate-500 font-medium">30-min intervals</span>
              </div>

              {slotsByCategory.map((catGroup) => (
                <div key={catGroup.category} className="space-y-2">
                  <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                    {catGroup.category}
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {catGroup.items.map((slotItem) => {
                      const isSelected = selectedTime === slotItem.timeStr;
                      return (
                        <button
                          key={slotItem.timeStr}
                          disabled={slotItem.isPast}
                          onClick={() => !slotItem.isPast && setSelectedTime(slotItem.timeStr)}
                          className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                            isSelected
                              ? 'bg-[#FFD21F] border-[#FFD21F] text-[#171717] font-extrabold shadow-xs scale-102'
                              : slotItem.isPast
                              ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-50'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                          }`}
                        >
                          {slotItem.displayTime}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* 3. DURATION SELECTION */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="font-extrabold text-[#171717] text-base">How long do you need parking?</h2>
                <span className="text-xs text-slate-500 font-medium">1 to 5 Hours</span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <button
                  disabled={selectedDuration <= 1}
                  onClick={() => setSelectedDuration(selectedDuration - 1)}
                  className="w-10 h-10 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-30 text-[#171717] font-extrabold flex items-center justify-center transition-colors shadow-xs"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <div className="text-center">
                  <span className="text-3xl font-extrabold text-[#171717]">{selectedDuration}</span>
                  <span className="text-xs text-slate-500 block font-bold">
                    Hour{selectedDuration > 1 ? 's' : ''}
                  </span>
                </div>

                <button
                  disabled={selectedDuration >= 5}
                  onClick={() => setSelectedDuration(selectedDuration + 1)}
                  className="w-10 h-10 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-30 text-[#171717] font-extrabold flex items-center justify-center transition-colors shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {!durationValid && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>Parking duration exceeds operating hours (Closes at {format12Hour(lot?.closing_time)}).</span>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Booking Summary Card */}
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6 sticky top-24">
              <h2 className="font-extrabold text-[#171717] text-base pb-3 border-b border-slate-100">
                Reservation Details
              </h2>

              <div className="space-y-3 text-xs font-medium text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Parking Location:</span>
                  <span className="font-bold text-[#171717]">{lot?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Selected Date:</span>
                  <span className="font-bold text-slate-900">{selectedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Start Time:</span>
                  <span className="font-bold text-slate-900">{format12Hour(selectedTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Duration:</span>
                  <span className="font-bold text-slate-900">{selectedDuration} Hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Paid Until:</span>
                  <span className="font-bold text-slate-900">{paidEnd}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Extension Buffer Until:</span>
                  <span>{bufferEnd}</span>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Parking Fee ({selectedDuration} hrs @ {formatCurrency(lot?.price_per_hour)}/hr):</span>
                    <span className="font-bold text-slate-900">{formatCurrency(parkingFee)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Service Fee:</span>
                    <span className="font-bold text-slate-900">{formatCurrency(serviceFee)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-extrabold text-[#171717]">
                    <span>Total Amount:</span>
                    <span className="text-emerald-700 text-base">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Action CTA */}
              <button
                disabled={!durationValid || !selectedTime}
                onClick={handleProceedToSlots}
                className="w-full py-4 rounded-2xl bg-[#FFD21F] hover:bg-[#E5B800] text-[#171717] font-extrabold text-sm shadow-md flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-98"
              >
                View Available Slots
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
