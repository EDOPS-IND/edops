"use client";

import { useEffect, useState } from "react";
import { getPrincipalAttendance } from "../../edops-api";

type Student = { id: string; name: string; className: string; roll: string; markedRecords: number; attendanceRate: number; daysAbsent: number; unexcusedAbsences: number };
type TrendDay = { date: string; markedRecords: number; presentRecords: number; attendanceRate: number | null };
type Teacher = { id: string; name: string; approvedLeave: boolean; recordedClasses: number };
type Attendance = { enrolledStudents: number; markedRecords: number; studentAttendanceRate: number | null; pendingRegisters: number; atRisk: Student[]; trend: TrendDay[]; teachers: Teacher[] };
type View = "students" | "trends" | "teachers";

export function AttendancePane({ organizationId, initialTab = "students" }: {
  organizationId: string; initialTab?: View;
}) {
  const [data, setData] = useState<Attendance | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    getPrincipalAttendance(organizationId)
      .then((result) => { if (active) setData(result); })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Could not load attendance"); });
    return () => { active = false; };
  }, [organizationId]);

  const view = initialTab;
  const date = (value: string) => value?.slice(0, 10) || "—";
  const rate = (value: number | null | undefined) => value == null ? "—" : `${value}%`;
  const card = (label: string, value: string | number, detail: string) =>
    <div className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-xs font-semibold text-slate-600">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p><p className="text-xs text-slate-500">{detail}</p></div>;

  return <section className="space-y-5 text-sm">
    <h2 className="text-xl font-semibold">{{ students: "Student Attendance", trends: "Attendance Trends", teachers: "Teacher Activity and Leave" }[view]}</h2>
    {error && <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{error}</p>}
    {!data && !error && <p>Loading attendance…</p>}
    {data && view === "students" && <>
      <p className="text-slate-600">Current academic year. Attendance comes from finalized class registers; below 75% identifies students who may need follow-up.</p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {card("Campus student attendance today", rate(data.studentAttendanceRate), `${data.markedRecords} recorded student periods`)}
        {card("Active enrolled students", data.enrolledStudents, "Current academic year")}
        {card("Below 75% attendance", data.atRisk.length, "Students with recorded attendance")}
        {card("Pending class registers today", data.pendingRegisters, "Scheduled periods without a finalized register")}
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <h3 className="p-4 font-semibold">Students below 75%</h3>
        {data.atRisk.length ? <table className="w-full text-left"><thead className="bg-slate-50"><tr>
          <th className="p-3">Student</th><th className="p-3">Class / roll</th><th className="p-3">Attendance</th>
          <th className="p-3">Days absent</th><th className="p-3">Unexcused records</th>
        </tr></thead><tbody>{data.atRisk.map((student) => <tr key={student.id} className="border-t border-slate-100">
          <td className="p-3">{student.name}</td><td className="p-3">{student.className} · {student.roll}</td>
          <td className="p-3">{rate(student.attendanceRate)} ({student.markedRecords} records)</td>
          <td className="p-3">{student.daysAbsent}</td><td className="p-3">{student.unexcusedAbsences}</td>
        </tr>)}</tbody></table> : <p className="p-4 text-slate-500">No student with recorded attendance is below 75%.</p>}
      </div>
    </>}
    {data && view === "trends" && <>
      <p className="text-slate-600">Daily attendance across finalized registers for the last 14 calendar days. A dash means no student attendance was recorded that day.</p>
      <div className="grid grid-cols-7 gap-2 rounded-lg border border-slate-200 bg-white p-4 lg:grid-cols-14">
        {data.trend.map((day) => <div key={date(day.date)} className="flex flex-col items-center gap-1" title={`${date(day.date)}: ${rate(day.attendanceRate)}, ${day.markedRecords} records`}>
          <span className="text-xs font-semibold">{rate(day.attendanceRate)}</span>
          <div className="flex h-32 w-full items-end rounded bg-slate-100"><div className="w-full rounded bg-blue-600" style={{ height: day.attendanceRate == null ? 0 : `${day.attendanceRate}%` }} /></div>
          <span className="text-[10px] text-slate-600">{date(day.date).slice(5)}</span>
        </div>)}
      </div>
      <div className="overflow-x-auto rounded-lg border bg-white"><table className="w-full text-left"><thead><tr><th className="p-3">Date</th><th className="p-3">Present / late</th><th className="p-3">Recorded</th><th className="p-3">Rate</th></tr></thead>
        <tbody>{data.trend.map((day) => <tr key={date(day.date)} className="border-t"><td className="p-3">{date(day.date)}</td><td className="p-3">{day.presentRecords}</td><td className="p-3">{day.markedRecords}</td><td className="p-3">{rate(day.attendanceRate)}</td></tr>)}</tbody></table></div>
    </>}
    {data && view === "teachers" && <>
      <p className="text-slate-600">Recorded teaching comes from finalized class registers. Approved leave comes from leave requests. No recorded class does not establish that a teacher was absent.</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {card("Active teachers", data.teachers.length, "School roster")}
        {card("Recorded teaching today", data.teachers.filter((teacher) => teacher.recordedClasses > 0).length, "At least one finalized register")}
        {card("Approved leave today", data.teachers.filter((teacher) => teacher.approvedLeave).length, "Approved leave requests")}
      </div>
      <div className="overflow-x-auto rounded-lg border bg-white"><table className="w-full text-left"><thead><tr><th className="p-3">Teacher</th><th className="p-3">Recorded classes today</th><th className="p-3">Approved leave</th></tr></thead>
        <tbody>{data.teachers.map((teacher) => <tr key={teacher.id} className="border-t"><td className="p-3">{teacher.name}</td><td className="p-3">{teacher.recordedClasses}</td><td className="p-3">{teacher.approvedLeave ? "Yes" : "No"}</td></tr>)}</tbody></table>
        {!data.teachers.length && <p className="p-4 text-slate-500">No active teachers in this school.</p>}</div>
    </>}
  </section>;
}
