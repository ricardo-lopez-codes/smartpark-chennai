import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Wifi,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Copy,
  Check,
  Radio,
  Activity,
  Zap,
  ChevronDown,
  ChevronUp,
  AlertTriangle
} from 'lucide-react';
import {
  getStoredESP32Url,
  saveStoredESP32Url,
  fetchESP32Health,
  fetchESP32Data,
  DEFAULT_ESP32_URL
} from '../../services/esp32Service';

export default function OwnerESP32Config() {
  const [gatewayUrl, setGatewayUrl] = useState(getStoredESP32Url());
  const [activeUrl, setActiveUrl] = useState(getStoredESP32Url());
  const [connecting, setConnecting] = useState(false);
  
  // Connection Test States
  const [healthStatus, setHealthStatus] = useState(null); // { connected: boolean, statusText: string, raw: object }
  const [dataPayload, setDataPayload] = useState(null);   // normalized payload or null
  const [lastFetchTime, setLastFetchTime] = useState(null);

  // UI state
  const [copied, setCopied] = useState(false);
  const [rawExpanded, setRawExpanded] = useState(true);

  // Function to run connection test & update states
  const runConnectionCheck = async (urlToTest = activeUrl) => {
    setConnecting(true);
    try {
      const [hRes, dRes] = await Promise.all([
        fetchESP32Health(urlToTest),
        fetchESP32Data(urlToTest)
      ]);
      setHealthStatus(hRes);
      setDataPayload(dRes);
      setLastFetchTime(new Date());
    } catch (err) {
      console.warn('ESP32 check error:', err);
    } finally {
      setConnecting(false);
    }
  };

  // On mount and when activeUrl changes, run initial check and setup 1s poll
  useEffect(() => {
    runConnectionCheck(activeUrl);

    const interval = setInterval(() => {
      fetchESP32Data(activeUrl).then((dRes) => {
        setDataPayload(dRes);
        setLastFetchTime(new Date());
      }).catch(() => {});

      fetchESP32Health(activeUrl).then((hRes) => {
        setHealthStatus(hRes);
      }).catch(() => {});
    }, 1000);

    return () => clearInterval(interval);
  }, [activeUrl]);

  const handleConnectSubmit = (e) => {
    e.preventDefault();
    const saved = saveStoredESP32Url(gatewayUrl);
    setGatewayUrl(saved);
    setActiveUrl(saved);
    runConnectionCheck(saved);
  };

  const handleCopyRawJson = () => {
    if (!dataPayload?.raw) return;
    const jsonStr = JSON.stringify(dataPayload.raw, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isOnline = dataPayload?.connected && healthStatus?.connected;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      
      {/* Header & Connection Badge */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#FFD21F] flex items-center justify-center text-[#171717] font-extrabold shadow-sm">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-[#171717]">ESP32 Hardware Integration</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-[#FFD21F] font-mono text-[10px] font-black uppercase">
                433MHz LoRa Gateway
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Configure receiver IP address & view real-time physical sensor telemetry for Slot A1.
            </p>
          </div>
        </div>

        {/* Status Indicator Pill */}
        <div className="flex items-center gap-2 shrink-0">
          <div className={`px-4 py-2 rounded-2xl font-extrabold text-xs flex items-center gap-2 border shadow-2xs ${
            isOnline
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}>
            <span className={`w-2.5 h-2.5 rounded-full ${
              isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
            }`} />
            <span>{isOnline ? '● ESP32 ONLINE' : '● ESP32 OFFLINE'}</span>
          </div>
        </div>
      </div>

      {/* Gateway Configuration Panel */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="font-extrabold text-[#171717] text-base flex items-center gap-2">
            <Radio className="w-4 h-4 text-blue-600" />
            ESP32 Gateway Configuration
          </h2>
          <span className="text-xs text-slate-400 font-mono font-bold">Default: {DEFAULT_ESP32_URL}</span>
        </div>

        <form onSubmit={handleConnectSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              ESP32 Gateway IP / URL Address *
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Wifi className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={gatewayUrl}
                  onChange={(e) => setGatewayUrl(e.target.value)}
                  placeholder="http://192.168.4.1"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-[#171717] font-mono font-extrabold text-sm focus:outline-none focus:border-[#FFD21F] focus:ring-2 focus:ring-[#FFD21F]/40"
                />
              </div>

              <button
                type="submit"
                disabled={connecting}
                className="py-3 px-6 rounded-2xl bg-[#FFD21F] hover:bg-[#E5B800] text-[#171717] font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 disabled:opacity-50 shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${connecting ? 'animate-spin' : ''}`} />
                {connecting ? 'Testing...' : 'Connect'}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1.5">
              Enter standalone IP or full URL (e.g. <code className="text-slate-800 font-mono">192.168.4.1</code> or <code className="text-slate-800 font-mono">http://192.168.4.1</code>).
            </p>
          </div>
        </form>

        {/* Connection Tests Checklist */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs font-medium">
          <div className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider mb-1">
            Endpoint Diagnostic Test Results:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* GET /health Result */}
            <div className={`p-3 rounded-xl border flex items-center justify-between ${
              healthStatus?.connected
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-rose-50/70 border-rose-200 text-rose-950'
            }`}>
              <div className="flex items-center gap-2 font-bold">
                {healthStatus?.connected ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600" />
                )}
                <span>GET /health Endpoint</span>
              </div>
              <span className="font-mono text-[11px] font-bold">
                {healthStatus?.connected ? '✓ Reachable' : '✗ Unreachable'}
              </span>
            </div>

            {/* GET /data Result */}
            <div className={`p-3 rounded-xl border flex items-center justify-between ${
              dataPayload?.connected
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-rose-50/70 border-rose-200 text-rose-950'
            }`}>
              <div className="flex items-center gap-2 font-bold">
                {dataPayload?.connected ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600" />
                )}
                <span>GET /data Endpoint</span>
              </div>
              <span className="font-mono text-[11px] font-bold">
                {dataPayload?.connected ? '✓ Reachable' : '✗ Unreachable'}
              </span>
            </div>
          </div>

          {!isOnline && (
            <div className="mt-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs font-medium flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">ESP32 Offline:</strong> Make sure your laptop is connected to the ESP32 receiver Wi-Fi network <code className="font-bold bg-amber-200/60 px-1 rounded">PARK_A_LOT_IOT</code> and the gateway IP <code className="font-bold bg-amber-200/60 px-1 rounded">{activeUrl}</code> is reachable.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Telemetry Cards for Slot A1 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* A1 Status */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Slot A1 Status</span>
          <span className={`text-base font-black px-2.5 py-1 rounded-lg inline-block border ${
            dataPayload?.slotStatus === 'OCCUPIED'
              ? 'bg-rose-100 text-rose-950 border-rose-300'
              : dataPayload?.slotStatus === 'AVAILABLE'
              ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
              : dataPayload?.slotStatus === 'WAITING'
              ? 'bg-amber-100 text-amber-950 border-amber-300'
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}>
            {dataPayload?.slotStatus || '--'}
          </span>
        </div>

        {/* RSSI */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">RSSI Signal</span>
          <span className="text-lg font-black text-slate-900 font-mono block">
            {dataPayload?.rssi || '--'}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">LoRa Signal Strength</span>
        </div>

        {/* SNR */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">SNR Ratio</span>
          <span className="text-lg font-black text-slate-900 font-mono block">
            {dataPayload?.snr || '--'}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Signal-to-Noise</span>
        </div>

        {/* Packet Count */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Packets Received</span>
          <span className="text-lg font-black text-blue-700 font-mono block">
            {dataPayload?.packetCount || '--'}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Telemetry Packets</span>
        </div>

        {/* Last Update */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1 col-span-2 md:col-span-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Last Update</span>
          <span className="text-lg font-black text-slate-900 font-mono block">
            {dataPayload?.lastUpdateMs || '--'}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">ESP32 Latency</span>
        </div>
      </div>

      {/* Collapsible Raw ESP32 Data */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-md space-y-4">
        <div
          onClick={() => setRawExpanded(!rawExpanded)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#FFD21F]" />
            <h3 className="font-extrabold text-sm text-[#FFD21F]">Raw ESP32 Data (GET /data)</h3>
          </div>

          <div className="flex items-center gap-3">
            {dataPayload?.raw && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyRawJson();
                }}
                className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-colors border border-slate-700"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy JSON'}
              </button>
            )}
            {rawExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </div>
        </div>

        {rawExpanded && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs overflow-x-auto custom-scrollbar text-amber-300">
            {dataPayload?.raw ? (
              <pre>{JSON.stringify(dataPayload.raw, null, 2)}</pre>
            ) : (
              <span className="text-slate-500 italic">No raw JSON payload received. ESP32 is currently offline.</span>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
