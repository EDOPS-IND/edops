"use client";

import React, { useState, useEffect } from "react";
import { getTeacherWorkload, updateTeacherTask } from "../../edops-api";
import {
  BarChart2,
  CheckCircle2,
  Clock,
  CheckSquare,
  BookOpen,
  Users,
  ShieldCheck,
  Calendar,
} from "lucide-react";

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

interface WorkloadPaneProps {
  organizationId: string;
}

export const WorkloadPane: React.FC<WorkloadPaneProps> = ({ organizationId }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  useEffect(() => {
    loadWorkload();
  }, [organizationId]);

  const loadWorkload = async () => {
    setLoading(true);
    try {
      const res = await getTeacherWorkload(organizationId);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    try {
      await updateTeacherTask(organizationId, taskId, { status: newStatus });
      setData((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          tasks: prev.tasks.map((t: any) =>
            t.id === taskId ? { ...t, status: newStatus } : t
          ),
        };
      });
    } catch (err) {
      console.error(err);
    }
  };

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
          Loading academic workload &amp; tasks...
        </p>
      </div>
    );
  }

  const workload = data?.workload || {
    teachingPeriods: 22,
    maxPeriods: 30,
    preparationPeriods: 5,
    remedialPeriods: 3,
    dutyPeriods: 2,
    totalLoad: 32,
    status: "Optimal",
  };
  const tasks = data?.tasks || [];
  const filteredTasks = tasks.filter((t: any) => {
    if (filter === "all") return true;
    return t.status === filter;
  });

  const percentage = Math.min(
    Math.round((workload.teachingPeriods / (workload.maxPeriods || 30)) * 100),
    100
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* 1. Header */}
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
            Capacity &amp; Deliverables
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
            Faculty Workload &amp; Task Checklist
          </h2>
          <p style={{ margin: 0, fontSize: "13px", color: T.slate, lineHeight: 1.5 }}>
            Track weekly teaching quota against CBSE guidelines, preparation balance, and instructional action items.
          </p>
        </div>

        <div
          style={{
            padding: "6px 14px",
            borderRadius: "100px",
            background: T.greenBg,
            fontSize: "11px",
            fontWeight: 600,
            color: T.greenDark,
          }}
        >
          {percentage}% Capacity Utilized ({workload.status || "Optimal"})
        </div>
      </div>

      {/* 2. Top 4 Metric Cards - Strict DESIGN.md Section 2.1 Palettes */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "12px",
        }}
      >
        {/* Teaching Periods (Pastel Sky) */}
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
              Teaching Periods
            </span>
            <BookOpen size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.skyDark }}>
            {workload.teachingPeriods} / {workload.maxPeriods}
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.skyDark }}>
            Weekly scheduled class periods
          </p>
        </div>

        {/* Preparation Slots (Pastel Mint) */}
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
              Prep &amp; Authoring
            </span>
            <CheckCircle2 size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.greenDark }}>
            {workload.preparationPeriods} Slots
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.greenDark }}>
            Reserved for lesson plans &amp; grading
          </p>
        </div>

        {/* Remedials (Pastel Warm Amber) */}
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
              Remedial Quota
            </span>
            <Users size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.amberDark }}>
            {workload.remedialPeriods} Sessions
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.amberDark }}>
            Targeted zero-period academic support
          </p>
        </div>

        {/* Supervision Duty (Pastel Violet) */}
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
              Campus Duty
            </span>
            <ShieldCheck size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.violetDark }}>
            {workload.dutyPeriods} Periods
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.violetDark }}>
            Corridor &amp; examination supervision
          </p>
        </div>
      </div>

      {/* 3. Task Checklist Card */}
      <div
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: T.navy }}>
              Instructional Tasks &amp; Action Items
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: T.slate }}>
              Interactive faculty task list synced with school academic deliverables
            </p>
          </div>

          {/* Filter Pills */}
          <div style={{ display: "flex", background: T.chip, padding: "4px", borderRadius: "8px", border: `1px solid ${T.border}`, gap: "4px" }}>
            {(["all", "pending", "completed"] as const).map((mode) => {
              const active = filter === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFilter(mode)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: active ? 600 : 500,
                    cursor: "pointer",
                    border: "none",
                    background: active ? T.navy : "transparent",
                    color: active ? T.white : T.slate,
                  }}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Task List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filteredTasks.length === 0 ? (
            <div style={{ padding: "36px", textAlign: "center", color: T.slate, fontSize: "12px", border: `1px dashed ${T.border}`, borderRadius: "8px" }}>
              No tasks found under the selected view.
            </div>
          ) : (
            filteredTasks.map((t: any) => {
              const isDone = t.status === "completed";
              return (
                <div
                  key={t.id}
                  onClick={() => handleToggleTask(t.id, t.status)}
                  style={{
                    padding: "14px 16px",
                    borderRadius: "8px",
                    border: `1px solid ${T.border}`,
                    background: isDone ? T.chip : T.white,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "5px",
                        border: isDone ? `1px solid ${T.greenDark}` : `1px solid ${T.line}`,
                        background: isDone ? T.greenDark : T.white,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: T.white,
                      }}
                    >
                      {isDone && <CheckCircle2 size={13} color={T.white} />}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: isDone ? T.slate : T.navy,
                          textDecoration: isDone ? "line-through" : "none",
                        }}
                      >
                        {t.title}
                      </div>
                      <div style={{ fontSize: "11px", color: T.slate, marginTop: "2px" }}>
                        Category: {t.category || "Instructional"} • Due: {t.dueDate || "Term Week 4"}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: "6px",
                      fontSize: "10.5px",
                      fontWeight: 600,
                      background: isDone ? T.greenBg : T.amberBg,
                      color: isDone ? T.greenDark : T.amberDark,
                    }}
                  >
                    {isDone ? "Done ✓" : "Pending"}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
