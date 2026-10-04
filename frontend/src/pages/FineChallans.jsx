import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertOctagon, ArrowLeft, ShieldAlert, CheckCircle2, Clock, DollarSign, RefreshCw, AlertCircle, FileText, Check } from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatDate, formatTime } from '../utils/formatters';

export default function FineChallans() {
  const [challans, setChallans] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const navigate = useNavigate();

  const fetchChallans = async () => {
    setLoading(true);
    try {
      const res = await api.get('/v1/challans/me');
      setChallans(res.data || []);
    } catch (err) {
      console.warn('Error loading fine challans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallans();
  }, []);

  const handlePayFine = async (challanId, amount) => {
    setPayingId(challanId);
    try {
      const res = await api.post(`/v1/challans/${challanId}/pay`);
      setToastMessage({ type: 'success', text: `Fine payment of ₹${amount} successful! Challan cleared.` });
      fetchChallans();
    } catch (err) {
      const errorDetail = err.response?.data?.detail || 'Failed to pay fine. Please check wallet balance.';
      setToastMessage({ type: 'error', text: errorDetail });
    } finally {
      setPayingId(null);
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  const filteredChallans = challans.filter(c => {
    if (filterStatus === 'UNPAID') return c.status === 'UNPAID';
    if (filterStatus === 'PAID') return c.status === 'PAID';
    return true;
  });

  const unpaidCount = challans.filter(c => c.status === 'UNPAID').length;
  const unpaidTotal = challans
    .filter(c => c.status === 'UNPAID')
    .reduce((sum, c) => sum + (c.fine_amount || 0), 0);

  const getViolationBadge = (type) => {
    switch (type) {
      case 'OVERSTAY':
        return <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Overstay Violation</span>;
      case 'WRONG_SLOT':
        return <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Wrong Slot Violation</span>;
      case 'UNRESERVED_PARKING':
        return <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-900 border border-purple-200 text-xs font-bold flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5" /> Unreserved Parking</span>;
      case 'BUFFER_VIOLATION':
      default:
        return <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold flex items-center gap-1.5"><AlertOctagon className="w-3.5 h-3.5" /> Buffer Violation</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 px-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-5 right-5 z-50 p-4 rounded-xl shadow-xl text-white font-bold flex items-center gap-3 transition-all ${
          toastMessage.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-[#171717] flex items-center gap-2">
              <AlertOctagon className="w-7 h-7 text-rose-600" />
              Fine Challans & Violations
            </h1>
            <p className="text-xs text-slate-500 font-medium">Automatic penalty billing based on sensor & parking rule violations</p>
          </div>
        </div>

        <button
          onClick={fetchChallans}
          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-lg space-y-1">
          <span className="text-xs font-semibold tracking-wider uppercase opacity-90">Total Unpaid Fines</span>
          <div className="text-3xl font-black">{formatCurrency(unpaidTotal)}</div>
          <p className="text-xs text-rose-100 font-medium">{unpaidCount} pending challan(s) requiring settlement</p>
        </div>

        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-950 shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase text-amber-800">Penalty Rate Formula</span>
          <div className="text-2xl font-black text-amber-900">1.5x Hourly Rent</div>
          <p className="text-xs text-amber-700 font-medium">1 hr fine = 1.5x standard hourly slot rental rate (₹60/hr @ ₹40 rent)</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 text-white shadow-lg space-y-1">
          <span className="text-xs font-semibold tracking-wider uppercase text-amber-400">GCC Enforcement</span>
          <div className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-amber-400" />
            LoRa Automated
          </div>
          <p className="text-xs text-slate-300 font-medium">Violations auto-flagged via ESP32 geomagnetic sensors</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {['ALL', 'UNPAID', 'PAID'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              filterStatus === status
                ? 'bg-[#171717] text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {status === 'ALL' ? 'All Challans' : status}
          </button>
        ))}
      </div>

      {/* Challans List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 font-medium space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-500" />
          <p>Fetching violation records from server...</p>
        </div>
      ) : filteredChallans.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No Fine Challans Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">You have no {filterStatus.toLowerCase()} parking violation records or pending fines. Maintain compliant parking to avoid penalties!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredChallans.map((challan) => (
            <div
              key={challan.id || challan.challan_id}
              className={`p-6 rounded-2xl bg-white border transition-all shadow-sm ${
                challan.status === 'UNPAID'
                  ? 'border-rose-200 hover:border-rose-300 shadow-rose-50/50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getViolationBadge(challan.violation_type)}
                    <span className="text-xs font-mono font-bold text-slate-400">ID: {challan.challan_id}</span>
                  </div>
                  <h3 className="text-base font-extrabold text-[#171717]">{challan.violation_reason}</h3>
                  <p className="text-xs text-slate-500">
                    Issued on {formatDate(challan.issued_at)} at {formatTime(challan.issued_at)}
                  </p>
                </div>

                <div className="text-left md:text-right flex md:flex-col justify-between items-center md:items-end">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Fine Amount</span>
                    <span className="text-2xl font-black text-rose-600">{formatCurrency(challan.fine_amount)}</span>
                  </div>
                  <div className="mt-1">
                    {challan.status === 'UNPAID' ? (
                      <span className="px-3 py-1 rounded-full bg-rose-500 text-white text-[11px] font-black tracking-wider uppercase shadow-xs">
                        UNPAID
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-[11px] font-black tracking-wider uppercase flex items-center gap-1 shadow-xs">
                        <Check className="w-3 h-3" /> PAID
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Penalty Calculation Breakdown */}
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase block">Slot Location</span>
                  <span className="font-extrabold text-slate-800">
                    {challan.slot_number ? `Slot ${challan.slot_number}` : 'N/A'}
                    {challan.assigned_slot_number && challan.assigned_slot_number !== challan.slot_number && (
                      <span className="text-rose-500 text-[10px] block font-normal">Assigned: {challan.assigned_slot_number}</span>
                    )}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase block">Base Rent Rate</span>
                  <span className="font-extrabold text-slate-800">{formatCurrency(challan.hourly_rent_rate)}/hr</span>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase block">Fine Multiplier</span>
                  <span className="font-extrabold text-amber-600">{challan.fine_multiplier}x Rate ({formatCurrency(challan.fine_rate_per_hour)}/hr)</span>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase block">Violation Duration</span>
                  <span className="font-extrabold text-slate-800">{challan.duration_hours} Hour(s)</span>
                </div>
              </div>

              {/* Action */}
              {challan.status === 'UNPAID' && (
                <div className="mt-4 pt-3 flex items-center justify-between">
                  <span className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                    <ShieldAlert className="w-4 h-4" /> Unpaid penalties may restrict future slot bookings.
                  </span>

                  <button
                    onClick={() => handlePayFine(challan.challan_id, challan.fine_amount)}
                    disabled={payingId === challan.challan_id}
                    className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {payingId === challan.challan_id ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Processing Wallet Payment...
                      </>
                    ) : (
                      <>
                        <DollarSign className="w-4 h-4" />
                        Pay Fine ({formatCurrency(challan.fine_amount)})
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
