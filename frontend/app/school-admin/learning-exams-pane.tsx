import React, { useState, useEffect } from "react";
import { api, createSchoolAdminCoursework, scheduleSchoolAdminExam } from "../edops-api";
import { ExamRecord } from "./types";
import {
  BookOpen,
  Award,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Calendar,
  Eye,
  Plus,
  X,
  ArrowRight,
} from "lucide-react";

export function LearningExamsPane({
  organizationId,
  initialTab = "assignments",
  activeTab,
  onTabChange,
}: {
  organizationId?: string;
  initialTab?: "assignments" | "exams" | "results";
  activeTab?: "assignments" | "exams" | "results";
  onTabChange?: (tab: "assignments" | "exams" | "results") => void;
}) {
  const [subtab, setSubtab] = useState<"assignments" | "exams" | "results">(activeTab || initialTab);

  useEffect(() => {
    if (activeTab) setSubtab(activeTab);
  }, [activeTab]);

  const [data, setData] = useState<any>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Modal open states
  const [showCourseworkModal, setShowCourseworkModal] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);

  // Coursework form
  const [asgSectionId, setAsgSectionId] = useState("");
  const [asgSubjectId, setAsgSubjectId] = useState("");
  const [asgTitle, setAsgTitle] = useState("");
  const [asgDesc, setAsgDesc] = useState("");
  const [asgDueAt, setAsgDueAt] = useState(() => new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]);
  const [asgMaxScore, setAsgMaxScore] = useState(100);

  // Exam form
  const [examSectionId, setExamSectionId] = useState("");
  const [examSubjectId, setExamSubjectId] = useState("");
  const [examName, setExamName] = useState("");
  const [examTerm, setExamTerm] = useState("Term 1");
  const [examDate, setExamDate] = useState(() => new Date(Date.now() + 86400000).toISOString().split("T")[0]);
  const [examStartTime, setExamStartTime] = useState("09:00");
  const [examEndTime, setExamEndTime] = useState("12:00");
  const [examMaxMarks, setExamMaxMarks] = useState(100);

  const loadData = () => {
    if (organizationId) {
      api<any>(`/organizations/${organizationId}/school-admin/learning/overview`)
        .then(setData)
        .catch(() => {});
    }
  };

  useEffect(() => {
    setData(null);
    loadData();
  }, [organizationId]);

  const assignments: any[] = data?.assignments || [];
  const exams: any[] = data?.exams || [];
  const sections: any[] = data?.sections || [];
  const subjects: any[] = data?.subjects || [];

  const openCourseworkModal = () => {
    setError("");
    if (!asgSectionId && sections.length > 0) setAsgSectionId(sections[0].id);
    if (!asgSubjectId && subjects.length > 0) setAsgSubjectId(subjects[0].id);
    setShowCourseworkModal(true);
  };

  const openExamModal = () => {
    setError("");
    if (!examSectionId && sections.length > 0) setExamSectionId(sections[0].id);
    if (!examSubjectId && subjects.length > 0) setExamSubjectId(subjects[0].id);
    setShowExamModal(true);
  };

  const handleCreateCoursework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId || !asgSectionId || !asgSubjectId || !asgTitle.trim()) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await createSchoolAdminCoursework(organizationId, {
        sectionId: asgSectionId,
        subjectId: asgSubjectId,
        title: asgTitle.trim(),
        description: asgDesc.trim() || undefined,
        dueAt: `${asgDueAt}T23:59:59Z`,
        maxScore: Number(asgMaxScore) || 100,
      });
      setNotice(`✓ Successfully published coursework "${asgTitle.trim()}".`);
      setShowCourseworkModal(false);
      setAsgTitle("");
      setAsgDesc("");
      loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to create coursework");
    } finally {
      setBusy(false);
    }
  };

  const handleScheduleExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId || !examSectionId || !examSubjectId || !examName.trim()) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await scheduleSchoolAdminExam(organizationId, {
        sectionId: examSectionId,
        subjectId: examSubjectId,
        examName: examName.trim(),
        term: examTerm.trim(),
        examDate,
        startTime: examStartTime,
        endTime: examEndTime,
        maxMarks: Number(examMaxMarks) || 100,
      });
      setNotice(`✓ Successfully scheduled exam "${examName.trim()}".`);
      setShowExamModal(false);
      setExamName("");
      loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to schedule exam");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      {notice && (
        <div style={{ padding: "10px 14px", background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: "8px", color: "#065F46", fontSize: "13px", fontWeight: 600 }}>
          {notice}
        </div>
      )}
      {error && (
        <div style={{ padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "8px", color: "#991B1B", fontSize: "13px", fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* Top 4 Pastel Metric Cards (Strictly 148px) */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
        {/* 1. Active Coursework (Pastel Violet) */}
        <article
          onClick={() => {
            setSubtab("assignments");
            setNotice("");
            setError("");
            if (onTabChange) onTabChange("assignments");
          }}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: "#e1d2ff",
            border: "1px solid #e1d2ff",
            borderRadius: "10px",
            color: "#4a0e8f",
            cursor: "pointer",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Active Coursework
            </span>
            <BookOpen size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#4a0e8f" }}>
            {assignments.length}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px" }}>Assignments &amp; Practice Sets</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600 }}>
              View <ArrowRight size={13} />
            </span>
          </div>
        </article>

        {/* 2. Submission Rate (Pastel Mint) */}
        <article
          onClick={() => {
            setSubtab("assignments");
            setNotice("");
            setError("");
            if (onTabChange) onTabChange("assignments");
          }}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: "#ccefbf",
            border: "1px solid #ccefbf",
            borderRadius: "10px",
            color: "#1a5c0a",
            cursor: "pointer",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Turn-In Rate
            </span>
            <CheckCircle2 size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#1a5c0a" }}>
            {assignments.length ? Math.round(assignments.reduce((sum, a) => sum + (a.completionPct || 0), 0) / assignments.length) : 0}%
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px" }}>Average completion pace</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600 }}>
              Turn-In <ArrowRight size={13} />
            </span>
          </div>
        </article>

        {/* 3. Term Exams (Pastel Sky) */}
        <article
          onClick={() => {
            setSubtab("exams");
            setNotice("");
            setError("");
            if (onTabChange) onTabChange("exams");
          }}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: "#bae5f5",
            border: "1px solid #bae5f5",
            borderRadius: "10px",
            color: "#0a5a7a",
            cursor: "pointer",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Exam Cycles
            </span>
            <Calendar size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#0a5a7a" }}>
            {exams.length}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px" }}>Term assessment windows</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600 }}>
              Exams <ArrowRight size={13} />
            </span>
          </div>
        </article>

        {/* 4. Results Published (Pastel Coral) */}
        <article
          onClick={() => {
            setSubtab("results");
            setNotice("");
            setError("");
            if (onTabChange) onTabChange("results");
          }}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: "#ffd8c7",
            border: "1px solid #ffd8c7",
            borderRadius: "10px",
            color: "#782a00",
            cursor: "pointer",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Published Results
            </span>
            <Award size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#782a00" }}>
            {exams.filter((ex) => ex.isPublished).length}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px" }}>Available in student portals</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600 }}>
              Results <ArrowRight size={13} />
            </span>
          </div>
        </article>
      </section>

      {/* Subtab Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e4e6e9", paddingBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", gap: "6px" }}>
          {[
            { id: "assignments", label: "Assignment Completion Monitoring" },
            { id: "exams", label: "Examinations & Schedules" },
            { id: "results", label: "Result Publishing & Report Cards" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setSubtab(tab.id as any);
                setNotice("");
                setError("");
                if (onTabChange) onTabChange(tab.id as any);
              }}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: subtab === tab.id ? 700 : 500,
                background: subtab === tab.id ? "#0c1e33" : "transparent",
                color: subtab === tab.id ? "#ffffff" : "#4a5568",
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={subtab === "assignments" ? openCourseworkModal : openExamModal}
          style={{ padding: "8px 16px", background: "#0c1e33", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "12.5px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <Plus size={15} /> {subtab === "assignments" ? "New Coursework" : "Schedule New Exam"}
        </button>
      </div>

      {/* 1. ASSIGNMENTS MONITORING TAB */}
      {subtab === "assignments" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #e4e6e9", borderRadius: "10px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0c1e33" }}>Active Coursework &amp; Homework Completion</h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>School Admin oversight of teacher assignment releases and student turn-in rates</p>
            </div>
            <span style={{ background: "#ECFDF5", color: "#047857", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 700 }}>
              Average Submission Rate: {assignments.length ? Math.round(assignments.reduce((sum, a) => sum + (a.completionPct || 0), 0) / assignments.length) : 0}%
            </span>
          </div>

          <div style={{ display: "grid", gap: "10px" }}>
            {assignments.length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>
                No active coursework records found. Click "+ New Coursework" to publish assignments across sections.
              </div>
            ) : (
              assignments.map((asg) => (
                <div key={asg.id} style={{ padding: "14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e4e6e9" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)" }}>{asg.class} · {asg.subject}</span>
                      <h4 style={{ margin: "2px 0", fontSize: "14.5px", fontWeight: 800, color: "#0c1e33" }}>{asg.title}</h4>
                      <span style={{ fontSize: "11.5px", color: "var(--muted)" }}>Faculty: <b>{asg.teacher}</b> · Due: <b>{asg.dueDate}</b></span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "16px", fontWeight: 800, color: "#0c1e33" }}>
                        {asg.submitted} / {asg.total} ({asg.completionPct}%)
                      </span>
                      <div style={{ fontSize: "11px", color: asg.status === "Graded" ? "#047857" : "#B45309", fontWeight: 700 }}>
                        {asg.status}
                      </div>
                    </div>
                  </div>

                  <div style={{ width: "100%", height: "6px", background: "#e4e6e9", borderRadius: "3px", margin: "10px 0 6px", overflow: "hidden" }}>
                    <div style={{ width: `${asg.completionPct}%`, height: "100%", background: "#0c1e33" }} />
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11.5px", color: "var(--muted)" }}>
                    <span>{asg.total - asg.submitted} students pending submission</span>
                    <button style={{ background: "transparent", border: "none", color: "#0c1e33", fontWeight: 700, cursor: "pointer" }}>
                      View Student Drilldown ↗
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 2. EXAMINATIONS SCHEDULE TAB */}
      {subtab === "exams" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #e4e6e9", borderRadius: "10px", padding: "20px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 800, color: "#0c1e33" }}>School Examination Windows &amp; Cycles</h3>
          <p style={{ margin: "0 0 16px", fontSize: "12px", color: "var(--muted)" }}>Unit Tests, Periodic Assessments, Half-Yearly and Annual CBSE Examination Cycles</p>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e4e6e9", color: "var(--muted)" }}>
                  <th style={{ padding: "10px" }}>Exam Name</th>
                  <th style={{ padding: "10px" }}>Exam Type</th>
                  <th style={{ padding: "10px" }}>Applicable Grades</th>
                  <th style={{ padding: "10px" }}>Dates Window</th>
                  <th style={{ padding: "10px" }}>Passing Criteria</th>
                  <th style={{ padding: "10px" }}>Result Status</th>
                  <th style={{ padding: "10px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {exams.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "24px", textAlign: "center", color: "var(--muted)" }}>
                      No examination cycles scheduled. Click "Schedule New Exam" above.
                    </td>
                  </tr>
                ) : (
                  exams.map((ex) => (
                    <tr key={ex.id} style={{ borderBottom: "1px solid #f4f6f7" }}>
                      <td style={{ padding: "12px 10px" }}>
                        <b style={{ color: "#0c1e33" }}>{ex.name}</b>
                        <div style={{ fontSize: "11px", color: "var(--muted)" }}>Session: {ex.academicYear}</div>
                      </td>
                      <td style={{ padding: "12px 10px" }}>{ex.examType}</td>
                      <td style={{ padding: "12px 10px" }}>{ex.grade}</td>
                      <td style={{ padding: "12px 10px" }}>{ex.startDate} → {ex.endDate}</td>
                      <td style={{ padding: "12px 10px" }}><b>{ex.passingMarks}</b> / {ex.totalMarks} (33%)</td>
                      <td style={{ padding: "12px 10px" }}>
                        <span style={{
                          padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 700,
                          background: ex.isPublished ? "#ECFDF5" : "#FEF3C7",
                          color: ex.isPublished ? "#047857" : "#92400E",
                        }}>
                          {ex.isPublished ? "Results Published" : "Marks In Progress"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 10px", textAlign: "right" }}>
                        <button style={{ padding: "4px 8px", background: "#f8fafc", border: "1px solid #e4e6e9", color: "#0c1e33", borderRadius: "6px", fontSize: "11.5px", fontWeight: 700, cursor: "pointer" }}>
                          Manage Subjects
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

      {/* 3. SAVED EXAM RESULTS TAB */}
      {subtab === "results" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #e4e6e9", borderRadius: "10px", padding: "20px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 800, color: "#0c1e33" }}>Saved Examination Results &amp; Report Cards</h3>
          <p style={{ margin: "0 0 16px", fontSize: "12px", color: "var(--muted)" }}>Verified student scores and academic performance archives</p>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e4e6e9", color: "var(--muted)" }}>
                  <th style={{ padding: "10px" }}>Exam</th>
                  <th style={{ padding: "10px" }}>Subject</th>
                  <th style={{ padding: "10px" }}>Student</th>
                  <th style={{ padding: "10px" }}>Marks Obtained</th>
                  <th style={{ padding: "10px" }}>Maximum Marks</th>
                  <th style={{ padding: "10px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {(!data?.results || data.results.length === 0) ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "var(--muted)" }}>
                      No examination scores currently published for this session.
                    </td>
                  </tr>
                ) : (
                  data.results.map((res: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #f4f6f7" }}>
                      <td style={{ padding: "12px 10px", fontWeight: 600, color: "#0c1e33" }}>{res.exam}</td>
                      <td style={{ padding: "12px 10px", color: "#334155" }}>{res.subject}</td>
                      <td style={{ padding: "12px 10px", fontWeight: 600, color: "#0c1e33" }}>{res.student}</td>
                      <td style={{ padding: "12px 10px", fontWeight: 700, color: "#047857" }}>{res.score}</td>
                      <td style={{ padding: "12px 10px", color: "var(--muted)" }}>{res.max}</td>
                      <td style={{ padding: "12px 10px" }}>
                        <span style={{ padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 700, background: "#ECFDF5", color: "#047857" }}>
                          {res.status || "Finalized"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Coursework Modal */}
      {showCourseworkModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(12, 30, 51, 0.45)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "14px", width: "100%", maxWidth: "520px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)", overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #e4e6e9", background: "#f8fafc" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <BookOpen size={18} color="#0c1e33" />
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0c1e33" }}>Create New Coursework</h3>
              </div>
              <button onClick={() => setShowCourseworkModal(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#667085" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCoursework} style={{ padding: "20px", display: "grid", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label style={{ display: "grid", gap: "4px", fontSize: "12px", fontWeight: 600, color: "#344054" }}>
                  <span>Class Section <span style={{ color: "#D92D20" }}>*</span></span>
                  <select
                    required
                    value={asgSectionId}
                    onChange={(e) => setAsgSectionId(e.target.value)}
                    style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #e4e6e9", fontSize: "13px", background: "#FFFFFF" }}
                  >
                    <option value="">Select section...</option>
                    {sections.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.programName ? `${s.programName} — ${s.name}` : `Section ${s.name}`}</option>
                    ))}
                  </select>
                </label>

                <label style={{ display: "grid", gap: "4px", fontSize: "12px", fontWeight: 600, color: "#344054" }}>
                  <span>Subject <span style={{ color: "#D92D20" }}>*</span></span>
                  <select
                    required
                    value={asgSubjectId}
                    onChange={(e) => setAsgSubjectId(e.target.value)}
                    style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #e4e6e9", fontSize: "13px", background: "#FFFFFF" }}
                  >
                    <option value="">Select subject...</option>
                    {subjects.map((sub: any) => (
                      <option key={sub.id} value={sub.id}>{sub.name} ({sub.code || "SUB"})</option>
                    ))}
                  </select>
                </label>
              </div>

              <label style={{ display: "grid", gap: "4px", fontSize: "12px", fontWeight: 600, color: "#344054" }}>
                <span>Assignment Title <span style={{ color: "#D92D20" }}>*</span></span>
                <input
                  type="text"
                  required
                  value={asgTitle}
                  onChange={(e) => setAsgTitle(e.target.value)}
                  placeholder="e.g. Real Numbers Practice Set & Proofs"
                  style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #e4e6e9", fontSize: "13px" }}
                />
              </label>

              <label style={{ display: "grid", gap: "4px", fontSize: "12px", fontWeight: 600, color: "#344054" }}>
                <span>Description / Homework Notes</span>
                <textarea
                  rows={3}
                  value={asgDesc}
                  onChange={(e) => setAsgDesc(e.target.value)}
                  placeholder="Instructions for students..."
                  style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #e4e6e9", fontSize: "13px", resize: "vertical" }}
                />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label style={{ display: "grid", gap: "4px", fontSize: "12px", fontWeight: 600, color: "#344054" }}>
                  <span>Due Date <span style={{ color: "#D92D20" }}>*</span></span>
                  <input
                    type="date"
                    required
                    value={asgDueAt}
                    onChange={(e) => setAsgDueAt(e.target.value)}
                    style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #e4e6e9", fontSize: "13px" }}
                  />
                </label>

                <label style={{ display: "grid", gap: "4px", fontSize: "12px", fontWeight: 600, color: "#344054" }}>
                  <span>Max Score</span>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={asgMaxScore}
                    onChange={(e) => setAsgMaxScore(Number(e.target.value))}
                    style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #e4e6e9", fontSize: "13px" }}
                  />
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", paddingTop: "8px", borderTop: "1px solid #e4e6e9" }}>
                <button
                  type="button"
                  onClick={() => setShowCourseworkModal(false)}
                  style={{ padding: "8px 14px", borderRadius: "6px", border: "1px solid #e4e6e9", background: "#f8fafc", fontSize: "12.5px", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  style={{ padding: "8px 18px", borderRadius: "6px", border: "none", background: "#0c1e33", color: "#ffffff", fontSize: "12.5px", fontWeight: 700, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.6 : 1 }}
                >
                  {busy ? "Publishing..." : "Publish Coursework"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Exam Modal */}
      {showExamModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(12, 30, 51, 0.45)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "14px", width: "100%", maxWidth: "520px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)", overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #e4e6e9", background: "#f8fafc" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Award size={18} color="#0c1e33" />
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0c1e33" }}>Schedule School Examination</h3>
              </div>
              <button onClick={() => setShowExamModal(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#667085" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleScheduleExam} style={{ padding: "20px", display: "grid", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label style={{ display: "grid", gap: "4px", fontSize: "12px", fontWeight: 600, color: "#344054" }}>
                  <span>Class Section <span style={{ color: "#D92D20" }}>*</span></span>
                  <select
                    required
                    value={examSectionId}
                    onChange={(e) => setExamSectionId(e.target.value)}
                    style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #e4e6e9", fontSize: "13px", background: "#FFFFFF" }}
                  >
                    <option value="">Select section...</option>
                    {sections.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.programName ? `${s.programName} — ${s.name}` : `Section ${s.name}`}</option>
                    ))}
                  </select>
                </label>

                <label style={{ display: "grid", gap: "4px", fontSize: "12px", fontWeight: 600, color: "#344054" }}>
                  <span>Subject <span style={{ color: "#D92D20" }}>*</span></span>
                  <select
                    required
                    value={examSubjectId}
                    onChange={(e) => setExamSubjectId(e.target.value)}
                    style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #e4e6e9", fontSize: "13px", background: "#FFFFFF" }}
                  >
                    <option value="">Select subject...</option>
                    {subjects.map((sub: any) => (
                      <option key={sub.id} value={sub.id}>{sub.name} ({sub.code || "SUB"})</option>
                    ))}
                  </select>
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "12px" }}>
                <label style={{ display: "grid", gap: "4px", fontSize: "12px", fontWeight: 600, color: "#344054" }}>
                  <span>Exam Name <span style={{ color: "#D92D20" }}>*</span></span>
                  <input
                    type="text"
                    required
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    placeholder="e.g. Periodic Assessment 2"
                    style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #e4e6e9", fontSize: "13px" }}
                  />
                </label>

                <label style={{ display: "grid", gap: "4px", fontSize: "12px", fontWeight: 600, color: "#344054" }}>
                  <span>Term / Cycle <span style={{ color: "#D92D20" }}>*</span></span>
                  <input
                    type="text"
                    required
                    value={examTerm}
                    onChange={(e) => setExamTerm(e.target.value)}
                    placeholder="e.g. Term 1"
                    style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #e4e6e9", fontSize: "13px" }}
                  />
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "12px" }}>
                <label style={{ display: "grid", gap: "4px", fontSize: "12px", fontWeight: 600, color: "#344054" }}>
                  <span>Exam Date <span style={{ color: "#D92D20" }}>*</span></span>
                  <input
                    type="date"
                    required
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #e4e6e9", fontSize: "13px" }}
                  />
                </label>

                <label style={{ display: "grid", gap: "4px", fontSize: "12px", fontWeight: 600, color: "#344054" }}>
                  <span>Start Time</span>
                  <input
                    type="time"
                    required
                    value={examStartTime}
                    onChange={(e) => setExamStartTime(e.target.value)}
                    style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #e4e6e9", fontSize: "13px" }}
                  />
                </label>

                <label style={{ display: "grid", gap: "4px", fontSize: "12px", fontWeight: 600, color: "#344054" }}>
                  <span>End Time</span>
                  <input
                    type="time"
                    required
                    value={examEndTime}
                    onChange={(e) => setExamEndTime(e.target.value)}
                    style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #e4e6e9", fontSize: "13px" }}
                  />
                </label>
              </div>

              <label style={{ display: "grid", gap: "4px", fontSize: "12px", fontWeight: 600, color: "#344054" }}>
                <span>Maximum Marks</span>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={examMaxMarks}
                  onChange={(e) => setExamMaxMarks(Number(e.target.value))}
                  style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #e4e6e9", fontSize: "13px" }}
                />
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", paddingTop: "8px", borderTop: "1px solid #e4e6e9" }}>
                <button
                  type="button"
                  onClick={() => setShowExamModal(false)}
                  style={{ padding: "8px 14px", borderRadius: "6px", border: "1px solid #e4e6e9", background: "#f8fafc", fontSize: "12.5px", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  style={{ padding: "8px 18px", borderRadius: "6px", border: "none", background: "#0c1e33", color: "#ffffff", fontSize: "12.5px", fontWeight: 700, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.6 : 1 }}
                >
                  {busy ? "Scheduling..." : "Schedule Exam"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
