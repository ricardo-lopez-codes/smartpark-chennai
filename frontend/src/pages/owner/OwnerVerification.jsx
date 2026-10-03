import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  FileCheck,
  Calendar,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Building,
  Upload,
  Phone,
  FileText,
  MapPin,
  Sparkles,
  ArrowRight,
  BadgeCheck,
  Info
} from 'lucide-react';
import api from '../../services/api';

export default function OwnerVerification() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusData, setStatusData] = useState(null);
  const [activeTab, setActiveTab] = useState('stage1');
  const [toastMessage, setToastMessage] = useState(null);

  // Stage 1 Document Form State
  const [docForm, setDocForm] = useState({
    commercial_license: '',
    property_deed_ref: '',
    gstin: '',
    govt_id_type: 'Aadhaar / PAN Card',
    govt_id_number: '',
    contact_phone: '',
    address: '',
    additional_notes: ''
  });

  // Stage 2 Appointment Form State
  const getTomorrowDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const [appointmentForm, setAppointmentForm] = useState({
    appointment_date: getTomorrowDate(),
    appointment_time: '10:00 AM - 12:00 PM',
    contact_person: '',
    contact_phone: '',
    site_instructions: 'Please enter via Main Commercial Gate A. Parking Supervisor available at security booth.'
  });

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await api.get('/owner/verification-status');
      setStatusData(res.data);

      if (res.data) {
        setDocForm(prev => ({
          ...prev,
          contact_phone: res.data.address ? prev.contact_phone : '',
          address: res.data.address || ''
        }));
        setAppointmentForm(prev => ({
          ...prev,
          contact_phone: res.data.inspection_appointment_contact || ''
        }));

        if (res.data.verification_status === 'PHYSICAL_INSPECTION_SCHEDULED' || res.data.verification_status === 'APPROVED') {
          setActiveTab('stage2');
        } else if (res.data.verification_status === 'PHYSICAL_VERIFICATION_PENDING') {
          setActiveTab('stage2');
        } else {
          setActiveTab('stage1');
        }
      }
    } catch (err) {
      console.error('Error fetching verification status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleDocumentSubmit = async (e) => {
    e.preventDefault();
    if (!docForm.commercial_license || !docForm.property_deed_ref) {
      alert('Please fill in required fields: Commercial License and Property Deed Reference.');
      return;
    }
    try {
      setSubmitting(true);
      const res = await api.post('/owner/submit-documents', docForm);
      setToastMessage({ type: 'success', text: res.data.message });
      await fetchStatus();
      setActiveTab('stage2');
    } catch (err) {
      console.error('Error submitting documents:', err);
      setToastMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to submit documents. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAppointmentSubmit = async (e) => {
    e.preventDefault();
    if (!appointmentForm.appointment_date || !appointmentForm.contact_phone) {
      alert('Please select an appointment date and provide a contact phone number.');
      return;
    }
    try {
      setSubmitting(true);
      const res = await api.post('/schedule-appointment', appointmentForm);
      setToastMessage({ type: 'success', text: res.data.message });
      await fetchStatus();
    } catch (err) {
      console.error('Error scheduling appointment:', err);
      setToastMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to schedule appointment.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-[#FFD21F] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-extrabold text-slate-500">Loading facility verification status...</p>
      </div>
    );
  }

  const verStatus = statusData?.verification_status || 'DOCUMENT_VERIFICATION_PENDING';
  const isApproved = verStatus === 'APPROVED' || statusData?.is_live;
  const isDocSubmitted = ['PHYSICAL_VERIFICATION_PENDING', 'PHYSICAL_INSPECTION_SCHEDULED', 'APPROVED'].includes(verStatus);
  const isApptScheduled = ['PHYSICAL_INSPECTION_SCHEDULED', 'APPROVED'].includes(verStatus);

  const timeSlots = [
    '09:00 AM - 11:00 AM',
    '11:00 AM - 01:00 PM',
    '02:00 PM - 04:00 PM',
    '04:00 PM - 06:00 PM'
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-[#111827] text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-[#FFD21F]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#FFD21F] text-[#171717] font-black">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#FFD21F]">
              Official GCC & PARK-A-LOT Owner Portal
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Parking Facility Verification & 1-to-1 Interview Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-medium">
            Complete your 2-stage verification to activate your commercial parking facility on the PARK-A-LOT live network in South Chennai.
          </p>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`p-4 rounded-2xl flex items-center justify-between font-extrabold text-xs ${
          toastMessage.type === 'success' ? 'bg-emerald-100 text-emerald-950 border border-emerald-300' : 'bg-rose-100 text-rose-950 border border-rose-300'
        }`}>
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="underline ml-4">Dismiss</button>
        </div>
      )}

      {/* Progress Stepper Bar */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Step 1 Card */}
          <div className={`p-4 rounded-2xl border transition-all flex items-start gap-3 ${
            isDocSubmitted
              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
              : 'bg-amber-50/80 border-amber-300 text-amber-950'
          }`}>
            <div className={`p-2 rounded-xl shrink-0 ${isDocSubmitted ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
              {isDocSubmitted ? <CheckCircle2 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider block opacity-75">Stage 1</span>
              <h3 className="font-extrabold text-sm">Document Submission</h3>
              <p className="text-xs mt-0.5 opacity-90 font-medium">
                {isDocSubmitted ? 'Submitted & Under Review' : 'Action Required: Submit Proofs'}
              </p>
            </div>
          </div>

          {/* Step 2 Card */}
          <div className={`p-4 rounded-2xl border transition-all flex items-start gap-3 ${
            isApptScheduled
              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
              : isDocSubmitted
              ? 'bg-blue-50/80 border-blue-300 text-blue-950 animate-pulse'
              : 'bg-slate-50 border-slate-200 text-slate-400'
          }`}>
            <div className={`p-2 rounded-xl shrink-0 ${
              isApptScheduled ? 'bg-emerald-500 text-white' : isDocSubmitted ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600'
            }`}>
              {isApptScheduled ? <CheckCircle2 className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider block opacity-75">Stage 2</span>
              <h3 className="font-extrabold text-sm">1-to-1 On-Site Inspection</h3>
              <p className="text-xs mt-0.5 opacity-90 font-medium">
                {isApptScheduled ? 'Appointment Confirmed' : isDocSubmitted ? 'Schedule 1-to-1 Interview' : 'Pending Stage 1'}
              </p>
            </div>
          </div>

          {/* Step 3 Card */}
          <div className={`p-4 rounded-2xl border transition-all flex items-start gap-3 ${
            isApproved
              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
              : 'bg-slate-50 border-slate-200 text-slate-400'
          }`}>
            <div className={`p-2 rounded-xl shrink-0 ${isApproved ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-600'}`}>
              <BadgeCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider block opacity-75">Final Step</span>
              <h3 className="font-extrabold text-sm">Public Go-Live</h3>
              <p className="text-xs mt-0.5 opacity-90 font-medium">
                {isApproved ? 'Facility Live & Bookable' : 'Pending Verification'}
              </p>
            </div>
          </div>

        </div>

        {/* Tab Navigation Controls */}
        <div className="flex border-b border-slate-200 gap-6">
          <button
            onClick={() => setActiveTab('stage1')}
            className={`pb-3 font-extrabold text-xs sm:text-sm transition-all border-b-2 ${
              activeTab === 'stage1'
                ? 'border-[#171717] text-[#171717]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Stage 1: Submit Ownership Documents {isDocSubmitted && '✓'}
          </button>
          <button
            onClick={() => setActiveTab('stage2')}
            className={`pb-3 font-extrabold text-xs sm:text-sm transition-all border-b-2 ${
              activeTab === 'stage2'
                ? 'border-[#171717] text-[#171717]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Stage 2: 1-to-1 Inspection & Interview {isApptScheduled && '✓'}
          </button>
        </div>
      </div>

      {/* TAB 1 CONTENT: Stage 1 Document Submission */}
      {activeTab === 'stage1' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">Stage 1: Facility Ownership & Commercial Proofs</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Submit property deed numbers, commercial license, and owner identification for administrative audit.
              </p>
            </div>
            {isDocSubmitted && (
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-xs border border-emerald-300">
                Documents Submitted
              </span>
            )}
          </div>

          <form onSubmit={handleDocumentSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Commercial License */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-slate-500" />
                  Commercial Authorization License Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GCC/PK/2026/8492"
                  value={docForm.commercial_license}
                  onChange={(e) => setDocForm({ ...docForm, commercial_license: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#FFD21F] text-xs font-semibold text-slate-900"
                />
              </div>

              {/* Property Deed */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-500" />
                  Property Title Deed / Lease Agreement Ref *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DEED-CHENNAI-2024-9912"
                  value={docForm.property_deed_ref}
                  onChange={(e) => setDocForm({ ...docForm, property_deed_ref: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#FFD21F] text-xs font-semibold text-slate-900"
                />
              </div>

              {/* GSTIN */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-slate-500" />
                  GST Identification Number (GSTIN)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 33AAAAA0000A1Z5 (Optional for small space)"
                  value={docForm.gstin}
                  onChange={(e) => setDocForm({ ...docForm, gstin: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#FFD21F] text-xs font-semibold text-slate-900"
                />
              </div>

              {/* Govt ID Type & Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-slate-500" />
                  Government ID Proof Number (Aadhaar / PAN)
                </label>
                <input
                  type="text"
                  placeholder="e.g. ABCDE1234F or 1234-5678-9012"
                  value={docForm.govt_id_number}
                  onChange={(e) => setDocForm({ ...docForm, govt_id_number: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#FFD21F] text-xs font-semibold text-slate-900"
                />
              </div>

              {/* Contact Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-slate-500" />
                  Primary Commercial Phone Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. +91 98765 43210"
                  value={docForm.contact_phone}
                  onChange={(e) => setDocForm({ ...docForm, contact_phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#FFD21F] text-xs font-semibold text-slate-900"
                />
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  Full Commercial Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. No 42, Mount Road, Guindy, Chennai"
                  value={docForm.address}
                  onChange={(e) => setDocForm({ ...docForm, address: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#FFD21F] text-xs font-semibold text-slate-900"
                />
              </div>

            </div>

            {/* Document Upload Simulation Box */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-2">
              <Upload className="w-8 h-8 text-slate-400 mx-auto" />
              <div>
                <p className="text-xs font-extrabold text-slate-700">Scanned Document Copy Confirmation</p>
                <p className="text-[11px] text-slate-500 font-medium">
                  By submitting this form, you confirm that physical copies of your Commercial License and Property Deed will be presented during the 1-to-1 physical inspection audit.
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3.5 rounded-2xl bg-[#FFD21F] hover:bg-[#E5B800] text-[#171717] font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center gap-2"
              >
                {submitting ? 'Submitting Documents...' : 'Submit Stage 1 Documents →'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2 CONTENT: Stage 2 1-to-1 On-Site Inspection & Interview Scheduler */}
      {activeTab === 'stage2' && (
        <div className="space-y-6">
          
          {/* Status Alert */}
          {!isDocSubmitted && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 font-bold text-xs flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>Please submit your Stage 1 ownership documents first, or schedule your inspection appointment below.</span>
            </div>
          )}

          {/* Confirmed Appointment Card if already scheduled */}
          {isApptScheduled && statusData?.inspection_appointment_date && (
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-900 text-white shadow-xl space-y-5 border border-emerald-500/40 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-emerald-500 text-white font-black">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">
                      Confirmed 1-to-1 Interview & Audit
                    </span>
                    <h3 className="text-xl font-black">Inspection Appointment Scheduled</h3>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-extrabold text-xs">
                  CONFIRMED
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Scheduled Date</span>
                  <div className="flex items-center gap-2 text-sm font-extrabold text-white">
                    <Calendar className="w-4 h-4 text-[#FFD21F]" />
                    {statusData.inspection_appointment_date.split('T')[0]}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Time Slot</span>
                  <div className="flex items-center gap-2 text-sm font-extrabold text-white">
                    <Clock className="w-4 h-4 text-[#FFD21F]" />
                    {statusData.inspection_appointment_time || '10:00 AM - 12:00 PM'}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Auditor</span>
                  <div className="flex items-center gap-2 text-sm font-extrabold text-white truncate">
                    <UserCheck className="w-4 h-4 text-[#FFD21F]" />
                    GCC Senior Auditor
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700 text-xs space-y-1 text-slate-300">
                <p><strong>On-Site Contact Phone:</strong> {statusData.inspection_appointment_contact || 'Provided by owner'}</p>
                <p><strong>Site Instructions:</strong> {statusData.inspection_appointment_notes || 'Enter via Main Commercial Gate'}</p>
              </div>

              {/* 1-to-1 Audit Checklist Info */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <h4 className="font-extrabold text-xs text-[#FFD21F] uppercase tracking-wider flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  What will be audited during the 1-to-1 physical interview:
                </h4>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside font-medium">
                  <li>Physical slot count & bay layout alignment ({statusData.total_slots || 20} slots)</li>
                  <li>ESP32 Magnetometer Sensor hardware & wireless gateway testing</li>
                  <li>Entry/Exit barrier gate operations & CCTV coverage</li>
                  <li>Verification of original commercial deeds & license documents</li>
                </ul>
              </div>
            </div>
          )}

          {/* Appointment Scheduler Form */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-black text-slate-900">
                {isApptScheduled ? 'Reschedule 1-to-1 Inspection Appointment' : 'Schedule 1-to-1 On-Site Inspection & Interview'}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Select your preferred inspection date and time slot for the GCC / PARK-A-LOT physical audit team to visit your facility.
              </p>
            </div>

            <form onSubmit={handleAppointmentSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Date Picker */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    Preferred Inspection Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={getTomorrowDate()}
                    value={appointmentForm.appointment_date}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, appointment_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#FFD21F] text-xs font-semibold text-slate-900"
                  />
                </div>

                {/* Contact Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-slate-500" />
                    On-Site Person Direct Mobile Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +91 98765 43210"
                    value={appointmentForm.contact_phone}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, contact_phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#FFD21F] text-xs font-semibold text-slate-900"
                  />
                </div>

              </div>

              {/* Time Slot Selection Buttons */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-500" />
                  Select Preferred 2-Hour Time Window *
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setAppointmentForm({ ...appointmentForm, appointment_time: slot })}
                      className={`p-3 rounded-2xl font-extrabold text-xs transition-all border text-center ${
                        appointmentForm.appointment_time === slot
                          ? 'bg-slate-900 text-[#FFD21F] border-slate-900 shadow-sm'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Site Access Instructions */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  On-Site Gate Access & Landmark Instructions
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide instructions for the verifier (e.g. Commercial gate entry, parking level, security booth location)"
                  value={appointmentForm.site_instructions}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, site_instructions: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#FFD21F] text-xs font-semibold text-slate-900"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3.5 rounded-2xl bg-[#FFD21F] hover:bg-[#E5B800] text-[#171717] font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center gap-2"
                >
                  {submitting ? 'Confirming Appointment...' : 'Confirm 1-to-1 Inspection Appointment →'}
                </button>
              </div>
            </form>
          </div>

        </div>
      )}

    </div>
  );
}
