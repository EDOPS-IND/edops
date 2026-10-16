'use client';

import React, { useState } from 'react';
import { Calendar, Clock, Video, Users, CheckCircle2, Plus, AlertCircle, X, ExternalLink } from 'lucide-react';
import { WardInfo, PtmBooking } from '../types';
import { PtmBookingModal } from '../components/ptm-booking-modal';

interface PtmPaneProps {
  selectedWard: WardInfo;
}

export const PtmPane: React.FC<PtmPaneProps> = ({ selectedWard }) => {
  const isGrade10 = selectedWard.sectionName.includes('10');

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookings, setBookings] = useState<PtmBooking[]>([
    {
      id: 'ptm-1',
      studentUserId: selectedWard.studentUserId,
      childName: selectedWard.name,
      teacherId: isGrade10 ? 't-raman' : 't-anita',
      teacherName: isGrade10 ? 'Dr. K. Raman' : 'Mrs. Anita Deshmukh',
      subject: isGrade10 ? 'Mathematics (Class Teacher)' : 'General Science (Class Teacher)',
      date: 'Saturday, Oct 25, 2026',
      timeSlot: '10:00 AM - 10:15 AM',
      meetingMode: 'in_person',
      status: 'confirmed',
      parentNotes: 'Review pre-board preparation and calculus problem sets.',
      bookedAt: '2026-10-12',
    },
  ]);

  const handleBookSuccess = (newBooking: PtmBooking) => {
    setBookings([newBooking, ...bookings]);
  };

  const handleCancelBooking = (id: string) => {
    if (confirm('Are you sure you want to cancel this conference reservation?')) {
      setBookings((prev) => prev.filter((b) => b.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. SESSION ANNOUNCEMENT HERO */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-bold">
            <Calendar size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Term 1 Parent-Teacher Conference (PTM)</h3>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
                Reservations Open
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Date: <b className="text-slate-800">Saturday, October 25, 2026</b> • Time: <b className="text-slate-800">09:00 AM – 01:00 PM IST</b>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              15-minute dedicated discussion slots available with all subject educators.
            </p>
          </div>
        </div>

        <button
          onClick={() => setBookingModalOpen(true)}
          className="bg-[#090D16] hover:bg-[#1E293B] text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all shadow-xs border border-[#1A243D] flex items-center gap-2 self-start md:self-auto shrink-0"
        >
          <Plus size={14} /> Schedule New Conference
        </button>
      </div>

      {/* 2. CONFIRMED RESERVATIONS */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Your Reserved Conference Appointments</h4>
            <p className="text-[11px] text-slate-500">Confirmed meeting slots for {selectedWard.name} ({selectedWard.sectionName})</p>
          </div>
          <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded font-bold border border-indigo-200">
            {bookings.length} Confirmed Slots
          </span>
        </div>

        <div className="space-y-3">
          {bookings.length > 0 ? (
            bookings.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/50 transition-colors space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                      {b.meetingMode === 'video_conference' ? <Video size={18} className="text-indigo-600" /> : <Users size={18} className="text-slate-700" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-bold text-slate-900 text-sm">{b.teacherName}</h5>
                        <span className="text-xs text-slate-500">• {b.subject}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-medium text-slate-800">{b.date}</span>
                        <span>at</span>
                        <span className="font-mono font-bold text-indigo-700">{b.timeSlot}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                      {b.status}
                    </span>
                    <button
                      onClick={() => handleCancelBooking(b.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Cancel Booking"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider block">Agenda / Focus Area</span>
                    <p className="text-slate-700 mt-0.5 font-medium">&ldquo;{b.parentNotes}&rdquo;</p>
                  </div>

                  {b.meetingMode === 'video_conference' ? (
                    <a
                      href={b.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <Video size={13} />
                      <span>Join Google Meet</span>
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    <div className="text-[11px] text-slate-500 font-medium">
                      Location: <b className="text-slate-800">Campus Senior Wing, Room 204</b>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              No appointments scheduled yet. Click &quot;Schedule New Conference&quot; to pick a slot.
            </div>
          )}
        </div>
      </div>

      {/* 3. CONFERENCE GUIDELINES */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
        <h5 className="font-bold text-slate-800">Guidelines for Parents during PTM:</h5>
        <p>1. Please join or arrive 5 minutes prior to the scheduled conference slot to ensure strict adherence to the bell schedule.</p>
        <p>2. Keep questions focused on academic progression, CBSE continuous evaluation, and learning habits.</p>
        <p>3. If requiring an extended session, please notify the Class Teacher via the Academic Inbox or raise a query to the Principal.</p>
      </div>

      {/* Booking Modal */}
      <PtmBookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        selectedWard={selectedWard}
        onBookSuccess={handleBookSuccess}
      />
    </div>
  );
};
