import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Car, Mail, Phone, Edit2, ArrowLeft, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export default function Account() {
  const { user, updateProfile } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [vehicleNumber, setVehicleNumber] = useState(user?.vehicle_number || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await updateProfile({ name, phone, vehicle_number: vehicleNumber });
    setSaving(false);
    if (res.success) {
      addNotification({
        title: 'Profile Updated',
        message: 'Your account profile has been updated successfully.',
        type: 'success'
      });
      setIsEditing(false);
    } else {
      addNotification({
        title: 'Update Failed',
        message: res.error,
        type: 'error'
      });
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-[#171717]">My Account</h1>
          <p className="text-xs text-slate-500 font-medium">Civilian user details & vehicle settings</p>
        </div>
      </div>

      {/* User Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-[#FFD21F] flex items-center justify-center text-[#171717] font-extrabold text-2xl shadow-sm">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#171717]">{user?.name || 'Civilian User'}</h2>
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold uppercase tracking-wider">
              {user?.role || 'civilian'} Account
            </span>
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4 text-xs font-medium">
            <div>
              <label className="text-slate-600 block font-bold mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717] focus:outline-none focus:border-[#FFD21F] focus:ring-2 focus:ring-[#FFD21F]/40"
              />
            </div>
            <div>
              <label className="text-slate-600 block font-bold mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717] focus:outline-none focus:border-[#FFD21F] focus:ring-2 focus:ring-[#FFD21F]/40"
              />
            </div>
            <div>
              <label className="text-slate-600 block font-bold mb-1">Primary Vehicle License Plate</label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717] focus:outline-none focus:border-[#FFD21F] focus:ring-2 focus:ring-[#FFD21F]/40 font-mono uppercase font-bold"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3.5 rounded-xl bg-[#FFD21F] hover:bg-[#E5B800] text-[#171717] font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
              >
                <Check className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 text-xs font-medium">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-700" />
                <div>
                  <span className="text-slate-500 block">Email Address</span>
                  <span className="font-bold text-slate-900">{user?.email || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-700" />
                <div>
                  <span className="text-slate-500 block">Phone Number</span>
                  <span className="font-bold text-slate-900">{user?.phone || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <Car className="w-4 h-4 text-slate-700" />
                <div>
                  <span className="text-slate-500 block">Registered Vehicle Plate</span>
                  <span className="font-mono font-extrabold text-emerald-700 text-sm">{user?.vehicle_number || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsEditing(true)}
                className="w-full py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200 transition-all shadow-xs"
              >
                <Edit2 className="w-4 h-4 text-slate-700" />
                Edit Profile & Vehicle Number
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
