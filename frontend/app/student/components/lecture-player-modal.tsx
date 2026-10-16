'use client';

import React, { useState } from 'react';
import { X, Play, Pause, RotateCcw, CheckCircle2, Bookmark, FileText } from 'lucide-react';
import { updateStudentLectureProgress, toggleStudentBookmark } from '../../edops-api';

interface LecturePlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  lecture: any;
  onSuccess?: () => void;
}

export const LecturePlayerModal: React.FC<LecturePlayerModalProps> = ({
  isOpen,
  onClose,
  organizationId,
  lecture,
  onSuccess,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(lecture?.watchedPct || 60);
  const [isCompleted, setIsCompleted] = useState(lecture?.isCompleted || false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  if (!isOpen || !lecture) return null;

  const handleToggleComplete = async () => {
    const nextCompleted = !isCompleted;
    setIsCompleted(nextCompleted);
    try {
      await updateStudentLectureProgress(organizationId, lecture.id, {
        lastPositionSeconds: nextCompleted ? lecture.durationSeconds || 2400 : 1200,
        watchedPct: nextCompleted ? 100 : progress,
        isCompleted: nextCompleted,
      });
      onSuccess?.();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleBookmark = async () => {
    setIsBookmarked(!isBookmarked);
    try {
      await toggleStudentBookmark(organizationId, {
        resourceId: lecture.id,
        resourceType: 'recorded_lecture',
        title: lecture.title,
        subjectName: lecture.subject,
        url: lecture.videoUrl || 'https://cdn.school.edu/lecture.mp4',
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070A10]/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">{lecture.title}</h3>
            <p className="text-xs text-slate-500">{lecture.subject} • {lecture.teacher}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleBookmark}
              className={`p-1.5 rounded-lg border transition-colors ${
                isBookmarked ? 'bg-amber-50 text-amber-600 border-amber-200' : 'text-slate-400 hover:bg-slate-100 border-transparent'
              }`}
              title="Bookmark lecture"
            >
              <Bookmark className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Canvas Simulator */}
        <div className="relative aspect-video bg-slate-900 flex flex-col items-center justify-center text-white p-6 select-none">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center cursor-pointer transition-transform active:scale-95 mx-auto"
                 onClick={() => setIsPlaying(!isPlaying)}>
              {isPlaying ? <Pause className="w-7 h-7 text-white" /> : <Play className="w-7 h-7 text-white translate-x-0.5" />}
            </div>
            <p className="text-xs text-slate-300 font-medium">
              {isPlaying ? 'Playing High-Definition Stream' : 'Click to Resume Lecture'}
            </p>
            <p className="text-[11px] text-slate-400">Duration: {lecture.duration} • Recorded: {lecture.recordedDate}</p>
          </div>

          {/* Player Controls Bar */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/80 to-transparent p-4 space-y-2">
            <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden cursor-pointer">
              <div className="bg-indigo-500 h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-300">
              <span>{Math.round((progress / 100) * 42)}:00 / {lecture.duration}</span>
              <span>{progress}% Watched</span>
            </div>
          </div>
        </div>

        {/* Action footer */}
        <div className="p-4 bg-slate-50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleComplete}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                isCompleted
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isCompleted ? 'Marked as Completed' : 'Mark as Completed'}</span>
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
