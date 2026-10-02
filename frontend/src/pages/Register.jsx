import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, User, Mail, Phone, Lock, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      addNotification({
        title: 'Validation Error',
        message: 'Passwords do not match.',
        type: 'error'
      });
      return;
    }

    setLoading(true);
    const res = await register(name, email, phone, password, vehicleNumber || 'TN-09-AB-1234');
    setLoading(false);

    if (res.success) {
      addNotification({
        title: 'Account Created',
        message: 'Welcome to SmartPark!',
        type: 'success'
      });
      navigate('/');
    } else {
      addNotification({
        title: 'Registration Failed',
        message: res.error,
        type: 'error'
      });
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 px-4 space-y-6">
      
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-3xl bg-[#FFD21F] flex items-center justify-center text-[#171717] mx-auto shadow-md">
          <Car className="w-8 h-8 text-[#171717]" />
        </div>
        <h1 className="text-3xl font-extrabold text-[#171717] tracking-tight">Welcome to SmartPark</h1>
        <p className="text-xs text-slate-500 font-medium">Find, reserve and manage your parking with ease.</p>
      </div>

      {/* Registration Form Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md space-y-5">
        <div className="space-y-1">
          <h2 className="text-lg font-extrabold text-[#171717]">Create your account</h2>
          <p className="text-xs text-slate-500 font-medium">Register for civilian parking access across South Chennai</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-3.5 text-xs font-medium">
          <div>
            <label className="text-slate-600 font-bold block mb-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ricardo Lopez"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717] placeholder-slate-400 focus:outline-none focus:border-[#FFD21F] focus:ring-2 focus:ring-[#FFD21F]/40"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-600 font-bold block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ricardo@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717] placeholder-slate-400 focus:outline-none focus:border-[#FFD21F] focus:ring-2 focus:ring-[#FFD21F]/40"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-600 font-bold block mb-1">Mobile Number</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717] placeholder-slate-400 focus:outline-none focus:border-[#FFD21F] focus:ring-2 focus:ring-[#FFD21F]/40"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-600 font-bold block mb-1">Vehicle Number</label>
            <div className="relative">
              <Car className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="TN-09-AB-1234"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717] placeholder-slate-400 focus:outline-none focus:border-[#FFD21F] focus:ring-2 focus:ring-[#FFD21F]/40 uppercase font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-600 font-bold block mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717] placeholder-slate-400 focus:outline-none focus:border-[#FFD21F] focus:ring-2 focus:ring-[#FFD21F]/40"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-600 font-bold block mb-1">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717] placeholder-slate-400 focus:outline-none focus:border-[#FFD21F] focus:ring-2 focus:ring-[#FFD21F]/40"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#FFD21F] hover:bg-[#E5B800] text-[#171717] font-extrabold text-sm flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50 mt-2"
          >
            <UserPlus className="w-4 h-4" />
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-600 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-slate-900 font-extrabold hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
