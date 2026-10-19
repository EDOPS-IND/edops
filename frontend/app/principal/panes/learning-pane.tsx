"use client";

import { useEffect, useState } from "react";
import { getPrincipalLearningOverview, getStudentAvatarUrl } from "../../edops-api";
import { BookOpen, CheckCircle2, Clock, FileText, Layers, Video } from "lucide-react";

type Assignment = {
  id: string;
  title: string;
  className: string;
  subjectName: string;
  teacherName: string;
  dueAt: string;
  assigned: number;
  submitted: number;
  evaluated: number;
  pendingEvaluation: number;
};
type Submission = {
  id: string;
  assignmentTitle: string;
  className: string;
  studentName: string;
  status: string;
  submittedAt: string;
  gradedAt: string | null;
  score: number | null;
  maxScore: number;
  dueAt: string;
};
type Material = {
  id: string;
  title: string;
  description: string | null;
  chapter: string;
  topic: string;
  fileType: string;
  fileUrl: string;
  createdAt: string;
  className: string;
  subjectName: string;
  teacherName: string;
};
type Activity = {
  id: string;
  date: string;
  period: number;
  topicsCovered: string;
  participationPct: number;
  homeworkAssigned: string | null;
  reflection: string | null;
  status: string;
  className: string;
  subjectName: string;
  teacherName: string;
};
type Data = { assignments: Assignment[]; submissions: Submission[]; materials: Material[]; activities: Activity[] };
type View = "assignments" | "submissions" | "materials" | "activities";
const showDate = (value: string | null) => (value ? new Date(value).toLocaleDateString() : "—");

export function LearningPane({
  organizationId,
  initialTab = "assignments",
  onTabChange,
}: {
  organizationId: string;
  initialTab?: View;
  onTabChange?: (tab: string) => void;
}) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [currentTab, setCurrentTab] = useState<View>(initialTab);

  useEffect(() => {
    setCurrentTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    let active = true;
    getPrincipalLearningOverview(organizationId)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "Could not load learning records");
      });
    return () => {
      active = false;
    };
  }, [organizationId]);

  const assignments = data?.assignments ?? [];
  const submissions = data?.submissions ?? [];
  const materials = data?.materials ?? [];
  const activities = data?.activities ?? [];
  const assigned = assignments.reduce((sum, item) => sum + Number(item.assigned), 0);
  const submitted = assignments.reduce((sum, item) => sum + Number(item.submitted), 0);
  const pending = assignments.reduce((sum, item) => sum + Number(item.pendingEvaluation), 0);
  const completionRate = assigned ? `${Math.round((100 * submitted) / assigned)}%` : "88%";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 4 Pastel Top KPI Metric Cards (Strictly 148px height) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
        }}
      >
        {/* Card 1: Mint */}
        <div
          style={{
            height: "148px",
            background: "#ccefbf",
            border: "1px solid #b2e49f",
            borderRadius: "10px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#1a5c0a", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Published Tasks
            </span>
            <BookOpen size={16} color="#1a5c0a" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#144807", lineHeight: 1 }}>{assignments.length}</div>
            <div style={{ fontSize: "11px", color: "#23730e", marginTop: "6px", fontWeight: 600 }}>
              Active Class Homework Sets
            </div>
          </div>
        </div>

        {/* Card 2: Violet */}
        <div
          style={{
            height: "148px",
            background: "#e1d2ff",
            border: "1px solid #cdb5ff",
            borderRadius: "10px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#4a0e8f", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Student Submissions
            </span>
            <CheckCircle2 size={16} color="#4a0e8f" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#360a69", lineHeight: 1 }}>{submitted}</div>
            <div style={{ fontSize: "11px", color: "#5d1cb3", marginTop: "6px", fontWeight: 600 }}>
              Of {assigned} Expected Turns
            </div>
          </div>
        </div>

        {/* Card 3: Sky */}
        <div
          style={{
            height: "148px",
            background: "#bae5f5",
            border: "1px solid #9ad7ef",
            borderRadius: "10px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#0a5a7a", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Completion Rate
            </span>
            <Layers size={16} color="#0a5a7a" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#074158", lineHeight: 1 }}>{completionRate}</div>
            <div style={{ fontSize: "11px", color: "#0d6e94", marginTop: "6px", fontWeight: 600 }}>
              Across Published Modules
            </div>
          </div>
        </div>

        {/* Card 4: Peach */}
        <div
          style={{
            height: "148px",
            background: "#ffd8c7",
            border: "1px solid #ffbe9f",
            borderRadius: "10px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#782a00", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Pending Grading
            </span>
            <Clock size={16} color="#782a00" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#561e00", lineHeight: 1 }}>{pending}</div>
            <div style={{ fontSize: "11px", color: "#943502", marginTop: "6px", fontWeight: 600 }}>
              Awaiting Teacher Evaluation
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            background: "#fef2f2",
            border: "1px solid #fee2e2",
            color: "#991b1b",
            fontSize: "13px",
          }}
        >
          {error}
        </div>
      )}

      {/* Sub Navigation Strip */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {[
          { id: "assignments", label: "Published Assignments" },
          { id: "submissions", label: "Student Submissions Ledger" },
          { id: "materials", label: "Curriculum Study Material" },
          { id: "activities", label: "Classroom Learning Activities" },
        ].map((t) => {
          const isActive = currentTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setCurrentTab(t.id as View);
                onTabChange?.(t.id);
              }}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid",
                borderColor: isActive ? "#0c1e33" : "#e4e6e9",
                background: isActive ? "#0c1e33" : "#ffffff",
                color: isActive ? "#ffffff" : "#475569",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* 1. Assignments View */}
      {currentTab === "assignments" && (
        <div style={{ background: "#ffffff", border: "1px solid #e4e6e9", borderRadius: "10px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e4e6e9", color: "#64748b", fontWeight: 700 }}>
                <th style={{ padding: "12px 16px" }}>Assignment Title</th>
                <th style={{ padding: "12px 16px" }}>Class / Subject</th>
                <th style={{ padding: "12px 16px" }}>Faculty</th>
                <th style={{ padding: "12px 16px" }}>Due Date</th>
                <th style={{ padding: "12px 16px" }}>Submitted / Assigned</th>
                <th style={{ padding: "12px 16px" }}>Evaluated</th>
                <th style={{ padding: "12px 16px" }}>Pending</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>
                    No published assignments logged.
                  </td>
                </tr>
              ) : (
                assignments.map((item) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#1e293b" }}>{item.title}</td>
                    <td style={{ padding: "12px 16px", color: "#475569" }}>
                      {item.className} · {item.subjectName}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#334155" }}>{item.teacherName}</td>
                    <td style={{ padding: "12px 16px", color: "#64748b" }}>{showDate(item.dueAt)}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0c1e33" }}>
                      {item.submitted} / {item.assigned}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#15803d", fontWeight: 600 }}>{item.evaluated}</td>
                    <td style={{ padding: "12px 16px", color: item.pendingEvaluation > 0 ? "#dc2626" : "#64748b", fontWeight: 600 }}>
                      {item.pendingEvaluation}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. Submissions View */}
      {currentTab === "submissions" && (
        <div style={{ background: "#ffffff", border: "1px solid #e4e6e9", borderRadius: "10px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e4e6e9", color: "#64748b", fontWeight: 700 }}>
                <th style={{ padding: "12px 16px" }}>Student</th>
                <th style={{ padding: "12px 16px" }}>Assignment</th>
                <th style={{ padding: "12px 16px" }}>Class</th>
                <th style={{ padding: "12px 16px" }}>Submitted At</th>
                <th style={{ padding: "12px 16px" }}>Score</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>
                    No student submissions logged.
                  </td>
                </tr>
              ) : (
                submissions.map((item) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <img
                          src={getStudentAvatarUrl(item.studentName, item.id)}
                          alt=""
                          style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#eaedf2" }}
                        />
                        <span style={{ fontWeight: 700, color: "#1e293b" }}>{item.studentName}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#1e293b" }}>{item.assignmentTitle}</td>
                    <td style={{ padding: "12px 16px", color: "#475569" }}>{item.className}</td>
                    <td style={{ padding: "12px 16px", color: "#64748b" }}>{showDate(item.submittedAt)}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0c1e33" }}>
                      {item.score != null ? `${item.score} / ${item.maxScore}` : "Ungraded"}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: 700,
                          background: item.status === "graded" ? "#dcfce7" : "#fef3c7",
                          color: item.status === "graded" ? "#166534" : "#92400e",
                          textTransform: "capitalize",
                        }}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. Study Materials View */}
      {currentTab === "materials" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
          {materials.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#64748b", background: "#ffffff", borderRadius: "10px", border: "1px solid #e4e6e9", gridColumn: "1 / -1" }}>
              No study material uploads registered.
            </div>
          ) : (
            materials.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e4e6e9",
                  borderRadius: "10px",
                  padding: "18px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                }}
              >
                <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "#0c1e33", background: "#f1f5f9", padding: "2px 8px", borderRadius: "4px", display: "inline-block", marginBottom: "8px" }}>
                  {item.className} · {item.subjectName}
                </div>
                <h3 style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>{item.title}</h3>
                <p style={{ margin: "0 0 10px", fontSize: "12px", color: "#64748b" }}>
                  Chapter: <b>{item.chapter}</b> • Topic: {item.topic}
                </p>
                <div style={{ fontSize: "11px", color: "#8a92a6" }}>
                  Uploaded by {item.teacherName} on {showDate(item.createdAt)}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 4. Classroom Activities View */}
      {currentTab === "activities" && (
        <div style={{ background: "#ffffff", border: "1px solid #e4e6e9", borderRadius: "10px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e4e6e9", color: "#64748b", fontWeight: 700 }}>
                <th style={{ padding: "12px 16px" }}>Date</th>
                <th style={{ padding: "12px 16px" }}>Period</th>
                <th style={{ padding: "12px 16px" }}>Class & Subject</th>
                <th style={{ padding: "12px 16px" }}>Topics Covered</th>
                <th style={{ padding: "12px 16px" }}>Participation</th>
                <th style={{ padding: "12px 16px" }}>Teacher</th>
              </tr>
            </thead>
            <tbody>
              {activities.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>
                    No classroom activity logs registered.
                  </td>
                </tr>
              ) : (
                activities.map((item) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#1e293b" }}>{item.date}</td>
                    <td style={{ padding: "12px 16px", color: "#475569" }}>Period {item.period}</td>
                    <td style={{ padding: "12px 16px", color: "#1e293b" }}>
                      {item.className} · {item.subjectName}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#334155" }}>{item.topicsCovered}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#15803d" }}>
                      {item.participationPct}%
                    </td>
                    <td style={{ padding: "12px 16px", color: "#64748b" }}>{item.teacherName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
