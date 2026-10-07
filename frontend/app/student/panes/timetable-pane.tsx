'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Calendar, CheckCircle2, Video } from 'lucide-react';
import { getStudentTimetable } from '../../edops-api';

interface TimetablePaneProps {
  organizationId: string;
}

export const TimetablePane: React.FC<TimetablePaneProps> = ({ organizationId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState('monday');

  useEffect(() => {
    loadTimetable();
  }, [organizationId]);

  const loadTimetable = async () => {
    setLoading(true);
    try {
      const res = await getStudentTimetable(organizationId);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading class timetable...</div>;
  }

  const weeklySchedule = data?.weeklySchedule || {};
  const previousClasses = data?.previousClasses || [];
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const daySchedule = weeklySchedule[selectedDay] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Academic Timetable & Class History</h2>
        <p className="text-sm text-slate-500">6-day timetable schedule, classroom allocations, and past lecture records.</p>
      </div>

      {/* Day Selector Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
        {days.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`pb-3 px-4 text-xs font-bold capitalize transition-colors border-b-2 whitespace-nowrap ${
              selectedDay === day
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Selected Day Timetable Periods */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm capitalize">{selectedDay} Schedule</h3>
          <span className="text-xs text-slate-400">{daySchedule.length} Teaching Periods</span>
        </div>
        <div className="divide-y divide-slate-100">
          {daySchedule.map((item: any, idx: number) => (
            <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                  P{item.period}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{item.subject}</h4>
                  <p className="text-xs text-slate-500">
                    {item.time} • Room {item.room}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-700">{item.teacher}</span>
                <span className="block text-[10px] text-slate-400">Regular Lecture</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Previous Classes Review */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm">Previous Classes Log</h3>
          <p className="text-xs text-slate-500">Recent completed sessions with attendance records and homework assignments.</p>
        </div>
        <div className="divide-y divide-slate-100">
          {previousClasses.map((item: any, idx: number) => (
            <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">{item.subject}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                    {item.attendance}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">{item.topic}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {item.date} • Period {item.period} • {item.teacher}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium">
                  HW: {item.homeworkStatus}
                </span>
                {item.hasRecording && (
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 font-medium flex items-center gap-1">
                    <Video className="w-3 h-3" /> Lecture Saved
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
