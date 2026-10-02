import React, { useState } from 'react';
import { CreditCard, CheckCircle2, XCircle, Lock, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function RazorpayModal({ isOpen, onClose, lot, slot, duration, totalAmount, onPaymentComplete }) {
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSimulatePayment = async (success) => {
    setProcessing(true);
    setErrorMsg('');
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      onPaymentComplete(success);
    } catch (err) {
      setErrorMsg('Payment processing error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header - Razorpay branding */}
        <div className="bg-[#171717] p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-[#FFD21F]" />
              <span className="font-extrabold text-lg tracking-tight text-white">Razorpay</span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#FFD21F] text-[#171717]">
                Demo Checkout
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Lock className="w-3.5 h-3.5" />
              <span>256-bit SSL</span>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-slate-400 font-medium">Paying to SmartPark South Chennai</p>
            <p className="text-3xl font-extrabold text-[#FFD21F] mt-1">{formatCurrency(totalAmount)}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">Location:</span>
              <span className="font-bold text-[#171717]">{lot?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Slot:</span>
              <span className="font-bold text-blue-700">{slot?.slot_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Duration:</span>
              <span className="font-bold text-[#171717]">{duration} Hour{duration > 1 ? 's' : ''}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 font-extrabold text-[#171717]">
              <span>Total Amount:</span>
              <span className="text-emerald-700">{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Simulation Buttons */}
          <div className="space-y-3">
            <p className="text-xs font-extrabold text-center text-slate-400 uppercase tracking-wider">
              Select Payment Outcome
            </p>

            <button
              disabled={processing}
              onClick={() => handleSimulatePayment(true)}
              className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 disabled:opacity-50"
            >
              <CheckCircle2 className="w-5 h-5" />
              {processing ? 'Processing Payment...' : 'Simulate Success'}
            </button>

            <button
              disabled={processing}
              onClick={() => handleSimulatePayment(false)}
              className="w-full py-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-sm flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
            >
              <XCircle className="w-5 h-5" />
              Simulate Failure
            </button>

            <button
              disabled={processing}
              onClick={onClose}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-800 pt-1 font-semibold transition-colors"
            >
              Cancel Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
