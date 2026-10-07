"use client";

import React, { useState, useEffect } from "react";
import {
  ClipboardList,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Search,
  ExternalLink,
  Plus
} from "lucide-react";
import { getTeacherAssignments, getTeacherSubmissionsQueue, gradeTeacherSubmission } from "../../edops-api";

interface AssignmentsPaneProps {
  organizationId: string;
  onCreateAssignment: () => void;
}

export function AssignmentsPane({
  organizationId,
  onCreateAssignment,
}: AssignmentsPaneProps) {
  const [data, setData] = useState<any>(null);
  const [queueData, setQueueData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"assignments" | "queue">("assignments");
  const [loading, setLoading] = useState(true);

  // Grading Drawer State
  const [gradingSubmission, setGradingSubmission] = useState<any>(null);
  const [score, setScore] = useState<number>(18);
  const [feedback, setFeedback] = useState<string>("Good work, accurate algebraic steps.");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [organizationId]);

  async function loadData() {
    setLoading(true);
    try {
      const [asgRes, queueRes] = await Promise.all([
        getTeacherAssignments(organizationId),
        getTeacherSubmissionsQueue(organizationId),
      ]);
      setData(asgRes);
      setQueueData(queueRes);
    } catch {
      setData({ assignments: [] });
      setQueueData({ pendingQueue: [] });
    } finally {
      setLoading(false);
    }
  }

  const handleGrade = async () => {
    if (!gradingSubmission) return;
    setSubmitting(true);
    try {
      await gradeTeacherSubmission(organizationId, gradingSubmission.id, {
        score: Number(score),
        feedback,
      });
      setQueueData((prev: any) => ({
        ...prev,
        pendingQueue: prev.pendingQueue.filter((q: any) => q.id !== gradingSubmission.id),
      }));
      setGradingSubmission(null);
    } catch {
      setQueueData((prev: any) => ({
        ...prev,
        pendingQueue: prev.pendingQueue.filter((q: any) => q.id !== gradingSubmission.id),
      }));
      setGradingSubmission(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900  flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-indigo-600 " />
            Coursework & Submission Evaluation Command
          </h2>
          <p className="text-xs text-gray-500  mt-0.5">
            Coursework authoring, student submission tracking and 48-hour SLA evaluation queues
          </p>
        </div>

        <button
          onClick={onCreateAssignment}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
        >
          + New Assignment
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200  gap-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab("assignments")}
          className={`py-2.5 border-b-2 transition ${
            activeTab === "assignments"
              ? "border-indigo-600 text-indigo-600 "
              : "border-transparent text-gray-500 hover:text-gray-900 :text-gray-200"
          }`}
        >
          All Coursework ({data?.assignments?.length ?? 0})
        </button>
        <button
          onClick={() => setActiveTab("queue")}
          className={`py-2.5 border-b-2 transition flex items-center gap-2 ${
            activeTab === "queue"
              ? "border-indigo-600 text-indigo-600 "
              : "border-transparent text-gray-500 hover:text-gray-900 :text-gray-200"
          }`}
        >
          <span>Evaluation Queue</span>
          <span className="text-[10px] bg-red-100 text-red-700   px-1.5 py-0.2 rounded-full font-bold">
            {queueData?.pendingQueue?.length ?? 0} Pending
          </span>
        </button>
      </div>

      {activeTab === "assignments" ? (
        /* Coursework Cards */
        data?.assignments?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.assignments.map((asg: any) => (
              <div key={asg.id} className="p-5 bg-white  rounded-xl border border-gray-200  space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                      {asg.sectionName} • {asg.subjectName}
                    </span>
                    <h3 className="text-base font-bold text-gray-900  mt-0.5">
                      {asg.title}
                    </h3>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800   capitalize">
                    {asg.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50  rounded-xl text-center text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Submitted</span>
                    <strong className="text-gray-900  text-sm">{asg.submittedCount} / {asg.totalStudents}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Evaluated</span>
                    <strong className="text-emerald-600 text-sm">{asg.evaluatedCount}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Pending SLA</span>
                    <strong className="text-red-600 text-sm">{asg.pendingEvaluation}</strong>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-gray-400">
                  <span>Due Date: {asg.dueAt || "No deadline"}</span>
                  <span>Max Marks: <strong>{asg.maxScore}</strong></span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center bg-white rounded-xl border border-dashed border-gray-200 text-gray-400 text-xs">
            No coursework assignments created yet. Click "+ Create Assignment" above to assign work.
          </div>
        )
      ) : (
        /* Evaluation Queue Table */
        <div className="bg-white  rounded-xl border border-gray-200  overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50  text-gray-500 font-bold uppercase tracking-wider text-[10px] border-b border-gray-200 ">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Assignment</th>
                <th className="py-3 px-4">Submitted At</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 ">
              {queueData?.pendingQueue?.length > 0 ? (
                queueData.pendingQueue.map((sub: any) => (
                  <tr key={sub.id} className="hover:bg-gray-50 :bg-gray-750/50">
                    <td className="py-3 px-4 font-bold text-gray-900 ">
                      {sub.studentName} <span className="text-gray-400 font-normal">({sub.rollNumber})</span>
                    </td>
                    <td className="py-3 px-4">{sub.classSection}</td>
                    <td className="py-3 px-4 font-medium text-indigo-600">{sub.assignmentTitle}</td>
                    <td className="py-3 px-4 text-gray-400">{sub.submittedAt || "N/A"}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        sub.status === "late" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setGradingSubmission(sub);
                          setScore(18);
                          setFeedback("Good solution formulation.");
                        }}
                        className="px-3 py-1 font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                      >
                        Grade Now →
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    No submissions currently pending evaluation.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Inline Grading Modal */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white  rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200  space-y-4 text-xs">
            <h3 className="text-base font-bold text-gray-900 ">
              Evaluate: {gradingSubmission.studentName} — {gradingSubmission.assignmentTitle}
            </h3>

            <div className="p-3 bg-gray-50  rounded-xl space-y-1">
              <span className="font-bold text-gray-700 ">Submitted Content:</span>
              <p className="text-gray-600 ">{gradingSubmission.content}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold block mb-1">Score (Out of {gradingSubmission.maxScore})</label>
                <input
                  type="number"
                  min={0}
                  max={gradingSubmission.maxScore}
                  value={score}
                  onChange={(e) => setScore(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border rounded-lg bg-white  text-gray-900 "
                />
              </div>
            </div>

            <div>
              <label className="font-bold block mb-1">Pedagogical Feedback</label>
              <textarea
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full px-3 py-1.5 border rounded-lg bg-white  text-gray-900 "
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setGradingSubmission(null)}
                className="px-3 py-1.5 font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleGrade}
                disabled={submitting}
                className="px-4 py-1.5 font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm"
              >
                {submitting ? "Saving..." : "Save Grade & Return"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
