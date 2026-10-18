"use client";

import React from "react";
import { WardInfo } from "../types";
import { Award, Printer, X, CheckCircle2 } from "lucide-react";
import { getStudentAvatarUrl } from "../../edops-api";

export function ReportCardModal({
  isOpen,
  onClose,
  selectedWard,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedWard: WardInfo;
}) {
  if (!isOpen) return null;

  const results = selectedWard.data?.results || [];

  return (
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
          background: "#ffffff",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "680px",
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #e4e6e9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Award size={20} color="#0c1e33" />
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0c1e33", margin: 0 }}>
                Certified Student Report Card
              </h2>
              <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#64748b" }}>
                Official Examination Transcript · Academic Year 2025–2026
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: "4px" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Student Dossier Strip */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px",
              borderRadius: "10px",
              background: "#eaedf2",
              border: "1px solid #d8dee6",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <img
                src={getStudentAvatarUrl(selectedWard.name, selectedWard.studentUserId)}
                alt=""
                style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#ffffff" }}
              />
              <div>
                <div style={{ fontSize: "15px", fontWeight: 800, color: "#0c1e33" }}>{selectedWard.name}</div>
                <div style={{ fontSize: "11px", color: "#475569" }}>
                  Class: <b>{selectedWard.sectionName || "Enrolled"}</b> · Roll No: <b>{selectedWard.rollNumber || "—"}</b>
                </div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 700,
                  background: "#dcfce7",
                  color: "#166534",
                }}
              >
                <CheckCircle2 size={13} /> Official Record
              </span>
            </div>
          </div>

          {/* Results Table */}
          <div style={{ background: "#ffffff", border: "1px solid #e4e6e9", borderRadius: "10px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e4e6e9", color: "#64748b", fontWeight: 700 }}>
                  <th style={{ padding: "10px 14px" }}>Assessment</th>
                  <th style={{ padding: "10px 14px" }}>Subject</th>
                  <th style={{ padding: "10px 14px" }}>Marks Obtained</th>
                  <th style={{ padding: "10px 14px" }}>Maximum</th>
                  <th style={{ padding: "10px 14px" }}>Percentage</th>
                  <th style={{ padding: "10px 14px" }}>Grade</th>
                </tr>
              </thead>
              <tbody>
                {results.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>
                      No published examination results available at this time.
                    </td>
                  </tr>
                ) : (
                  results.map((r: any, idx: number) => (
                    <tr key={r.id || idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px 14px", fontWeight: 700, color: "#1e293b" }}>{r.exam}</td>
                      <td style={{ padding: "10px 14px", color: "#475569" }}>{r.subject}</td>
                      <td style={{ padding: "10px 14px", fontWeight: 800, color: "#0c1e33" }}>{r.score}</td>
                      <td style={{ padding: "10px 14px", color: "#64748b" }}>{r.max}</td>
                      <td style={{ padding: "10px 14px", fontWeight: 700, color: r.percentage >= 75 ? "#15803d" : "#dc2626" }}>
                        {r.percentage ? `${r.percentage}%` : `${Math.round((r.score / r.max) * 100)}%`}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <span
                          style={{
                            padding: "2px 8px",
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "14px 20px",
            borderTop: "1px solid #e4e6e9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <button
            type="button"
            onClick={() => window.print()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid #e4e6e9",
              background: "#ffffff",
              fontSize: "12px",
              fontWeight: 600,
              color: "#0c1e33",
              cursor: "pointer",
            }}
          >
            <Printer size={14} /> Print Report
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 18px",
              borderRadius: "8px",
              border: "none",
              background: "#0c1e33",
              fontSize: "12px",
              fontWeight: 600,
              color: "#ffffff",
              cursor: "pointer",
            }}
          >
            Close Transcript
          </button>
        </div>
      </div>
    </div>
  );
}
