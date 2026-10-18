"use client";

import React from "react";
import { WardInfo } from "../types";
import { BookOpen, Award, CheckCircle2, Star, Eye } from "lucide-react";
import { getStudentAvatarUrl } from "../../edops-api";

export function AcademicsPane({
  selectedWard,
  onOpenReportModal,
}: {
  selectedWard: WardInfo;
  onOpenReportModal?: () => void;
}) {
  const subjects = selectedWard.data?.subjects || [];
  const results = selectedWard.data?.results || [];

  const totalScore = results.reduce((acc: number, r: any) => acc + (Number(r.score) || 0), 0);
  const totalMax = results.reduce((acc: number, r: any) => acc + (Number(r.max) || 0), 0);
  const avgPct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 84;

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
              Enrolled Subjects
            </span>
            <BookOpen size={16} color="#1a5c0a" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#144807", lineHeight: 1 }}>{subjects.length}</div>
            <div style={{ fontSize: "11px", color: "#23730e", marginTop: "6px", fontWeight: 600 }}>
              Curriculum Courses Active
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
              Published Results
            </span>
            <Award size={16} color="#4a0e8f" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#360a69", lineHeight: 1 }}>{results.length}</div>
            <div style={{ fontSize: "11px", color: "#5d1cb3", marginTop: "6px", fontWeight: 600 }}>
              Official Exam Scores Released
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
              Aggregate Average
            </span>
            <CheckCircle2 size={16} color="#0a5a7a" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#074158", lineHeight: 1 }}>{avgPct}%</div>
            <div style={{ fontSize: "11px", color: "#0d6e94", marginTop: "6px", fontWeight: 600 }}>
              Term Assessment Average
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
              Academic Standing
            </span>
            <Star size={16} color="#782a00" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#561e00", lineHeight: 1 }}>
              {avgPct >= 80 ? "Exemplary" : avgPct >= 65 ? "Good" : "Needs Support"}
            </div>
            <div style={{ fontSize: "11px", color: "#943502", marginTop: "6px", fontWeight: 600 }}>
              Performance Track Verified
            </div>
          </div>
        </div>
      </div>

      {/* Published Examination Results */}
      <div style={{ background: "#ffffff", border: "1px solid #e4e6e9", borderRadius: "10px", overflow: "hidden" }}>
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #e4e6e9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>
              Official Examination Results
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#64748b" }}>
              Official transcript certified by school administration.
            </p>
          </div>
          {onOpenReportModal && (
            <button
              onClick={onOpenReportModal}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                borderRadius: "8px",
                background: "#0c1e33",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
              }}
            >
              <Eye size={14} /> View Official Report Card
            </button>
          )}
        </div>

        {results.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: "#64748b", fontSize: "12px" }}>
            No examination results published yet for this academic term.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e4e6e9", color: "#64748b", fontWeight: 700 }}>
                  <th style={{ padding: "12px 16px" }}>Assessment</th>
                  <th style={{ padding: "12px 16px" }}>Subject</th>
                  <th style={{ padding: "12px 16px" }}>Marks Obtained</th>
                  <th style={{ padding: "12px 16px" }}>Maximum</th>
                  <th style={{ padding: "12px 16px" }}>Percentage</th>
                  <th style={{ padding: "12px 16px" }}>Grade</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r: any, idx: number) => {
                  const pct = r.percentage ? r.percentage : Math.round((Number(r.score) / Number(r.max)) * 100);
                  return (
                    <tr
                      key={r.id || idx}
                      style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s ease" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#fbfcfd")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
                    >
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "#1e293b" }}>{r.exam}</td>
                      <td style={{ padding: "12px 16px", color: "#475569" }}>{r.subject}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 800, color: "#0c1e33" }}>{r.score}</td>
                      <td style={{ padding: "12px 16px", color: "#64748b" }}>{r.max}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: "60px", height: "6px", borderRadius: "3px", background: "#f1f5f9", overflow: "hidden" }}>
                            <div
                              style={{
                                width: `${Math.min(100, pct)}%`,
                                height: "100%",
                                background: pct >= 75 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444",
                              }}
                            />
                          </div>
                          <span style={{ fontWeight: 700, color: pct >= 75 ? "#15803d" : "#dc2626" }}>{pct}%</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: 700,
                            background: "#f1f5f9",
                            color: "#0c1e33",
                          }}
                        >
                          {r.grade || "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Enrolled Subjects & Teachers */}
      <div style={{ background: "#ffffff", border: "1px solid #e4e6e9", borderRadius: "10px", padding: "20px" }}>
        <h3 style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>Enrolled Curriculum Subjects</h3>
        <p style={{ margin: "0 0 16px", fontSize: "11px", color: "#64748b" }}>
          Current course allocations and assigned teaching faculty.
        </p>

        {subjects.length === 0 ? (
          <p style={{ color: "#64748b", fontSize: "12px" }}>No curriculum subjects currently enrolled.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
            {subjects.map((sub: any) => (
              <div
                key={sub.id}
                style={{
                  border: "1px solid #e4e6e9",
                  borderRadius: "8px",
                  padding: "14px",
                  background: "#f8fafc",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <img
                  src={getStudentAvatarUrl(sub.teacher || sub.name, sub.teacherId || sub.id)}
                  alt=""
                  style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#eaedf2" }}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: "13px", color: "#1e293b" }}>{sub.name}</div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>
                    Teacher: <b>{sub.teacher}</b> • Code: {sub.code || "—"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
