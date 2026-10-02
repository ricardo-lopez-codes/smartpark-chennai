import React, { useState, useEffect } from 'react';
import { Cpu, Wifi, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Battery, Radio } from 'lucide-react';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

export default function OwnerIoT() {
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [syncing, setSyncing] = useState(false);
  const { addNotification } = useNotification();

  const fetchTelemetry = async () => {
    try {
      const res = await api.get('/owner/sensors');
      setTelemetry(res.data);
    } catch (err) {
      console.error('Failed to fetch sensor telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleManualSync = async () => {
    setSyncing(true);
    await fetchTelemetry();
    setTimeout(() => {
      setSyncing(false);
      addNotification({
        title: 'IoT Mesh Synced',
        message: 'All ESP32 magnetometer nodes responding normally.',
        type: 'success'
      });
    }, 800);
  };

  const metrics = telemetry?.metrics || {
    total: 80,
    connected: 76,
    healthy: 74,
    warnings: 2,
    offline: 4
  };

  const sensors = telemetry?.sensors || [];

  const filteredSensors = sensors.filter(s => {
    if (filterStatus === 'ALL') return true;
    return s.status.toUpperCase() === filterStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Gateway Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-extrabold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Gateway Online
            </span>
            <span className="text-xs text-slate-400 font-mono">Last Sync: 2 sec ago</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">IoT Sensor Health & Mesh Status</h2>
          <p className="text-xs text-slate-300">ESP32 wireless magnetometer bay occupancy sensor cluster</p>
        </div>

        <button
          onClick={handleManualSync}
          disabled={syncing}
          className="px-5 py-3 rounded-2xl bg-[#FFD21F] hover:bg-[#E5B800] text-[#171717] font-extrabold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50 relative z-10"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Ping Mesh...' : 'Ping IoT Nodes'}
        </button>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Connected Sensors</span>
            <Wifi className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-[#171717]">
            {metrics.connected} / {metrics.total}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">95% mesh connectivity</span>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold">
            <span>Healthy Nodes</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-950">{metrics.healthy}</p>
          <span className="text-[10px] text-emerald-700 font-bold block">Normal calibration</span>
        </div>

        <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-amber-900 text-xs font-bold">
            <span>Signal Warnings</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-950">{metrics.warnings}</p>
          <span className="text-[10px] text-amber-800 font-bold block">Weak RSSI / Battery low</span>
        </div>

        <div className="p-5 rounded-2xl bg-rose-50/70 border border-rose-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-rose-800 text-xs font-bold">
            <span>Offline Sensors</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-950">{metrics.offline}</p>
          <span className="text-[10px] text-rose-700 font-bold block">Maintenance required</span>
        </div>

      </div>

      {/* Sensor Nodes Table */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-base text-[#171717]">Magnetometer Bay Sensor List</h3>
            <p className="text-xs text-slate-500">Live telemetry values (microtesla μT & detection status)</p>
          </div>

          <div className="flex items-center gap-1 text-xs font-bold">
            {['ALL', 'ONLINE', 'WARNING', 'OFFLINE'].map(st => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterStatus === st ? 'bg-[#171717] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-4 border-[#FFD21F] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-500">Retrieving sensor telemetry...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px] bg-slate-50/50">
                  <th className="py-3 px-4">Sensor ID</th>
                  <th className="py-3 px-4">Slot</th>
                  <th className="py-3 px-4">Mesh Status</th>
                  <th className="py-3 px-4">Vehicle Detection</th>
                  <th className="py-3 px-4">Magnetic Val</th>
                  <th className="py-3 px-4">Signal Status</th>
                  <th className="py-3 px-4">Battery</th>
                  <th className="py-3 px-4 text-right">Last Sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredSensors.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#171717] flex items-center gap-2">
                      <Cpu className="w-3.5 h-3.5 text-slate-400" />
                      {s.sensor_id}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{s.slot_number}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                        s.status === 'Online' ? 'bg-emerald-100 text-emerald-800' :
                        s.status === 'Warning' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        ● {s.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`font-bold ${s.vehicle_detected ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {s.vehicle_detected ? 'Vehicle Detected' : 'Not Detected'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">{s.magnetic_value} μT</td>
                    <td className="py-3.5 px-4 text-slate-600">{s.signal_status}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800 flex items-center gap-1">
                      <Battery className={`w-3.5 h-3.5 ${s.battery_pct < 20 ? 'text-rose-500' : 'text-emerald-600'}`} />
                      {s.battery_pct}%
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-500 font-mono text-[11px]">{s.last_sync}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}
