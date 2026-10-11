"use client";

import { useEffect, useState } from "react";
import { getPrincipalLearningOverview } from "../../edops-api";

type Assignment = { id: string; title: string; className: string; subjectName: string; teacherName: string; dueAt: string; assigned: number; submitted: number; evaluated: number; pendingEvaluation: number };
type Submission = { id: string; assignmentTitle: string; className: string; studentName: string; status: string; submittedAt: string; gradedAt: string | null; score: number | null; maxScore: number; dueAt: string };
type Material = { id: string; title: string; description: string | null; chapter: string; topic: string; fileType: string; fileUrl: string; createdAt: string; className: string; subjectName: string; teacherName: string };
type Activity = { id: string; date: string; period: number; topicsCovered: string; participationPct: number; homeworkAssigned: string | null; reflection: string | null; status: string; className: string; subjectName: string; teacherName: string };
type Data = { assignments: Assignment[]; submissions: Submission[]; materials: Material[]; activities: Activity[] };
type View = "assignments" | "submissions" | "materials" | "activities";
const showDate = (value: string | null) => value ? new Date(value).toLocaleDateString() : "—";

export function LearningPane({ organizationId, initialTab = "assignments" }: { organizationId: string; initialTab?: View }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    getPrincipalLearningOverview(organizationId)
      .then((result) => { if (active) setData(result); })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Could not load learning records"); });
    return () => { active = false; };
  }, [organizationId]);

  const assignments = data?.assignments ?? [];
  const submissions = data?.submissions ?? [];
  const materials = data?.materials ?? [];
  const activities = data?.activities ?? [];
  const assigned = assignments.reduce((sum, item) => sum + Number(item.assigned), 0);
  const submitted = assignments.reduce((sum, item) => sum + Number(item.submitted), 0);
  const pending = assignments.reduce((sum, item) => sum + Number(item.pendingEvaluation), 0);
  const kpi = (label: string, value: string | number, detail: string) =>
    <div className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-xs font-semibold text-slate-600">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p><p className="text-xs text-slate-500">{detail}</p></div>;
  const cell = "p-3 text-left align-top";

  return <section className="space-y-5 text-sm">
    <h2 className="text-xl font-semibold">{{ assignments: "Assignments", submissions: "Submissions", materials: "Study Materials", activities: "Classroom Activities" }[initialTab]}</h2>
    {error && <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{error}</p>}
    {!data && !error && <p>Loading learning records…</p>}

    {data && initialTab === "assignments" && <>
      <p className="text-slate-600">Published assignments for the current academic year. Assigned counts use active students in each class.</p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpi("Published assignments", assignments.length, "Current academic year")}
        {kpi("Submitted / assigned", `${submitted} / ${assigned}`, "Student submissions")}
        {kpi("Submission completion", assigned ? `${Math.round(100 * submitted / assigned)}%` : "—", "Across published assignments")}
        {kpi("Pending evaluation", pending, "Submitted but not graded")}
      </div>
      <div className="overflow-x-auto rounded-lg border bg-white"><table className="w-full"><thead className="bg-slate-50"><tr>
        <th className={cell}>Assignment</th><th className={cell}>Class / subject</th><th className={cell}>Teacher</th><th className={cell}>Due</th>
        <th className={cell}>Submitted / assigned</th><th className={cell}>Evaluated</th><th className={cell}>Pending</th>
      </tr></thead><tbody>{assignments.map((item) => <tr key={item.id} className="border-t">
        <td className={cell}>{item.title}</td><td className={cell}>{item.className} · {item.subjectName}</td><td className={cell}>{item.teacherName}</td>
        <td className={cell}>{showDate(item.dueAt)}</td><td className={cell}>{item.submitted} / {item.assigned}</td>
        <td className={cell}>{item.evaluated}</td><td className={cell}>{item.pendingEvaluation}</td>
      </tr>)}</tbody></table>{!assignments.length && <p className="p-4 text-slate-500">No published assignments in the current academic year.</p>}</div>
    </>}

    {data && initialTab === "submissions" && <>
      <p className="text-slate-600">Individual student work received for published assignments. Missing submissions appear in the outstanding count.</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {kpi("Received", submitted, "Across published assignments")}
        {kpi("Awaiting submission", Math.max(0, assigned - submitted), "Assigned less received")}
        {kpi("Awaiting evaluation", pending, "Received but not graded")}
      </div>
      <div className="overflow-x-auto rounded-lg border bg-white"><table className="w-full"><thead className="bg-slate-50"><tr>
        <th className={cell}>Student</th><th className={cell}>Assignment</th><th className={cell}>Class</th><th className={cell}>Submitted</th><th className={cell}>Timing</th><th className={cell}>Evaluation</th>
      </tr></thead><tbody>{submissions.map((item) => <tr key={item.id} className="border-t">
        <td className={cell}>{item.studentName}</td><td className={cell}>{item.assignmentTitle}</td><td className={cell}>{item.className}</td>
        <td className={cell}>{showDate(item.submittedAt)}</td><td className={cell}>{new Date(item.submittedAt) <= new Date(item.dueAt) ? "On time" : "Late"}</td>
        <td className={cell}>{item.gradedAt ? `${item.score} / ${item.maxScore}` : "Pending"}</td>
      </tr>)}</tbody></table>{!submissions.length && <p className="p-4 text-slate-500">No student submissions recorded for published assignments.</p>}</div>
      {submissions.length === 100 && <p className="text-xs text-slate-500">Showing the 100 most recent submissions.</p>}
    </>}

    {data && initialTab === "materials" && <>
      <p className="text-slate-600">Resources teachers have saved for a class and subject: documents, videos, presentations, images, or links.</p>
      <div className="overflow-x-auto rounded-lg border bg-white"><table className="w-full"><thead className="bg-slate-50"><tr>
        <th className={cell}>Material</th><th className={cell}>Class / subject</th><th className={cell}>Chapter / topic</th><th className={cell}>Teacher</th><th className={cell}>Type</th><th className={cell}>Added</th>
      </tr></thead><tbody>{materials.map((item) => {
        const safeUrl = /^https?:\/\//i.test(item.fileUrl) || /^\/(?!\/)/.test(item.fileUrl);
        return <tr key={item.id} className="border-t"><td className={cell}>{safeUrl ? <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">{item.title}</a> : item.title}
          {item.description && <p className="text-xs text-slate-500">{item.description}</p>}</td>
          <td className={cell}>{item.className} · {item.subjectName}</td><td className={cell}>{item.chapter} · {item.topic}</td>
          <td className={cell}>{item.teacherName}</td><td className={cell}>{item.fileType}</td><td className={cell}>{showDate(item.createdAt)}</td></tr>;
      })}</tbody></table>{!materials.length && <p className="p-4 text-slate-500">No study materials saved for current classes.</p>}</div>
      {materials.length === 100 && <p className="text-xs text-slate-500">Showing the 100 most recent materials.</p>}
    </>}

    {data && initialTab === "activities" && <>
      <p className="text-slate-600">Teacher-recorded lesson delivery and classroom participation, including covered topics and assigned homework.</p>
      <div className="overflow-x-auto rounded-lg border bg-white"><table className="w-full"><thead className="bg-slate-50"><tr>
        <th className={cell}>Date / period</th><th className={cell}>Class / subject</th><th className={cell}>Teacher</th><th className={cell}>Topics covered</th><th className={cell}>Participation</th><th className={cell}>Homework / reflection</th>
      </tr></thead><tbody>{activities.map((item) => <tr key={item.id} className="border-t">
        <td className={cell}>{item.date} · {item.period}</td><td className={cell}>{item.className} · {item.subjectName}</td>
        <td className={cell}>{item.teacherName}</td><td className={cell}>{item.topicsCovered}</td><td className={cell}>{item.participationPct}% ({item.status})</td>
        <td className={cell}>{item.homeworkAssigned || "—"}{item.reflection && <p className="text-xs text-slate-500">{item.reflection}</p>}</td>
      </tr>)}</tbody></table>{!activities.length && <p className="p-4 text-slate-500">No classroom activity recorded for current classes.</p>}</div>
      {activities.length === 100 && <p className="text-xs text-slate-500">Showing the 100 most recent activities.</p>}
    </>}
  </section>;
}
