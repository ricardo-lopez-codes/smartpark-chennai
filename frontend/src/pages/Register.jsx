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
  const [carSlots, setCarSlots] = useState(15);
  const [bikeSlots, setBikeSlots] = useState(10);
  const [carPricePerHour, setCarPricePerHour] = useState(40);
  const [bikePricePerHour, setBikePricePerHour] = useState(20);
  const [slotPrefix, setSlotPrefix] = useState('A');
  const [slotStartNum, setSlotStartNum] = useState(1);
  const [slotEndNum, setSlotEndNum] = useState(25);
  const [openingTime, setOpeningTime] = useState('06:00');
  const [closingTime, setClosingTime] = useState('23:00');
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

  // Helper to generate live slot preview array (e.g. A1..A15 for Cars, B1..B10 for Bikes)
  const generateSlotPreview = () => {
    const slots = [];
    const cCount = Math.min(Math.max(Number(carSlots) || 0, 0), 100);
    const bCount = Math.min(Math.max(Number(bikeSlots) || 0, 0), 100);

    for (let i = 1; i <= cCount; i++) {
      slots.push(`A${i} (Car)`);
    }
    for (let i = 1; i <= bCount; i++) {
      slots.push(`B${i} (Bike)`);
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

    const formattedVehicleType = (vehicleType === 'Two Wheeler' || vehicleType === 'Bike') ? 'BIKE' : 'CAR';

    setLoading(true);
    const res = await registerCivilian(
      civilianName.trim(),
      civilianEmail.trim(),
      civilianPhone.trim(),
      civilianPassword,
      vehicleNumber.trim() || 'TN-09-AB-1234',
      formattedVehicleType
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
    if (Number(carSlots) < 0 || Number(bikeSlots) < 0 || (Number(carSlots) + Number(bikeSlots)) === 0) {
      addNotification({ title: 'Validation Error', message: 'Please specify at least 1 Car or Bike slot.', type: 'error' });
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

    const totalSlots = Number(carSlots) + Number(bikeSlots);

    setLoading(true);
    const res = await registerOwner({
      company_name: companyName.trim(),
      person_name: personName.trim(),
      number_of_slots: totalSlots,
      car_slots: Number(carSlots),
      bike_slots: Number(bikeSlots),
      car_price_per_hour: Number(carPricePerHour) || 40.0,
      bike_price_per_hour: Number(bikePricePerHour) || 20.0,
      slot_prefix: 'A',
      slot_start_num: 1,
      slot_end_num: totalSlots,
      opening_time: openingTime,
      closing_time: closingTime,
      phone: ownerPhone.trim(),
      email: ownerEmail.trim(),
      password: ownerPassword,
      address: address.trim() || `${companyName}, ${areaName}, South Chennai`,
      area_name: areaName,
      price_per_hour: Number(carPricePerHour) || 40.0
    });
    setLoading(false);

    if (res.success) {
      addNotification({
        title: 'Space Owner Registered',
        message: `Welcome ${personName}! Your facility '${companyName}' is now live on civilian dashboards!`,
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
                  placeholder="e.g. Express Avenue Parking"
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

            {/* VEHICLE TYPE SLOTS & PRICING CONFIGURATOR */}
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-300 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
                <span className="font-extrabold text-amber-950 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-700" />
                  Vehicle Slot & Pricing Configurator
                </span>
                <span className="text-[11px] font-extrabold bg-[#171717] text-[#FFD21F] px-2.5 py-1 rounded-lg font-mono">
                  Total Slots: {Number(carSlots || 0) + Number(bikeSlots || 0)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* CAR PARKING CONFIG */}
                <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                    <span className="text-base">🚗</span> Car Parking
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-slate-600 block text-[10px] font-bold mb-1">Car Slots</label>
                      <input
                        type="number"
                        min="0"
                        max="200"
                        value={carSlots}
                        onChange={(e) => setCarSlots(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-[#171717] font-extrabold text-center"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 block text-[10px] font-bold mb-1">Rate (₹/hr)</label>
                      <input
                        type="number"
                        min="5"
                        max="500"
                        value={carPricePerHour}
                        onChange={(e) => setCarPricePerHour(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-[#171717] font-extrabold text-center"
                      />
                    </div>
                  </div>
                </div>

                {/* BIKE PARKING CONFIG */}
                <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                    <span className="text-base">🏍️</span> Two Wheeler / Bike Parking
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-slate-600 block text-[10px] font-bold mb-1">Bike Slots</label>
                      <input
                        type="number"
                        min="0"
                        max="200"
                        value={bikeSlots}
                        onChange={(e) => setBikeSlots(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-[#171717] font-extrabold text-center"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 block text-[10px] font-bold mb-1">Rate (₹/hr)</label>
                      <input
                        type="number"
                        min="5"
                        max="500"
                        value={bikePricePerHour}
                        onChange={(e) => setBikePricePerHour(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-[#171717] font-extrabold text-center"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* LIVE GENERATED SLOTS PREVIEW */}
              <div className="pt-2 border-t border-amber-200/80 space-y-1.5">
                <span className="text-[10px] uppercase font-extrabold text-amber-900 tracking-wider block">
                  Generated Slots Preview ({generateSlotPreview().length} slots):
                </span>
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto custom-scrollbar p-2 bg-white rounded-xl border border-amber-200 font-mono text-[11px]">
                  {generateSlotPreview().length > 0 ? (
                    generateSlotPreview().map((slotLabel, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-0.5 rounded-md font-black text-[10px] border ${
                          slotLabel.includes('Car')
                            ? 'bg-blue-50 text-blue-900 border-blue-200'
                            : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                        }`}
                      >
                        {slotLabel}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic text-[10px]">No slots specified</span>
                  )}
                </div>
              </div>
            </div>

            {/* OPERATING HOURS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
