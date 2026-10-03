import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileCheck, MapPin, CheckCircle, XCircle, Search, RefreshCw, Layers } from 'lucide-react';
import api from '../services/api';
import { useNotification } from '../context/NotificationContext';

export default function AdminVerification() {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLot, setSelectedLot] = useState(null);
  const [docNotes, setDocNotes] = useState('');
  const [verifierName, setVerifierName] = useState('Admin Inspector (GCC / SmartPark)');
  const [verifiedCap, setVerifiedCap] = useState(20);
  const [physicalNotes, setPhysicalNotes] = useState('Physical facility inspected on-site. Sensor hardware, barrier gates, and total capacity verified.');
  const [submitting, setSubmitting] = useState(false);

  const { addNotification } = useNotification();

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/verifications');
      setVerifications(res.data || []);
      if (res.data && res.data.length > 0 && !selectedLot) {
        setSelectedLot(res.data[0]);
        setVerifiedCap(res.data[0].total_slots || 20);
      }
    } catch (err) {
      console.warn('Error fetching verifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  const handleDocReview = async (lotId, action) => {
    setSubmitting(true);
    try {
      const res = await api.post(`/admin/verifications/${lotId}/documents`, {
        action,
        notes: docNotes || 'Document verification reviewed by admin.'
      });
      addNotification({
        title: 'Document Review Updated',
        message: res.data.message,
        type: action === 'APPROVE' ? 'success' : 'error'
      });
      fetchVerifications();
    } catch (err) {
      addNotification({
        title: 'Error',
        message: err.response?.data?.detail || 'Failed to update document status.',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhysicalReview = async (lotId, action) => {
    setSubmitting(true);
    try {
      const res = await api.post(`/admin/verifications/${lotId}/physical`, {
        verifier_name: verifierName,
        verified_capacity: parseInt(verifiedCap, 10),
        notes: physicalNotes,
        action
      });
      addNotification({
        title: 'Physical Verification Updated',
        message: res.data.message,
        type: action === 'APPROVE' ? 'success' : 'error'
      });
      fetchVerifications();
    } catch (err) {
      addNotification({
        title: 'Error',
        message: err.response?.data?.detail || 'Failed to update physical verification status.',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLots = verifications.filter(l =>
    l.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.owner_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.verification_status?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#FFD21F]" />
            <span className="text-xs font-extrabold text-[#FFD21F] uppercase tracking-wider">Admin Verification Control</span>
          </div>
          <h1 className="text-2xl font-black">Two-Stage Owner Verification Management</h1>
          <p className="text-xs text-slate-300 font-medium">
            Stage 1 (Document Review) + Stage 2 (On-Site Physical Inspection) before parking lots become LIVE.
          </p>
        </div>

        <button
          onClick={fetchVerifications}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs flex items-center gap-2 border border-slate-700 shadow-xs transition-all self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: List of Owner Parking Lots */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search facility name, owner, status..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#FFD21F] outline-none"
            />
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="h-48 rounded-2xl bg-slate-200 animate-pulse" />
            ) : filteredLots.map((lot) => {
              const isSelected = selectedLot?.id === lot.id;
              const isApproved = lot.verification_status === 'APPROVED';
              return (
                <button
                  key={lot.id}
                  onClick={() => {
                    setSelectedLot(lot);
                    setVerifiedCap(lot.total_slots || 20);
                  }}
                  className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-slate-900 bg-amber-50/80 ring-2 ring-[#FFD21F]'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between pb-1">
                    <h3 className="font-extrabold text-slate-900 text-sm truncate">{lot.name}</h3>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      isApproved
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-900'
                    }`}>
                      {lot.verification_status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium truncate">{lot.address}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-600 font-bold mt-2">
                    <span>Owner: {lot.owner_name}</span>
                    <span>{lot.total_slots} Slots</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 2 Columns: Verification Workspace */}
        <div className="lg:col-span-2">
          {selectedLot ? (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
              
              {/* Facility Details Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                <div>
                  <h2 className="text-xl font-black text-slate-900">{selectedLot.name}</h2>
                  <p className="text-xs text-slate-500 flex items-center gap-1 font-medium mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" /> {selectedLot.address}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 font-bold block">CURRENT STATUS</span>
                  <span className={`text-xs font-black px-3 py-1 rounded-full inline-block ${
                    selectedLot.verification_status === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}>
                    {selectedLot.verification_status} ({selectedLot.is_live ? 'LIVE' : 'NOT LIVE'})
                  </span>
                </div>
              </div>

              {/* Owner & Capacity Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium">
                <div>
                  <span className="text-slate-400 block font-bold uppercase text-[10px]">Owner Name</span>
                  <span className="font-extrabold text-slate-900">{selectedLot.owner_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold uppercase text-[10px]">Total Capacity</span>
                  <span className="font-extrabold text-slate-900">{selectedLot.total_slots} Spaces</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold uppercase text-[10px]">Reservable</span>
                  <span className="font-extrabold text-blue-700">{selectedLot.reservable_capacity} Spaces</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold uppercase text-[10px]">Protected Buffer</span>
                  <span className="font-extrabold text-amber-800">{selectedLot.buffer_capacity || 2} Spaces</span>
                </div>
              </div>

              {/* STAGE 1: DOCUMENT VERIFICATION */}
              <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-amber-800" />
                  <h3 className="font-extrabold text-slate-900 text-sm">Stage 1: Ownership Document Review</h3>
                </div>
                <p className="text-xs text-slate-700 font-medium">
                  Submitted Documentation: <strong>{selectedLot.document_info}</strong>
                </p>

                <input
                  type="text"
                  value={docNotes}
                  onChange={(e) => setDocNotes(e.target.value)}
                  placeholder="Enter administrative document verification notes..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium bg-white focus:ring-2 focus:ring-[#FFD21F] outline-none"
                />

                <div className="flex items-center gap-3 pt-1">
                  <button
                    disabled={submitting}
                    onClick={() => handleDocReview(selectedLot.id, 'APPROVE')}
                    className="py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve Documents (Stage 1)
                  </button>
                  <button
                    disabled={submitting}
                    onClick={() => handleDocReview(selectedLot.id, 'REJECT')}
                    className="py-2.5 px-4 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" /> Reject Documents
                  </button>
                </div>
              </div>

              {/* STAGE 2: PHYSICAL IN-PERSON VERIFICATION */}
              <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-800" />
                  <h3 className="font-extrabold text-slate-900 text-sm">Stage 2: In-Person Physical Facility Verification</h3>
                </div>
                <p className="text-xs text-slate-700 font-medium">
                  Verify physical parking facility operational readiness on-site before making it publicly bookable to civilians.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Verifier Name</label>
                    <input
                      type="text"
                      value={verifierName}
                      onChange={(e) => setVerifierName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium bg-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Verified Physical Capacity</label>
                    <input
                      type="number"
                      value={verifiedCap}
                      onChange={(e) => setVerifiedCap(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium bg-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Physical Inspection Notes & Evidentiary Summary</label>
                  <textarea
                    rows={2}
                    value={physicalNotes}
                    onChange={(e) => setPhysicalNotes(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white outline-none"
                  />
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    disabled={submitting}
                    onClick={() => handlePhysicalReview(selectedLot.id, 'APPROVE')}
                    className="py-2.5 px-4 rounded-xl bg-[#171717] hover:bg-slate-900 text-[#FFD21F] font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4 text-[#FFD21F]" /> Approve & Make Facility LIVE
                  </button>
                  <button
                    disabled={submitting}
                    onClick={() => handlePhysicalReview(selectedLot.id, 'REJECT')}
                    className="py-2.5 px-4 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" /> Reject Physical Inspection
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center text-slate-500 font-medium">
              Select a facility from the list to manage Stage 1 & Stage 2 verification.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
