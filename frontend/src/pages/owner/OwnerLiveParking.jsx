import React, { useState, useEffect, useRef } from 'react';
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
  ChevronDown,
  Radio,
  Wifi,
  Activity
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { fetchESP32Data, getStoredESP32Url } from '../../services/esp32Service';

export default function OwnerLiveParking() {
  const { user } = useAuth();
  const isEsp32Demo = user?.email === 'esp32@smartpark.in';

  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const { addNotification } = useNotification();

  // ESP32 State
  const [esp32Data, setEsp32Data] = useState({
    connected: false,
    gatewayUrl: getStoredESP32Url(),
    slot: 'A1',
    status: 'OFFLINE',
    slotStatus: 'UNKNOWN',
    rssi: '--',
    snr: '--',
    packetCount: '--',
    lastUpdateMs: '--'
  });
  const [isOnline, setIsOnline] = useState(false);
  const lastSuccessRef = useRef(0);

  // Normal database slots fetch
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

  // ESP32 Polling
  useEffect(() => {
    if (isEsp32Demo) {
      setLoading(false);
      let isMounted = true;

      const pollESP32 = async () => {
        const url = getStoredESP32Url();
        const res = await fetchESP32Data(url);
        if (!isMounted) return;

        const now = Date.now();
        if (res.connected) {
          lastSuccessRef.current = now;
          setIsOnline(true);
        } else {
          if (now - lastSuccessRef.current > 3000) {
            setIsOnline(false);
          }
        }
        setEsp32Data(res);
      };

      pollESP32();
      const interval = setInterval(pollESP32, 1000);
      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    } else {
      fetchSlots();
      const interval = setInterval(fetchSlots, 5000);
      return () => clearInterval(interval);
    }
  }, [isEsp32Demo]);

  const handleToggleMaintenance = async (slot) => {
    if (isEsp32Demo) {
      addNotification({
        title: 'Hardware Controlled Slot',
        message: 'Slot A1 state is managed by the physical ESP32 sensor.',
        type: 'info'
      });
      return;
    }
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
      case 'waiting':
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
      case 'waiting':
        return <span className="w-3 h-3 rounded-full bg-amber-500 shadow-xs flex-shrink-0" />;
      case 'maintenance':
      case 'unavailable':
        return <span className="w-3 h-3 rounded-full bg-slate-400 shadow-xs flex-shrink-0" />;
      default:
        return <span className="w-3 h-3 rounded-full bg-blue-500 shadow-xs flex-shrink-0" />;
    }
  };

  // Compute displayed slots
  let displaySlots = [];
  if (isEsp32Demo) {
    const statusMap = isOnline ? (esp32Data.slotStatus || 'UNKNOWN') : 'UNKNOWN';
    displaySlots = [
      {
        id: 'esp32-a1',
        slot_number: 'A1',
        status: statusMap.toLowerCase(),
        price_per_hour: 40,
        slot_type: 'Car',
        zone: 'Zone A (ESP32 Bay)',
        floor: 'Ground Floor',
        is_hardware: true
      }
    ];
  } else {
    displaySlots = slots;
  }

  const filteredSlots = displaySlots.filter(s => {
    if (filterStatus === 'ALL') return true;
    return s.status?.toLowerCase() === filterStatus.toLowerCase();
  });

  return (
    <div className="space-y-6">
      
      {/* Top Controls & Header Bar */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-black text-[#171717]">
              {isEsp32Demo ? 'ESP32 Hardware Integration — Live Parking Bay' : 'Live Parking Slot Grid'}
            </h2>
            {isEsp32Demo && (
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-wider border border-blue-200 flex items-center gap-1">
                <Cpu className="w-3 h-3" />
                LIVE HARDWARE DATA
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            {isEsp32Demo
              ? 'Real hardware telemetry directly connected to ESP32 LoRa sensor gateway'
              : 'Real-time magnetometer sensor & occupancy map for your facility'}
          </p>
        </div>

        {/* Legend / Status Badges */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
          {isEsp32Demo ? (
            <div className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border ${
              isOnline
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}>
              <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span className="font-extrabold uppercase tracking-wide">
                {isOnline ? '● ESP32 ONLINE' : '● ESP32 OFFLINE'}
              </span>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* ESP32 Hardware Telemetry Banner (ESP32 Mode Only) */}
      {isEsp32Demo && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 text-white shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-blue-500/20 border border-blue-500/30 text-blue-400">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400">
                  Physical Sensor Node: Slot A1
                </span>
                <h3 className="text-lg font-extrabold text-white">ESP32 LoRa Hardware Telemetry</h3>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs text-slate-300 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700">
              <Wifi className="w-4 h-4 text-[#FFD21F]" />
              <span>Gateway: <strong>{esp32Data.gatewayUrl || 'http://192.168.4.1'}</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-medium">
            <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-1">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Signal Strength (RSSI)</span>
              <p className="text-lg font-black font-mono text-emerald-400">{isOnline ? esp32Data.rssi : '--'}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-1">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Signal / Noise (SNR)</span>
              <p className="text-lg font-black font-mono text-blue-400">{isOnline ? esp32Data.snr : '--'}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-1">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Packets Received</span>
              <p className="text-lg font-black font-mono text-amber-400">{isOnline ? esp32Data.packetCount : '--'}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-1">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Last Update</span>
              <p className="text-lg font-black font-mono text-slate-200">{isOnline ? esp32Data.lastUpdateMs : '--'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Entrance Banner & Slot Bay Grid */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          
          {/* ENTRANCE Directional Indicator */}
          <div className="w-full py-3 rounded-2xl bg-slate-900 text-white text-center font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-md">
            <span>ENTRANCE</span>
            <span className="text-[#FFD21F] text-lg font-bold">↓</span>
          </div>

          {/* Filter Pills / Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-extrabold text-slate-600">
              Showing {filteredSlots.length} {isEsp32Demo ? 'Hardware Slot (A1 Only)' : 'Slots'}
            </span>
            {!isEsp32Demo && (
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
            )}
          </div>

          {/* Slot Cards Grid */}
          <div className={`grid gap-4 ${isEsp32Demo ? 'grid-cols-1 max-w-sm mx-auto' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5'}`}>
            {filteredSlots.map((slot) => {
              const isSelected = selectedSlot?.id === slot.id || (isEsp32Demo && selectedSlot?.slot_number === 'A1');
              return (
                <button
                  key={slot.id}
                  onClick={() => setSelectedSlot(slot)}
                  className={`p-5 rounded-2xl border flex flex-col justify-between ${
                    isEsp32Demo ? 'h-36' : 'h-28'
                  } text-left transition-all cursor-pointer relative ${getSlotBadgeStyle(slot.status, isSelected)}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-mono font-black text-base tracking-tight flex items-center gap-2">
                      Slot {slot.slot_number}
                      {isEsp32Demo && (
                        <span className="text-[10px] font-sans font-extrabold px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">
                          ESP32 SENSOR
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-1">
                      {getStatusDot(slot.status)}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs uppercase font-black block opacity-90 tracking-wide">
                      {slot.status}
                    </span>
                    <span className="text-xs font-bold block opacity-80">
                      ₹{slot.price_per_hour}/hr
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-medium opacity-75 border-t border-current/10 pt-1.5">
                    <span>{slot.slot_type || 'Car'}</span>
                    <span>{isEsp32Demo ? 'Source: ESP32 LoRa Sensor' : (slot.zone || 'Zone A')}</span>
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

              {/* Slot Details */}
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 grid grid-cols-2 gap-2 font-medium">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Rate</span>
                    <span className="font-bold text-[#171717]">₹{selectedSlot.price_per_hour}/hour</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Zone & Floor</span>
                    <span className="font-bold text-[#171717]">{selectedSlot.zone}, {selectedSlot.floor}</span>
                  </div>
                </div>

                {isEsp32Demo && (
                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-2 text-blue-950">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-800 block">
                      Physical Telemetry Data
                    </span>
                    <div className="space-y-1 font-mono text-xs">
                      <div className="flex justify-between">
                        <span>Gateway:</span>
                        <strong className="text-slate-900">{esp32Data.gatewayUrl}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>RSSI Signal:</span>
                        <strong className="text-slate-900">{isOnline ? esp32Data.rssi : '--'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>SNR Ratio:</span>
                        <strong className="text-slate-900">{isOnline ? esp32Data.snr : '--'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Packets:</span>
                        <strong className="text-slate-900">{isOnline ? esp32Data.packetCount : '--'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Latency:</span>
                        <strong className="text-slate-900">{isOnline ? esp32Data.lastUpdateMs : '--'}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Active Booking Info if Present */}
                {!isEsp32Demo && (selectedSlot.booking || selectedSlot.active_booking) ? (
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
                  !isEsp32Demo && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 text-slate-500 text-center text-xs font-medium">
                      No active civilian reservation on this bay.
                    </div>
                  )
                )}
              </div>

              {/* Actions */}
              {!isEsp32Demo && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleToggleMaintenance(selectedSlot)}
                    className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#171717] font-extrabold text-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <Wrench className="w-4 h-4 text-slate-700" />
                    {selectedSlot.status === 'maintenance' ? 'Re-enable Slot' : 'Mark Maintenance'}
                  </button>
                </div>
              )}

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
