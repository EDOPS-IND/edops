"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  BookOpen,
  Calendar,
  ClipboardList,
  GraduationCap,
  TrendingUp,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ChevronRight
} from "lucide-react";
import { getTeacherClasses, getTeacherClassDetails } from "../../edops-api";

interface ClassesPaneProps {
  organizationId: string;
  onOpenStudentDossier: (studentId: string) => void;
  onTakeAttendance: (sectionId: string, className?: string) => void;
  onCreateAssignment: (sectionId: string) => void;
}

export function ClassesPane({
  organizationId,
  onOpenStudentDossier,
  onTakeAttendance,
  onCreateAssignment,
}: ClassesPaneProps) {
  const [classesData, setClassesData] = useState<any>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [classDetail, setClassDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadClasses();
  }, [organizationId]);

  useEffect(() => {
    if (selectedSectionId) {
      loadClassDetail(selectedSectionId);
    }
  }, [selectedSectionId]);

  async function loadClasses() {
    setLoading(true);
    try {
      const res = await getTeacherClasses(organizationId);
      setClassesData(res);
      if (res?.classes?.length > 0) {
        setSelectedSectionId(res.classes[0].sectionId);
      }
    } catch {
      setClassesData({ classes: [] });
      setSelectedSectionId("");
    } finally {
      setLoading(false);
    }
  }

  async function loadClassDetail(sectionId: string) {
    setDetailLoading(true);
    try {
      const res = await getTeacherClassDetails(organizationId, sectionId);
      setClassDetail(res);
    } catch {
      setClassDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }

  const selectedClass = classesData?.classes?.find((c: any) => c.sectionId === selectedSectionId);

  const filteredStudents = (classDetail?.students || []).filter((s: any) => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase()) && !s.rollNumber.includes(searchQuery)) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900  flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600 " />
            My Teaching Classes & Subject Command
          </h2>
          <p className="text-xs text-gray-500  mt-0.5">
            Subject-scoped academic command center for classes assigned in the active academic year
          </p>
        </div>
      </div>

      {/* Classes Selector Strip */}
      {classesData?.classes?.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {classesData.classes.map((c: any) => {
            const isSelected = c.sectionId === selectedSectionId;
            return (
              <div
                key={c.sectionId}
                onClick={() => setSelectedSectionId(c.sectionId)}
                className={`p-4 rounded-xl border cursor-pointer transition relative ${
                  isSelected
                    ? "bg-indigo-50/70  border-indigo-500 shadow-md ring-2 ring-indigo-500/20"
                    : "bg-white  border-gray-200  hover:border-gray-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 ">
                      {c.className}
                    </h3>
                    <p className="text-xs font-semibold text-indigo-600 ">
                      {c.subjectName}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100  text-gray-600  font-semibold">
                    {c.studentCount} Students
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 text-[11px]">
                  <div>
                    <span className="text-gray-400 block">Average</span>
                    <strong className="text-gray-900  text-sm">{c.subjectAverage}%</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Attendance</span>
                    <strong className="text-emerald-600 text-sm">{c.attendanceRate}%</strong>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-gray-100  flex items-center justify-between text-[11px] text-gray-500">
                  <span>{c.upcomingExam || "Active Session"}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center bg-white rounded-xl border border-dashed border-gray-200 text-gray-400 text-xs">
          No classes assigned to this teacher in the active academic term.
        </div>
      )}

      {/* SELECTED CLASS ACADEMIC DETAIL */}
      {selectedClass && (
        <div className="bg-white  rounded-xl border border-gray-200  p-6 space-y-6">
          {/* Class Header Bar */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-gray-200 ">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600  bg-indigo-50  px-2 py-0.5 rounded">
                  Active Subject View
                </span>
                <h3 className="text-xl font-bold text-gray-900 ">
                  {selectedClass.className} — {selectedClass.subjectName}
                </h3>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Displaying subject-scoped attendance, test mastery, coursework rates and student classifications
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onTakeAttendance(selectedClass.sectionId, selectedClass.className)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[#090D16] hover:bg-[#131C31] shadow-xs border border-[#1A243D] transition-colors"
                style={{ color: "#FFFFFF" }}
              >
                Take Register
              </button>
              <button
                onClick={() => onCreateAssignment(selectedClass.sectionId)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 shadow-sm transition-colors"
                style={{ color: "#0F172A" }}
              >
                + Assignment
              </button>
            </div>
          </div>

          {/* Section KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 bg-gray-50  rounded-xl space-y-1">
              <span className="text-gray-400 block font-medium">Class Subject Average</span>
              <div className="text-2xl font-black text-indigo-600">{classDetail?.overview?.subjectAverage ?? 0}%</div>
              <span className="text-gray-500">Highest: {classDetail?.overview?.highestScore ?? 0}% • Lowest: {classDetail?.overview?.lowestScore ?? 0}%</span>
            </div>

            <div className="p-3.5 bg-gray-50  rounded-xl space-y-1">
              <span className="text-gray-400 block font-medium">Pass Percentage</span>
              <div className="text-2xl font-black text-emerald-600">{classDetail?.overview?.passRate ?? 0}%</div>
              <span className="text-gray-500">Median Score: {classDetail?.overview?.medianScore ?? 0}%</span>
            </div>

            <div className="p-3.5 bg-gray-50  rounded-xl space-y-1">
              <span className="text-gray-400 block font-medium">Attendance Rate</span>
              <div className="text-2xl font-black text-blue-600">{classDetail?.overview?.attendance ?? 0}%</div>
              <span className="text-gray-500">Period attendance records</span>
            </div>

            <div className="p-3.5 bg-gray-50  rounded-xl space-y-1">
              <span className="text-gray-400 block font-medium">Curriculum Progress</span>
              <div className="text-2xl font-black text-purple-600">{classDetail?.overview?.curriculumProgress ?? 0}%</div>
              <span className="text-gray-500">{classDetail?.chapters?.length ?? 0} Chapters tracked</span>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-gray-500">Classification:</span>
              {["all", "Strong", "On Track", "Needs Support", "Intervention Recommended"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-colors ${
                    statusFilter === st
                      ? "bg-[#090D16] shadow-sm border border-[#1A243D]"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                  }`}
                  style={statusFilter === st ? { color: "#FFFFFF" } : undefined}
                >
                  {st === "all" ? "All" : st}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search student by name or roll..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-gray-50  border border-gray-300  rounded-lg text-gray-900 "
              />
            </div>
          </div>

          {/* Students Roster Table */}
          <div className="overflow-x-auto border border-gray-200  rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50  text-gray-500  font-bold uppercase tracking-wider text-[10px] border-b border-gray-200 ">
                <tr>
                  <th className="py-3 px-4">Roll</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Attendance</th>
                  <th className="py-3 px-4">Subject Avg</th>
                  <th className="py-3 px-4">Coursework</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 ">
                {detailLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">Loading roster...</td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">No students match filter criteria.</td>
                  </tr>
                ) : (
                  filteredStudents.map((s: any) => (
                    <tr key={s.id} className="hover:bg-gray-50 :bg-gray-750/50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-gray-500">{s.rollNumber}</td>
                      <td className="py-3 px-4 font-bold text-gray-900">
                        {s.name || "Student"}
                      </td>
                      <td className="py-3 px-4 font-semibold text-emerald-600">{s.attendance}%</td>
                      <td className="py-3 px-4 font-black text-indigo-600 text-sm">{s.subjectAverage}%</td>
                      <td className="py-3 px-4 text-gray-600 ">{s.assignmentCompletion}%</td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          s.status === "Strong"
                            ? "bg-emerald-100 text-emerald-800  "
                            : s.status === "On Track"
                            ? "bg-blue-100 text-blue-800  "
                            : s.status === "Needs Support"
                            ? "bg-amber-100 text-amber-800  "
                            : "bg-red-100 text-red-800  "
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onOpenStudentDossier(s.id)}
                          className="px-2.5 py-1 text-xs font-semibold text-indigo-600  hover:bg-indigo-50 :bg-indigo-950/60 rounded-lg transition"
                        >
                          View 360 →
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
