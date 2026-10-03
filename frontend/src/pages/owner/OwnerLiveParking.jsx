import React, { useState, useEffect } from 'react';
import {
  Grid,
  Info,
  Car,
  Clock,
  User,
  Phone,
  ShieldAlert,
  Cpu,
  CheckCircle2,
  X,
  Wrench,
  ChevronDown
} from 'lucide-react';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

export default function OwnerLiveParking() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const { addNotification } = useNotification();

  const fetchSlots = async () => {
    try {
      const res = await api.get('/owner/live-slots');
      setSlots(res.data);
    } catch (err) {
      console.error('Failed to fetch owner slots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
    const interval = setInterval(fetchSlots, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleMaintenance = async (slot) => {
    const newStatus = slot.status === 'maintenance' || slot.status === 'unavailable' ? 'available' : 'maintenance';
    try {
      await api.put(`/owner/slots/${slot.id}`, { status: newStatus });
      addNotification({
        title: `Slot ${slot.slot_number} Updated`,
        message: `Status changed to ${newStatus.toUpperCase()}`,
        type: 'success'
      });
      fetchSlots();
      if (selectedSlot?.id === slot.id) {
        setSelectedSlot(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      addNotification({
        title: 'Update Failed',
        message: 'Could not update slot status.',
        type: 'error'
      });
    }
  };

  const getSlotBadgeStyle = (status, isSelected) => {
    if (isSelected) {
      return 'bg-blue-600 border-blue-700 text-white shadow-lg scale-105 ring-4 ring-blue-300';
    }
    switch (status?.toLowerCase()) {
      case 'available':
        return 'bg-emerald-50 border-emerald-300 text-emerald-950 hover:bg-emerald-100 hover:border-emerald-400';
      case 'occupied':
        return 'bg-rose-50 border-rose-300 text-rose-950 hover:bg-rose-100 hover:border-rose-400';
      case 'reserved':
        return 'bg-amber-50 border-amber-300 text-amber-950 hover:bg-amber-100 hover:border-amber-400';
      case 'maintenance':
      case 'unavailable':
        return 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-800';
    }
  };

  const getStatusDot = (status) => {
    switch (status?.toLowerCase()) {
      case 'available':
        return <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-xs flex-shrink-0" />;
      case 'occupied':
        return <span className="w-3 h-3 rounded-full bg-rose-500 shadow-xs flex-shrink-0" />;
      case 'reserved':
        return <span className="w-3 h-3 rounded-full bg-amber-500 shadow-xs flex-shrink-0" />;
      case 'maintenance':
      case 'unavailable':
        return <span className="w-3 h-3 rounded-full bg-slate-400 shadow-xs flex-shrink-0" />;
      default:
        return <span className="w-3 h-3 rounded-full bg-blue-500 shadow-xs flex-shrink-0" />;
    }
  };

  const filteredSlots = slots.filter(s => {
    if (filterStatus === 'ALL') return true;
    return s.status?.toLowerCase() === filterStatus.toLowerCase();
  });

  return (
    <div className="space-y-6">
      
      {/* Top Controls & Legend Bar */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#171717]">Live Parking Slot Grid</h2>
          <p className="text-xs text-slate-500">Real-time magnetometer sensor & occupancy map for your facility</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Available
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            Occupied
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            Reserved
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            Maintenance
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            Selected
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Entrance Banner & Slot Bay Grid */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          
          {/* ENTRANCE Directional Indicator */}
          <div className="w-full py-3 rounded-2xl bg-slate-900 text-white text-center font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-md">
            <span>ENTRANCE</span>
            <span className="text-[#FFD21F] text-lg font-bold">↓</span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-extrabold text-slate-600">Showing {filteredSlots.length} Slots</span>
            <div className="flex items-center gap-1 text-xs">
              {['ALL', 'AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'].map(st => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all ${
                    filterStatus === st
                      ? 'bg-[#171717] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Slot Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {filteredSlots.map((slot) => {
              const isSelected = selectedSlot?.id === slot.id;
              const isBuffer = slot.is_buffer || (slot.slot_number && ['A19', 'A20', 'B19', 'B20'].includes(slot.slot_number));
              return (
                <button
                  key={slot.id}
                  onClick={() => setSelectedSlot(slot)}
                  className={`p-3.5 rounded-2xl border flex flex-col justify-between h-28 text-left transition-all cursor-pointer relative ${
                    isBuffer ? 'ring-2 ring-amber-400/80 bg-amber-50/40' : ''
                  } ${getSlotBadgeStyle(slot.status, isSelected)}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-mono font-black text-sm tracking-tight">{slot.slot_number}</span>
                    <div className="flex items-center gap-1">
                      {isBuffer && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 border border-amber-300">
                          BUFFER
                        </span>
                      )}
                      {getStatusDot(slot.status)}
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-extrabold block opacity-80">
                      {slot.status}
                    </span>
                    <span className="text-[11px] font-bold block truncate">
                      ₹{slot.price_per_hour}/hr
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-medium opacity-70 border-t border-current/10 pt-1">
                    <span>{slot.slot_type || 'Car'}</span>
                    <span>{isBuffer ? 'Protected Buffer' : (slot.zone || 'Zone A')}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Slot Detail Inspector Drawer */}
        <div className="space-y-6">
          {selectedSlot ? (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md space-y-6 sticky top-20">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFD21F] text-[#171717] font-black text-xl flex items-center justify-center shadow-xs">
                    {selectedSlot.slot_number}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-[#171717]">Slot {selectedSlot.slot_number}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {getStatusDot(selectedSlot.status)}
                      <span className="text-xs font-bold text-slate-700 capitalize">{selectedSlot.status}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSlot(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Slot Info Details */}
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 grid grid-cols-2 gap-2 font-medium">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Rate</span>
                    <span className="font-bold text-[#171717]">₹{selectedSlot.price_per_hour}/hour</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Zone & Floor</span>
                    <span className="font-bold text-[#171717]">{selectedSlot.zone}, {selectedSlot.floor}</span>
                  </div>
                </div>

                {/* Active Booking Info if Present */}
                {(selectedSlot.booking || selectedSlot.active_booking) ? (
                  <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-amber-950 uppercase tracking-wider">
                        Active Reservation
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                        {(selectedSlot.booking || selectedSlot.active_booking).booking_id}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-800">
                      <div className="flex items-center gap-2 font-bold">
                        <User className="w-3.5 h-3.5 text-amber-800" />
                        <span>{(selectedSlot.booking || selectedSlot.active_booking).customer_name}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-slate-700">
                        <Car className="w-3.5 h-3.5 text-amber-800" />
                        <span>{(selectedSlot.booking || selectedSlot.active_booking).vehicle_number}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-amber-800" />
                        <span>Status: <strong>{(selectedSlot.booking || selectedSlot.active_booking).status}</strong></span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-slate-50 text-slate-500 text-center text-xs font-medium">
                    No active civilian reservation on this bay.
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleToggleMaintenance(selectedSlot)}
                  className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#171717] font-extrabold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Wrench className="w-4 h-4 text-slate-700" />
                  {selectedSlot.status === 'maintenance' ? 'Re-enable Slot' : 'Mark Maintenance'}
                </button>
              </div>

            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Info className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-sm text-[#171717]">Select a Parking Slot</h4>
              <p className="text-xs text-slate-500">
                Click any slot card in the layout grid to inspect live occupancy, reservation telemetry, customer details, and sensor health.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
