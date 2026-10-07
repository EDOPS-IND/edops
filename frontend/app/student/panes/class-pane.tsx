'use client';

import React, { useState, useEffect } from 'react';
import { Users, Megaphone, User, ShieldCheck } from 'lucide-react';
import { getStudentClass } from '../../edops-api';

interface ClassPaneProps {
  organizationId: string;
}

export const ClassPane: React.FC<ClassPaneProps> = ({ organizationId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClass();
  }, [organizationId]);

  const loadClass = async () => {
    setLoading(true);
    try {
      const res = await getStudentClass(organizationId);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading class information...</div>;
  }

  const classInfo = data?.classInfo || {
    className: 'Class 10-A',
    academicYear: '2026-27',
    classTeacher: 'Rahul Sharma',
    roomNumber: 'A-204',
    studentCount: 42,
    subjectsCount: 6,
  };

  const classmates = data?.classmates || [];
  const announcements = data?.announcements || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">My Class Hub</h2>
        <p className="text-sm text-slate-500">Official cohort registration, class leadership, and peer directory.</p>
      </div>

      {/* Class Meta Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Enrolled Section</span>
          <div className="text-xl font-bold text-slate-900 mt-1">{classInfo.className}</div>
          <p className="text-xs text-slate-400 mt-1">AY {classInfo.academicYear}</p>
        </div>
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Class Teacher</span>
          <div className="text-xl font-bold text-slate-900 mt-1">{classInfo.classTeacher}</div>
          <p className="text-xs text-slate-400 mt-1">Senior Mathematics Faculty</p>
        </div>
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Home Classroom</span>
          <div className="text-xl font-bold text-indigo-600 mt-1">Room {classInfo.roomNumber}</div>
          <p className="text-xs text-slate-400 mt-1">Main Academic Wing</p>
        </div>
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Cohort Size</span>
          <div className="text-xl font-bold text-slate-900 mt-1">{classInfo.studentCount} Students</div>
          <p className="text-xs text-slate-400 mt-1">{classInfo.subjectsCount} Prescribed Subjects</p>
        </div>
      </div>

      {/* Class Announcements */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-indigo-600" />
          <h3 className="font-bold text-slate-900 text-sm">Official Class Notices & Bulletins</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {announcements.map((ann: any) => (
            <div key={ann.id} className="p-4 space-y-1 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900">{ann.title}</h4>
                <span className="text-[11px] text-slate-400">{ann.date}</span>
              </div>
              <p className="text-xs text-slate-600">{ann.content}</p>
              <p className="text-[11px] text-slate-400 pt-1">Posted by: {ann.author}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Classmate Directory (Privacy Protected: Only Name & Roll Number) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-600" />
            <h3 className="font-bold text-slate-900 text-sm">Classmate Roster</h3>
          </div>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Privacy Guard Active (No personal contacts exposed)</span>
          </span>
        </div>
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {classmates.map((mate: any, idx: number) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
                mate.isSelf
                  ? 'bg-indigo-50/80 border-indigo-200 text-indigo-900 font-bold'
                  : 'bg-slate-50/60 border-slate-200/80 text-slate-800'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  mate.isSelf ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {mate.rollNumber}
              </div>
              <div className="truncate">
                <div className="text-xs truncate font-medium">{mate.name}</div>
                <div className="text-[10px] text-slate-400">Roll No. {mate.rollNumber}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
