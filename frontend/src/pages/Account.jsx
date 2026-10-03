import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Car, Mail, Phone, Edit2, ArrowLeft, Check, Plus, PlusCircle, X, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { formatCurrency } from '../utils/formatters';
import BuyCreditsModal from '../components/BuyCreditsModal';

export default function Account() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, updateProfile } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [isBuyCreditsOpen, setIsBuyCreditsOpen] = useState(false);
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);

  // Edit Profile States
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [vehicleNumber, setVehicleNumber] = useState(user?.vehicle_number || '');
  const [vehicleType, setVehicleType] = useState(user?.vehicle_type || 'CAR');
  const [saving, setSaving] = useState(false);

  // New Vehicle Modal States
  const [newPlate, setNewPlate] = useState('');
  const [newType, setNewType] = useState('CAR');
  const [addingVehicle, setAddingVehicle] = useState(false);

  useEffect(() => {
    if (searchParams.get('add_vehicle') === 'true') {
      setIsAddVehicleOpen(true);
    }
  }, [searchParams]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await updateProfile({
      name,
      phone,
      vehicle_number: vehicleNumber,
      vehicle_type: vehicleType
    });
    setSaving(false);
    if (res.success) {
      addNotification({
        title: 'Profile Updated',
        message: 'Your account profile and primary vehicle details have been updated.',
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

  const handleAddNewVehicle = async (e) => {
    e.preventDefault();
    if (!newPlate.trim()) {
      addNotification({
        title: 'Plate Number Required',
        message: 'Please enter a valid vehicle license plate number.',
        type: 'error'
      });
      return;
    }

    setAddingVehicle(true);
    const res = await updateProfile({
      vehicle_number: newPlate.trim().toUpperCase(),
      vehicle_type: newType
    });
    setAddingVehicle(false);

    if (res.success) {
      addNotification({
        title: 'New Vehicle Registered',
        message: `Successfully set ${newPlate.toUpperCase()} (${newType === 'CAR' ? '🚗 Car' : '🏍️ Bike'}) as active vehicle.`,
        type: 'success'
      });
      setIsAddVehicleOpen(false);
      setNewPlate('');
      // remove searchParam
      setSearchParams({});
    } else {
      addNotification({
        title: 'Registration Failed',
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
          <p className="text-xs text-slate-500 font-medium">User details & vehicle settings</p>
        </div>
      </div>

      {/* User Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-[#FFD21F] flex items-center justify-center text-[#171717] font-extrabold text-2xl shadow-sm">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-extrabold text-[#171717]">{user?.name || 'User Account'}</h2>
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold uppercase tracking-wider">
              {user?.role || 'User'} Account
            </span>
          </div>
        </div>

        {/* PARK-A-LOT Wallet & Rewards Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-md space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">💳</span>
              <h3 className="font-extrabold text-sm text-[#FFD21F]">PARK-A-LOT Wallet</h3>
            </div>
            <button
              onClick={() => setIsBuyCreditsOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#FFD21F] hover:bg-[#E5B800] text-[#171717] font-extrabold text-[11px] shadow-xs flex items-center gap-1 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              Buy Credits
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Wallet Credits</span>
              <span className="text-3xl font-black text-[#FFD21F]">{user?.wallet_credits || user?.wallet_balance || 0} <span className="text-sm font-bold text-slate-300">Credits</span></span>
            </div>
            <div className="text-right text-xs text-slate-400 font-medium">
              1 Credit = ₹1
            </div>
          </div>

          <div className="text-[11px] text-slate-300 font-medium bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/60">
            💳 <strong>Wallet Credits:</strong> Buy credits with money to top up your wallet. Use your balance for instant 1-click checkout and 100% full early exit refunds!
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

            <div>
              <label className="text-slate-600 block font-bold mb-1">Vehicle Category / Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setVehicleType('CAR')}
                  className={`p-3 rounded-xl border font-extrabold text-xs flex items-center justify-center gap-2 transition-all ${
                    vehicleType === 'CAR'
                      ? 'bg-amber-50 border-amber-400 text-amber-950 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  🚗 Four Wheeler (Car)
                </button>
                <button
                  type="button"
                  onClick={() => setVehicleType('BIKE')}
                  className={`p-3 rounded-xl border font-extrabold text-xs flex items-center justify-center gap-2 transition-all ${
                    vehicleType === 'BIKE'
                      ? 'bg-blue-50 border-blue-400 text-blue-950 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  🏍️ Two Wheeler (Bike)
                </button>
              </div>
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

            {/* Registered Vehicle Card with Add New Vehicle CTA */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-amber-900" />
                  <span className="font-extrabold text-amber-950 text-xs">Primary Active Vehicle</span>
                </div>
                <button
                  onClick={() => setIsAddVehicleOpen(true)}
                  className="px-3 py-1 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-[11px] flex items-center gap-1 shadow-2xs transition-all active:scale-95"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Add New Vehicle
                </button>
              </div>

              <div className="p-3 bg-white rounded-xl border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">License Plate</span>
                  <span className="font-mono font-black text-emerald-800 text-base">{user?.vehicle_number || 'N/A'}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Vehicle Type</span>
                  <span className={`inline-block px-2.5 py-0.5 rounded-md font-extrabold text-xs border ${
                    user?.vehicle_type === 'BIKE'
                      ? 'bg-blue-50 text-blue-900 border-blue-200'
                      : 'bg-amber-100 text-amber-950 border-amber-300'
                  }`}>
                    {user?.vehicle_type === 'BIKE' ? '🏍️ Bike / Two Wheeler' : '🚗 Car / Four Wheeler'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200 transition-all shadow-xs"
              >
                <Edit2 className="w-4 h-4 text-slate-700" />
                Edit Profile Details
              </button>

              <button
                onClick={() => setIsAddVehicleOpen(true)}
                className="py-3 px-4 rounded-xl bg-[#FFD21F] hover:bg-[#E5B800] text-[#171717] font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                Add New Vehicle
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ADD NEW VEHICLE MODAL */}
      {isAddVehicleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#171717]">Add New Vehicle</h3>
                  <p className="text-xs text-slate-500 font-medium">Register vehicle license plate & type</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddVehicleOpen(false);
                  setSearchParams({});
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewVehicle} className="space-y-4 text-xs font-medium">
              <div>
                <label className="text-slate-700 font-bold block mb-1.5">
                  Vehicle License Plate Number *
                </label>
                <input
                  type="text"
                  required
                  value={newPlate}
                  onChange={(e) => setNewPlate(e.target.value)}
                  placeholder="e.g. TN-09-CB-5678"
                  className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[#171717] font-mono uppercase font-black text-sm focus:outline-none focus:border-[#FFD21F] focus:ring-2 focus:ring-[#FFD21F]/40"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1.5">
                  Vehicle Type *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewType('CAR')}
                    className={`p-3.5 rounded-2xl border font-black text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                      newType === 'CAR'
                        ? 'bg-amber-100 border-amber-400 text-amber-950 shadow-xs ring-2 ring-amber-400/40'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-xl">🚗</span>
                    <span>Car (Four-Wheeler)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewType('BIKE')}
                    className={`p-3.5 rounded-2xl border font-black text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                      newType === 'BIKE'
                        ? 'bg-blue-100 border-blue-400 text-blue-950 shadow-xs ring-2 ring-blue-400/40'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-xl">🏍️</span>
                    <span>Bike (Two-Wheeler)</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={addingVehicle}
                  className="flex-1 py-3.5 rounded-xl bg-[#FFD21F] hover:bg-[#E5B800] text-[#171717] font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  {addingVehicle ? 'Registering...' : 'Register Vehicle'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddVehicleOpen(false);
                    setSearchParams({});
                  }}
                  className="px-4 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BUY CREDITS MODAL */}
      <BuyCreditsModal
        isOpen={isBuyCreditsOpen}
        onClose={() => setIsBuyCreditsOpen(false)}
      />
    </div>
  );
}

