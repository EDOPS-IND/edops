'use client';

import React, { useState } from 'react';
import { X, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { WardInfo, LeaveApplication } from '../types';

interface ApplyLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedWard: WardInfo;
  onApplyLeave: (leave: LeaveApplication) => void;
}

export const ApplyLeaveModal: React.FC<ApplyLeaveModalProps> = ({
  isOpen,
  onClose,
  selectedWard,
  onApplyLeave,
}) => {
  const [leaveType, setLeaveType] = useState('Sick / Medical Leave');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setIsSubmitting(true);
    const newLeave: LeaveApplication = {
      id: `leave-${Date.now()}`,
      studentUserId: selectedWard.studentUserId,
      childName: selectedWard.name,
      leaveType,
      startDate,
      endDate,
      reason: reason.trim(),
      status: 'pending',
      submittedAt: new Date().toISOString().split('T')[0],
    };

    setTimeout(() => {
      onApplyLeave(newLeave);
      setIsSubmitting(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setReason('');
        onClose();
      }, 1000);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070A10]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Calendar size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Submit Student Leave Request</h3>
              <p className="text-xs text-slate-500">Official absence notification for school administration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 size={28} />
            </div>
            <h4 className="text-base font-bold text-slate-900">Leave Application Submitted!</h4>
            <p className="text-xs text-slate-500">
              Absence request has been queued for {selectedWard.name}&apos;s Class Teacher and Attendance Cell.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Applying for Student</label>
              <input
                type="text"
                readOnly
                value={`${selectedWard.name} (${selectedWard.sectionName} · Roll ${selectedWard.rollNumber})`}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-600 font-medium cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Leave Category</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Sick / Medical Leave">Sick / Medical Leave</option>
                  <option value="Casual / Family Urgent">Casual / Family Urgent</option>
                  <option value="Medical Emergency">Medical Emergency</option>
                  <option value="Sports / Olympiad Tournament">Sports / Olympiad Tournament</option>
                  <option value="Other Planned Absence">Other Planned Absence</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">From Date</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">To Date (Inclusive)</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Reason Description</label>
              <textarea
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="State the reason for absence and doctor/family details..."
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-[#090D16] text-white hover:bg-[#1E293B] font-semibold transition-all shadow-xs border border-[#1A243D] disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Leave Application'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
