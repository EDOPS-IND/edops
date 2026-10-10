"use client";

import React, { useState } from "react";
import { Plus, Target, Calendar, CheckCircle2, Clock, AlertCircle, FileText } from "lucide-react";

export function PlanningPane({
  plans = [],
  targets = [],
  actionPlans = [],
  meetings = [],
  onTriggerAction,
  organizationId,
  initialTab,
}: {
  plans?: any[];
  targets?: any[];
  actionPlans?: any[];
  meetings?: any[];
  onTriggerAction?: (actionType: string) => void;
  organizationId?: string;
  initialTab?: string;
}) {
  const [liveData, setLiveData] = useState<any>(null);
  const [subTab, setSubTab] = useState<"annual_plan" | "targets" | "action_plans" | "meetings">((initialTab as any) || "annual_plan");

  React.useEffect(() => {
    if (!organizationId) return;
    import("../../edops-api").then(({ getPrincipalPlanning }) => {
      getPrincipalPlanning(organizationId)
        .then((data) => setLiveData(data))
        .catch(() => null);
    });
  }, [organizationId]);

  const planList = (liveData?.plans && liveData.plans.length > 0) ? liveData.plans : plans;
  const targetList = (liveData?.targets && liveData.targets.length > 0) ? liveData.targets : targets;
  const actionList = (liveData?.actionPlans && liveData.actionPlans.length > 0) ? liveData.actionPlans : actionPlans;
  const meetingList = (liveData?.meetings && liveData.meetings.length > 0) ? liveData.meetings : meetings;


  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Sub-navigation & Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          {[
            { id: "annual_plan", label: "Annual Pedagogical Plan" },
            { id: "targets", label: "School Academic Targets" },
            { id: "action_plans", label: "Academic Action Plans" },
            { id: "meetings", label: "Academic Review Meetings" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid",
                borderColor: subTab === tab.id ? "#064E3B" : "#CBD5E1",
                background: subTab === tab.id ? "#064E3B" : "#FFFFFF",
                color: subTab === tab.id ? "#F8E7C9" : "#475569",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => onTriggerAction(subTab === "annual_plan" ? "plan" : "action")}
          style={{
            background: "#064E3B",
            color: "#F8E7C9",
            border: "none",
            borderRadius: "8px",
            padding: "8px 16px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Plus size={16} />
          {subTab === "annual_plan" ? "New Academic Plan" : "+ Create Action Plan"}
        </button>
      </div>

      {/* 1. Annual Pedagogical Plan Tab */}
      {subTab === "annual_plan" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {planList.map((plan: any, idx: number) => (
            <div key={idx} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#166534", background: "#DCFCE7", padding: "2px 8px", borderRadius: "4px" }}>
                    {plan.board || "CBSE"} Mandatory Filing
                  </span>
                  <h3 style={{ margin: "6px 0 2px", fontSize: "18px", fontWeight: 700, color: "#1E293B" }}>{plan.title}</h3>
                  <span style={{ fontSize: "12px", color: "#64748B" }}>Academic Session 2026-27 · Status: <b>{plan.status}</b></span>
                </div>
                <span style={{ background: "#F1F5F9", color: "#334155", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 700 }}>
                  Approved by Principal
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", fontSize: "13px" }}>
                <div style={{ background: "#F8FAFC", padding: "14px", borderRadius: "8px", border: "1px solid #F1F5F9" }}>
                  <div style={{ fontWeight: 700, color: "#1E293B", marginBottom: "4px" }}>🎯 Academic Objectives</div>
                  <div style={{ color: "#475569" }}>{plan.academicObjectives}</div>
                </div>
                <div style={{ background: "#F8FAFC", padding: "14px", borderRadius: "8px", border: "1px solid #F1F5F9" }}>
                  <div style={{ fontWeight: 700, color: "#1E293B", marginBottom: "4px" }}>👨‍🏫 Teaching & Pedagogy Strategy</div>
                  <div style={{ color: "#475569" }}>{plan.teachingPedagogyStrategy}</div>
                </div>
                <div style={{ background: "#F8FAFC", padding: "14px", borderRadius: "8px", border: "1px solid #F1F5F9" }}>
                  <div style={{ fontWeight: 700, color: "#1E293B", marginBottom: "4px" }}>📊 Assessment & Evaluation Scheme</div>
                  <div style={{ color: "#475569" }}>{plan.assessmentStrategy}</div>
                </div>
                <div style={{ background: "#F8FAFC", padding: "14px", borderRadius: "8px", border: "1px solid #F1F5F9" }}>
                  <div style={{ fontWeight: 700, color: "#1E293B", marginBottom: "4px" }}>🌱 Student Support & Remedial Plan</div>
                  <div style={{ color: "#475569" }}>{plan.remedialPlan || "Tier-1 Classroom differentiation; Tier-2 Scheduled zero-period booster clinics; Tier-3 Special educator mentoring."}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. School Academic Targets Tab */}
      {subTab === "targets" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          {targetList.map((tgt: any, idx: number) => (
            <div key={idx} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "18px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#2563EB", background: "#EFF6FF", padding: "2px 6px", borderRadius: "4px" }}>Target</span>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: tgt.status === "Achieved" ? "#15803D" : "#B45309" }}>{tgt.status}</span>
                </div>
                <h4 style={{ margin: "0 0 10px", fontSize: "15px", fontWeight: 700, color: "#1E293B" }}>{tgt.title}</h4>
                <div style={{ fontSize: "12px", color: "#64748B", marginBottom: "12px" }}>Owner: <b>{tgt.ownerName}</b></div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                  <span>Baseline: <b>{tgt.baselineValue}</b></span>
                  <span>Target: <b>{tgt.targetValue}</b></span>
                </div>
                <div style={{ height: "6px", width: "100%", background: "#E2E8F0", borderRadius: "3px", overflow: "hidden", marginBottom: "6px" }}>
                  <div style={{ height: "100%", width: `${tgt.progressPercentage || 65}%`, background: "#065F46" }} />
                </div>
                <div style={{ fontSize: "11px", color: "#64748B", textAlign: "right" }}>Progress: <b>{tgt.progressPercentage || 65}%</b></div>
              </div>

              <div style={{ marginTop: "14px", paddingTop: "10px", borderTop: "1px solid #F1F5F9", fontSize: "11px", color: "#64748B", display: "flex", justifyContent: "space-between" }}>
                <span>Target Deadline:</span>
                <b>{tgt.deadline}</b>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Academic Action Plans Tab */}
      {subTab === "action_plans" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {actionList.map((act: any, idx: number) => (
            <div key={idx} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ background: "#FEE2E2", color: "#991B1B", fontSize: "11px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px" }}>Intervention Plan</span>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>Owner: <b>{act.ownerName}</b></span>
                  </div>
                  <h4 style={{ margin: "6px 0 2px", fontSize: "15px", fontWeight: 700, color: "#1E293B" }}>{act.issue}</h4>
                </div>
                <span style={{ background: act.status === "Active" ? "#DCFCE7" : "#F1F5F9", color: act.status === "Active" ? "#166534" : "#475569", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 700 }}>
                  {act.status}
                </span>
              </div>

              <div style={{ fontSize: "13px", color: "#334155", display: "flex", flexDirection: "column", gap: "6px" }}>
                <div><b>Evidence Base:</b> {act.evidence}</div>
                <div><b>Root Cause:</b> {act.rootCause}</div>
                <div><b>Prescribed Action:</b> <span style={{ color: "#065F46", fontWeight: 600 }}>{act.action}</span></div>
                <div><b>Expected Result:</b> {act.expectedResult}</div>
              </div>

              <div style={{ marginTop: "12px", paddingTop: "8px", borderTop: "1px dashed #E2E8F0", display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748B" }}>
                <span>Scheduled Review Date: <b>{act.reviewDate}</b></span>
                <span>Final Target Deadline: <b>{act.deadline}</b></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Academic Review Meetings Tab */}
      {subTab === "meetings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {meetingList.map((meet: any, idx: number) => (

            <div key={idx} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1E293B" }}>{meet.meetingType}</h4>
                  <span style={{ fontSize: "12px", color: "#64748B" }}>Date: <b>{meet.meetingDate}</b> · Participants: {Array.isArray(meet.participants) ? meet.participants.join(", ") : meet.participants}</span>
                </div>
                <span style={{ background: "#DCFCE7", color: "#166534", padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 600 }}>{meet.status}</span>
              </div>
              <div style={{ fontSize: "13px", color: "#334155", marginTop: "10px" }}>
                <div><b>Agenda:</b> {meet.agenda}</div>
                <div style={{ marginTop: "4px" }}><b>Findings:</b> {meet.findings}</div>
                <div style={{ marginTop: "4px" }}><b>Decisions / Resolutions:</b> <span style={{ color: "#065F46" }}>{meet.decisions}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
