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
  ArrowRight,
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
  onTabChange?: (tab: string) => void;
}

/* -------------------------------------------------------------------------- */
/* SKELETON LOADERS & EMPTY STATES                                            */
/* -------------------------------------------------------------------------- */

function KpiSkeletonGrid() {
  const cards = [
    { bg: "#E0D3FF" },
    { bg: "#D0EDC0" },
    { bg: "#BCE6F3" },
    { bg: "#FADAC9" },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "16px",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {cards.map((c, i) => (
        <div
          key={i}
          style={{
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "164px",
            padding: "20px",
            gap: "12px",
            background: c.bg,
            borderRadius: "10px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <div className="edops-skeleton-kpi" style={{ width: "110px", height: "12px", borderRadius: "4px" }} />
            <div className="edops-skeleton-kpi" style={{ width: "20px", height: "20px", borderRadius: "50%" }} />
          </div>
          <div className="edops-skeleton-kpi" style={{ width: "75px", height: "36px", borderRadius: "6px" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
            <div className="edops-skeleton-kpi" style={{ width: "140px", height: "10px", borderRadius: "4px" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <div className="edops-skeleton-kpi" style={{ width: "55px", height: "10px", borderRadius: "4px" }} />
              <div className="edops-skeleton-kpi" style={{ width: "14px", height: "14px", borderRadius: "3px" }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  illustration = "/bee.png",
  title,
  description,
  actionLabel,
  onAction,
}: {
  illustration?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        width: "100%",
        textAlign: "center",
        boxSizing: "border-box",
        background: "#FFFFFF",
        borderRadius: "10px",
        border: "1px solid #E0E5EB",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <img
        src={illustration}
        alt=""
        style={{
          width: illustration === "/noresult.png" ? "120px" : "96px",
          height: "auto",
          maxHeight: "100px",
          objectFit: "contain",
          marginBottom: "16px",
          opacity: 0.95,
        }}
      />
      <b style={{ fontSize: "15px", fontWeight: 700, color: "#0C1E33", marginBottom: "6px" }}>
        {title}
      </b>
      <p style={{ margin: 0, fontSize: "12.5px", color: "#64748B", maxWidth: "440px", lineHeight: 1.55 }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          style={{
            marginTop: "16px",
            padding: "8px 18px",
            borderRadius: "6px",
            background: "#0C1E33",
            color: "#FFFFFF",
            border: "none",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'Poppins', sans-serif",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Plus size={14} />
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function AssessmentsPane({
  questionPapers = [],
  assessmentTypes = [],
  onReviewQuestionPaper,
  organizationId,
  initialTab = "assessments",
  onNavigate,
  onTabChange,
}: AssessmentsPaneProps) {
  const [tab, setTab] = useState<"assessments" | "analysis">(initialTab);

  useEffect(() => {
    if (initialTab) {
      setTab(initialTab);
    }
  }, [initialTab]);
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
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", fontFamily: "'Poppins', sans-serif" }}>
      {/* Tab Navigation Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2E8F0", paddingBottom: "12px", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => {
              setTab("assessments");
              onTabChange?.("assessments");
            }}
            style={{
              boxSizing: "border-box",
              display: "inline-flex",
              alignItems: "center",
              height: "34px",
              padding: "0 16px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: tab === "assessments" ? 600 : 500,
              background: tab === "assessments" ? "#0C1E33" : "#F4F6F8",
              color: tab === "assessments" ? "#FFFFFF" : "#5A6B7D",
              border: tab === "assessments" ? "1px solid #0C1E33" : "1px solid #E2E8F0",
              cursor: "pointer",
              fontFamily: "'Poppins', sans-serif",
              boxShadow: tab === "assessments" ? "0 2px 4px rgba(12, 30, 51, 0.14)" : "none",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (tab !== "assessments") {
                e.currentTarget.style.background = "#E9EEF4";
                e.currentTarget.style.color = "#0C1E33";
              }
            }}
            onMouseLeave={(e) => {
              if (tab !== "assessments") {
                e.currentTarget.style.background = "#F4F6F8";
                e.currentTarget.style.color = "#5A6B7D";
              }
            }}
          >
            Assessments &amp; Question Papers
          </button>
          <button
            onClick={() => {
              setTab("analysis");
              onTabChange?.("analysis");
            }}
            style={{
              boxSizing: "border-box",
              display: "inline-flex",
              alignItems: "center",
              height: "34px",
              padding: "0 16px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: tab === "analysis" ? 600 : 500,
              background: tab === "analysis" ? "#0C1E33" : "#F4F6F8",
              color: tab === "analysis" ? "#FFFFFF" : "#5A6B7D",
              border: tab === "analysis" ? "1px solid #0C1E33" : "1px solid #E2E8F0",
              cursor: "pointer",
              fontFamily: "'Poppins', sans-serif",
              boxShadow: tab === "analysis" ? "0 2px 4px rgba(12, 30, 51, 0.14)" : "none",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (tab !== "analysis") {
                e.currentTarget.style.background = "#E9EEF4";
                e.currentTarget.style.color = "#0C1E33";
              }
            }}
            onMouseLeave={(e) => {
              if (tab !== "analysis") {
                e.currentTarget.style.background = "#F4F6F8";
                e.currentTarget.style.color = "#5A6B7D";
              }
            }}
          >
            Assessment Analysis
          </button>
        </div>

        {tab === "assessments" && (
          <button
            onClick={() => setCreateModalOpen(true)}
            style={{
              background: "#0C1E33",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "12.5px",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontFamily: "'Poppins', sans-serif",
              boxShadow: "0 2px 4px rgba(12, 30, 51, 0.12)",
            }}
          >
            <Plus size={15} /> Register Question Paper
          </button>
        )}
      </div>

      {tab === "assessments" && (
        <>
          {/* 4 Standard Pastel KPI Cards (strictly 164px height) */}
          {loading ? (
            <KpiSkeletonGrid />
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "16px",
                width: "100%",
              }}
            >
              {/* Card 1: Approved Papers (Pastel Violet) */}
              <div
                style={{
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  height: "164px",
                  padding: "20px",
                  gap: "12px",
                  background: "#E0D3FF",
                  borderRadius: "10px",
                }}
              >
                <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#51249A", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    APPROVED BLUEPRINTS
                  </span>
                  <CheckCircle2 size={19} strokeWidth={1.8} style={{ color: "#51249A" }} />
                </div>
                <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
                  {papers.filter((p: any) => p.status === "Approved").length} / {papers.length || 0}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#51249A" }}>
                    Certified papers ready for exam dispatch
                  </span>
                </div>
              </div>

              {/* Card 2: Question Papers Logged (Pastel Mint Green) */}
              <div
                style={{
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  height: "164px",
                  padding: "20px",
                  gap: "12px",
                  background: "#D0EDC0",
                  borderRadius: "10px",
                }}
              >
                <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#305E26", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    QUESTION PAPERS LOGGED
                  </span>
                  <BookOpen size={19} strokeWidth={1.8} style={{ color: "#305E26" }} />
                </div>
                <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
                  {papers.length || 0}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#305E26" }}>
                    Across Midterm, Periodic, and Finals
                  </span>
                </div>
              </div>

              {/* Card 3: Pending Review (Pastel Sky Blue) */}
              <div
                style={{
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  height: "164px",
                  padding: "20px",
                  gap: "12px",
                  background: "#BCE6F3",
                  borderRadius: "10px",
                }}
              >
                <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#265F79", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    PENDING REVIEW
                  </span>
                  <Clock size={19} strokeWidth={1.8} style={{ color: "#265F79" }} />
                </div>
                <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
                  {papers.filter((p: any) => p.status !== "Approved").length || 0}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#265F79" }}>
                    Awaiting difficulty &amp; competency sign-off
                  </span>
                </div>
              </div>

              {/* Card 4: Competency Mapping (Pastel Warm Peach) */}
              <div
                style={{
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  height: "164px",
                  padding: "20px",
                  gap: "12px",
                  background: "#FADAC9",
                  borderRadius: "10px",
                }}
              >
                <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#82401E", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    COMPETENCY MAPPING
                  </span>
                  <Award size={19} strokeWidth={1.8} style={{ color: "#82401E" }} />
                </div>
                <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
                  {papers.length > 0 ? `${Math.round((papers.filter((p: any) => p.competencyMapped).length / papers.length) * 100)}%` : "100%"}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#82401E" }}>
                    Curriculum learning outcomes compliance
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 2. Question Paper Approval Pipeline */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E0E5EB", borderRadius: "10px", padding: "20px", boxShadow: "0 1px 3px rgba(12, 30, 51, 0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0C1E33" }}>
                  Question Paper Review &amp; Blueprint Approval Workflow
                </h3>
                <span style={{ fontSize: "12px", color: "#64748B" }}>
                  Principal quality check: difficulty distribution, competency mapping &amp; mark allocations
                </span>
              </div>
              <span style={{ background: "#DCFCE7", color: "#166534", padding: "4px 10px", borderRadius: "100px", fontSize: "11px", fontWeight: 600 }}>
                Board Quality Protocol Active
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {papers.length === 0 ? (
                <EmptyState
                  illustration="/bee.png"
                  title="No Question Papers Logged"
                  description="Teachers can submit question papers for review, or you can register a question paper blueprint directly."
                  actionLabel="Register Question Paper Blueprint"
                  onAction={() => setCreateModalOpen(true)}
                />
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
                        border: "1px solid #E0E5EB",
                        borderRadius: "10px",
                        padding: "18px 20px",
                        background: isPublished ? "#F0FDF4" : isApproved ? "#F0FDF4" : isDraft ? "#FFFBEB" : "#FFFFFF",
                        boxShadow: "0 1px 3px rgba(12, 30, 51, 0.03)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ background: "#EFF6FF", color: "#1E40AF", fontSize: "11px", fontWeight: 600, padding: "2px 7px", borderRadius: "4px" }}>
                              {paper.grade} · {paper.subjectName}
                            </span>
                            <span style={{ fontSize: "12px", color: "#64748B" }}>
                              Term: <b>{paper.term}</b>
                            </span>
                          </div>
                          <h4 style={{ margin: "6px 0 2px", fontSize: "16px", fontWeight: 700, color: "#0C1E33" }}>{paper.title}</h4>
                          <div style={{ fontSize: "12px", color: "#64748B" }}>
                            Setter: <b>{paper.submittedByName}</b> · {paper.totalMarks} Marks · {paper.durationMinutes} Mins
                          </div>
                        </div>

                        <span
                          style={{
                            padding: "3px 9px",
                            borderRadius: "100px",
                            fontSize: "11.5px",
                            fontWeight: 600,
                            background: isPublished ? "#DCFCE7" : isApproved ? "#E0F2FE" : isDraft ? "#FEF3C7" : "#FEF3C7",
                            color: isPublished ? "#166534" : isApproved ? "#075985" : isDraft ? "#92400E" : "#92400E",
                          }}
                        >
                          {paper.status}
                        </span>
                      </div>

                      {/* Blueprint difficulty distribution */}
                      <div style={{ background: "#F8FAFC", borderRadius: "8px", padding: "12px", margin: "10px 0", fontSize: "12px", border: "1px solid #F1F5F9" }}>
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

                      {!isPublished && (
                        <div style={{ marginTop: "12px", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                          <input
                            type="text"
                            placeholder="Add evaluation comment or revision instructions..."
                            value={commentsInput[paper.id] || ""}
                            onChange={(e) => setCommentsInput({ ...commentsInput, [paper.id]: e.target.value })}
                            style={{ flex: 1, minWidth: "220px", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12px", fontFamily: "'Poppins', sans-serif" }}
                          />
                          {!isApproved && (
                            <button
                              disabled={isBusy}
                              onClick={() => handleAction(paper.id, "Approved")}
                              style={{ background: "#0C1E33", color: "#FFFFFF", border: "none", borderRadius: "6px", padding: "8px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "'Poppins', sans-serif" }}
                            >
                              Approve Blueprint
                            </button>
                          )}
                          <button
                            disabled={isBusy}
                            onClick={() => handleAction(paper.id, "Needs Revision")}
                            style={{ background: "#FFFBEB", color: "#B45309", border: "1px solid #FCD34D", borderRadius: "6px", padding: "8px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "'Poppins', sans-serif" }}
                          >
                            Request Revision
                          </button>
                          <button
                            disabled={isBusy}
                            onClick={() => handleAction(paper.id, "Published")}
                            style={{ background: "#16A34A", color: "#FFFFFF", border: "none", borderRadius: "6px", padding: "8px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "'Poppins', sans-serif" }}
                          >
                            Publish for Printing
                          </button>
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

      {tab === "analysis" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #E0E5EB", borderRadius: "10px", padding: "24px", boxShadow: "0 1px 3px rgba(12, 30, 51, 0.04)" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 700, color: "#0C1E33" }}>
            Formative &amp; Summative Assessment Telemetry
          </h3>
          {evaluations.length === 0 ? (
            <EmptyState
              illustration="/bee.png"
              title="No Assessment Evaluated"
              description="Evaluations and score breakdowns will populate here once teachers record marks."
            />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
              {evaluations.map((ev: any) => (
                <div
                  key={ev.id}
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E0E5EB",
                    borderRadius: "8px",
                    padding: "16px",
                  }}
                >
                  <h4 style={{ margin: "0 0 6px", fontSize: "14.5px", fontWeight: 700, color: "#0C1E33" }}>{ev.title}</h4>
                  <div style={{ fontSize: "12px", color: "#64748B" }}>
                    Class: <b>{ev.className}</b> · Max Marks: <b>{ev.maxMarks}</b>
                  </div>
                  <div style={{ fontSize: "12px", color: "#166534", marginTop: "8px", fontWeight: 600 }}>
                    {ev.enteredStudents} student scores finalized
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Question Paper Registration Modal */}
      {createModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(11, 15, 25, 0.7)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "540px",
              maxHeight: "85vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #E0E5EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0C1E33", margin: 0 }}>Register Question Paper Blueprint</h2>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B", padding: "4px" }}
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleCreateQuestionPaper}
              style={{ padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  Question Paper Title *
                </label>
                <input
                  required
                  placeholder="e.g. Class 10 Mathematics Term 1 Periodic Test"
                  value={paperForm.title}
                  onChange={(e) => setPaperForm({ ...paperForm, title: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12px", fontFamily: "'Poppins', sans-serif" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                    Subject *
                  </label>
                  <select
                    value={paperForm.subjectName}
                    onChange={(e) => setPaperForm({ ...paperForm, subjectName: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12px", fontFamily: "'Poppins', sans-serif" }}
                  >
                    {subjects.length > 0 ? (
                      subjects.map((s: any) => (
                        <option key={s.id} value={s.name}>
                          {s.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Science">Science</option>
                        <option value="English">English</option>
                        <option value="Social Studies">Social Studies</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                    Grade / Class *
                  </label>
                  <input
                    value={paperForm.grade}
                    onChange={(e) => setPaperForm({ ...paperForm, grade: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12px", fontFamily: "'Poppins', sans-serif" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                    Term *
                  </label>
                  <input
                    value={paperForm.term}
                    onChange={(e) => setPaperForm({ ...paperForm, term: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12px", fontFamily: "'Poppins', sans-serif" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                    Max Total Marks *
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={200}
                    value={paperForm.totalMarks}
                    onChange={(e) => setPaperForm({ ...paperForm, totalMarks: Number(e.target.value) })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12px", fontFamily: "'Poppins', sans-serif" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#475569", marginBottom: "2px" }}>
                    Easy % (Target 30)
                  </label>
                  <input
                    type="number"
                    value={paperForm.difficultyEasyPct}
                    onChange={(e) => setPaperForm({ ...paperForm, difficultyEasyPct: Number(e.target.value) })}
                    style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#475569", marginBottom: "2px" }}>
                    Medium % (Target 50)
                  </label>
                  <input
                    type="number"
                    value={paperForm.difficultyMediumPct}
                    onChange={(e) => setPaperForm({ ...paperForm, difficultyMediumPct: Number(e.target.value) })}
                    style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#475569", marginBottom: "2px" }}>
                    Hard % (Target 20)
                  </label>
                  <input
                    type="number"
                    value={paperForm.difficultyHardPct}
                    onChange={(e) => setPaperForm({ ...paperForm, difficultyHardPct: Number(e.target.value) })}
                    style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12px" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #E0E5EB", background: "#FFFFFF", fontSize: "12px", fontWeight: 600, color: "#475569", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPaper}
                  style={{ padding: "8px 18px", borderRadius: "8px", border: "none", background: "#0C1E33", fontSize: "12px", fontWeight: 600, color: "#FFFFFF", cursor: "pointer" }}
                >
                  {submittingPaper ? "Registering…" : "Save Blueprint"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
