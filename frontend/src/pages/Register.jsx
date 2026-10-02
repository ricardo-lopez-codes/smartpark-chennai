import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, Building2, User, Mail, Phone, Lock, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export default function Register() {
  // Account Type Selection Tab: 'civilian' | 'owner'
  const [accountType, setAccountType] = useState('civilian');

  // Civilian Form State
  const [civilianName, setCivilianName] = useState('');
  const [civilianPhone, setCivilianPhone] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('Car');
  const [civilianEmail, setCivilianEmail] = useState('');
  const [civilianPassword, setCivilianPassword] = useState('');
  const [civilianConfirmPassword, setCivilianConfirmPassword] = useState('');

  // Owner Form State
  const [companyName, setCompanyName] = useState('');
  const [personName, setPersonName] = useState('');
  const [numberOfSlots, setNumberOfSlots] = useState(20);
  const [slotPrefix, setSlotPrefix] = useState('A');
  const [slotStartNum, setSlotStartNum] = useState(1);
  const [slotEndNum, setSlotEndNum] = useState(20);
  const [openingTime, setOpeningTime] = useState('06:00');
  const [closingTime, setClosingTime] = useState('23:00');
  const [pricePerHour, setPricePerHour] = useState(40);
  const [areaName, setAreaName] = useState('Anna Nagar');
  const [address, setAddress] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [ownerConfirmPassword, setOwnerConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const { registerCivilian, registerOwner } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  // Helper to generate live slot preview array (e.g. A1, A2, A3 ... A20)
  const generateSlotPreview = () => {
    const prefix = (slotPrefix || 'A').toUpperCase().trim();
    const start = Number(slotStartNum) || 1;
    const end = Number(slotEndNum) || (start + Number(numberOfSlots) - 1);
    const slots = [];
    const count = Math.min(Math.max(end - start + 1, 0), 200);

    for (let i = 0; i < count; i++) {
      slots.push(`${prefix}${start + i}`);
    }
    return slots;
  };

  const handleCivilianSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!civilianName.trim()) {
      addNotification({ title: 'Validation Error', message: 'Full Name is required.', type: 'error' });
      return;
    }
    if (!civilianPhone.trim()) {
      addNotification({ title: 'Validation Error', message: 'Mobile Phone Number is required.', type: 'error' });
      return;
    }
    if (!civilianEmail.trim() || !civilianEmail.includes('@')) {
      addNotification({ title: 'Validation Error', message: 'Valid email address is required.', type: 'error' });
      return;
    }
    if (civilianPassword.length < 6) {
      addNotification({ title: 'Validation Error', message: 'Password must be at least 6 characters.', type: 'error' });
      return;
    }
    if (civilianPassword !== civilianConfirmPassword) {
      addNotification({ title: 'Validation Error', message: 'Passwords do not match.', type: 'error' });
      return;
    }

    setLoading(true);
    const res = await registerCivilian(
      civilianName.trim(),
      civilianEmail.trim(),
      civilianPhone.trim(),
      civilianPassword,
      vehicleNumber.trim() || 'TN-09-AB-1234'
    );
    setLoading(false);

    if (res.success) {
      addNotification({ title: 'Account Created', message: 'Welcome to PARK-A-LOT!', type: 'success' });
      navigate('/');
    } else {
      addNotification({ title: 'Registration Failed', message: res.error, type: 'error' });
    }
  };

  const handleOwnerSubmit = async (e) => {
    e.preventDefault();

    // Owner Validation
    if (!companyName.trim()) {
      addNotification({ title: 'Validation Error', message: 'Company / Parking Space Name is required.', type: 'error' });
      return;
    }
    if (!personName.trim()) {
      addNotification({ title: 'Validation Error', message: "Person's Name is required.", type: 'error' });
      return;
    }
    if (Number(numberOfSlots) <= 0) {
      addNotification({ title: 'Validation Error', message: 'Number of slots must be greater than 0.', type: 'error' });
      return;
    }
    if (Number(slotStartNum) > Number(slotEndNum)) {
      addNotification({ title: 'Validation Error', message: 'Slot start number cannot be greater than end number.', type: 'error' });
      return;
    }
    if (!openingTime || !closingTime) {
      addNotification({ title: 'Validation Error', message: 'Opening and closing times are required.', type: 'error' });
      return;
    }
    if (openingTime >= closingTime) {
      addNotification({ title: 'Validation Error', message: 'Closing time must be after opening time.', type: 'error' });
      return;
    }
    if (!ownerPhone.trim()) {
      addNotification({ title: 'Validation Error', message: 'Phone number is required.', type: 'error' });
      return;
    }
    if (!ownerEmail.trim() || !ownerEmail.includes('@')) {
      addNotification({ title: 'Validation Error', message: 'Valid email address is required.', type: 'error' });
      return;
    }
    if (ownerPassword.length < 6) {
      addNotification({ title: 'Validation Error', message: 'Password must be at least 6 characters.', type: 'error' });
      return;
    }
    if (ownerPassword !== ownerConfirmPassword) {
      addNotification({ title: 'Validation Error', message: 'Passwords do not match.', type: 'error' });
      return;
    }

    setLoading(true);
    const res = await registerOwner({
      company_name: companyName.trim(),
      person_name: personName.trim(),
      number_of_slots: Number(numberOfSlots),
      slot_prefix: (slotPrefix || 'A').toUpperCase().trim(),
      slot_start_num: Number(slotStartNum),
      slot_end_num: Number(slotEndNum),
      opening_time: openingTime,
      closing_time: closingTime,
      phone: ownerPhone.trim(),
      email: ownerEmail.trim(),
      password: ownerPassword,
      address: address.trim() || `${companyName}, ${areaName}, South Chennai`,
      area_name: areaName,
      price_per_hour: Number(pricePerHour) || 40.0
    });
    setLoading(false);

    if (res.success) {
      addNotification({
        title: 'Space Owner Registered',
        message: `Welcome ${personName}! Your parking lot '${companyName}' is now live.`,
        type: 'success'
      });
      navigate('/owner');
    } else {
      addNotification({ title: 'Registration Failed', message: res.error, type: 'error' });
    }
  };

  const slotPreviewList = generateSlotPreview();

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      
      {/* Brand & Page Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-3xl bg-[#FFD21F] flex items-center justify-center text-[#171717] mx-auto shadow-md">
          <Car className="w-7 h-7 text-[#171717]" />
        </div>
        <h1 className="text-3xl font-extrabold text-[#171717] tracking-tight">
          Create Your PARK-A-LOT Account
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Select account type below to get started
        </p>
      </div>

      {/* Account Type Tab Selector */}
      <div className="p-1.5 rounded-2xl bg-slate-200/80 grid grid-cols-2 gap-1.5 max-w-md mx-auto shadow-inner">
        <button
          type="button"
          onClick={() => setAccountType('civilian')}
          className={`py-3 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all ${
            accountType === 'civilian'
              ? 'bg-[#FFD21F] text-[#171717] shadow-md scale-[1.02]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50'
          }`}
        >
          <Car className="w-4 h-4" />
          Civilian
        </button>

        <button
          type="button"
          onClick={() => setAccountType('owner')}
          className={`py-3 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all ${
            accountType === 'owner'
              ? 'bg-slate-900 text-[#FFD21F] shadow-md scale-[1.02]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Parking Space Owner
        </button>
      </div>

      {/* CIVILIAN REGISTRATION FORM */}
      {accountType === 'civilian' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-md space-y-5">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-[#171717]">Civilian Driver Registration</h2>
              <p className="text-xs text-slate-500 font-medium">Find and reserve parking slots across South Chennai</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[10px] uppercase">
              Civilian
            </span>
          </div>

          <form onSubmit={handleCivilianSubmit} className="space-y-4 text-xs font-medium">
            
            {/* Full Name */}
            <div>
              <label className="text-slate-700 font-bold block mb-1">Full Name *</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={civilianName}
                  onChange={(e) => setCivilianName(e.target.value)}
                  placeholder="Ricardo Lopez"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717] focus:outline-none focus:border-[#FFD21F] focus:ring-2 focus:ring-[#FFD21F]/40"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="text-slate-700 font-bold block mb-1">Phone Number *</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  required
                  value={civilianPhone}
                  onChange={(e) => setCivilianPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717] focus:outline-none focus:border-[#FFD21F] focus:ring-2 focus:ring-[#FFD21F]/40"
                />
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Vehicle Number</label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="TN-09-AB-1234"
                  className="w-full px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717] font-mono font-bold uppercase focus:outline-none focus:border-[#FFD21F]"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Vehicle Type</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717] font-bold focus:outline-none focus:border-[#FFD21F]"
                >
                  <option value="Car">Car / SUV</option>
                  <option value="Sedan">Sedan</option>
                  <option value="Two Wheeler">Two Wheeler / Bike</option>
                  <option value="EV">EV Car</option>
                  <option value="Auto">Auto / Commercial</option>
                </select>
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="text-slate-700 font-bold block mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={civilianEmail}
                  onChange={(e) => setCivilianEmail(e.target.value)}
                  placeholder="civilian@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717] focus:outline-none focus:border-[#FFD21F] focus:ring-2 focus:ring-[#FFD21F]/40"
                />
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={civilianPassword}
                    onChange={(e) => setCivilianPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717] focus:outline-none focus:border-[#FFD21F]"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Confirm Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={civilianConfirmPassword}
                    onChange={(e) => setCivilianConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717] focus:outline-none focus:border-[#FFD21F]"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#FFD21F] hover:bg-[#E5B800] text-[#171717] font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50 mt-4"
            >
              <UserPlus className="w-4 h-4" />
              {loading ? 'Creating Civilian Account...' : 'Create Civilian Account'}
            </button>
          </form>
        </div>
      )}

      {/* PARKING SPACE OWNER REGISTRATION FORM */}
      {accountType === 'owner' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-md space-y-5">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-[#171717]">Space Owner Registration</h2>
              <p className="text-xs text-slate-500 font-medium">List your commercial parking space & configure live slots</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-slate-900 text-[#FFD21F] font-extrabold text-[10px] uppercase">
              Owner Portal
            </span>
          </div>

          <form onSubmit={handleOwnerSubmit} className="space-y-4 text-xs font-medium">
            
            {/* Company & Person Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Company / Parking Space Name *</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Saravana Stores Parking"
                  className="w-full px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717] font-bold focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Person's Name *</label>
                <input
                  type="text"
                  required
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717] font-bold focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>

            {/* Area Location & Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-700 font-bold block mb-1">South Chennai Area *</label>
                <select
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717] font-bold focus:outline-none focus:border-slate-900"
                >
                  <option value="Anna Nagar">Anna Nagar</option>
                  <option value="T. Nagar">T. Nagar</option>
                  <option value="Velachery">Velachery</option>
                  <option value="Marina">Marina</option>
                  <option value="Adyar">Adyar</option>
                  <option value="Guindy">Guindy</option>
                  <option value="Koyambedu">Koyambedu</option>
                  <option value="Vadapalani">Vadapalani</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Full Street Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="11th Main Rd, Block AA, Anna Nagar"
                  className="w-full px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717] focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>

            {/* SLOT RANGE CONFIGURATOR BOX */}
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-300 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-amber-950 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-700" />
                  Slot Range Configurator
                </span>
                <span className="text-[10px] font-extrabold bg-[#171717] text-[#FFD21F] px-2.5 py-0.5 rounded-md font-mono">
                  {slotPrefix.toUpperCase() || 'A'}{slotStartNum} – {slotPrefix.toUpperCase() || 'A'}{slotEndNum}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-xs">
                <div>
                  <label className="text-slate-700 block text-[10px] font-bold mb-1">Number of Slots</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={numberOfSlots}
                    onChange={(e) => {
                      const count = Number(e.target.value);
                      setNumberOfSlots(count);
                      setSlotEndNum(Number(slotStartNum) + count - 1);
                    }}
                    className="w-full px-2.5 py-2.5 rounded-xl bg-white border border-amber-300 text-[#171717] font-extrabold text-center"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block text-[10px] font-bold mb-1">Slot Prefix</label>
                  <input
                    type="text"
                    maxLength="3"
                    value={slotPrefix}
                    onChange={(e) => setSlotPrefix(e.target.value)}
                    className="w-full px-2.5 py-2.5 rounded-xl bg-white border border-amber-300 text-[#171717] font-black text-center uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block text-[10px] font-bold mb-1">Start Num</label>
                  <input
                    type="number"
                    min="1"
                    value={slotStartNum}
                    onChange={(e) => {
                      const start = Number(e.target.value);
                      setSlotStartNum(start);
                      setSlotEndNum(start + Number(numberOfSlots) - 1);
                    }}
                    className="w-full px-2.5 py-2.5 rounded-xl bg-white border border-amber-300 text-[#171717] font-black text-center font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block text-[10px] font-bold mb-1">End Num</label>
                  <input
                    type="number"
                    value={slotEndNum}
                    onChange={(e) => setSlotEndNum(Number(e.target.value))}
                    className="w-full px-2.5 py-2.5 rounded-xl bg-white border border-amber-300 text-[#171717] font-black text-center font-mono"
                  />
                </div>
              </div>

              {/* LIVE GENERATED SLOTS PREVIEW */}
              <div className="pt-2 border-t border-amber-200/80 space-y-1.5">
                <span className="text-[10px] uppercase font-extrabold text-amber-900 tracking-wider block">
                  Generated Slots Preview:
                </span>
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto custom-scrollbar p-2 bg-white rounded-xl border border-amber-200 font-mono text-[11px]">
                  {slotPreviewList.length > 0 ? (
                    slotPreviewList.map((slotNum) => (
                      <span
                        key={slotNum}
                        className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-950 font-black text-[10px] border border-amber-300"
                      >
                        {slotNum}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic text-[10px]">Invalid slot range numbers</span>
                  )}
                </div>
              </div>
            </div>

            {/* OPERATING HOURS & PRICE */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Opening Time *</label>
                <input
                  type="time"
                  required
                  value={openingTime}
                  onChange={(e) => setOpeningTime(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[#171717] font-mono font-bold focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Closing Time *</label>
                <input
                  type="time"
                  required
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[#171717] font-mono font-bold focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Price / Hour (₹)</label>
                <input
                  type="number"
                  min="10"
                  max="500"
                  value={pricePerHour}
                  onChange={(e) => setPricePerHour(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[#171717] font-bold focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>

            {/* PHONE & EMAIL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Phone Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    placeholder="+91 98765 99999"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717] focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="owner@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717] focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* PASSWORDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717] focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Confirm Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={ownerConfirmPassword}
                    onChange={(e) => setOwnerConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717] focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-black text-[#FFD21F] font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50 mt-4"
            >
              <Building2 className="w-4 h-4" />
              {loading ? 'Creating Space Owner Portal...' : 'Create Owner Account'}
            </button>
          </form>
        </div>
      )}

      {/* Login link footer */}
      <div className="text-center pt-2">
        <p className="text-xs text-slate-600 font-medium">
          Already have an account?{' '}
          <Link to="/login" className="text-slate-900 font-extrabold hover:underline">
            Log in
          </Link>
        </p>
      </div>

    </div>
  );
}
