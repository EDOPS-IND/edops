"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Layers,
  ChevronRight
} from "lucide-react";
import { getTeacherCurriculum, updateTeacherCurriculumProgress } from "../../edops-api";

interface CurriculumPaneProps {
  organizationId: string;
}

export function CurriculumPane({ organizationId }: CurriculumPaneProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurriculum();
  }, [organizationId]);

  async function loadCurriculum() {
    setLoading(true);
    try {
      const res = await getTeacherCurriculum(organizationId);
      setData(res);
    } catch {
      setData({
        overview: {
          className: "",
          subjectName: "",
          academicYear: "",
          expectedProgressPct: 0,
          actualProgressPct: 0,
          gapPct: 0,
          totalChapters: 0,
          completedChapters: 0,
          inProgressChapters: 0,
          upcomingChapters: 0,
        },
        chapters: []
      });
    } finally {
      setLoading(false);
    }
  }

  const handleIncrementProgress = async (chapter: any) => {
    const nextLessons = Math.min(chapter.plannedLessons || 10, (chapter.completedLessons || 0) + 1);
    try {
      await updateTeacherCurriculumProgress(organizationId, chapter.id, { completedLessons: nextLessons });
      setData((prev: any) => {
        if (!prev) return prev;
        const updatedChapters = prev.chapters.map((c: any) => {
          if (c.id !== chapter.id) return c;
          const completionPct = Math.round((nextLessons / (c.plannedLessons || 10)) * 100);
          return {
            ...c,
            completedLessons: nextLessons,
            completionPct,
            status: completionPct >= 100 ? 'Completed' : 'In Progress (Current)',
          };
        });
        return { ...prev, chapters: updatedChapters };
      });
    } catch (e) {
      console.error(e);
    }
  };

  const overview = data?.overview;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900  flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-indigo-600 " />
          Curriculum Syllabus Execution & Learning Outcomes Matrix
        </h2>
        <p className="text-xs text-gray-500  mt-0.5">
          Chapter-wise syllabus pacing, actual vs expected instructional progress, and CBSE competency mappings
        </p>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white  rounded-xl border border-gray-200 ">
          <span className="text-[10px] font-bold uppercase text-gray-400">Actual Syllabus Delivered</span>
          <div className="text-2xl font-black text-indigo-600 mt-1">{overview?.actualProgressPct}%</div>
          <span className="text-xs text-gray-500">{overview?.completedChapters} of {overview?.totalChapters} chapters complete</span>
        </div>

        <div className="p-4 bg-white  rounded-xl border border-gray-200 ">
          <span className="text-[10px] font-bold uppercase text-gray-400">Expected Annual Pacing</span>
          <div className="text-2xl font-black text-gray-900  mt-1">{overview?.expectedProgressPct}%</div>
          <span className="text-xs text-gray-500">Board calendar timeline</span>
        </div>

        <div className="p-4 bg-white  rounded-xl border border-gray-200 ">
          <span className="text-[10px] font-bold uppercase text-amber-500">Pacing Gap</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{overview?.gapPct}%</div>
          <span className="text-xs text-amber-600 font-semibold">Behind schedule</span>
        </div>

        <div className="p-4 bg-white  rounded-xl border border-gray-200 ">
          <span className="text-[10px] font-bold uppercase text-gray-400">Current Unit</span>
          <div className="text-base font-black text-gray-900  mt-1.5 truncate">
            {data?.chapters?.find((c: any) => c.status?.includes("In Progress"))?.name || data?.chapters?.[0]?.name || "None in Progress"}
          </div>
          <span className="text-xs text-gray-500">
            {data?.chapters?.length > 0 ? "Active syllabus tracking" : "No active chapters"}
          </span>
        </div>
      </div>

      {/* Chapters Table */}
      <div className="bg-white  rounded-xl border border-gray-200  p-5 space-y-4">
        <h3 className="text-base font-bold text-gray-900 ">
          Chapter-wise Curriculum Units
        </h3>

        {(!data?.chapters || data.chapters.length === 0) ? (
          <div className="py-12 text-center text-xs text-gray-400">
            No curriculum syllabus units recorded yet. When curriculum nodes are assigned, they will display here with lesson tracking.
          </div>
        ) : (
          <div className="space-y-3">
            {data?.chapters?.map((chap: any) => (
            <div key={chap.id} className="p-4 rounded-xl border border-gray-200  space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-indigo-50  text-indigo-600 font-bold flex items-center justify-center text-xs">
                    {chap.sequence}
                  </span>
                  <h4 className="font-bold text-sm text-gray-900 ">{chap.name}</h4>
                </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      chap.status === "Completed"
                        ? "bg-emerald-100 text-emerald-800  "
                        : chap.status.includes("In Progress")
                        ? "bg-blue-100 text-blue-800  "
                        : "bg-gray-100 text-gray-600 "
                    }`}>
                      {chap.status}
                    </span>
                    <span className="font-bold text-gray-900 ">{chap.completionPct}%</span>
                    {chap.completionPct < 100 && (
                      <button
                        onClick={() => handleIncrementProgress(chap)}
                        className="px-2 py-0.5 text-[11px] font-semibold rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
                        title="Record 1 delivered lesson"
                      >
                        + Lesson ({chap.completedLessons}/{chap.plannedLessons})
                      </button>
                    )}
                  </div>
                </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-100  h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all"
                  style={{ width: `${chap.completionPct}%` }}
                />
              </div>

              {/* Learning Outcomes */}
              <div className="space-y-1.5 pt-1">
                <span className="text-gray-400 font-semibold block text-[10px] uppercase">Mapped Learning Outcomes:</span>
                {chap.learningOutcomes?.map((lo: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-gray-50  text-gray-700 ">
                    <div>
                      <strong className="text-indigo-600 mr-2">{lo.code}:</strong>
                      <span>{lo.description}</span>
                    </div>
                    {lo.achievementPct !== null && (
                      <span className="font-bold text-emerald-600 shrink-0 ml-3">
                        {lo.achievementPct}% Achieved
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
