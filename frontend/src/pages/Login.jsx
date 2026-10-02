import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, Mail, Lock, LogIn, X, KeyRound, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, demoLogin } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  const handleDemoClick = async (role) => {
    setLoading(true);
    const res = await demoLogin(role);
    setLoading(false);

    if (res.success) {
      addNotification({
        title: 'Hackathon Demo Access',
        message: `Authenticated via backend as ${role === 'owner' ? 'Owner Demo (PARK-A-LOT Demo Parking)' : 'Civilian Demo'}`,
        type: 'success'
      });
      if (res.user && res.user.role === 'owner') {
        navigate('/owner');
      } else {
        navigate('/');
      }
    } else {
      addNotification({
        title: 'Demo Access Failure',
        message: res.error,
        type: 'error'
      });
    }
  };

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
    const res = await login(email.trim(), password);
    setLoading(false);

    if (res.success) {
      addNotification({
        title: 'Welcome Back',
        message: 'Successfully logged into PARK-A-LOT',
        type: 'success'
      });
      
      // Role-based authorization route strictly from backend JWT user record
      if (res.user && res.user.role === 'owner') {
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

  const handleForgotRequest = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: forgotEmail.trim() });
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
        email: forgotEmail.trim(),
        reset_token: resetToken,
        new_password: newPassword
      });

      addNotification({
        title: 'Password Reset Complete',
        message: res.data.message || 'Your password has been updated. You can now log in.',
        type: 'success'
      });

      setEmail(forgotEmail.trim());
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
        <p className="text-xs text-slate-500 font-medium">Smart parking & space owner portal.</p>
      </div>

      {/* Login Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-md space-y-5">
        <div className="space-y-1">
          <h2 className="text-lg font-extrabold text-[#171717]">Log In</h2>
          <p className="text-xs text-slate-500 font-medium">Access your Civilian Dashboard or Space Owner Portal</p>
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
                placeholder="registered@email.com"
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
            {loading ? 'Authenticating...' : 'Log In'}
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

      {/* Hackathon Demo Access Card */}
      <div className="p-5 rounded-3xl bg-amber-50/70 border border-amber-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#171717]">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Hackathon Demo Access</h3>
          </div>
          <span className="text-[10px] font-bold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-full">
            Real Backend DB Auth
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Civilian Demo Option */}
          <div className="p-3.5 rounded-2xl bg-white border border-amber-200/60 flex flex-col justify-between space-y-2.5">
            <div>
              <div className="font-extrabold text-[#171717] flex items-center justify-between">
                <span>Civilian Demo</span>
                <span className="text-[10px] text-slate-400 font-medium">Role: civilian</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">
                email: <strong className="text-slate-800">demo@smartpark.in</strong>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                password: <span className="text-slate-800 font-semibold">demopassword</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleDemoClick('civilian')}
              disabled={loading}
              className="w-full py-2 px-3 rounded-xl bg-[#171717] hover:bg-slate-800 text-white text-[11px] font-extrabold transition-all shadow-xs flex items-center justify-center gap-1.5"
            >
              Use Civilian Demo
            </button>
          </div>

          {/* Owner Demo Option */}
          <div className="p-3.5 rounded-2xl bg-white border border-amber-200/60 flex flex-col justify-between space-y-2.5">
            <div>
              <div className="font-extrabold text-[#171717] flex items-center justify-between">
                <span>Owner Demo</span>
                <span className="text-[10px] text-slate-400 font-medium">Role: owner</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">
                email: <strong className="text-slate-800">owner@smartpark.in</strong>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                password: <span className="text-slate-800 font-semibold">demopassword</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleDemoClick('owner')}
              disabled={loading}
              className="w-full py-2 px-3 rounded-xl bg-[#FFD21F] hover:bg-[#E5B800] text-[#171717] text-[11px] font-extrabold transition-all shadow-xs flex items-center justify-center gap-1.5"
            >
              Use Owner Demo
            </button>
          </div>
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
