import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Grid,
  TrendingUp,
  Layers,
  CalendarCheck,
  IndianRupee,
  ArrowUpRight,
  Clock,
  Car,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { fetchESP32Data, getStoredESP32Url } from '../../services/esp32Service';

function OverstayAlertSection() {
  const [alerts, setAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);

  const fetchAlerts = async () => {
    try {
      const res = await api.get('/owner/overstay-alerts');
      setAlerts(res.data || []);
    } catch (err) {
      console.warn('Error fetching overstay alerts:', err);
    } finally {
      setLoadingAlerts(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const timer = setInterval(fetchAlerts, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleAction = async (bookingId) => {
    try {
      await api.post(`/owner/overstay-action/${bookingId}`);
      fetchAlerts();
    } catch (err) {
      console.warn('Error logging security action:', err);
    }
  };

  if (loadingAlerts && alerts.length === 0) return null;
  if (alerts.length === 0) return null;

  return (
    <div className="p-6 rounded-3xl bg-rose-50 border border-rose-300 text-rose-950 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-rose-200 text-rose-900">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-rose-950">Overstay Security Alerts ({alerts.length})</h3>
            <p className="text-xs text-rose-800 font-medium">Vehicles exceeding paid duration and grace period</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-rose-200 text-rose-900 font-extrabold text-xs">
          Physical Action Needed
        </span>
      </div>

      <div className="space-y-3">
        {alerts.map((a) => (
          <div key={a.id} className="p-4 rounded-2xl bg-white border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-sm">{a.vehicle_number}</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                  {a.assigned_position} {a.is_buffer_assigned ? '(Buffer Space)' : ''}
                </span>
                <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">
                  +{a.overstay_duration_minutes} Mins Overdue
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Customer: <strong>{a.customer_name}</strong> ({a.customer_phone}) • Code: {a.booking_id}
              </p>
              <p className="text-xs text-rose-700 font-bold">
                ⚠️ Recommended Action: {a.recommended_action}
              </p>
            </div>

            <button
              disabled={a.security_action_taken}
              onClick={() => handleAction(a.id)}
              className={`px-4 py-2.5 rounded-xl font-extrabold text-xs shadow-xs transition-all shrink-0 ${
                a.security_action_taken
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                  : 'bg-rose-900 hover:bg-rose-950 text-white active:scale-95'
              }`}
            >
              {a.security_action_taken ? '✓ Lock Action Logged' : 'Log Physical Lock Applied'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OwnerOverview() {
  const { user } = useAuth();
  const isEsp32Demo = user?.email === 'esp32@smartpark.in';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [esp32Status, setEsp32Status] = useState('UNKNOWN');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/owner/overview');
      setData(res.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch owner dashboard metrics:', err);
      setError('Unable to connect to parking server. Please verify backend service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isEsp32Demo) {
      let active = true;
      const pollESP32 = async () => {
        const res = await fetchESP32Data(getStoredESP32Url());
        if (active && res.connected) {
          setEsp32Status(res.slotStatus || 'UNKNOWN');
        } else if (active) {
          setEsp32Status('UNKNOWN');
        }
      };
      pollESP32();
      const interval = setInterval(pollESP32, 1000);
      return () => {
        active = false;
        clearInterval(interval);
      };
    }
  }, [isEsp32Demo]);

  if (loading && !data) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-[#FFD21F] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-extrabold text-slate-500">Loading live parking database metrics...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-8 rounded-3xl bg-rose-50 border border-rose-200 text-center space-y-4 max-w-lg mx-auto my-10">
        <h3 className="font-extrabold text-rose-950 text-base">Database Connection Failure</h3>
        <p className="text-xs text-rose-800 font-medium">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="px-5 py-2.5 rounded-xl bg-rose-900 text-white font-extrabold text-xs hover:bg-rose-950 transition-all"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Real Database Metrics (or default zero values if new empty lot)
  const isOccupiedEsp = esp32Status === 'OCCUPIED';
  const totalSlots = isEsp32Demo ? 1 : (data?.total_slots || 0);
  const occupiedSlots = isEsp32Demo ? (isOccupiedEsp ? 1 : 0) : (data?.occupied_slots || 0);
  const availableSlots = isEsp32Demo ? (isOccupiedEsp ? 0 : 1) : (data?.available_slots ?? totalSlots);
  const reservedSlots = isEsp32Demo ? 0 : (data?.reserved_slots || 0);
  const todayRevenue = data?.today_revenue || 0;
  const todayBookingsCount = data?.today_bookings_count || 0;
  const occupancyPct = isEsp32Demo ? (isOccupiedEsp ? 100 : 0) : (data?.occupancy_percent || 0);
  const lotName = isEsp32Demo ? 'PARK-A-LOT (ESP32 LoRa Demo Node)' : (data?.company_name || 'My Parking Facility');
  const isOpen = data?.is_open ?? true;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-[#111827] text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-[#FFD21F]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 border ${
                isOpen
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                {isOpen ? 'Lot Open Now' : 'Closed Outside Hours'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Hours: {data?.opening_time || '06:00'} – {data?.closing_time || '23:00'}
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {getGreeting()}, <span className="text-[#FFD21F]">{user?.name}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xl">
              PARK-A-LOT • <strong className="text-white">{lotName}</strong>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/owner/live-parking"
              className="px-4 py-3 rounded-2xl bg-[#FFD21F] hover:bg-[#E5B800] text-[#171717] font-extrabold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Grid className="w-4 h-4" />
              View Live Slot Grid
            </Link>
            <Link
              to="/owner/bookings"
              className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs flex items-center gap-2 border border-slate-700 transition-all"
            >
              <CalendarCheck className="w-4 h-4 text-[#FFD21F]" />
              Manage Bookings
            </Link>
          </div>
        </div>
      </div>

      {/* Feature 5: OWNER TWO-STAGE VERIFICATION BANNER */}
      {data?.verification_status !== 'APPROVED' && (
        <div className="p-6 rounded-3xl bg-amber-50 border border-amber-300 text-amber-950 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 px-2.5 py-0.5 rounded-full bg-amber-200/80 border border-amber-300">
              STAGE VERIFICATION IN PROGRESS: {data?.verification_status || 'DOCUMENT_VERIFICATION_PENDING'}
            </span>
            <h3 className="font-extrabold text-base text-amber-950 pt-1">Parking Facility Verification & Inspection</h3>
            <p className="text-xs text-amber-900 font-medium max-w-xl">
              {data?.verification_status === 'PHYSICAL_INSPECTION_SCHEDULED'
                ? 'Stage 1 Documents submitted and Stage 2 1-to-1 physical inspection appointment is scheduled!'
                : data?.verification_status === 'PHYSICAL_VERIFICATION_PENDING'
                ? 'Stage 1 Documents submitted! Please schedule your 1-to-1 physical inspection & interview appointment.'
                : 'Stage 1 Document verification pending. Submit ownership proofs & schedule your 1-to-1 physical inspection.'}
            </p>
          </div>
          <Link
            to="/owner/verification"
            className="px-4 py-2.5 rounded-xl bg-amber-900 hover:bg-amber-950 text-white font-extrabold text-xs shrink-0 shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
          >
            <span>Complete Verification & Interview</span>
            <ChevronRight className="w-4 h-4 text-[#FFD21F]" />
          </Link>
        </div>
      )}

      {/* 8 Database Summary & Feature Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
        
        {/* Total Slots */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Total Capacity</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-[#171717]">{totalSlots}</p>
          <span className="text-[10px] text-slate-400 font-medium block">Physical spaces</span>
        </div>

        {/* Reservable Capacity */}
        <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-blue-900 text-xs font-bold">
            <span>Reservable</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-950">{data?.reservable_capacity || (totalSlots - 2)}</p>
          <span className="text-[10px] text-blue-700 font-bold block">Normal capacity</span>
        </div>

        {/* Feature 4: Buffer Capacity */}
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-amber-950 text-xs font-bold">
            <span>Protected Buffer</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-950">{data?.buffer_capacity || 2}</p>
          <span className="text-[10px] text-amber-800 font-bold block">
            {data?.buffer_in_use_count ? `${data.buffer_in_use_count} In Use` : 'Protected spaces'}
          </span>
        </div>

        {/* Available */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold">
            <span>Available</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-950">{availableSlots}</p>
          <span className="text-[10px] text-emerald-700 font-bold block">Ready for arrivals</span>
        </div>

        {/* Occupied */}
        <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-rose-800 text-xs font-bold">
            <span>Occupied</span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-950">{occupiedSlots}</p>
          <span className="text-[10px] text-rose-700 font-bold block">Active parked</span>
        </div>

        {/* Feature 2: Overstay Count */}
        <div className="p-4 rounded-2xl bg-rose-100/90 border border-rose-300 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-rose-950 text-xs font-bold">
            <span>Overstay Alerts</span>
            <Clock className="w-4 h-4 text-rose-700 animate-pulse" />
          </div>
          <p className="text-2xl font-black text-rose-950">{data?.overstay_count || 0}</p>
          <span className="text-[10px] text-rose-900 font-extrabold block">Action Required</span>
        </div>

        {/* Today's Revenue */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Today's Revenue</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-[#171717]">₹{todayRevenue.toLocaleString()}</p>
          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" /> Live DB
          </span>
        </div>

        {/* Occupancy % */}
        <div className="p-4 rounded-2xl bg-[#FFD21F]/20 border border-[#FFD21F] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#171717] text-xs font-extrabold">
            <span>Occupancy</span>
            <span className="text-xs font-black">{occupancyPct}%</span>
          </div>
          <div className="w-full h-2 bg-white rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-[#171717] rounded-full transition-all duration-500"
              style={{ width: `${occupancyPct}%` }}
            />
          </div>
          <span className="text-[10px] text-[#171717] font-bold block pt-0.5">Real-time load</span>
        </div>

      </div>

      {/* FEATURE 2: SECURITY & OVERSTAY ALERTS SECTION */}
      <OverstayAlertSection />

      {/* Main Section: Quick Status & Facilities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Facility Info Card */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-[#171717]">Parking Facility Status</h3>
              <p className="text-xs text-slate-500">Live operational data from central FastAPI database</p>
            </div>
            <Link to="/owner/settings" className="text-xs font-extrabold text-slate-900 hover:underline flex items-center gap-1">
              Edit Facility Info <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Facility Name</span>
              <p className="font-bold text-[#171717] text-sm">{lotName}</p>
              <span className="text-[11px] text-slate-500 block">{data?.address || 'South Chennai Commercial Hub'}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Operating Hours & Pricing</span>
              <p className="font-bold text-[#171717] text-sm">₹{data?.price_per_hour || 40}/hour</p>
              <span className="text-[11px] text-slate-500 block font-mono">
                Open: {data?.opening_time || '06:00'} | Close: {data?.closing_time || '23:00'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900 font-bold">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Shared Database Synchronization Active (FastAPI Server)
            </span>
            <span className="font-extrabold">{totalSlots} Total Slots</span>
          </div>
        </div>

        {/* Quick Lot Operations Widget */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-800 font-bold">
                <Car className="w-5 h-5 text-[#171717]" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-[#171717]">Quick Lot Action</h4>
                <p className="text-xs text-slate-500">Inspect real-time slot grid</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold">
              ● Live DB
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-500 font-bold block uppercase">Available</span>
              <span className="text-lg font-black text-[#171717]">
                {availableSlots} / {totalSlots}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
              <span className="text-[10px] text-emerald-800 font-bold block uppercase">Occupancy</span>
              <span className="text-lg font-black text-emerald-950">
                {occupancyPct}%
              </span>
            </div>
          </div>

          <Link
            to="/owner/live-parking"
            className="w-full py-3 rounded-xl bg-[#171717] hover:bg-black text-[#FFD21F] font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            Inspect Live Slot Grid <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

      </div>

    </div>
  );
}
