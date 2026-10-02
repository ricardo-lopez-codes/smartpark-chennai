import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, Mail, Lock, LogIn, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      addNotification({
        title: 'Welcome Back',
        message: 'Successfully logged into PARK-A-LOT',
        type: 'success'
      });
      navigate('/');
    } else {
      addNotification({
        title: 'Authentication Failure',
        message: res.error,
        type: 'error'
      });
    }
  };

  const handleQuickDemoLogin = async () => {
    setEmail('demo@smartpark.in');
    setPassword('Demo@123');
    setLoading(true);
    const res = await login('demo@smartpark.in', 'Demo@123');
    setLoading(false);

    if (res.success) {
      addNotification({
        title: 'Demo Account Logged In',
        message: 'Logged in as Demo User (demo@smartpark.in)',
        type: 'success'
      });
      navigate('/');
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 space-y-6">
      
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-3xl bg-[#FFD21F] flex items-center justify-center text-[#171717] mx-auto shadow-md">
          <Car className="w-8 h-8 text-[#171717]" />
        </div>
        <h1 className="text-3xl font-extrabold text-[#171717] tracking-tight">PARK-A-LOT</h1>
        <p className="text-xs text-slate-500 font-medium">Smart parking made simple.</p>
      </div>

      {/* Demo Account Shortcut */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 space-y-2.5 shadow-xs">
        <div className="flex items-center justify-between text-xs text-amber-950 font-bold">
          <span className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-700" />
            Quick Demo Account
          </span>
          <span className="text-[10px] bg-[#FFD21F] text-[#171717] px-2 py-0.5 rounded font-extrabold">1-Click</span>
        </div>
        <p className="text-xs text-slate-600 font-medium">
          Email: <code className="font-mono text-slate-900 font-bold">demo@smartpark.in</code> | Pass: <code className="font-mono text-slate-900 font-bold">Demo@123</code>
        </p>
        <button
          type="button"
          onClick={handleQuickDemoLogin}
          className="w-full py-2.5 rounded-xl bg-[#FFD21F] hover:bg-[#E5B800] text-[#171717] font-extrabold text-xs shadow-xs transition-all"
        >
          Log In with Demo Account
        </button>
      </div>

      {/* Login Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md space-y-5">
        <div className="space-y-1">
          <h2 className="text-lg font-extrabold text-[#171717]">Log In</h2>
          <p className="text-xs text-slate-500 font-medium">Access your parking reservations</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 text-xs font-medium">
          <div>
            <label className="text-slate-600 font-bold block mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="demo@smartpark.in"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717] placeholder-slate-400 focus:outline-none focus:border-[#FFD21F] focus:ring-2 focus:ring-[#FFD21F]/40"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#FFD21F] hover:bg-[#E5B800] text-[#171717] font-extrabold text-sm flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-600 font-medium">
            Don't have an account?{' '}
            <Link to="/register" className="text-slate-900 font-extrabold hover:underline">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
