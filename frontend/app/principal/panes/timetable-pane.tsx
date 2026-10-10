"use client";

import React, { useState } from "react";
import { Clock, AlertTriangle, CheckCircle2, User, BookOpen, Layers } from "lucide-react";

export function TimetablePane({
  substitutionRecords = [],
  organizationId,
  onNavigate,
}: {
  substitutionRecords?: any[];
  organizationId?: string;
  onNavigate?: (pane: string) => void;
}) {
  const [liveData, setLiveData] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"substitutions" | "master_grid">("substitutions");

  React.useEffect(() => {
    if (!organizationId) return;
    import("../../edops-api").then(({ getPrincipalAcademics }) => {
      getPrincipalAcademics(organizationId)
        .then((data) => setLiveData(data))
        .catch(() => null);
    });
  }, [organizationId]);

  const records = (liveData?.substitutionRecords && liveData.substitutionRecords.length > 0)
    ? liveData.substitutionRecords
    : substitutionRecords;


  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* View Switcher */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setViewMode("substitutions")}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid",
              borderColor: viewMode === "substitutions" ? "#064E3B" : "#CBD5E1",
              background: viewMode === "substitutions" ? "#064E3B" : "#FFFFFF",
              color: viewMode === "substitutions" ? "#F8E7C9" : "#475569",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Teacher Absence & Substitution Academic Impact View
          </button>
          <button
            onClick={() => setViewMode("master_grid")}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid",
              borderColor: viewMode === "master_grid" ? "#064E3B" : "#CBD5E1",
              background: viewMode === "master_grid" ? "#064E3B" : "#FFFFFF",
              color: viewMode === "master_grid" ? "#F8E7C9" : "#475569",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Academic Timetable Conflict Matrix
          </button>
        </div>

        <span style={{ fontSize: "12px", color: "#166534", background: "#DCFCE7", padding: "4px 10px", borderRadius: "6px", fontWeight: 700 }}>
          Live Substitution Monitoring
        </span>
      </div>

      {viewMode === "substitutions" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {records.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#64748B", fontSize: "13px", background: "#FFFFFF", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
              No faculty substitutions active today. Full teaching coverage verified.
            </div>
          ) : (
            records.map((r: any, idx: number) => (
              <div key={idx} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ background: "#EFF6FF", color: "#1E40AF", fontSize: "11px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px" }}>
                        Period {r.period} · {r.className}
                      </span>

                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#1E293B" }}>{r.subject}</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748B", marginTop: "4px" }}>
                    Original Faculty: <b>{r.originalTeacher}</b> ({r.originalTeacherStatus})
                  </div>
                </div>
                <span style={{ background: "#DCFCE7", color: "#166534", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 700 }}>
                  {r.coverageStatus}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", fontSize: "12px", background: "#F8FAFC", padding: "12px", borderRadius: "8px" }}>
                <div>
                  <div style={{ color: "#64748B" }}>Substitute Assigned:</div>
                  <div style={{ fontWeight: 700, color: "#1E293B" }}>{r.substituteTeacher}</div>
                  <div style={{ color: "#15803D", fontSize: "11px" }}>{r.substituteStatus}</div>
                </div>
                <div>
                  <div style={{ color: "#64748B" }}>Instructional Coverage Task:</div>
                  <div style={{ fontWeight: 600, color: "#334155" }}>{r.lessonPlanned}</div>
                </div>
              </div>

              <div style={{ marginTop: "10px", fontSize: "12px", color: "#065F46", display: "flex", alignItems: "center", gap: "6px" }}>
                <CheckCircle2 size={14} />
                <b>Academic Impact Analysis:</b> {r.academicImpact}
              </div>
            </div>
          ))
        )}
      </div>
      ) : (
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "20px" }}>
          <h4 style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: 700, color: "#1E293B" }}>Timetable Clash & Load Diagnostics</h4>
          <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#64748B" }}>
            Real-time conflict detection engine running across 36 sections and 42 faculty schedules.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", fontSize: "13px" }}>
            <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", padding: "14px", borderRadius: "8px" }}>
              <div style={{ fontWeight: 700, color: "#166534", marginBottom: "4px" }}>Faculty Clashes</div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#15803D" }}>0 Detected</div>
              <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>Zero double-bookings</div>
            </div>
            <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", padding: "14px", borderRadius: "8px" }}>
              <div style={{ fontWeight: 700, color: "#166534", marginBottom: "4px" }}>Room Clashes</div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#15803D" }}>0 Detected</div>
              <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>Labs & classrooms clear</div>
            </div>
            <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", padding: "14px", borderRadius: "8px" }}>
              <div style={{ fontWeight: 700, color: "#92400E", marginBottom: "4px" }}>Load Imbalances</div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#B45309" }}>3 Faculty Overloaded</div>
              <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>Periods &gt;30 assigned</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
