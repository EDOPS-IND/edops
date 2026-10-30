"use client";

import React, { useState, useEffect } from "react";
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck,
  FileText,
  Plus,
  Send,
  X,
  AlertCircle,
  Upload,
  RefreshCw,
  Eye,
} from "lucide-react";
import { getTeacherAssessments, submitTeacherQuestionPaper, extractQuestionPaperOcr, getTeacherClassDetails, submitTeacherMarks } from "../../edops-api";

const T = {
  navy: "#0c1e33",
  slate: "#495d72",
  muted: "#a6abb5",
  faint: "#b3b3b3",
  pageBg: "#f4f6f7",
  white: "#ffffff",
  border: "#e4e6e9",
  line: "#ced8e5",
  chip: "#f5f6f8",
  blue: "#17a1fa",
  greenBg: "#ccefbf",
  greenDark: "#1a5c0a",
  skyBg: "#d0e6ff",
  skyDark: "#0a3a7a",
  amberBg: "#fde1ac",
  amberDark: "#614400",
  roseBg: "#ffd6d6",
  roseDark: "#7a1a1a",
  violetBg: "#e1d2ff",
  violetDark: "#4a0e8f",
};

interface ExamsPaneProps {
  organizationId: string;
}

export function ExamsPane({ organizationId }: ExamsPaneProps) {
  const [examSchedules, setExamSchedules] = useState<any[]>([]);
  const [questionPapers, setQuestionPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractMode, setExtractMode] = useState<"file" | "text">("file");
  const [rawDraftText, setRawDraftText] = useState("");
  const [viewingPaperContent, setViewingPaperContent] = useState<any>(null);

  const [paperForm, setPaperForm] = useState({
    title: "",
    subjectName: "",
    grade: "Grade 10",
    term: "Term 1 Midterm",
    totalMarks: 80,
    durationMinutes: 180,
    difficultyEasyPct: 30,
    difficultyMediumPct: 50,
    difficultyHardPct: 20,
    competencyMapped: true,
    formattedContent: "",
  });

  // Marks Entry State
  const [marksExam, setMarksExam] = useState<any | null>(null);
  const [marksScores, setMarksScores] = useState<Array<{ id: string; name: string; roll: string; score: number | ""; remarks: string }>>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [savingMarks, setSavingMarks] = useState(false);
  const [marksError, setMarksError] = useState("");

  async function handleOpenMarksEntry(exam: any) {
    setMarksExam(exam);
    setLoadingStudents(true);
    setMarksError("");
    try {
      const det = await getTeacherClassDetails(organizationId, exam.sectionId);
      if (det?.students) {
        const existing = exam.studentScores || {};
        setMarksScores(
          det.students.map((st: any) => ({
            id: st.id,
            name: st.name,
            roll: st.rollNumber || "01",
            score: existing[st.id] !== undefined ? existing[st.id] : "",
            remarks: "Satisfactory",
          }))
        );
      } else {
        setMarksScores([]);
      }
    } catch (err: any) {
      setMarksError(err?.message || "Failed to load student list");
      setMarksScores([]);
    } finally {
      setLoadingStudents(false);
    }
  }

  async function handleSaveMarks(lockMarks: boolean) {
    if (!marksExam || !marksScores.length) return;
    const max = Number(marksExam.maxMarks) || 80;
    const invalid = marksScores.find(
      (s) => s.score === "" || Number(s.score) < 0 || Number(s.score) > max
    );
    if (invalid) {
      setMarksError(`Please enter a valid numeric score (0 to ${max}) for each student.`);
      return;
    }
    setSavingMarks(true);
    setMarksError("");
    try {
      await submitTeacherMarks(organizationId, {
        sectionId: marksExam.sectionId,
        subjectId: marksExam.subjectId,
        title: marksExam.name,
        maxMarks: max,
        scores: marksScores.map((s) => ({
          studentId: s.id,
          score: Number(s.score),
          remarks: s.remarks,
        })),
        lockMarks,
      });
      setMarksExam(null);
      await loadExams();
    } catch (err: any) {
      setMarksError(err?.message || "Failed to save marks");
    } finally {
      setSavingMarks(false);
    }
  }

  async function loadExams() {
    try {
      const res = await getTeacherAssessments(organizationId);
      setExamSchedules(res?.examSchedules || []);
      setQuestionPapers(res?.questionPapers || []);
    } catch {
      setExamSchedules([]);
      setQuestionPapers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    loadExams();
  }, [organizationId]);

  async function handleSubmitPaper(e: React.FormEvent) {
    e.preventDefault();
    if (!paperForm.title.trim()) {
      setFormError("Enter a question paper title");
      return;
    }
    const easy = Number(paperForm.difficultyEasyPct) || 0;
    const med = Number(paperForm.difficultyMediumPct) || 0;
    const hard = Number(paperForm.difficultyHardPct) || 0;
    if (easy + med + hard !== 100) {
      setFormError("Difficulty percentages must total 100%");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      await submitTeacherQuestionPaper(organizationId, {
        ...paperForm,
        subjectName: paperForm.subjectName || examSchedules[0]?.subject || "General",
        grade: paperForm.grade || examSchedules[0]?.classSection?.split("-")[0]?.trim() || "Grade 10",
        term: paperForm.term || examSchedules[0]?.name || "Term 1 Midterm",
        totalMarks: Number(paperForm.totalMarks) || 80,
        durationMinutes: Number(paperForm.durationMinutes) || 180,
        difficultyEasyPct: easy,
        difficultyMediumPct: med,
        difficultyHardPct: hard,
        formattedContent: paperForm.formattedContent || undefined,
      });
      setShowSubmitModal(false);
      setPaperForm({
        title: "",
        subjectName: "",
        grade: "Grade 10",
        term: "Term 1 Midterm",
        totalMarks: 80,
        durationMinutes: 180,
        difficultyEasyPct: 30,
        difficultyMediumPct: 50,
        difficultyHardPct: 20,
        competencyMapped: true,
        formattedContent: "",
      });
      setRawDraftText("");
      await loadExams();
    } catch (err: any) {
      setFormError(err instanceof Error ? err.message : "Failed to submit question paper");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "48px 0", textAlign: "center", color: T.slate, fontFamily: "'Poppins', sans-serif" }}>
        <div
          style={{
            width: "28px",
            height: "28px",
            border: `3px solid ${T.line}`,
            borderTopColor: T.navy,
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 12px",
          }}
        />
        <p style={{ fontSize: "13px", fontWeight: 600, color: T.slate, margin: 0 }}>
          Loading examination schedules...
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* 1. Header Row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: T.slate,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Examinations &amp; Terminals
          </span>
          <h2
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: 600,
              color: T.navy,
              letterSpacing: "-0.01em",
            }}
          >
            Term Examinations &amp; Evaluation Deadlines
          </h2>
          <p style={{ margin: 0, fontSize: "13px", color: T.slate, lineHeight: 1.5 }}>
            Official examination timetables, syllabus scopes, room allocations, and marks submission checkpoints.
          </p>
        </div>

        <div
          style={{
            padding: "6px 14px",
            borderRadius: "100px",
            background: T.chip,
            fontSize: "11px",
            fontWeight: 600,
            color: T.slate,
            border: `1px solid ${T.border}`,
          }}
        >
          {examSchedules.length} Terminal Exams Scheduled
        </div>
      </div>

      {/* 2. Top 4 Metric Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "12px",
        }}
      >
        {/* Total Terminal Exams */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: T.skyBg,
            border: `1px solid ${T.skyBg}`,
            borderRadius: "10px",
            color: T.skyDark,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Terminal Exams
            </span>
            <Award size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.skyDark }}>
            {examSchedules.length}
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.skyDark }}>
            Scheduled for current academic year
          </p>
        </div>

        {/* Next Exam */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: T.violetBg,
            border: `1px solid ${T.violetBg}`,
            borderRadius: "10px",
            color: T.violetDark,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Next Exam
            </span>
            <Calendar size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "18px", fontWeight: 700, lineHeight: 1.2, color: T.violetDark, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {examSchedules[0]?.name || "—"}
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.violetDark }}>
            {examSchedules[0]?.date ? `Date: ${examSchedules[0].date}` : "No upcoming exams scheduled"}
          </p>
        </div>

        {/* Marks Deadline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: T.amberBg,
            border: `1px solid ${T.amberBg}`,
            borderRadius: "10px",
            color: T.amberDark,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Evaluation Deadline
            </span>
            <Clock size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "20px", fontWeight: 700, lineHeight: 1.2, color: T.amberDark, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {examSchedules[0]?.marksSubmissionDeadline || "—"}
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.amberDark }}>
            {examSchedules[0]?.marksSubmissionDeadline ? "7 days post-examination lock" : "Pending exam completion"}
          </p>
        </div>

        {/* Question Papers Status */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: T.greenBg,
            border: `1px solid ${T.greenBg}`,
            borderRadius: "10px",
            color: T.greenDark,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Question Papers
            </span>
            <CheckCircle2 size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.greenDark }}>
            {questionPapers.length > 0
              ? `${questionPapers.filter((p) => p.status === "Approved").length}/${questionPapers.length}`
              : "0"}
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.greenDark }}>
            {questionPapers.some((p) => p.status === "Under Review")
              ? "Papers awaiting Principal review"
              : questionPapers.length > 0
              ? "All submitted papers approved"
              : "Submit blueprint before exam week"}
          </p>
        </div>
      </div>

      {/* 3. Question Papers for Approval Section */}
      <div
        style={{
          background: T.white,
          borderRadius: "10px",
          border: `1px solid ${T.border}`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "18px 24px",
            borderBottom: `1px solid ${T.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            background: "#fcfdfe",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FileCheck size={18} style={{ color: T.navy }} />
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: T.navy }}>
                Question Papers for Principal Approval
              </h3>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: T.slate }}>
              Submit question paper blueprints approx. 1 week prior to exams for Principal review, difficulty balancing, and approval.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setFormError("");
              setShowSubmitModal(true);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              borderRadius: "6px",
              background: T.navy,
              color: T.white,
              border: "none",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(12,30,51,0.08)",
            }}
          >
            <Plus size={14} /> Submit Question Paper
          </button>
        </div>

        {questionPapers.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {questionPapers.map((paper, idx) => {
              const isApproved = paper.status === "Approved";
              const isRevision = paper.status === "Revision Requested";

              const statusBg = isApproved ? T.greenBg : isRevision ? T.roseBg : T.amberBg;
              const statusColor = isApproved ? T.greenDark : isRevision ? T.roseDark : T.amberDark;
              const statusLabel = isApproved
                ? "Approved by Principal"
                : isRevision
                ? "Revision Requested"
                : "Under Review by Principal";

              return (
                <div
                  key={paper.id || idx}
                  style={{
                    padding: "18px 24px",
                    borderBottom: idx !== questionPapers.length - 1 ? `1px solid ${T.border}` : "none",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "15px", fontWeight: 700, color: T.navy }}>
                          {paper.title}
                        </span>
                        <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "10px", background: T.chip, color: T.slate, border: `1px solid ${T.border}` }}>
                          {paper.grade} • {paper.subjectName}
                        </span>
                        <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "10px", background: "#f1f5f9", color: "#475569" }}>
                          {paper.term}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "6px", fontSize: "12px", color: T.slate }}>
                        <span>Max Marks: <strong>{paper.totalMarks}</strong></span>
                        <span>Duration: <strong>{paper.durationMinutes} min</strong></span>
                        {paper.createdAt && <span>Submitted: {new Date(paper.createdAt).toLocaleDateString()}</span>}
                      </div>
                    </div>

                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: 700,
                        background: statusBg,
                        color: statusColor,
                      }}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  {/* Difficulty Breakdown Bar */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: T.slate }}>
                      <span>Difficulty Blueprint:</span>
                      <span>
                        Easy: {paper.difficultyEasyPct}% • Medium: {paper.difficultyMediumPct}% • Hard: {paper.difficultyHardPct}%
                      </span>
                    </div>
                    <div style={{ height: "6px", borderRadius: "3px", overflow: "hidden", display: "flex", background: "#e2e8f0" }}>
                      <div style={{ width: `${paper.difficultyEasyPct || 30}%`, background: "#22c55e" }} title={`Easy: ${paper.difficultyEasyPct}%`} />
                      <div style={{ width: `${paper.difficultyMediumPct || 50}%`, background: "#3b82f6" }} title={`Medium: ${paper.difficultyMediumPct}%`} />
                      <div style={{ width: `${paper.difficultyHardPct || 20}%`, background: "#ef4444" }} title={`Hard: ${paper.difficultyHardPct}%`} />
                    </div>
                  </div>

                  {paper.blueprintJson?.formattedContent && (
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        onClick={() => setViewingPaperContent(paper)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "4px 10px",
                          borderRadius: "4px",
                          background: "#f1f5f9",
                          border: "1px solid #cbd5e1",
                          color: "#334155",
                          fontSize: "11px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        <Eye size={13} /> View Digitized Paper
                      </button>
                    </div>
                  )}

                  {/* Principal Review Comments / Feedback */}
                  {paper.reviewComments && (
                    <div
                      style={{
                        padding: "10px 14px",
                        borderRadius: "6px",
                        background: isRevision ? "#fff1f2" : "#f8fafc",
                        border: `1px solid ${isRevision ? "#fecdd3" : "#e2e8f0"}`,
                        fontSize: "12px",
                        color: isRevision ? "#9f1239" : "#334155",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "8px",
                      }}
                    >
                      <AlertCircle size={15} style={{ flexShrink: 0, marginTop: "2px", color: isRevision ? "#e11d48" : "#64748b" }} />
                      <div>
                        <strong>Principal Feedback:</strong> {paper.reviewComments}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: "36px 20px", textAlign: "center", color: T.slate, fontSize: "13px" }}>
            <FileText size={28} style={{ color: "#cbd5e1", margin: "0 auto 8px" }} />
            <div>No question papers submitted yet for this academic term.</div>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#94a3b8" }}>
              Click "Submit Question Paper" to send your examination blueprint to the Principal for verification.
            </p>
          </div>
        )}
      </div>

      {/* 4. Examination Timeline Cards */}
      {examSchedules.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {examSchedules.map((exam) => (
            <div
              key={exam.id}
              style={{
                background: T.white,
                borderRadius: "10px",
                border: `1px solid ${T.border}`,
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", borderBottom: `1px solid ${T.border}`, paddingBottom: "14px" }}>
                <div>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: T.blue, textTransform: "uppercase" }}>
                    {exam.classSection} • {exam.subject}
                  </span>
                  <h3 style={{ margin: "4px 0 0", fontSize: "17px", fontWeight: 600, color: T.navy }}>
                    {exam.name}
                  </h3>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  {exam.isLocked ? (
                    <>
                      <span style={{ fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "6px", background: T.skyBg, color: T.skyDark }}>
                        Marks Submitted &amp; Locked
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenMarksEntry(exam)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "5px 12px",
                          borderRadius: "6px",
                          background: T.chip,
                          color: T.navy,
                          border: `1px solid ${T.border}`,
                          fontWeight: 600,
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                      >
                        <Eye size={13} />
                        View Marks
                      </button>
                    </>
                  ) : exam.evaluationId ? (
                    <button
                      type="button"
                      onClick={() => handleOpenMarksEntry(exam)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "6px 14px",
                        borderRadius: "6px",
                        background: T.amberBg,
                        color: T.amberDark,
                        border: `1px solid ${T.border}`,
                        fontWeight: 600,
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      <FileText size={13} />
                      Edit Marks (Draft)
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenMarksEntry(exam)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "6px 14px",
                        borderRadius: "6px",
                        background: T.navy,
                        color: T.white,
                        border: "none",
                        fontWeight: 600,
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      <Plus size={13} />
                      Enter Marks
                    </button>
                  )}
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "4px 10px",
                      borderRadius: "6px",
                      background: T.greenBg,
                      color: T.greenDark,
                    }}
                  >
                    {exam.status || "Scheduled"}
                  </span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                <div style={{ padding: "14px", background: T.chip, borderRadius: "8px", border: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: "10px", color: T.slate, fontWeight: 600, textTransform: "uppercase" }}>Exam Date &amp; Timing</span>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: T.navy, margin: "4px 0" }}>{exam.date}</div>
                  <div style={{ fontSize: "12px", color: T.slate }}>{exam.time}</div>
                </div>

                <div style={{ padding: "14px", background: T.chip, borderRadius: "8px", border: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: "10px", color: T.amberDark, fontWeight: 600, textTransform: "uppercase" }}>Marks Entry Deadline</span>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: T.amberDark, margin: "4px 0" }}>{exam.marksSubmissionDeadline}</div>
                  <div style={{ fontSize: "12px", color: T.slate }}>Portal lock applies post-date</div>
                </div>

                <div style={{ padding: "14px", background: T.chip, borderRadius: "8px", border: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: "10px", color: T.slate, fontWeight: 600, textTransform: "uppercase" }}>Evaluation Details</span>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: T.navy, margin: "4px 0" }}>Max: {exam.maxMarks ?? 80} Marks</div>
                  <div style={{ fontSize: "12px", color: T.slate }}>Passing: {exam.passingMarks ?? Math.round((exam.maxMarks ?? 80) * 0.33)} Marks</div>
                </div>
              </div>

              {exam.syllabusUnits && exam.syllabusUnits.length > 0 && (
                <div style={{ fontSize: "12px" }}>
                  <span style={{ fontWeight: 600, color: T.navy }}>Included Syllabus Units: </span>
                  <span style={{ color: T.slate }}>{exam.syllabusUnits.join(", ")}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: "48px", textAlign: "center", background: T.white, borderRadius: "10px", border: `1px dashed ${T.border}`, color: T.slate, fontSize: "13px" }}>
          No formal terminal examination schedules published for this term.
        </div>
      )}

      {/* 5. Submit Question Paper Drawer */}
      {showSubmitModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(12, 30, 51, 0.55)",
            backdropFilter: "blur(2px)",
            zIndex: 1000,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !submitting) setShowSubmitModal(false);
          }}
        >
          <aside
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              height: "100%",
              width: "min(680px, 100vw)",
              background: T.white,
              boxShadow: "-12px 0 30px rgba(0,0,0,0.18)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "18px 24px",
                borderBottom: `1px solid ${T.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#f8fafc",
                flexShrink: 0,
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: T.navy }}>
                  Submit Question Paper for Approval
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: T.slate }}>
                  Digitize handwritten notes or draft questions into a clean exam paper for Principal verification.
                </p>
              </div>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowSubmitModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: T.slate,
                  padding: "6px",
                  display: "inline-flex",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitPaper} style={{ flex: 1, padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
              {formError && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "6px",
                    background: "#fef2f2",
                    border: "1px solid #fee2e2",
                    color: "#991b1b",
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  {formError}
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: T.navy, marginBottom: "4px" }}>
                  Question Paper Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Class 10 Mathematics Midterm Paper"
                  value={paperForm.title}
                  onChange={(e) => setPaperForm((p) => ({ ...p, title: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: `1px solid ${T.border}`,
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: T.navy, marginBottom: "4px" }}>
                    Subject
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mathematics"
                    value={paperForm.subjectName}
                    onChange={(e) => setPaperForm((p) => ({ ...p, subjectName: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: `1px solid ${T.border}`,
                      fontSize: "13px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: T.navy, marginBottom: "4px" }}>
                    Class / Grade
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Grade 10"
                    value={paperForm.grade}
                    onChange={(e) => setPaperForm((p) => ({ ...p, grade: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: `1px solid ${T.border}`,
                      fontSize: "13px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* OCR Digitizer Section */}
              <div style={{ background: "#f8fafc", borderRadius: "8px", border: `1px solid ${T.border}`, padding: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <FileText size={16} style={{ color: T.navy }} />
                    <span style={{ fontSize: "13px", fontWeight: 700, color: T.navy }}>
                      Scan &amp; Digitize Question Paper
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      onClick={() => setExtractMode("file")}
                      style={{
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: 600,
                        border: "none",
                        background: extractMode === "file" ? T.navy : "#e2e8f0",
                        color: extractMode === "file" ? "#ffffff" : "#475569",
                        cursor: "pointer",
                      }}
                    >
                      Upload Handwritten / Scan
                    </button>
                    <button
                      type="button"
                      onClick={() => setExtractMode("text")}
                      style={{
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: 600,
                        border: "none",
                        background: extractMode === "text" ? T.navy : "#e2e8f0",
                        color: extractMode === "text" ? "#ffffff" : "#475569",
                        cursor: "pointer",
                      }}
                    >
                      Paste Draft Text
                    </button>
                  </div>
                </div>

                {extractMode === "file" ? (
                  <div>
                    <label
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "16px",
                        border: "2px dashed #cbd5e1",
                        borderRadius: "6px",
                        background: "#ffffff",
                        cursor: extracting ? "wait" : "pointer",
                      }}
                    >
                      <Upload size={20} style={{ color: "#64748b", marginBottom: "4px" }} />
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "#334155" }}>
                        {extracting ? "Scanning and formatting paper..." : "Click or drop handwritten exam photo / PDF"}
                      </span>
                      <span style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
                        Supports JPG, PNG, WebP, PDF
                      </span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        disabled={extracting}
                        style={{ display: "none" }}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setExtracting(true);
                          setFormError("");
                          try {
                            const reader = new FileReader();
                            reader.onload = async () => {
                              const base64 = reader.result as string;
                              try {
                                const res = await extractQuestionPaperOcr(organizationId, {
                                  fileData: base64,
                                  mimeType: file.type,
                                  subjectHint: paperForm.subjectName,
                                  gradeHint: paperForm.grade,
                                });
                                if (res?.formattedContent) {
                                  setPaperForm((p) => ({
                                    ...p,
                                    title: p.title || res.title || p.title,
                                    subjectName: p.subjectName || res.subjectName || p.subjectName,
                                    grade: p.grade || res.grade || p.grade,
                                    totalMarks: res.totalMarks || p.totalMarks,
                                    durationMinutes: res.durationMinutes || p.durationMinutes,
                                    difficultyEasyPct: res.difficultyEasyPct ?? p.difficultyEasyPct,
                                    difficultyMediumPct: res.difficultyMediumPct ?? p.difficultyMediumPct,
                                    difficultyHardPct: res.difficultyHardPct ?? p.difficultyHardPct,
                                    formattedContent: res.formattedContent,
                                  }));
                                }
                              } catch (err: any) {
                                setFormError(err instanceof Error ? err.message : "OCR Extraction failed");
                              } finally {
                                setExtracting(false);
                              }
                            };
                            reader.readAsDataURL(file);
                          } catch {
                            setExtracting(false);
                          }
                        }}
                      />
                    </label>
                  </div>
                ) : (
                  <div>
                    <textarea
                      placeholder="Paste raw questions, instructions, or rough draft here..."
                      rows={4}
                      value={rawDraftText}
                      onChange={(e) => setRawDraftText(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: `1px solid ${T.border}`,
                        fontSize: "12px",
                        boxSizing: "border-box",
                        fontFamily: "inherit",
                      }}
                    />
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "6px" }}>
                      <button
                        type="button"
                        disabled={extracting || !rawDraftText.trim()}
                        onClick={async () => {
                          setExtracting(true);
                          setFormError("");
                          try {
                            const res = await extractQuestionPaperOcr(organizationId, {
                              rawText: rawDraftText,
                              subjectHint: paperForm.subjectName,
                              gradeHint: paperForm.grade,
                            });
                            if (res?.formattedContent) {
                              setPaperForm((p) => ({
                                ...p,
                                title: p.title || res.title || p.title,
                                subjectName: p.subjectName || res.subjectName || p.subjectName,
                                totalMarks: res.totalMarks || p.totalMarks,
                                formattedContent: res.formattedContent,
                              }));
                            }
                          } catch (err: any) {
                            setFormError(err instanceof Error ? err.message : "Digitization failed");
                          } finally {
                            setExtracting(false);
                          }
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "6px 12px",
                          borderRadius: "4px",
                          background: "#7c3aed",
                          color: "#ffffff",
                          fontSize: "11px",
                          fontWeight: 600,
                          border: "none",
                          cursor: extracting ? "wait" : "pointer",
                        }}
                      >
                        <RefreshCw size={12} /> Format into Exam Template
                      </button>
                    </div>
                  </div>
                )}

                {/* Editable Preview Section */}
                <div style={{ marginTop: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: T.navy }}>
                      Standardized Exam Template (Editable Live Preview)
                    </label>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>
                      Principal sees this text format
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    placeholder="Standardized paper content with Sections, Questions, and Marks will appear here. You can edit any question or formula inline."
                    value={paperForm.formattedContent}
                    onChange={(e) => setPaperForm((p) => ({ ...p, formattedContent: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "12px",
                      lineHeight: 1.5,
                      fontFamily: "ui-monospace, monospace",
                      boxSizing: "border-box",
                      background: "#ffffff",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: T.navy, marginBottom: "4px" }}>
                    Term
                  </label>
                  <input
                    type="text"
                    placeholder="Term 1"
                    value={paperForm.term}
                    onChange={(e) => setPaperForm((p) => ({ ...p, term: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: `1px solid ${T.border}`,
                      fontSize: "13px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: T.navy, marginBottom: "4px" }}>
                    Total Marks
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={paperForm.totalMarks}
                    onChange={(e) => setPaperForm((p) => ({ ...p, totalMarks: Number(e.target.value) }))}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: `1px solid ${T.border}`,
                      fontSize: "13px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: T.navy, marginBottom: "4px" }}>
                    Duration (min)
                  </label>
                  <input
                    type="number"
                    min={15}
                    value={paperForm.durationMinutes}
                    onChange={(e) => setPaperForm((p) => ({ ...p, durationMinutes: Number(e.target.value) }))}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: `1px solid ${T.border}`,
                      fontSize: "13px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px", border: `1px solid ${T.border}` }}>
                <span style={{ display: "block", fontSize: "12px", fontWeight: 600, color: T.navy, marginBottom: "8px" }}>
                  Difficulty Blueprint Distribution (Total: 100%)
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", color: "#16a34a", fontWeight: 600 }}>Easy %</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={paperForm.difficultyEasyPct}
                      onChange={(e) => setPaperForm((p) => ({ ...p, difficultyEasyPct: Number(e.target.value) }))}
                      style={{ width: "100%", padding: "6px 8px", borderRadius: "4px", border: `1px solid ${T.border}`, fontSize: "12px", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", color: "#2563eb", fontWeight: 600 }}>Medium %</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={paperForm.difficultyMediumPct}
                      onChange={(e) => setPaperForm((p) => ({ ...p, difficultyMediumPct: Number(e.target.value) }))}
                      style={{ width: "100%", padding: "6px 8px", borderRadius: "4px", border: `1px solid ${T.border}`, fontSize: "12px", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", color: "#dc2626", fontWeight: 600 }}>Hard %</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={paperForm.difficultyHardPct}
                      onChange={(e) => setPaperForm((p) => ({ ...p, difficultyHardPct: Number(e.target.value) }))}
                      style={{ width: "100%", padding: "6px 8px", borderRadius: "4px", border: `1px solid ${T.border}`, fontSize: "12px", boxSizing: "border-box" }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setShowSubmitModal(false)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    background: "#ffffff",
                    border: `1px solid ${T.border}`,
                    fontSize: "12px",
                    fontWeight: 600,
                    color: T.slate,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 18px",
                    borderRadius: "6px",
                    background: T.navy,
                    border: "none",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#ffffff",
                    cursor: submitting ? "not-allowed" : "pointer",
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  <Send size={13} /> {submitting ? "Submitting..." : "Send to Principal for Approval"}
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}

      {/* 6. View Digitized Paper Drawer */}
      {viewingPaperContent && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(12, 30, 51, 0.55)",
            backdropFilter: "blur(2px)",
            zIndex: 1000,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingPaperContent(null);
          }}
        >
          <aside
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              height: "100%",
              width: "min(800px, 100vw)",
              background: T.white,
              boxShadow: "-12px 0 30px rgba(0,0,0,0.18)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "18px 24px",
                borderBottom: `1px solid ${T.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#f8fafc",
                flexShrink: 0,
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: T.navy }}>
                  {viewingPaperContent.title}
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: T.slate }}>
                  {viewingPaperContent.grade} • {viewingPaperContent.subjectName} • {viewingPaperContent.totalMarks} Marks
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingPaperContent(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: T.slate,
                  padding: "6px",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
              <div
                style={{
                  fontFamily: "ui-monospace, monospace",
                  fontSize: "13px",
                  lineHeight: 1.6,
                  color: "#1e293b",
                  whiteSpace: "pre-wrap",
                  background: "#f8fafc",
                  padding: "20px",
                  borderRadius: "8px",
                  border: `1px solid ${T.border}`,
                }}
              >
                {viewingPaperContent.blueprintJson?.formattedContent || "No digitized text content available."}
              </div>
            </div>

            <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "flex-end", background: "#f8fafc", flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setViewingPaperContent(null)}
                style={{
                  padding: "8px 18px",
                  borderRadius: "6px",
                  border: `1px solid ${T.border}`,
                  background: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: T.slate,
                  cursor: "pointer",
                }}
              >
                Close Drawer
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* 7. Marks Entry & Review Drawer */}
      {marksExam && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(12, 30, 51, 0.55)",
            backdropFilter: "blur(2px)",
            zIndex: 1000,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !savingMarks) {
              setMarksExam(null);
            }
          }}
        >
          <aside
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              height: "100%",
              width: "min(720px, 100vw)",
              background: T.white,
              boxShadow: "-12px 0 30px rgba(0,0,0,0.18)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "18px 24px",
                borderBottom: `1px solid ${T.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: T.navy }}>
                  {marksExam.isLocked ? "View Submitted Exam Marks" : "Enter Exam Marks"}
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: T.slate }}>
                  {marksExam.name} • {marksExam.classSection} • {marksExam.subject} (Max: {marksExam.maxMarks} Marks)
                </p>
              </div>
              <button
                type="button"
                disabled={savingMarks}
                onClick={() => setMarksExam(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: T.slate,
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Error banner if any */}
            {marksError && (
              <div
                style={{
                  margin: "12px 24px 0",
                  padding: "10px 14px",
                  borderRadius: "6px",
                  background: T.roseBg,
                  color: T.roseDark,
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <AlertCircle size={14} />
                {marksError}
              </div>
            )}

            {/* Content Body */}
            <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
              {loadingStudents ? (
                <div style={{ padding: "48px 0", textAlign: "center", color: T.slate, fontSize: "13px" }}>
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      border: `3px solid ${T.line}`,
                      borderTopColor: T.navy,
                      borderRadius: "50%",
                      margin: "0 auto 12px",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  Loading student roster...
                </div>
              ) : marksScores.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center", color: T.slate, fontSize: "13px" }}>
                  No active students enrolled in this section.
                </div>
              ) : (
                <div style={{ border: `1px solid ${T.border}`, borderRadius: "8px", overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: `1px solid ${T.border}`, color: T.slate, fontWeight: 700 }}>
                        <th style={{ padding: "10px 14px", width: "70px" }}>Roll No</th>
                        <th style={{ padding: "10px 14px" }}>Student Name</th>
                        <th style={{ padding: "10px 14px", width: "120px" }}>Score / {marksExam.maxMarks}</th>
                        <th style={{ padding: "10px 14px", width: "70px" }}>%</th>
                        <th style={{ padding: "10px 14px" }}>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marksScores.map((st, idx) => {
                        const scoreNum = Number(st.score);
                        const pct = st.score !== "" && Number.isFinite(scoreNum)
                          ? Math.round((scoreNum / (Number(marksExam.maxMarks) || 80)) * 100)
                          : null;
                        return (
                          <tr
                            key={st.id}
                            style={{
                              borderBottom: idx !== marksScores.length - 1 ? `1px solid ${T.border}` : "none",
                              background: idx % 2 === 0 ? "#ffffff" : "#fcfdfe",
                            }}
                          >
                            <td style={{ padding: "10px 14px", color: T.slate, fontWeight: 600 }}>{st.roll}</td>
                            <td style={{ padding: "10px 14px", color: T.navy, fontWeight: 600 }}>{st.name}</td>
                            <td style={{ padding: "10px 14px" }}>
                              <input
                                type="number"
                                min="0"
                                max={marksExam.maxMarks}
                                step="0.5"
                                disabled={marksExam.isLocked || savingMarks}
                                value={st.score}
                                onChange={(e) => {
                                  const val = e.target.value === "" ? "" : Number(e.target.value);
                                  setMarksScores((prev) =>
                                    prev.map((item) => (item.id === st.id ? { ...item, score: val } : item))
                                  );
                                }}
                                style={{
                                  width: "70px",
                                  padding: "5px 8px",
                                  border: `1px solid ${T.border}`,
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  color: T.navy,
                                  background: marksExam.isLocked ? "#f1f5f9" : "#ffffff",
                                }}
                              />
                            </td>
                            <td style={{ padding: "10px 14px", fontWeight: 700, color: pct !== null && pct >= 40 ? "#15803d" : pct !== null ? "#dc2626" : T.slate }}>
                              {pct !== null ? `${pct}%` : "—"}
                            </td>
                            <td style={{ padding: "10px 14px" }}>
                              <input
                                type="text"
                                disabled={marksExam.isLocked || savingMarks}
                                value={st.remarks}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setMarksScores((prev) =>
                                    prev.map((item) => (item.id === st.id ? { ...item, remarks: val } : item))
                                  );
                                }}
                                style={{
                                  width: "100%",
                                  padding: "5px 8px",
                                  border: `1px solid ${T.border}`,
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  color: T.slate,
                                  background: marksExam.isLocked ? "#f1f5f9" : "#ffffff",
                                }}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "14px 24px",
                borderTop: `1px solid ${T.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#f8fafc",
                flexShrink: 0,
              }}
            >
              {marksExam.isLocked ? (
                <>
                  <div style={{ fontSize: "12px", color: T.skyDark, fontWeight: 500 }}>
                    Marks submitted and locked for Principal review &amp; report cards.
                  </div>
                  <button
                    type="button"
                    onClick={() => setMarksExam(null)}
                    style={{
                      padding: "8px 18px",
                      borderRadius: "6px",
                      border: `1px solid ${T.border}`,
                      background: "#ffffff",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: T.navy,
                      cursor: "pointer",
                    }}
                  >
                    Close
                  </button>
                </>
              ) : (
                <>
                  <div style={{ fontSize: "11px", color: T.slate }}>
                    Saving draft allows updates. Submitting locks scores for Principal verification.
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      type="button"
                      disabled={savingMarks || loadingStudents || marksScores.length === 0}
                      onClick={() => handleSaveMarks(false)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "6px",
                        border: `1px solid ${T.border}`,
                        background: "#ffffff",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: T.navy,
                        cursor: "pointer",
                      }}
                    >
                      {savingMarks ? "Saving..." : "Save Draft"}
                    </button>
                    <button
                      type="button"
                      disabled={savingMarks || loadingStudents || marksScores.length === 0}
                      onClick={() => handleSaveMarks(true)}
                      style={{
                        padding: "8px 18px",
                        borderRadius: "6px",
                        border: "none",
                        background: T.navy,
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#ffffff",
                        cursor: "pointer",
                      }}
                    >
                      {savingMarks ? "Submitting..." : "Submit to Principal"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
