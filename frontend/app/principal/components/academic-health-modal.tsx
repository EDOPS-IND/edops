"use client";

import React from "react";
import { AcademicHealthComponent } from "../types";
import { X, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck } from "lucide-react";

export function AcademicHealthModal({
  score = 88,
  components = [],
  onClose,
  onNavigateAction,
}: {
  score?: number;
  components?: AcademicHealthComponent[];
  onClose: () => void;
  onNavigateAction?: (target: string) => void;
}) {
  return (
    <div className="modal-backdrop" style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
      <div
        className="modal-card"
        style={{
          background: "#FFFFFF",
          borderRadius: "14px",
          width: "100%",
          maxWidth: "880px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F8FAFC" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#ECFDF5", border: "1px solid #A7F3D0", display: "flex", alignItems: "center", justifyContent: "center", color: "#065F46" }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#1E293B" }}>
                Explainable Academic Health Score Dossier
              </h2>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748B" }}>
                Transparent mathematical composite of curriculum, assessment, student learning & faculty compliance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748B", padding: "6px" }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Top Score Summary Banner */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "10px", padding: "16px 20px" }}>
            <div>
              <div style={{ fontSize: "12px", color: "#166534", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Current Academic Health Rating</div>
              <div style={{ fontSize: "36px", fontWeight: 800, color: "#15803D", margin: "4px 0" }}>
                {score} <span style={{ fontSize: "18px", fontWeight: 500, color: "#166534" }}>/ 100</span>
              </div>
              <div style={{ fontSize: "13px", color: "#166534" }}>
                Status: <b>Strong Academic Health</b> · Above CBSE Quality Standard (Benchmark: 80)
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "11px", color: "#64748B", marginBottom: "4px" }}>Decision Logic</div>
              <span style={{ display: "inline-block", background: "#DCFCE7", color: "#166534", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 600 }}>
                Weighted Multi-Factor Model
              </span>
            </div>
          </div>

          {/* Factor Breakdown List */}
          <div>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#334155", margin: "0 0 12px" }}>
              Factor-by-Factor Explainability & Action Triggers
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {components.map((comp, idx) => (
                <div
                  key={idx}
                  style={{
                    border: "1px solid #E2E8F0",
                    borderRadius: "10px",
                    padding: "14px 16px",
                    background: comp.score < 85 ? "#FFFBEB" : "#FFFFFF",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {comp.score < 85 ? (
                        <AlertTriangle size={18} color="#D97706" />
                      ) : (
                        <CheckCircle2 size={18} color="#16A34A" />
                      )}
                      <span style={{ fontSize: "14px", fontWeight: 700, color: "#1E293B" }}>{comp.name}</span>
                      <span style={{ fontSize: "11px", color: "#64748B", background: "#F1F5F9", padding: "2px 6px", borderRadius: "4px" }}>
                        Weight: {comp.weight}
                      </span>
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: comp.score < 85 ? "#B45309" : "#15803D" }}>
                      {comp.score}%
                    </div>
                  </div>

                  <div style={{ fontSize: "12px", color: "#475569", marginBottom: "6px" }}>
                    <b>Underlying Evidence:</b> {comp.underlyingMetric}
                  </div>

                  {comp.flaggedClasses && comp.flaggedClasses.length > 0 && (
                    <div style={{ fontSize: "12px", color: "#9A3412", marginBottom: "6px" }}>
                      <b>Flagged Entities:</b> {comp.flaggedClasses.join(" · ")}
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", paddingTop: "8px", borderTop: "1px dashed #E2E8F0" }}>
                    <div style={{ fontSize: "12px", color: "#065F46" }}>
                      <b>Principal Action:</b> {comp.recommendedAction}
                    </div>
                    {onNavigateAction && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigateAction(comp.name);
                        }}
                        style={{
                          background: "#F8FAFC",
                          border: "1px solid #CBD5E1",
                          borderRadius: "6px",
                          padding: "4px 8px",
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#334155",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        Drill Down <ArrowRight size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #E2E8F0", background: "#F8FAFC", display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              background: "#1E293B",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              padding: "8px 20px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
}
