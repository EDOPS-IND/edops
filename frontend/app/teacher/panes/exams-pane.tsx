"use client";

import React, { useState, useEffect } from "react";
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck
} from "lucide-react";
import { getTeacherAssessments } from "../../edops-api";

interface ExamsPaneProps {
  organizationId: string;
}

export function ExamsPane({ organizationId }: ExamsPaneProps) {
  const [examSchedules, setExamSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadExams() {
      setLoading(true);
      try {
        const res = await getTeacherAssessments(organizationId);
        setExamSchedules(res?.examSchedules || []);
      } catch {
        setExamSchedules([]);
      } finally {
        setLoading(false);
      }
    }
    loadExams();
  }, [organizationId]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900  flex items-center gap-2">
          <Award className="w-6 h-6 text-indigo-600 " />
          Formal Examinations & Evaluation Readiness
        </h2>
        <p className="text-xs text-gray-500  mt-0.5">
          Term examination schedules, syllabus verification checkpoints and marks submission deadlines
        </p>
      </div>

      {examSchedules.length > 0 ? (
        <div className="space-y-4">
          {examSchedules.map((exam) => (
            <div key={exam.id} className="p-5 bg-white  rounded-xl border border-gray-200  space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-gray-100 ">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 ">
                    {exam.classSection} • {exam.subject}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900  mt-0.5">
                    {exam.name}
                  </h3>
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800   w-fit">
                  {exam.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-gray-50  rounded-xl space-y-1">
                  <span className="text-gray-400 font-medium">Exam Date & Timing</span>
                  <div className="font-bold text-gray-900  text-sm">{exam.date}</div>
                  <div className="text-gray-500">{exam.time}</div>
                </div>

                <div className="p-3 bg-gray-50  rounded-xl space-y-1">
                  <span className="text-gray-400 font-medium">Marks Entry Deadline</span>
                  <div className="font-bold text-amber-600 text-sm">{exam.marksSubmissionDeadline}</div>
                  <div className="text-gray-500">Lock enforced at 05:00 PM</div>
                </div>

                <div className="p-3 bg-gray-50  rounded-xl space-y-1">
                  <span className="text-gray-400 font-medium">Room Allocation</span>
                  <div className="font-bold text-gray-900  text-sm">{exam.roomAllocations || "Assigned Classroom"}</div>
                  <div className="text-gray-500">Seating chart published</div>
                </div>
              </div>

              <div className="p-3 bg-indigo-50/50  border border-indigo-100  rounded-xl">
                <span className="font-bold text-indigo-900  block mb-0.5">Tested Syllabus Scope:</span>
                <p className="text-gray-700 ">{exam.syllabusUnits}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-10 text-center bg-white rounded-xl border border-dashed border-gray-200 text-gray-400 text-xs">
          No formal term examinations or evaluation milestones scheduled currently.
        </div>
      )}
    </div>
  );
}
