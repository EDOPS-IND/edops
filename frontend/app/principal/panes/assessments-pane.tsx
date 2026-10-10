"use client";

import React, { useState } from "react";
import { QuestionPaperItem } from "../types";
import { CheckCircle2, Clock, FileText, Check, AlertCircle } from "lucide-react";

export function AssessmentsPane({
  questionPapers = [],
  assessmentTypes = [],
  onReviewQuestionPaper,
  organizationId,
  onNavigate,
}: {
  questionPapers?: QuestionPaperItem[];
  assessmentTypes?: any[];
  onReviewQuestionPaper?: (paperId: string, status: string, comments: string) => Promise<void>;
  organizationId?: string;
  onNavigate?: (pane: string) => void;
}) {
  const [liveData, setLiveData] = useState<any>(null);
  const [commentsInput, setCommentsInput] = useState<{ [key: string]: string }>({});

  React.useEffect(() => {
    if (!organizationId) return;
    import("../../edops-api").then(({ getPrincipalAssessments }) => {
      getPrincipalAssessments(organizationId)
        .then((data) => setLiveData(data))
        .catch(() => null);
    });
  }, [organizationId]);

  const papers = (liveData?.questionPapers && liveData.questionPapers.length > 0) ? liveData.questionPapers : questionPapers;
  const types = (liveData?.assessmentTypes && liveData.assessmentTypes.length > 0) ? liveData.assessmentTypes : assessmentTypes;

  const handleAction = async (id: string, status: string) => {
    const comment = commentsInput[id] || "Approved by Principal. Blueprint conforms to board guidelines.";
    if (onReviewQuestionPaper) {
      await onReviewQuestionPaper(id, status, comment);
    }
    alert(`Question paper updated to ${status}.`);
  };


  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* 1. Assessment Scheme & Blueprint Compliance Banner */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        {[
          { type: "Formative (Periodic)", weight: "20%", compliance: "98%", status: "Compliant" },
          { type: "Subject Enrichment", weight: "20%", compliance: "95%", status: "Compliant" },
          { type: "Summative (Term End)", weight: "60%", compliance: "100%", status: "On Track" },
          { type: "Competency Items (CBE)", weight: "50% min", compliance: "92%", status: "Exemplary" },
        ].map((item, idx) => (
          <div key={idx} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "16px" }}>
            <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>{item.type}</div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#1E293B", margin: "4px 0" }}>{item.weight}</div>
            <div style={{ fontSize: "11px", color: "#15803D", fontWeight: 600 }}>Compliance: {item.compliance} ({item.status})</div>
          </div>
        ))}
      </div>

      {/* 2. Question Paper Approval Pipeline (Section 34) */}
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
            <div style={{ textAlign: "center", padding: "24px 0", color: "#64748B", fontSize: "13px" }}>
              No question papers submitted for review.
            </div>
          ) : (
            papers.map((paper: any, idx: number) => (
              <div key={idx} style={{ border: "1px solid #E2E8F0", borderRadius: "10px", padding: "18px 20px", background: paper.status === "Approved" ? "#F0FDF4" : "#FFFFFF" }}>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ background: "#EFF6FF", color: "#1E40AF", fontSize: "11px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px" }}>
                      {paper.grade} · {paper.subjectName}
                    </span>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>Term: <b>{paper.term}</b></span>
                  </div>
                  <h4 style={{ margin: "6px 0 2px", fontSize: "16px", fontWeight: 700, color: "#1E293B" }}>{paper.title}</h4>
                  <div style={{ fontSize: "12px", color: "#64748B" }}>Setter: <b>{paper.submittedByName}</b> · {paper.totalMarks} Marks · {paper.durationMinutes} Mins</div>
                </div>

                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 700,
                    background: paper.status === "Approved" ? "#DCFCE7" : paper.status === "Published" ? "#E0F2FE" : "#FEF3C7",
                    color: paper.status === "Approved" ? "#166534" : paper.status === "Published" ? "#075985" : "#92400E",
                  }}
                >
                  {paper.status}
                </span>
              </div>

              {/* Blueprint difficulty distribution */}
              <div style={{ background: "#F8FAFC", borderRadius: "8px", padding: "12px", margin: "10px 0", fontSize: "12px" }}>
                <div style={{ fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Blueprint Difficulty Balance:</div>
                <div style={{ display: "flex", gap: "20px" }}>
                  <div>Easy: <b>{paper.difficultyEasyPct}%</b> (Target 30%)</div>
                  <div>Medium: <b>{paper.difficultyMediumPct}%</b> (Target 50%)</div>
                  <div>Hard / HOTS: <b>{paper.difficultyHardPct}%</b> (Target 20%)</div>
                  <div style={{ color: "#065F46" }}>• Competency Mapped: <b>{paper.competencyMapped ? "Yes" : "Pending"}</b></div>
                </div>
              </div>

              {paper.reviewComments && (
                <div style={{ fontSize: "12px", color: "#475569", marginBottom: "10px" }}>
                  <b>Principal Review Notes:</b> {paper.reviewComments}
                </div>
              )}

              {paper.status !== "Approved" && paper.status !== "Published" && (
                <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "12px", paddingTop: "10px", borderTop: "1px dashed #E2E8F0" }}>
                  <input
                    type="text"
                    placeholder="Enter review comments or modification requests..."
                    value={commentsInput[paper.id] || ""}
                    onChange={(e) => setCommentsInput({ ...commentsInput, [paper.id]: e.target.value })}
                    style={{ flex: 1, padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12px" }}
                  />
                  <button
                    onClick={() => handleAction(paper.id, "Approved")}
                    style={{ background: "#064E3B", color: "#F8E7C9", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                  >
                    Approve Blueprint
                  </button>
                  <button
                    onClick={() => handleAction(paper.id, "Draft")}
                    style={{ background: "#FFFBEB", color: "#B45309", border: "1px solid #FCD34D", borderRadius: "6px", padding: "8px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                  >
                    Request Revision
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      </div>
    </div>
  );
}
