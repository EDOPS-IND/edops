'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Video, Bookmark, FileText, Download, Play, CheckCircle2 } from 'lucide-react';
import { getStudentResources, toggleStudentBookmark } from '../../edops-api';

interface ResourcesPaneProps {
  organizationId: string;
  onOpenLecture: (lecture: any) => void;
}

export const ResourcesPane: React.FC<ResourcesPaneProps> = ({ organizationId, onOpenLecture }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'materials' | 'lectures' | 'bookmarks'>('materials');

  useEffect(() => {
    loadResources();
  }, [organizationId]);

  const loadResources = async () => {
    setLoading(true);
    try {
      const res = await getStudentResources(organizationId);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async (item: any, type: any) => {
    try {
      await toggleStudentBookmark(organizationId, {
        resourceId: item.id,
        resourceType: type,
        title: item.title,
        subjectName: item.subject,
        url: item.fileUrl || item.videoUrl || 'https://school.edu',
      });
      loadResources();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading study resources & recorded lectures...</div>;
  }

  const studyMaterials = data?.studyMaterials || [];
  const recordedLectures = data?.recordedLectures || [];
  const bookmarks = data?.bookmarks || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Learning Resources & Recorded Lectures</h2>
        <p className="text-sm text-slate-500">Official teacher-authored study notes, NCERT reference materials, and video lectures with playback tracking.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab('materials')}
          className={`pb-3 text-xs font-bold transition-colors border-b-2 ${
            activeTab === 'materials'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Study Material & Notes ({studyMaterials.length})
        </button>
        <button
          onClick={() => setActiveTab('lectures')}
          className={`pb-3 text-xs font-bold transition-colors border-b-2 ${
            activeTab === 'lectures'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Recorded Classroom Lectures ({recordedLectures.length})
        </button>
        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`pb-3 text-xs font-bold transition-colors border-b-2 ${
            activeTab === 'bookmarks'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Saved Bookmarks ({bookmarks.length})
        </button>
      </div>

      {activeTab === 'materials' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {studyMaterials.map((mat: any) => (
            <div key={mat.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                    {mat.subject}
                  </span>
                  <button
                    onClick={() => handleBookmark(mat, 'study_material')}
                    className="text-slate-400 hover:text-amber-500"
                  >
                    <Bookmark className="w-4 h-4" />
                  </button>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">{mat.title}</h4>
                <p className="text-xs text-slate-400">Chapter: {mat.chapter} • File: {mat.fileSize}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">{mat.uploadedBy}</span>
                <a
                  href={mat.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'lectures' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recordedLectures.map((lec: any) => (
            <div key={lec.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-50 text-purple-700">
                      {lec.subject}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">Duration: {lec.duration}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{lec.title}</h4>
                  <p className="text-xs text-slate-500">Instructor: {lec.teacher} • {lec.chapter}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Playback Progress</span>
                  <span className="font-bold text-slate-800">{lec.watchedPct}% watched</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${lec.isCompleted ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                    style={{ width: `${lec.watchedPct}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">Recorded: {lec.recordedDate}</span>
                <button
                  onClick={() => onOpenLecture(lec)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>{lec.watchedPct > 0 && !lec.isCompleted ? 'Resume Video' : 'Watch Lecture'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'bookmarks' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">Personal Saved Library</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {bookmarks.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No bookmarked materials saved yet.</div>
            ) : (
              bookmarks.map((bm: any) => (
                <div key={bm.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Bookmark className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{bm.title}</h4>
                      <p className="text-[11px] text-slate-400">{bm.subjectName} • {bm.resourceType}</p>
                    </div>
                  </div>
                  <a
                    href={bm.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                  >
                    Open Resource
                  </a>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
