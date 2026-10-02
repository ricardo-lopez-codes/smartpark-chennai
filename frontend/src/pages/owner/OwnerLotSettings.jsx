import React, { useState, useEffect } from 'react';
import { Settings, Save, MapPin, Phone, Mail, Clock, Shield, CheckSquare } from 'lucide-react';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

export default function OwnerLotSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { addNotification } = useNotification();

  const [name, setName] = useState('Saravana Stores Parking');
  const [address, setAddress] = useState('11th Main Rd, Block AA, Anna Nagar, Chennai');
  const [phone, setPhone] = useState('+91 44 2434 1122');
  const [email, setEmail] = useState('contact@saravanastores.in');
  const [price, setPrice] = useState(40);
  const [openingTime, setOpeningTime] = useState('09:00');
  const [closingTime, setClosingTime] = useState('22:00');
  const [description, setDescription] = useState('Premium multi-level covered smart parking facility with 24/7 CCTV & EV Charging.');
  const [maxDuration, setMaxDuration] = useState(8);
  const [cancellationPolicy, setCancellationPolicy] = useState('Full refund minus 1 hour parking fee if cancelled before start time.');
  
  const [facilities, setFacilities] = useState({
    cctv: true,
    evCharging: true,
    security: true,
    covered: true,
    accessible: true
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/owner/parking-lots/1');
      if (res.data) {
        setName(res.data.name || 'Saravana Stores Parking');
        setAddress(res.data.address || '11th Main Rd, Block AA, Anna Nagar, Chennai');
        setPhone(res.data.phone || '+91 44 2434 1122');
        setEmail(res.data.email || 'owner@smartpark.com');
        setPrice(res.data.price_per_hour || 40);
        setOpeningTime(res.data.opening_time || '09:00');
        setClosingTime(res.data.closing_time || '22:00');
        setDescription(res.data.description || 'Premium multi-level covered smart parking facility with 24/7 CCTV & EV Charging.');
      }
    } catch (err) {
      console.error('Failed to fetch lot settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const facilityStr = Object.entries(facilities)
        .filter(([_, val]) => val)
        .map(([key]) => key)
        .join(', ');

      await api.put('/owner/parking-lots/1', {
        name,
        address,
        phone,
        email,
        price_per_hour: parseFloat(price),
        opening_time: openingTime,
        closing_time: closingTime,
        description,
        facilities: facilityStr,
        max_duration_hours: parseInt(maxDuration),
        cancellation_policy: cancellationPolicy
      });

      addNotification({
        title: 'Settings Saved',
        message: 'Parking lot parameters updated successfully.',
        type: 'success'
      });
    } catch (err) {
      addNotification({
        title: 'Save Failed',
        message: err.response?.data?.detail || 'Error saving settings.',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      
      {/* Header */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#171717]">Parking Lot Configuration</h2>
          <p className="text-xs text-slate-500">Operating hours, base pricing rules, and property details</p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 rounded-2xl bg-[#FFD21F] hover:bg-[#E5B800] text-[#171717] font-extrabold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Basic Info & Hours */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Basic Information */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-[#171717]">Basic Information</h3>

            <div className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Parking Lot Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717] font-bold focus:outline-none focus:border-[#FFD21F]"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Address Location</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717] focus:outline-none focus:border-[#FFD21F]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Support Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717]"
                />
              </div>
            </div>
          </div>

          {/* Operating Hours & Rules */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-[#171717]">Operating Hours & Reservation Rules</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-medium">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Opening Time</label>
                <input
                  type="time"
                  value={openingTime}
                  onChange={(e) => setOpeningTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717]"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">Closing Time</label>
                <input
                  type="time"
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717]"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">Base Price (₹/hr)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717] font-bold"
                />
              </div>
            </div>

            <div className="pt-2 text-xs font-medium space-y-3">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Cancellation Policy</label>
                <input
                  type="text"
                  value={cancellationPolicy}
                  onChange={(e) => setCancellationPolicy(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717]"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right 1 Col: Facilities & Security */}
        <div className="space-y-6">
          
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-[#171717]">Available Facilities</h3>
            <p className="text-xs text-slate-500">Displayed on civilian mobile app search card</p>

            <div className="space-y-3 pt-2 text-xs font-bold text-[#171717]">
              {[
                { id: 'cctv', label: '24/7 CCTV Surveillance' },
                { id: 'evCharging', label: 'EV Charging Bays' },
                { id: 'security', label: 'Security Personnel' },
                { id: 'covered', label: 'Covered Multi-level Garage' },
                { id: 'accessible', label: 'Accessible Wheelchair Parking' }
              ].map(fac => (
                <label key={fac.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={facilities[fac.id]}
                    onChange={(e) => setFacilities({ ...facilities, [fac.id]: e.target.checked })}
                    className="w-4 h-4 rounded text-[#171717] focus:ring-[#FFD21F]"
                  />
                  <span>{fac.label}</span>
                </label>
              ))}
            </div>
          </div>

        </div>

      </div>

    </form>
  );
}
