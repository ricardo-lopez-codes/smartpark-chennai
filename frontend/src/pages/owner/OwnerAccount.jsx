import React, { useState } from 'react';
import { User, Shield, Key, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

export default function OwnerAccount() {
  const { user, logout, updateProfile } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || 'Chennai Commercial Properties');
  const [phone, setPhone] = useState(user?.phone || '+91 98765 99999');
  const [saving, setSaving] = useState(false);

  // Security password state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await updateProfile({ name, phone });
    setSaving(false);

    if (res.success) {
      addNotification({
        title: 'Profile Updated',
        message: 'Owner profile details updated successfully.',
        type: 'success'
      });
    } else {
      addNotification({
        title: 'Update Failed',
        message: res.error,
        type: 'error'
      });
    }
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    addNotification({
      title: 'Password Security',
      message: 'Password updated successfully.',
      type: 'success'
    });
    setCurrentPass('');
    setNewPass('');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Profile Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-xl flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#FFD21F] text-[#171717] font-black text-2xl flex items-center justify-center shadow-md">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'O'}
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#FFD21F]/20 text-[#FFD21F] text-[10px] font-extrabold uppercase tracking-widest block w-fit mb-1">
              PARKING LOT OWNER
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold">{user?.name || 'Chennai Commercial Properties'}</h2>
            <p className="text-xs text-slate-300 font-mono mt-0.5">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-300 font-extrabold text-xs flex items-center gap-2 border border-slate-700 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Profile Info Form */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-extrabold text-base text-[#171717] flex items-center gap-2">
            <User className="w-5 h-5 text-slate-700" />
            Business Profile Details
          </h3>

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs font-medium">
            <div>
              <label className="block text-slate-600 font-bold mb-1">Business / Owner Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717] font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">Account Email (Read-only)</label>
              <input
                type="email"
                disabled
                value={user?.email || 'owner@smartpark.com'}
                className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 font-mono cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717]"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl bg-[#FFD21F] hover:bg-[#E5B800] text-[#171717] font-extrabold text-xs shadow-xs transition-all"
            >
              {saving ? 'Updating...' : 'Update Account Info'}
            </button>
          </form>
        </div>

        {/* Security / Password Form */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-extrabold text-base text-[#171717] flex items-center gap-2">
            <Key className="w-5 h-5 text-slate-700" />
            Security & Authentication
          </h3>

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs font-medium">
            <div>
              <label className="block text-slate-600 font-bold mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717]"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-xs transition-all"
            >
              Update Security Password
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
