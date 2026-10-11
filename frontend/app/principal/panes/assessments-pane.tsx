"use client";

import React, { useState, useEffect } from "react";
import { QuestionPaperItem } from "../types";
import {
  CheckCircle2,
  Clock,
  FileText,
  Check,
  AlertCircle,
  Plus,
  X,
  BarChart2,
  BookOpen,
  Send,
  Layers,
  Award,
} from "lucide-react";
import {
  getPrincipalAssessments,
  createPrincipalQuestionPaper,
  reviewPrincipalQuestionPaper,
} from "../../edops-api";

interface AssessmentsPaneProps {
  questionPapers?: QuestionPaperItem[];
  assessmentTypes?: any[];
  onReviewQuestionPaper?: (paperId: string, status: string, comments: string) => Promise<void>;
  organizationId?: string;
  initialTab?: "assessments" | "analysis";
  onNavigate?: (pane: string, sub?: string) => void;
}

export function AssessmentsPane({
  questionPapers = [],
  assessmentTypes = [],
  onReviewQuestionPaper,
  organizationId,
  initialTab = "assessments",
  onNavigate,
}: AssessmentsPaneProps) {
  const [tab, setTab] = useState<"assessments" | "analysis">(initialTab);
  const [liveData, setLiveData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [commentsInput, setCommentsInput] = useState<{ [key: string]: string }>({});
  const [actionBusy, setActionBusy] = useState<{ [key: string]: boolean }>({});

  // Question Paper Registration Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [submittingPaper, setSubmittingPaper] = useState(false);
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
    submittedByUserId: "",
    submittedByName: "",
  });

  const loadAssessments = () => {
    if (!organizationId) return;
    setLoading(true);
    getPrincipalAssessments(organizationId)
      .then((data) => {
        setLiveData(data);
        if (data?.teachers && data.teachers.length > 0 && !paperForm.submittedByUserId) {
          setPaperForm((prev) => ({
            ...prev,
            submittedByUserId: data.teachers[0].id,
            submittedByName: data.teachers[0].name,
          }));
        }
        if (data?.subjects && data.subjects.length > 0 && !paperForm.subjectName) {
          setPaperForm((prev) => ({
            ...prev,
            subjectName: data.subjects[0].name,
          }));
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAssessments();
  }, [organizationId]);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const papers = liveData?.questionPapers ?? questionPapers;
  const types = liveData?.assessmentTypes ?? assessmentTypes;
  const evaluations = liveData?.evaluations ?? [];
  const teachers = liveData?.teachers ?? [];
  const subjects = liveData?.subjects ?? [];

  const handleAction = async (paperId: string, status: string) => {
    if (!organizationId) return;
    const comment =
      commentsInput[paperId] ||
      (status === "Approved"
        ? "Approved by Principal. Blueprint conforms to board guidelines."
        : status === "Published"
        ? "Approved and published for official examination dispatch."
        : "Revision requested: please revise difficulty balance and step mark distribution.");

    setActionBusy((prev) => ({ ...prev, [paperId]: true }));
    try {
      await reviewPrincipalQuestionPaper(organizationId, paperId, {
        status,
        reviewComments: comment,
      });
      if (onReviewQuestionPaper) {
        await onReviewQuestionPaper(paperId, status, comment);
      }
      loadAssessments();
    } catch {
      alert(`Could not update question paper to ${status}. Please try again.`);
    } finally {
      setActionBusy((prev) => ({ ...prev, [paperId]: false }));
    }
  };

  const handleCreateQuestionPaper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId || !paperForm.title.trim()) return;

    setSubmittingPaper(true);
    try {
      await createPrincipalQuestionPaper(organizationId, {
        title: paperForm.title.trim(),
        subjectName: paperForm.subjectName || "Mathematics",
        grade: paperForm.grade || "Grade 10",
        term: paperForm.term || "Term 1 Midterm",
        totalMarks: Number(paperForm.totalMarks) || 80,
        durationMinutes: Number(paperForm.durationMinutes) || 180,
        difficultyEasyPct: Number(paperForm.difficultyEasyPct) || 30,
        difficultyMediumPct: Number(paperForm.difficultyMediumPct) || 50,
        difficultyHardPct: Number(paperForm.difficultyHardPct) || 20,
        competencyMapped: Boolean(paperForm.competencyMapped),
        submittedByUserId: paperForm.submittedByUserId || undefined,
        submittedByName: paperForm.submittedByName || "Academic Teacher",
        status: "Under Review",
      });
      setCreateModalOpen(false);
      setPaperForm((prev) => ({
        ...prev,
        title: "",
      }));
      loadAssessments();
    } catch {
      alert("Failed to register question paper. Please check the inputs.");
    } finally {
      setSubmittingPaper(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Tab Navigation Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2E8F0", paddingBottom: "12px", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setTab("assessments")}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: tab === "assessments" ? 700 : 500,
              background: tab === "assessments" ? "#1E293B" : "#F8FAFC",
              color: tab === "assessments" ? "#FFFFFF" : "#64748B",
              border: "1px solid #E2E8F0",
              cursor: "pointer",
            }}
          >
            Assessments & Question Papers
          </button>
          <button
            onClick={() => setTab("analysis")}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: tab === "analysis" ? 700 : 500,
              background: tab === "analysis" ? "#1E293B" : "#F8FAFC",
              color: tab === "analysis" ? "#FFFFFF" : "#64748B",
              border: "1px solid #E2E8F0",
              cursor: "pointer",
            }}
          >
            Assessment Analysis
          </button>
        </div>

        {tab === "assessments" && (
          <button
            onClick={() => setCreateModalOpen(true)}
            style={{
              background: "#064E3B",
              color: "#F8E7C9",
              border: "none",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "12.5px",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Plus size={15} /> Register Question Paper
          </button>
        )}
      </div>

      {tab === "assessments" && (
        <>
          {/* 1. Assessment Scheme & Blueprint Compliance Banner (Derived from stored database records) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            {types.map((item: any, idx: number) => (
              <div key={idx} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "16px" }}>
                <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>{item.type}</div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "#1E293B", margin: "4px 0" }}>{item.weight}</div>
                <div style={{ fontSize: "11px", color: "#15803D", fontWeight: 600 }}>Compliance: {item.compliance} ({item.status})</div>
              </div>
            ))}
          </div>

          {/* 2. Question Paper Approval Pipeline */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1E293B" }}>
                  Question Paper Review & Blueprint Approval Workflow
                </h3>
                <span style={{ fontSize: "12px", color: "#64748B" }}>
                  Principal quality check: difficulty distribution, competency mapping & mark allocations
                </span>
              </div>
              <span style={{ background: "#DCFCE7", color: "#166534", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 700 }}>
                Board Quality Protocol Active
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {papers.length === 0 ? (
                <div style={{ textAlign: "center", padding: "36px 0", color: "#64748B", fontSize: "13px", background: "#F8FAFC", borderRadius: "8px", border: "1px dashed #CBD5E1" }}>
                  <p style={{ margin: "0 0 8px", fontWeight: 600 }}>No question papers currently logged in this organization.</p>
                  <p style={{ margin: "0 0 14px", fontSize: "12px", color: "#94A3B8" }}>Teachers can submit question papers for review, or you can register a question paper blueprint directly.</p>
                  <button
                    onClick={() => setCreateModalOpen(true)}
                    style={{ background: "#064E3B", color: "#F8E7C9", border: "none", borderRadius: "6px", padding: "7px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                  >
                    + Register Question Paper Blueprint
                  </button>
                </div>
              ) : (
                papers.map((paper: any, idx: number) => {
                  const isApproved = paper.status === "Approved";
                  const isPublished = paper.status === "Published";
                  const isDraft = paper.status === "Draft";
                  const isBusy = actionBusy[paper.id];

                  return (
                    <div
                      key={paper.id || idx}
                      style={{
                        border: "1px solid #E2E8F0",
                        borderRadius: "10px",
                        padding: "18px 20px",
                        background: isPublished ? "#F0FDF4" : isApproved ? "#F0FDF4" : isDraft ? "#FFFBEB" : "#FFFFFF",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ background: "#EFF6FF", color: "#1E40AF", fontSize: "11px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px" }}>
                              {paper.grade} · {paper.subjectName}
                            </span>
                            <span style={{ fontSize: "12px", color: "#64748B" }}>
                              Term: <b>{paper.term}</b>
                            </span>
                          </div>
                          <h4 style={{ margin: "6px 0 2px", fontSize: "16px", fontWeight: 700, color: "#1E293B" }}>{paper.title}</h4>
                          <div style={{ fontSize: "12px", color: "#64748B" }}>
                            Setter: <b>{paper.submittedByName}</b> · {paper.totalMarks} Marks · {paper.durationMinutes} Mins
                          </div>
                        </div>

                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 700,
                            background: isPublished ? "#DCFCE7" : isApproved ? "#E0F2FE" : isDraft ? "#FEF3C7" : "#FEF3C7",
                            color: isPublished ? "#166534" : isApproved ? "#075985" : isDraft ? "#92400E" : "#92400E",
                          }}
                        >
                          {paper.status}
                        </span>
                      </div>

                      {/* Blueprint difficulty distribution */}
                      <div style={{ background: "#F8FAFC", borderRadius: "8px", padding: "12px", margin: "10px 0", fontSize: "12px" }}>
                        <div style={{ fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Blueprint Difficulty Balance:</div>
                        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                          <div>Easy: <b>{paper.difficultyEasyPct}%</b> (Target 30%)</div>
                          <div>Medium: <b>{paper.difficultyMediumPct}%</b> (Target 50%)</div>
                          <div>Hard / HOTS: <b>{paper.difficultyHardPct}%</b> (Target 20%)</div>
                          <div style={{ color: "#065F46" }}>• Competency Mapped: <b>{paper.competencyMapped ? "Yes" : "Pending"}</b></div>
                        </div>
                      </div>

                      {paper.reviewComments && (
                        <div style={{ fontSize: "12px", color: "#475569", marginBottom: "10px", padding: "8px 12px", background: "#F1F5F9", borderRadius: "6px" }}>
                          <b>Principal Review Notes:</b> {paper.reviewComments}
                        </div>
                      )}

                      {/* Action buttons */}
                      {!isPublished && (
                        <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "12px", paddingTop: "10px", borderTop: "1px dashed #E2E8F0", flexWrap: "wrap" }}>
                          <input
                            type="text"
                            placeholder="Enter review notes or revision directives for the paper setter..."
                            value={commentsInput[paper.id] ?? ""}
                            onChange={(e) => setCommentsInput({ ...commentsInput, [paper.id]: e.target.value })}
                            style={{ flex: 1, minWidth: "220px", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12px" }}
                          />

                          {!isApproved && (
                            <button
                              disabled={isBusy}
                              onClick={() => handleAction(paper.id, "Approved")}
                              style={{ background: "#064E3B", color: "#F8E7C9", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "12px", fontWeight: 600, cursor: isBusy ? "not-allowed" : "pointer" }}
                            >
                              {isBusy ? "Updating…" : "Approve Blueprint"}
                            </button>
                          )}

                          <button
                            disabled={isBusy}
                            onClick={() => handleAction(paper.id, "Draft")}
                            style={{ background: "#FFFBEB", color: "#B45309", border: "1px solid #FCD34D", borderRadius: "6px", padding: "8px 14px", fontSize: "12px", fontWeight: 600, cursor: isBusy ? "not-allowed" : "pointer" }}
                          >
                            Request Revision
                          </button>

                          {isApproved && (
                            <button
                              disabled={isBusy}
                              onClick={() => handleAction(paper.id, "Published")}
                              style={{ background: "#0284C7", color: "#FFFFFF", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "12px", fontWeight: 600, cursor: isBusy ? "not-allowed" : "pointer" }}
                            >
                              Publish Question Paper
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      {/* 3. Assessment Analysis Tab (powered by stored exam evaluations) */}
      {tab === "analysis" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1E293B" }}>
                Assessment Performance Analysis
              </h3>
              <span style={{ fontSize: "12px", color: "#64748B" }}>
                Score distributions, class averages, and mastery from stored teacher evaluations
              </span>
            </div>
            <span style={{ background: "#F1F5F9", color: "#475569", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 700 }}>
              {evaluations.length} Evaluations Logged
            </span>
          </div>

          {evaluations.length === 0 ? (
            <div style={{ textAlign: "center", padding: "36px 0", color: "#64748B", fontSize: "13px", background: "#F8FAFC", borderRadius: "8px", border: "1px dashed #CBD5E1" }}>
              <BarChart2 size={32} style={{ margin: "0 auto 8px", color: "#94A3B8" }} />
              <p style={{ margin: "0 0 4px", fontWeight: 600 }}>No assessment evaluations found in the database.</p>
              <p style={{ margin: 0, fontSize: "12px", color: "#94A3B8" }}>When teachers record and submit assessment scores, detailed performance analysis will surface here.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {evaluations.map((ev: any, idx: number) => {
                const scoresMap = typeof ev.studentScores === "string" ? JSON.parse(ev.studentScores) : (ev.studentScores || {});
                const scores = Object.values(scoresMap).map(Number).filter((v) => !isNaN(v));
                const count = scores.length;
                const avg = count > 0 ? (scores.reduce((a, b) => a + b, 0) / count).toFixed(1) : "N/A";
                const highest = count > 0 ? Math.max(...scores) : "N/A";
                const lowest = count > 0 ? Math.min(...scores) : "N/A";
                const passRate = count > 0 ? Math.round((scores.filter((s) => s >= (Number(ev.maxMarks) || 50) * 0.4).length / count) * 100) : 100;

                return (
                  <div key={ev.id || idx} style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px", background: "#FAFAFA" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <div>
                        <span style={{ background: "#EEF2FF", color: "#4338CA", fontSize: "11px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px" }}>
                          {ev.sectionName} · {ev.subjectName}
                        </span>
                        <h4 style={{ margin: "4px 0", fontSize: "15px", fontWeight: 700, color: "#1E293B" }}>{ev.title}</h4>
                        <div style={{ fontSize: "11.5px", color: "#64748B" }}>Conducted on: {ev.date || "Recent"} · Max Marks: {ev.maxMarks}</div>
                      </div>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#15803D", background: "#DCFCE7", padding: "3px 8px", borderRadius: "4px" }}>
                        Pass Rate: {passRate}%
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginTop: "10px", background: "#FFFFFF", padding: "10px", borderRadius: "6px", border: "1px solid #E2E8F0", textAlign: "center" }}>
                      <div>
                        <span style={{ fontSize: "10px", color: "#64748B", display: "block" }}>Students Evaluated</span>
                        <b style={{ fontSize: "14px", color: "#1E293B" }}>{count}</b>
                      </div>
                      <div>
                        <span style={{ fontSize: "10px", color: "#64748B", display: "block" }}>Class Average</span>
                        <b style={{ fontSize: "14px", color: "#4F46E5" }}>{avg} / {ev.maxMarks}</b>
                      </div>
                      <div>
                        <span style={{ fontSize: "10px", color: "#64748B", display: "block" }}>Highest Mark</span>
                        <b style={{ fontSize: "14px", color: "#166534" }}>{highest}</b>
                      </div>
                      <div>
                        <span style={{ fontSize: "10px", color: "#64748B", display: "block" }}>Lowest Mark</span>
                        <b style={{ fontSize: "14px", color: "#991B1B" }}>{lowest}</b>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* QUESTION PAPER REGISTRATION MODAL */}
      {createModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", padding: "16px" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "12px", width: "100%", maxWidth: "540px", maxHeight: "90vh", overflowY: "auto", padding: "24px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #E2E8F0", paddingBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1E293B" }}>Register Question Paper Blueprint</h3>
              <button onClick={() => setCreateModalOpen(false)} style={{ border: "none", background: "none", cursor: "pointer", color: "#64748B" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateQuestionPaper} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>Paper Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Class 10 Mathematics Term 1 Summative Examination"
                  value={paperForm.title}
                  onChange={(e) => setPaperForm({ ...paperForm, title: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>Subject *</label>
                  <select
                    value={paperForm.subjectName}
                    onChange={(e) => setPaperForm({ ...paperForm, subjectName: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "13px", boxSizing: "border-box" }}
                  >
                    {subjects.length > 0 ? (
                      subjects.map((s: any) => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))
                    ) : (
                      <>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Science">Science</option>
                        <option value="English">English</option>
                        <option value="Social Science">Social Science</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>Grade / Class *</label>
                  <select
                    value={paperForm.grade}
                    onChange={(e) => setPaperForm({ ...paperForm, grade: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "13px", boxSizing: "border-box" }}
                  >
                    <option value="Grade 10">Grade 10</option>
                    <option value="Grade 9">Grade 9</option>
                    <option value="Grade 8">Grade 8</option>
                    <option value="Grade 11">Grade 11</option>
                    <option value="Grade 12">Grade 12</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>Paper Setter (Teacher) *</label>
                  <select
                    value={paperForm.submittedByUserId}
                    onChange={(e) => {
                      const sel = teachers.find((t: any) => t.id === e.target.value);
                      setPaperForm({
                        ...paperForm,
                        submittedByUserId: e.target.value,
                        submittedByName: sel?.name || "Academic Teacher",
                      });
                    }}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "13px", boxSizing: "border-box" }}
                  >
                    {teachers.length > 0 ? (
                      teachers.map((t: any) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))
                    ) : (
                      <option value="">Rahul Sharma (HOD Math)</option>
                    )}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>Examination Term</label>
                  <input
                    type="text"
                    placeholder="e.g. Term 1 Midterm"
                    value={paperForm.term}
                    onChange={(e) => setPaperForm({ ...paperForm, term: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>Total Marks</label>
                  <input
                    type="number"
                    min="10"
                    max="200"
                    value={paperForm.totalMarks}
                    onChange={(e) => setPaperForm({ ...paperForm, totalMarks: Number(e.target.value) })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>Duration (Minutes)</label>
                  <input
                    type="number"
                    min="30"
                    max="360"
                    value={paperForm.durationMinutes}
                    onChange={(e) => setPaperForm({ ...paperForm, durationMinutes: Number(e.target.value) })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>Blueprint Difficulty Balance (% Target: 30 / 50 / 20)</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                  <div>
                    <span style={{ fontSize: "11px", color: "#64748B" }}>Easy %</span>
                    <input
                      type="number"
                      value={paperForm.difficultyEasyPct}
                      onChange={(e) => setPaperForm({ ...paperForm, difficultyEasyPct: Number(e.target.value) })}
                      style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12px", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "#64748B" }}>Medium %</span>
                    <input
                      type="number"
                      value={paperForm.difficultyMediumPct}
                      onChange={(e) => setPaperForm({ ...paperForm, difficultyMediumPct: Number(e.target.value) })}
                      style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12px", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "#64748B" }}>Hard / HOTS %</span>
                    <input
                      type="number"
                      value={paperForm.difficultyHardPct}
                      onChange={(e) => setPaperForm({ ...paperForm, difficultyHardPct: Number(e.target.value) })}
                      style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12px", boxSizing: "border-box" }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                <input
                  type="checkbox"
                  id="competencyMappedCheck"
                  checked={paperForm.competencyMapped}
                  onChange={(e) => setPaperForm({ ...paperForm, competencyMapped: e.target.checked })}
                />
                <label htmlFor="competencyMappedCheck" style={{ fontSize: "12px", color: "#334155", cursor: "pointer" }}>
                  CBSE / Board Competency Mapped (min 50% case-based / application items)
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px", borderTop: "1px solid #E2E8F0", paddingTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  style={{ padding: "8px 14px", borderRadius: "6px", border: "1px solid #CBD5E1", background: "#FFFFFF", color: "#475569", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPaper}
                  style={{ padding: "8px 18px", borderRadius: "6px", border: "none", background: "#064E3B", color: "#F8E7C9", fontSize: "12px", fontWeight: 700, cursor: submittingPaper ? "not-allowed" : "pointer" }}
                >
                  {submittingPaper ? "Registering…" : "Register Blueprint"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

