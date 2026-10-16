'use client';

import React, { useState } from 'react';
import { X, Calendar, Clock, Video, Users, CheckCircle2 } from 'lucide-react';
import { WardInfo, PtmBooking } from '../types';

interface PtmBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedWard: WardInfo;
  onBookSuccess: (booking: PtmBooking) => void;
}

export const PtmBookingModal: React.FC<PtmBookingModalProps> = ({
  isOpen,
  onClose,
  selectedWard,
  onBookSuccess,
}) => {
  const isGrade10 = selectedWard.sectionName.includes('10');

  const teachers = isGrade10
    ? [
        { id: 't-raman', name: 'Dr. K. Raman', subject: 'Mathematics (Class Teacher)' },
        { id: 't-kapoor', name: 'Mrs. Sunita Kapoor', subject: 'Science & Physics' },
        { id: 't-menon', name: 'Mr. Rajiv Menon', subject: 'English Core' },
        { id: 't-singhal', name: 'Mr. Vikram Singhal', subject: 'Social Sciences' },
      ]
    : [
        { id: 't-anita', name: 'Mrs. Anita Deshmukh', subject: 'General Science (Class Teacher)' },
        { id: 't-alok', name: 'Mr. Alok Verma', subject: 'Mathematics' },
        { id: 't-sarita', name: 'Ms. Sarita Chawla', subject: 'Social Studies' },
      ];

  const availableSlots = [
    '09:00 AM - 09:15 AM',
    '09:20 AM - 09:35 AM',
    '09:40 AM - 09:55 AM',
    '10:15 AM - 10:30 AM',
    '10:35 AM - 10:50 AM',
    '11:00 AM - 11:15 AM',
  ];

  const [selectedTeacherId, setSelectedTeacherId] = useState(teachers[0].id);
  const [selectedSlot, setSelectedSlot] = useState(availableSlots[0]);
  const [meetingMode, setMeetingMode] = useState<'in_person' | 'video_conference'>('in_person');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const currentTeacher = teachers.find((t) => t.id === selectedTeacherId) || teachers[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const booking: PtmBooking = {
      id: `ptm-${Date.now()}`,
      studentUserId: selectedWard.studentUserId,
      childName: selectedWard.name,
      teacherId: currentTeacher.id,
      teacherName: currentTeacher.name,
      subject: currentTeacher.subject,
      date: 'Saturday, Oct 25, 2026',
      timeSlot: selectedSlot,
      meetingMode,
      meetingLink: meetingMode === 'video_conference' ? 'https://meet.google.com/edops-ptm-conf' : undefined,
      status: 'confirmed',
      parentNotes: notes.trim() || 'General academic review',
      bookedAt: new Date().toISOString(),
    };

    setTimeout(() => {
      onBookSuccess(booking);
      setIsSubmitting(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1000);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070A10]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Calendar size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Schedule 1-on-1 PTM Conference</h3>
              <p className="text-xs text-slate-500">Parent-Teacher Meeting Term 1 · Oct 25, 2026</p>
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
            <h4 className="text-base font-bold text-slate-900">PTM Slot Confirmed!</h4>
            <p className="text-xs text-slate-500">
              Your 1-on-1 conference with {currentTeacher.name} is reserved for Oct 25 at {selectedSlot}. Calendar confirmation has been issued.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
            {/* Regarding Ward */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Regarding Ward</label>
              <input
                type="text"
                readOnly
                value={`${selectedWard.name} (${selectedWard.sectionName})`}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-600 font-medium cursor-not-allowed"
              />
            </div>

            {/* Select Educator */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Faculty / Teacher</label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} — {t.subject}
                  </option>
                ))}
              </select>
            </div>

            {/* Conference Format Mode */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Meeting Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMeetingMode('in_person')}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                    meetingMode === 'in_person'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-bold'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <Users size={16} className={meetingMode === 'in_person' ? 'text-indigo-600' : 'text-slate-400'} />
                  <div>
                    <div className="text-xs">In-Person Campus</div>
                    <div className="text-[10px] text-slate-400 font-normal">Room 204, Senior Wing</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMeetingMode('video_conference')}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                    meetingMode === 'video_conference'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-bold'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <Video size={16} className={meetingMode === 'video_conference' ? 'text-indigo-600' : 'text-slate-400'} />
                  <div>
                    <div className="text-xs">Video Call</div>
                    <div className="text-[10px] text-slate-400 font-normal">Google Meet Link</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Available 15-Minute Slots */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Select Time Slot (Saturday, Oct 25)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2 px-2.5 rounded-xl border text-center transition-all font-mono text-[11px] ${
                      selectedSlot === slot
                        ? 'border-indigo-600 bg-indigo-600 text-white font-bold shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Agenda Notes */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Specific Discussion Points / Agenda (Optional)</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Discuss calculus homework pace and upcoming board preparatory exam plan..."
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Footer */}
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
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-[#090D16] text-white hover:bg-[#1E293B] font-semibold transition-all shadow-xs border border-[#1A243D] disabled:opacity-50"
              >
                {isSubmitting ? 'Confirming...' : 'Confirm Reservation'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
