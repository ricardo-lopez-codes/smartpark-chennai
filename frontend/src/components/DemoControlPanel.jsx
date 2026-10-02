import React, { useState } from 'react';
import { Cpu, Zap, Clock, AlertTriangle, CheckCircle, RefreshCw, X } from 'lucide-react';
import api from '../services/api';
import { useBooking } from '../context/BookingContext';
import { useNotification } from '../context/NotificationContext';

export default function DemoControlPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { activeBooking, fetchActiveBooking, selectedSlot } = useBooking();
  const { addNotification } = useNotification();
  const [loadingAction, setLoadingAction] = useState(false);

  const handleJumpTime = async (targetState) => {
    if (!activeBooking) {
      addNotification({
        title: 'Demo Control',
        message: 'No active booking to jump time. Create a booking first!',
        type: 'warning'
      });
      return;
    }

    setLoadingAction(true);
    try {
      await api.post('/demo/jump-time', {
        booking_id: activeBooking.id,
        target_state: targetState
      });
      await fetchActiveBooking();
      addNotification({
        title: 'Demo Time Jump',
        message: `Fast-forwarded active booking to ${targetState}`,
        type: 'success'
      });
    } catch (err) {
      addNotification({
        title: 'Error',
        message: 'Failed to execute time jump.',
        type: 'error'
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDemoAction = async (actionType, extraData = {}) => {
    setLoadingAction(true);
    try {
      const res = await api.post('/demo/action', {
        action: actionType,
        ...extraData
      });
      await fetchActiveBooking();
      addNotification({
        title: 'Demo Hardware Simulation',
        message: res.data.message || 'Action executed successfully.',
        type: 'info'
      });
    } catch (err) {
      addNotification({
        title: 'Error',
        message: 'Failed to execute demo action.',
        type: 'error'
      });
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <>
      {/* Floating Demo Panel Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 z-40 px-4 py-2.5 rounded-full bg-[#171717] border border-amber-400/40 text-[#FFD21F] font-extrabold text-xs shadow-2xl flex items-center gap-2 hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 group"
      >
        <Cpu className="w-4 h-4 text-[#FFD21F] animate-pulse group-hover:rotate-180 transition-transform duration-500" />
        <span>HACKATHON DEMO PANEL</span>
      </button>

      {/* Slide-Up Panel Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in slide-in-from-bottom-5 duration-300">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800 font-bold">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#171717]">Hackathon Presentation Controls</h3>
                  <p className="text-xs text-slate-500 font-medium">Simulate IoT Hardware & Server Time</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Time Manipulation Controls */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Active Booking Time Control
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  disabled={loadingAction || !activeBooking}
                  onClick={() => handleJumpTime('15_MIN_REMAINING')}
                  className="p-3.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-xs"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Jump to 15-Min Expiring
                </button>

                <button
                  disabled={loadingAction || !activeBooking}
                  onClick={() => handleJumpTime('EXPIRED')}
                  className="p-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-xs"
                >
                  <Clock className="w-4 h-4 text-rose-600" />
                  Force Expire Booking
                </button>
              </div>
            </div>

            {/* IoT Sensor Hardware Controls */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                Magnetometer Hardware Sensor Emulation
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  disabled={loadingAction}
                  onClick={() => handleDemoAction('RANDOM_SENSOR_TOGGLE')}
                  className="p-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <RefreshCw className={`w-4 h-4 text-slate-600 ${loadingAction ? 'animate-spin' : ''}`} />
                  Flip Random Slot Sensor
                </button>

                {selectedSlot && (
                  <button
                    disabled={loadingAction}
                    onClick={() => handleDemoAction('OCCUPY_SLOT', { slot_id: selectedSlot.id })}
                    className="p-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Occupy Slot {selectedSlot.slot_number}
                  </button>
                )}
              </div>
            </div>

            {/* Hint */}
            <p className="text-[11px] text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed font-medium">
              💡 <span className="text-[#171717] font-bold">Hackathon Tip:</span> Use these controls during judge evaluation to demonstrate the 15-minute expiration notification and live WebSocket updates without waiting for clock time.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
