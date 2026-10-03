import React, { useState } from 'react';
import { Wallet, Plus, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { formatCurrency } from '../utils/formatters';

export default function BuyCreditsModal({ isOpen, onClose, onSuccess }) {
  const { setUser } = useAuth();
  const { addNotification } = useNotification();
  const [selectedAmount, setSelectedAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const getEffectiveAmount = () => {
    if (customAmount && !isNaN(customAmount) && Number(customAmount) > 0) {
      return Number(customAmount);
    }
    return selectedAmount;
  };

  const effectiveAmount = getEffectiveAmount();
  const effectiveCredits = Math.floor(effectiveAmount);

  const handleBuyCredits = async () => {
    if (effectiveAmount <= 0) {
      addNotification({
        title: 'Invalid Amount',
        message: 'Please enter a valid amount greater than ₹0.',
        type: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/wallet/buy-credits', { amount: effectiveAmount });
      setUser(res.data);
      if (onSuccess) onSuccess(res.data);
      
      addNotification({
        title: '✓ CREDITS PURCHASED',
        message: `Successfully purchased ${effectiveCredits} Credits for ${formatCurrency(effectiveAmount)}!`,
        type: 'success'
      });

      onClose();
    } catch (err) {
      addNotification({
        title: 'Purchase Error',
        message: err.response?.data?.detail || 'Failed to purchase credits.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-5 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FFD21F] text-[#171717] flex items-center justify-center font-bold text-2xl shadow-sm">
            💳
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-[#171717]">Buy Wallet Credits</h3>
            <p className="text-xs text-slate-500 font-medium">₹1 = 1 Wallet Credit • Instant Credit Top-Up</p>
          </div>
        </div>

        {/* Preset Credit Amounts */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 block">Select Credit Top-Up Pack:</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { amount: 50, credits: 50, tag: 'Starter' },
              { amount: 100, credits: 100, tag: 'Popular' },
              { amount: 200, credits: 200, tag: 'Value' },
              { amount: 500, credits: 500, tag: 'Pro Pack' },
            ].map((pack) => (
              <button
                key={pack.amount}
                type="button"
                onClick={() => {
                  setSelectedAmount(pack.amount);
                  setCustomAmount('');
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                  selectedAmount === pack.amount && !customAmount
                    ? 'bg-[#FFD21F]/20 border-[#FFD21F] ring-2 ring-[#FFD21F]/40 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                {pack.tag && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-[#171717] text-[#FFD21F] text-[9px] font-black uppercase">
                    {pack.tag}
                  </span>
                )}
                <div className="font-extrabold text-slate-900 text-sm">{pack.credits} Credits</div>
                <div className="text-xs font-bold text-emerald-700 mt-0.5">{formatCurrency(pack.amount)}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Amount Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">Or Enter Custom Amount (₹):</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">₹</span>
            <input
              type="number"
              min="10"
              placeholder="e.g. 250"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setSelectedAmount(null);
              }}
              className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD21F] transition-all"
            />
          </div>
        </div>

        {/* Summary Card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs font-medium text-slate-700">
          <div className="flex justify-between">
            <span className="text-slate-500">Credits to add:</span>
            <span className="font-extrabold text-blue-700">{effectiveCredits} Credits</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Exchange Rate:</span>
            <span className="font-bold text-slate-800">₹1 = 1 Credit</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-extrabold text-[#171717]">
            <span>Total Payable:</span>
            <span className="text-emerald-700 text-base">{formatCurrency(effectiveAmount)}</span>
          </div>
        </div>

        {/* Security Badge */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Encrypted simulated checkout. Balance & credits available instantly.</span>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center gap-3 pt-1">
          <button
            disabled={loading || effectiveAmount <= 0}
            onClick={handleBuyCredits}
            className="w-full py-3.5 rounded-xl bg-[#171717] hover:bg-slate-800 text-[#FFD21F] font-extrabold text-xs shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 active:scale-98"
          >
            {loading ? 'Processing Top-Up...' : `Pay ${formatCurrency(effectiveAmount)} & Buy Credits`}
          </button>
          <button
            disabled={loading}
            onClick={onClose}
            className="w-full py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 transition-colors"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
