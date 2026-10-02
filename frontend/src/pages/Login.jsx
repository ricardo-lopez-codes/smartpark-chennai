import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, Mail, Lock, LogIn, Zap, Building2, X, KeyRound, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1 = enter email, 2 = reset password
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

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
      
      // Route based on role
      if (email.includes('owner') || (res.user && res.user.role === 'owner')) {
        navigate('/owner');
      } else {
        navigate('/');
      }
    } else {
      addNotification({
        title: 'Authentication Failure',
        message: res.error,
        type: 'error'
      });
    }
  };

  const handleQuickCivilianLogin = async () => {
    setEmail('demo@smartpark.in');
    setPassword('Demo@123');
    setLoading(true);
    const res = await login('demo@smartpark.in', 'Demo@123');
    setLoading(false);

    if (res.success) {
      addNotification({
        title: 'Civilian Demo Logged In',
        message: 'Logged in as Civilian User (demo@smartpark.in)',
        type: 'success'
      });
      navigate('/');
    }
  };

  const handleQuickOwnerLogin = async () => {
    setEmail('owner@smartpark.com');
    setPassword('password123');
    setLoading(true);
    const res = await login('owner@smartpark.com', 'password123');
    setLoading(false);

    if (res.success) {
      addNotification({
        title: 'Owner Portal Access Granted',
        message: 'Logged in as Parking Lot Owner (owner@smartpark.com)',
        type: 'success'
      });
      navigate('/owner');
    }
  };

  const handleForgotRequest = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: forgotEmail });
      setResetToken(res.data.reset_token || 'demo_token_123');
      setForgotStep(2);
      addNotification({
        title: 'Reset Code Sent',
        message: res.data.message || 'Verification token issued for your email.',
        type: 'info'
      });
    } catch (err) {
      addNotification({
        title: 'Reset Request Failed',
        message: err.response?.data?.detail || 'Could not process request.',
        type: 'error'
      });
    } finally {
      setForgotLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addNotification({
        title: 'Password Mismatch',
        message: 'New password and confirm password do not match.',
        type: 'error'
      });
      return;
    }

    setForgotLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        email: forgotEmail,
        reset_token: resetToken,
        new_password: newPassword
      });

      addNotification({
        title: 'Password Reset Complete',
        message: res.data.message || 'Your password has been updated. You can now log in.',
        type: 'success'
      });

      setEmail(forgotEmail);
      setPassword(newPassword);
      setShowForgotModal(false);
      setForgotStep(1);
    } catch (err) {
      addNotification({
        title: 'Reset Failed',
        message: err.response?.data?.detail || 'Password reset failed.',
        type: 'error'
      });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10 px-4 space-y-5">
      
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-3xl bg-[#FFD21F] flex items-center justify-center text-[#171717] mx-auto shadow-md">
          <Car className="w-8 h-8 text-[#171717]" />
        </div>
        <h1 className="text-3xl font-extrabold text-[#171717] tracking-tight">PARK-A-LOT</h1>
        <p className="text-xs text-slate-500 font-medium">Smart parking & owner management system.</p>
      </div>

      {/* Demo Account Shortcuts (Civilian + Owner) */}
      <div className="p-4 rounded-3xl bg-amber-50 border border-amber-300 space-y-3 shadow-xs">
        <div className="flex items-center justify-between text-xs text-amber-950 font-bold">
          <span className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-700" />
            Quick Demo Shortcuts
          </span>
          <span className="text-[10px] bg-[#FFD21F] text-[#171717] px-2 py-0.5 rounded font-extrabold">1-Click</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleQuickCivilianLogin}
            className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-amber-200 text-[#171717] font-extrabold text-xs shadow-2xs text-left flex items-center justify-between group transition-all"
          >
            <div>
              <span className="block text-[11px] text-amber-900 font-extrabold">Civilian Demo</span>
              <span className="text-[9px] text-slate-500 font-mono">demo@smartpark.in</span>
            </div>
            <Car className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
          </button>

          <button
            type="button"
            onClick={handleQuickOwnerLogin}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-2xs text-left flex items-center justify-between group transition-all"
          >
            <div>
              <span className="block text-[11px] text-[#FFD21F] font-extrabold">Owner Portal Demo</span>
              <span className="text-[9px] text-slate-300 font-mono">owner@smartpark.com</span>
            </div>
            <Building2 className="w-4 h-4 text-[#FFD21F] group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* Login Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md space-y-5">
        <div className="space-y-1">
          <h2 className="text-lg font-extrabold text-[#171717]">Log In</h2>
          <p className="text-xs text-slate-500 font-medium">Access Civilian Dashboard or Owner Portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 text-xs font-medium">
          <div>
            <label className="text-slate-600 font-bold block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="demo@smartpark.in or owner@smartpark.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717] placeholder-slate-400 focus:outline-none focus:border-[#FFD21F] focus:ring-2 focus:ring-[#FFD21F]/40"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-600 font-bold block">Password</label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotStep(1);
                  setShowForgotModal(true);
                }}
                className="text-[11px] font-extrabold text-slate-800 hover:text-black hover:underline"
              >
                Forgot Password?
              </button>
            </div>
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

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative max-w-md w-full rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-extrabold">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#171717]">Reset Password</h3>
                <p className="text-xs text-slate-500 font-medium">
                  {forgotStep === 1 ? 'Enter your account email to receive reset token' : 'Set your new account password'}
                </p>
              </div>
            </div>

            {forgotStep === 1 ? (
              <form onSubmit={handleForgotRequest} className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="Enter registered email"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717] focus:outline-none focus:border-[#FFD21F]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3.5 rounded-xl bg-[#FFD21F] hover:bg-[#E5B800] text-[#171717] font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {forgotLoading ? 'Generating Reset Code...' : 'Send Reset Link / Token'}
                </button>
              </form>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-4 text-xs">
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Reset token generated for <strong>{forgotEmail}</strong></span>
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717] focus:outline-none focus:border-[#FFD21F]"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#171717] focus:outline-none focus:border-[#FFD21F]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3.5 rounded-xl bg-[#171717] hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {forgotLoading ? 'Updating Password...' : 'Update & Reset Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
