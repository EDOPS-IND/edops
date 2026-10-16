'use client';

import React, { useState } from 'react';
import { X, MessageSquare, CheckCircle2 } from 'lucide-react';
import { WardInfo, ParentQuery } from '../types';

interface ParentQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedWard: WardInfo;
  onSubmitQuery: (query: ParentQuery) => void;
}

export const ParentQueryModal: React.FC<ParentQueryModalProps> = ({
  isOpen,
  onClose,
  selectedWard,
  onSubmitQuery,
}) => {
  const [category, setCategory] = useState('Academic Quality & Evaluation');
  const [subject, setSubject] = useState('');
  const [queryText, setQueryText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !queryText.trim()) return;

    setIsSubmitting(true);
    const newQuery: ParentQuery = {
      id: `qry-${Date.now()}`,
      studentUserId: selectedWard.studentUserId,
      childName: selectedWard.name,
      subject: subject.trim(),
      category,
      queryText: queryText.trim(),
      status: 'open',
      submittedAt: new Date().toISOString().split('T')[0],
    };

    setTimeout(() => {
      onSubmitQuery(newQuery);
      setIsSubmitting(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSubject('');
        setQueryText('');
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
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Submit Query to Principal & Administration</h3>
              <p className="text-xs text-slate-500">Official oversight desk monitored by school leadership</p>
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
            <h4 className="text-base font-bold text-slate-900">Query Dispatched!</h4>
            <p className="text-xs text-slate-500">
              Your message has been assigned a tracking reference and routed directly to the Principal&apos;s Desk.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Inquiry Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Academic Quality & Evaluation">Academic Quality & Evaluation</option>
                  <option value="Transport & Bus Route Concern">Transport & Bus Route Concern</option>
                  <option value="Campus Safety & Discipline">Campus Safety & Discipline</option>
                  <option value="Fee Invoicing & Payment">Fee Invoicing & Payment</option>
                  <option value="Special Educational Support">Special Educational Support</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Regarding Ward</label>
                <input
                  type="text"
                  readOnly
                  value={`${selectedWard.name} (${selectedWard.sectionName})`}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-600 font-medium cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Subject Header</label>
              <input
                type="text"
                required
                placeholder="e.g. Request for clarification on Math Periodic Test 2 grading criteria"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Detailed Inquiry</label>
              <textarea
                required
                rows={4}
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder="State details, specific dates, or questions for the principal or department head..."
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
                {isSubmitting ? 'Dispatching...' : 'Dispatch to Principal Desk'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
