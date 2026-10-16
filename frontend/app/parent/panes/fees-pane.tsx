'use client';

import React, { useState } from 'react';
import { CreditCard, CheckCircle2, Clock, Download, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import { WardInfo, FeeItem } from '../types';
import { FeePaymentModal } from '../components/fee-payment-modal';

interface FeesPaneProps {
  selectedWard: WardInfo;
}

export const FeesPane: React.FC<FeesPaneProps> = ({ selectedWard }) => {
  const isGrade10 = selectedWard.sectionName.includes('10');

  const [fees, setFees] = useState<FeeItem[]>([
    {
      id: 'fee-q1-26',
      studentUserId: selectedWard.studentUserId,
      term: 'Quarter 1 (Apr - Jun 2026)',
      academicYear: '2026-2027',
      title: 'Quarter 1 Tuition & Comprehensive Fee',
      dueDate: 'April 15, 2026',
      amount: isGrade10 ? 32500 : 26000,
      paidAmount: isGrade10 ? 32500 : 26000,
      status: 'paid',
      breakdown: {
        tuitionFee: isGrade10 ? 22000 : 18000,
        labFee: isGrade10 ? 4500 : 2500,
        sportsFee: 2000,
        examFee: isGrade10 ? 2500 : 1500,
        transportFee: 1500,
      },
      paidAt: '2026-04-10',
      receiptNumber: 'GST-REC-948102',
    },
    {
      id: 'fee-q2-26',
      studentUserId: selectedWard.studentUserId,
      term: 'Quarter 2 (Jul - Sep 2026)',
      academicYear: '2026-2027',
      title: 'Quarter 2 Tuition & STEM Lab Fee',
      dueDate: 'July 15, 2026',
      amount: isGrade10 ? 32500 : 26000,
      paidAmount: isGrade10 ? 32500 : 26000,
      status: 'paid',
      breakdown: {
        tuitionFee: isGrade10 ? 22000 : 18000,
        labFee: isGrade10 ? 4500 : 2500,
        sportsFee: 2000,
        examFee: isGrade10 ? 2500 : 1500,
        transportFee: 1500,
      },
      paidAt: '2026-07-12',
      receiptNumber: 'GST-REC-982143',
    },
    {
      id: 'fee-q3-26',
      studentUserId: selectedWard.studentUserId,
      term: 'Quarter 3 (Oct - Dec 2026)',
      academicYear: '2026-2027',
      title: 'Quarter 3 Tuition & Examination Fee',
      dueDate: 'November 10, 2026',
      amount: isGrade10 ? 34000 : 27500,
      paidAmount: 0,
      status: 'due',
      breakdown: {
        tuitionFee: isGrade10 ? 22000 : 18000,
        labFee: isGrade10 ? 4500 : 2500,
        sportsFee: 2000,
        examFee: isGrade10 ? 4000 : 3000, // Board exam reg component
        transportFee: 1500,
      },
    },
  ]);

  const [activePaymentFee, setActivePaymentFee] = useState<FeeItem | null>(null);

  const handlePaymentSuccess = (feeId: string) => {
    setFees((prev) =>
      prev.map((f) =>
        f.id === feeId
          ? {
              ...f,
              status: 'paid',
              paidAmount: f.amount,
              paidAt: new Date().toISOString().split('T')[0],
              receiptNumber: `GST-REC-${Math.floor(100000 + Math.random() * 900000)}`,
            }
          : f
      )
    );
  };

  const totalPaid = fees.filter((f) => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0);
  const totalDue = fees.filter((f) => f.status === 'due').reduce((sum, f) => sum + f.amount, 0);

  return (
    <div className="space-y-6">
      {/* 1. FEE OVERVIEW METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Fees Paid YTD</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              ₹{totalPaid.toLocaleString('en-IN')}
            </span>
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold border border-emerald-200">
              Verified
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Paid across Quarter 1 & 2 for session 2026-27</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Upcoming Obligation</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-amber-600 font-mono tracking-tight">
              ₹{totalDue.toLocaleString('en-IN')}
            </span>
            <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-bold border border-amber-200">
              Due Nov 10
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Quarter 3 installment including CBSE exam fees</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tax Receipts</span>
            <div className="text-xs text-slate-600 mt-1">
              All tuition fee components qualify for deductions under Section 80C of the IT Act.
            </div>
          </div>
          <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 mt-2">
            <ShieldCheck size={14} /> GST Tax Compliant Receipts
          </span>
        </div>
      </div>

      {/* 2. ITEMIZED FEE OBLIGATIONS & INSTALLMENTS */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Installment Ledger & Payment Status</h4>
            <p className="text-[11px] text-slate-500">Official fee schedule for {selectedWard.name} ({selectedWard.sectionName})</p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded font-bold">
            Academic Session 2026-27
          </span>
        </div>

        <div className="space-y-3">
          {fees.map((fee) => (
            <div
              key={fee.id}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/50 transition-colors space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                      fee.status === 'paid'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-amber-50 text-amber-600 border border-amber-200'
                    }`}
                  >
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">{fee.title}</h5>
                    <p className="text-[11px] text-slate-500">
                      {fee.term} • Due Date: <span className="font-medium text-slate-700">{fee.dueDate}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-mono font-extrabold text-base text-slate-900">
                      ₹{fee.amount.toLocaleString('en-IN')}
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider inline-block ${
                        fee.status === 'paid'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {fee.status === 'paid' ? 'Payment Cleared' : 'Pending Payment'}
                    </span>
                  </div>

                  {fee.status === 'paid' ? (
                    <button
                      onClick={() => alert(`Downloading GST Receipt #${fee.receiptNumber} for ${fee.title}...`)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <Download size={13} className="text-slate-500" />
                      <span>Receipt #{fee.receiptNumber?.split('-')[2]}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setActivePaymentFee(fee)}
                      className="px-4 py-2 rounded-xl bg-[#090D16] hover:bg-[#1E293B] text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs border border-[#1A243D]"
                    >
                      <span>Pay Online</span>
                      <ArrowRight size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Breakdown sub-row */}
              <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-600 grid grid-cols-2 sm:grid-cols-5 gap-2 border border-slate-100 font-mono">
                <div>Tuition: <b className="text-slate-800">₹{fee.breakdown.tuitionFee.toLocaleString('en-IN')}</b></div>
                <div>Lab & Library: <b className="text-slate-800">₹{fee.breakdown.labFee.toLocaleString('en-IN')}</b></div>
                <div>Sports: <b className="text-slate-800">₹{fee.breakdown.sportsFee.toLocaleString('en-IN')}</b></div>
                <div>Exam: <b className="text-slate-800">₹{fee.breakdown.examFee.toLocaleString('en-IN')}</b></div>
                <div>Transport: <b className="text-slate-800">₹{fee.breakdown.transportFee.toLocaleString('en-IN')}</b></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Modal */}
      <FeePaymentModal
        isOpen={Boolean(activePaymentFee)}
        onClose={() => setActivePaymentFee(null)}
        selectedWard={selectedWard}
        feeItem={activePaymentFee}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
};
