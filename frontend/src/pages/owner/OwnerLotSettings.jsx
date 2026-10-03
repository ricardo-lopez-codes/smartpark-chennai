import React, { useState, useEffect } from 'react';
import { Settings, Save, MapPin, Phone, Mail, Clock, Shield, CheckSquare, Layers, Sparkles, UserCheck } from 'lucide-react';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

const STANDARD_FACILITIES = [
  'CCTV',
  'EV Charging',
  'Security',
  'Covered Parking',
  'Accessible Parking',
  'Car Wash',
  'Restrooms',
  'Valet Parking',
  '24/7 Security'
];

export default function OwnerLotSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { addNotification } = useNotification();

  // Basic Details
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Slot Configuration & Vehicle Types
  const [totalSlots, setTotalSlots] = useState(25);
  const [carSlots, setCarSlots] = useState(15);
  const [bikeSlots, setBikeSlots] = useState(10);
  const [carPrice, setCarPrice] = useState(40);
  const [bikePrice, setBikePrice] = useState(20);
  const [slotPrefix, setSlotPrefix] = useState('A');
  const [slotStart, setSlotStart] = useState(1);
  const [slotEnd, setSlotEnd] = useState(25);

  // Operating Hours & Rules
  const [openingTime, setOpeningTime] = useState('06:00');
  const [closingTime, setClosingTime] = useState('23:00');
  const [price, setPrice] = useState(40);
  const [description, setDescription] = useState('');
  const [cancellationPolicy, setCancellationPolicy] = useState('');

  // Facilities
  const [selectedFacilities, setSelectedFacilities] = useState([]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/owner/lot-settings');
      if (res.data) {
        setCompanyName(res.data.company_name || '');
        setAddress(res.data.address || '');
        setContactPerson(res.data.contact_person || '');
        setPhone(res.data.phone || '');
        setEmail(res.data.email || '');

        setTotalSlots(res.data.total_slots || 25);
        setCarSlots(res.data.car_slots ?? 15);
        setBikeSlots(res.data.bike_slots ?? 10);
        setCarPrice(res.data.car_price_per_hour ?? 40);
        setBikePrice(res.data.bike_price_per_hour ?? 20);
        setSlotPrefix(res.data.slot_prefix || 'A');
        setSlotStart(res.data.slot_start || 1);
        setSlotEnd(res.data.slot_end || 25);

        setOpeningTime(res.data.opening_time || '06:00');
        setClosingTime(res.data.closing_time || '23:00');
        setPrice(res.data.price_per_hour || 40);
        setDescription(res.data.description || '');
        setCancellationPolicy(res.data.cancellation_policy || '');

        setSelectedFacilities(res.data.facilities || []);
      }
    } catch (err) {
      console.error('Failed to fetch lot settings:', err);
      addNotification({
        title: 'Error',
        message: 'Failed to load lot settings from backend database.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Compute live slot preview
  const computeSlotPreview = () => {
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

  const toggleFacility = (facility) => {
    if (selectedFacilities.includes(facility)) {
      setSelectedFacilities(selectedFacilities.filter(f => f !== facility));
    } else {
      setSelectedFacilities([...selectedFacilities, facility]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!companyName.trim()) {
      addNotification({ title: 'Validation Error', message: 'Company Name is required.', type: 'error' });
      return;
    }
    if (Number(carSlots) < 0 || Number(bikeSlots) < 0 || (Number(carSlots) + Number(bikeSlots)) === 0) {
      addNotification({ title: 'Validation Error', message: 'Please specify at least 1 Car or Bike slot.', type: 'error' });
      return;
    }
    if (openingTime >= closingTime) {
      addNotification({ title: 'Validation Error', message: 'Closing time must be after opening time.', type: 'error' });
      return;
    }

    const computedTotal = Number(carSlots) + Number(bikeSlots);

    setSaving(true);
    try {
      const payload = {
        company_name: companyName.trim(),
        address: address.trim(),
        contact_person: contactPerson.trim(),
        phone: phone.trim(),
        email: email.trim(),
        total_slots: computedTotal,
        car_slots: Number(carSlots),
        bike_slots: Number(bikeSlots),
        car_price_per_hour: Number(carPrice),
        bike_price_per_hour: Number(bikePrice),
        slot_prefix: (slotPrefix || 'A').toUpperCase().trim(),
        slot_start: Number(slotStart),
        slot_end: Number(slotEnd),
        opening_time: openingTime,
        closing_time: closingTime,
        price_per_hour: Number(carPrice),
        facilities: selectedFacilities,
        description: description.trim(),
        cancellation_policy: cancellationPolicy.trim()
      };

      const res = await api.put('/owner/lot-settings', payload);

      if (res.data) {
        addNotification({
          title: 'Settings Saved',
          message: 'Parking lot settings updated and persisted in central database.',
          type: 'success'
        });

        // Notify parent layout & header to refresh global lot info
        window.dispatchEvent(new Event('ownerLotSettingsUpdated'));
      }
    } catch (err) {
      console.error('Save settings error:', err);
      addNotification({
        title: 'Save Failed',
        message: err.response?.data?.detail || 'Could not update settings in database.',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const slotPreview = computeSlotPreview();

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-bold space-y-3">
        <div className="w-10 h-10 border-4 border-[#FFD21F] border-t-transparent rounded-full animate-spin mx-auto" />
        <p>Loading lot settings from database...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      
      {/* Top Header & Save Button */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#171717] flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#FFD21F]" />
            Parking Lot Settings (Global Source of Truth)
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Changes save directly to FastAPI & database and reflect instantly across civilian and owner portals.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3.5 rounded-2xl bg-[#FFD21F] hover:bg-[#E5B800] text-[#171717] font-extrabold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50 flex-shrink-0"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving to Database...' : 'Save All Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Basic Info, Slot Range, Operating Hours */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section A: Company & Location */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-[#171717] flex items-center gap-2">
              <MapPin className="w-5 h-5 text-slate-700" />
              Company Name & Location
            </h3>

            <div className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Company / Parking Space Name *</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Phoenix Mall Parking"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717] font-extrabold text-sm focus:outline-none focus:border-[#FFD21F] focus:ring-2 focus:ring-[#FFD21F]/40"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Street Address *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 11th Main Rd, Velachery, Chennai"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717] focus:outline-none focus:border-[#FFD21F]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Public Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Multi-level covered smart parking facility with 24/7 CCTV & EV Charging."
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717] focus:outline-none focus:border-[#FFD21F]"
                />
              </div>
            </div>
          </div>

          {/* Section B: Vehicle Slot Breakdown & Pricing Configurator */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-[#171717] flex items-center gap-2">
                <Layers className="w-5 h-5 text-slate-700" />
                Vehicle Slot & Hourly Rate Configuration
              </h3>
              <span className="text-[11px] font-extrabold bg-[#171717] text-[#FFD21F] px-3 py-1 rounded-lg font-mono">
                Total Capacity: {Number(carSlots || 0) + Number(bikeSlots || 0)} Slots
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* CAR PARKING CONFIG */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                    <span className="text-lg">🚗</span> Car Parking Space
                  </div>
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-900 font-extrabold text-[10px]">
                    Zone A (A1..A{carSlots})
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-700 block font-bold mb-1">Car Slots Count</label>
                    <input
                      type="number"
                      min="0"
                      max="200"
                      value={carSlots}
                      onChange={(e) => setCarSlots(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-[#171717] font-extrabold text-center"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 block font-bold mb-1">Car Rate (₹/hr)</label>
                    <input
                      type="number"
                      min="5"
                      max="500"
                      value={carPrice}
                      onChange={(e) => setCarPrice(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-[#171717] font-extrabold text-center"
                    />
                  </div>
                </div>
              </div>

              {/* BIKE PARKING CONFIG */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                    <span className="text-lg">🏍️</span> Two Wheeler / Bike Space
                  </div>
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-extrabold text-[10px]">
                    Zone B (B1..B{bikeSlots})
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-700 block font-bold mb-1">Bike Slots Count</label>
                    <input
                      type="number"
                      min="0"
                      max="200"
                      value={bikeSlots}
                      onChange={(e) => setBikeSlots(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-[#171717] font-extrabold text-center"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 block font-bold mb-1">Bike Rate (₹/hr)</label>
                    <input
                      type="number"
                      min="5"
                      max="500"
                      value={bikePrice}
                      onChange={(e) => setBikePrice(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-[#171717] font-extrabold text-center"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Generated Slots Array Preview */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
              <span className="text-[10px] uppercase font-extrabold text-amber-950 tracking-wider block">
                Generated Slot Breakdown Preview ({slotPreview.length} slots):
              </span>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto custom-scrollbar p-2 bg-white rounded-xl border border-amber-200 font-mono text-[11px]">
                {slotPreview.length > 0 ? (
                  slotPreview.map((slotLabel, idx) => (
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
                  <span className="text-slate-400 italic text-[10px]">No slots configured</span>
                )}
              </div>
            </div>
          </div>

          {/* Section C: Operating Hours & Rules */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-[#171717] flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-700" />
              Operating Hours & Pricing Rules
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Opening Time *</label>
                <input
                  type="time"
                  required
                  value={openingTime}
                  onChange={(e) => setOpeningTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717] font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Closing Time *</label>
                <input
                  type="time"
                  required
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717] font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Base Price (₹/hr) *</label>
                <input
                  type="number"
                  min="10"
                  max="1000"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717] font-extrabold text-sm"
                />
              </div>
            </div>

            <div className="pt-2 text-xs font-medium space-y-2">
              <label className="block text-slate-700 font-bold">Cancellation Policy</label>
              <input
                type="text"
                value={cancellationPolicy}
                onChange={(e) => setCancellationPolicy(e.target.value)}
                placeholder="Full refund minus 1 hour parking fee if cancelled before start time."
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717]"
              />
            </div>
          </div>

        </div>

        {/* Right 1 Col: Contact Details & Available Facilities */}
        <div className="space-y-6">
          
          {/* Section D: Contact Details */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-[#171717] flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-slate-700" />
              Contact Information
            </h3>

            <div className="space-y-3 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Contact Person</label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="e.g. Ricardo Lopez"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717] font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Support Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="support@parkinglot.com"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717]"
                />
              </div>
            </div>
          </div>

          {/* Section F: Available Facilities */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-[#171717] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Available Facilities
              </h3>
              <span className="text-[10px] font-bold text-slate-500">
                {selectedFacilities.length} Selected
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Checkboxes automatically reflect on civilian parking search and lot cards.
            </p>

            <div className="space-y-2 pt-1 text-xs font-bold text-[#171717]">
              {STANDARD_FACILITIES.map(fac => {
                const isSelected = selectedFacilities.includes(fac);
                return (
                  <label
                    key={fac}
                    onClick={() => toggleFacility(fac)}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-50 border-amber-300 text-amber-950 font-extrabold shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-[#171717] focus:ring-[#FFD21F]"
                    />
                    <span>{fac}</span>
                  </label>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </form>
  );
}
