'use client';

import React, { useState } from 'react';
import { X, CreditCard, CheckCircle2, Download, ShieldCheck, ArrowRight } from 'lucide-react';
import { WardInfo, FeeItem } from '../types';

interface FeePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedWard: WardInfo;
  feeItem: FeeItem | null;
  onPaymentSuccess: (feeId: string) => void;
}

export const FeePaymentModal: React.FC<FeePaymentModalProps> = ({
  isOpen,
  onClose,
  selectedWard,
  feeItem,
  onPaymentSuccess,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('parent@okaxis');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paidReceipt, setPaidReceipt] = useState<string | null>(null);

  if (!isOpen || !feeItem) return null;

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      const receiptNo = `GST-REC-${Math.floor(100000 + Math.random() * 900000)}`;
      setIsProcessing(false);
      setPaidReceipt(receiptNo);
      onPaymentSuccess(feeItem.id);
    }, 800);
  };

  const handleDownloadReceipt = () => {
    alert(`Downloaded GST Tax-Compliant Fee Receipt #${paidReceipt} for ₹${feeItem.amount.toLocaleString('en-IN')}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070A10]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CreditCard size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Secure Institutional Fee Payment</h3>
              <p className="text-xs text-slate-500">School Invoicing Gateway · GST Tax Invoice</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {paidReceipt ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900">Payment Successfully Completed!</h4>
              <p className="text-xs text-slate-500 mt-1">
                Receipt Reference: <span className="font-mono font-bold text-slate-800">{paidReceipt}</span>
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Student:</span>
                <span className="font-bold text-slate-800">{selectedWard.name} ({selectedWard.sectionName})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Obligation:</span>
                <span className="font-semibold text-slate-800">{feeItem.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Paid:</span>
                <span className="font-bold text-emerald-700 font-mono text-sm">₹{feeItem.amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="font-mono text-slate-700">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-semibold text-xs"
              >
                Done
              </button>
              <button
                onClick={handleDownloadReceipt}
                className="bg-[#090D16] hover:bg-[#1E293B] text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-2 shadow-xs border border-[#1A243D]"
              >
                <Download size={14} /> Download GST Receipt PDF
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePay} className="p-5 space-y-4 text-xs">
            {/* Invoice Breakdown */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <div>
                  <h4 className="font-bold text-slate-900">{feeItem.title}</h4>
                  <p className="text-[11px] text-slate-500">{feeItem.term} • Due: {feeItem.dueDate}</p>
                </div>
                <div className="text-right">
                  <div className="text-base font-extrabold text-slate-900 font-mono">
                    ₹{feeItem.amount.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-1.5 py-0.2 rounded border border-amber-200">
                    Awaiting Payment
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-1 text-[11px] text-slate-600 pt-1">
                <div>Tuition Component: <span className="font-mono font-semibold">₹{feeItem.breakdown.tuitionFee.toLocaleString('en-IN')}</span></div>
                <div>Lab & Library: <span className="font-mono font-semibold">₹{feeItem.breakdown.labFee.toLocaleString('en-IN')}</span></div>
                <div>Sports & Amenities: <span className="font-mono font-semibold">₹{feeItem.breakdown.sportsFee.toLocaleString('en-IN')}</span></div>
                <div>Examination & Tech: <span className="font-mono font-semibold">₹{feeItem.breakdown.examFee.toLocaleString('en-IN')}</span></div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Select Payment Instrument</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'upi', label: 'UPI / QR', desc: 'GPay, PhonePe, Paytm' },
                  { id: 'card', label: 'Debit / Credit', desc: 'Visa, Master, RuPay' },
                  { id: 'netbanking', label: 'Net Banking', desc: 'All Major Banks' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      paymentMethod === m.id
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-bold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="text-xs">{m.label}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === 'upi' && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">Enter Virtual Payment Address (VPA / UPI ID)</label>
                <input
                  type="text"
                  required
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. mobile@upi or username@okhdfcbank"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}

            {paymentMethod === 'card' && (
              <div className="space-y-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Card Number</label>
                  <input
                    type="text"
                    required
                    placeholder="4111 2222 3333 4444"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="MM/YY"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  />
                  <input
                    type="password"
                    maxLength={3}
                    required
                    placeholder="CVV"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1 text-slate-600">
                <ShieldCheck size={14} className="text-emerald-600" />
                256-Bit SSL Encrypted Institutional Gateway
              </span>
              <span className="font-bold text-slate-800">No Convenience Fee</span>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="px-5 py-2 rounded-xl bg-[#090D16] text-white hover:bg-[#1E293B] font-semibold transition-all shadow-xs border border-[#1A243D] disabled:opacity-50 flex items-center gap-2"
              >
                {isProcessing ? 'Processing Payment...' : `Authorize ₹${feeItem.amount.toLocaleString('en-IN')}`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
