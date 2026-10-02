import React from 'react';
import { Car, Check, Cpu } from 'lucide-react';

export default function SlotGrid({ slots, selectedSlot, onSelectSlot }) {
  const getSlotStyle = (slot) => {
    if (selectedSlot && selectedSlot.id === slot.id) {
      return 'bg-blue-600 border-blue-700 text-white shadow-md ring-2 ring-blue-300 scale-105';
    }

    switch (slot.status) {
      case 'available':
        return 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-900 cursor-pointer hover:border-emerald-500 hover:scale-105';
      case 'occupied':
        return 'bg-rose-50 border-rose-200 text-rose-800 cursor-not-allowed opacity-85';
      case 'reserved':
        return 'bg-amber-50 border-amber-200 text-amber-900 cursor-not-allowed opacity-85';
      case 'unavailable':
      default:
        return 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60';
    }
  };

  const getStatusBadge = (status, isSelected) => {
    if (isSelected) return 'Selected';
    switch (status) {
      case 'available': return 'Available';
      case 'occupied': return 'Occupied';
      case 'reserved': return 'Reserved';
      default: return 'Maintenance';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200 text-xs shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 shadow-xs"></span>
          <span className="text-slate-700 font-bold">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-md bg-rose-500 shadow-xs"></span>
          <span className="text-slate-700 font-bold">Occupied</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-md bg-amber-500 shadow-xs"></span>
          <span className="text-slate-700 font-bold">Reserved</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-md bg-blue-600 shadow-xs"></span>
          <span className="text-slate-700 font-bold">Your Selected Slot</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-md bg-slate-400"></span>
          <span className="text-slate-500 font-bold">Unavailable</span>
        </div>
      </div>

      {/* Grid Display */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {slots.map((slot) => {
          const isSelected = selectedSlot?.id === slot.id;
          const isAvailable = slot.status === 'available';

          return (
            <button
              key={slot.id}
              disabled={!isAvailable && !isSelected}
              onClick={() => isAvailable && onSelectSlot(slot)}
              className={`relative p-4 rounded-2xl border transition-all duration-200 flex flex-col items-center justify-center min-h-[95px] ${getSlotStyle(slot)}`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-[10px] font-mono tracking-wider opacity-75 uppercase font-bold">
                  {slot.slot_number}
                </span>
                {isSelected ? (
                  <Check className="w-4 h-4 text-white" />
                ) : (
                  <Car className="w-3.5 h-3.5 opacity-60" />
                )}
              </div>

              <span className="text-base font-extrabold tracking-tight my-0.5">
                {slot.slot_number}
              </span>

              <span className="text-[10px] font-bold tracking-wide">
                {getStatusBadge(slot.status, isSelected)}
              </span>

              {slot.sensor && (
                <span className="text-[9px] font-mono opacity-80 mt-1 flex items-center gap-1">
                  <Cpu className="w-2.5 h-2.5" />
                  {slot.sensor.magnetic_value} µT
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
