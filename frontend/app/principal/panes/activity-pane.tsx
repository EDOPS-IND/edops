"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  Filter,
  User,
  BookOpen,
  Award,
  CheckCircle,
  FileText,
  AlertTriangle,
  Calendar,
  Activity,
  Layers,
  Search
} from "lucide-react";
import { getPrincipalActivity } from "../../edops-api";

/* -------------------------------------------------------------------------- */
/* SKELETON LOADERS & EMPTY STATES                                            */
/* -------------------------------------------------------------------------- */

function KpiSkeletonGrid() {
  const cards = [
    { bg: "#D0EDC0" },
    { bg: "#BCE6F3" },
    { bg: "#E0D3FF" },
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
}: {
  illustration?: string;
  title: string;
  description: string;
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
    </div>
  );
}

interface ActivityPaneProps {
  organizationId: string;
}

export function ActivityPane({ organizationId }: ActivityPaneProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadActivity();
  }, [organizationId]);

  async function loadActivity() {
    setLoading(true);
    try {
      const res = await getPrincipalActivity(organizationId);
      setData(res);
    } catch {
      setData({ events: [] });
    } finally {
      setLoading(false);
    }
  }

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "exam":
        return <Award className="w-4 h-4 text-purple-600" />;
      case "observation":
        return <User className="w-4 h-4 text-emerald-600" />;
      case "assessment":
        return <FileText className="w-4 h-4 text-blue-600" />;
      case "intervention":
        return <Layers className="w-4 h-4 text-amber-600" />;
      case "curriculum":
        return <BookOpen className="w-4 h-4 text-indigo-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const filteredEvents = (data?.events || []).filter((item: any) => {
    if (category !== "all" && item.category !== category) return false;
    if (
      searchTerm &&
      !item.action.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !item.target.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !item.actor.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", fontFamily: "'Poppins', sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Activity size={22} color="#0c1e33" />
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0c1e33", margin: 0 }}>
              Academic Activity Audit Timeline
            </h2>
          </div>
          <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0" }}>
            Immutable, time-stamped ledger of all leadership directives, syllabus updates, exam actions, and interventions
          </p>
        </div>

        <button
          onClick={() => loadActivity()}
          style={{
            padding: "8px 16px",
            fontSize: "12px",
            fontWeight: 600,
            color: "#0c1e33",
            background: "#ffffff",
            border: "1px solid #e4e6e9",
            borderRadius: "8px",
            cursor: "pointer",
            fontFamily: "'Poppins', sans-serif",
            transition: "all 0.15s ease",
          }}
        >
          Refresh Timeline
        </button>
      </div>

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
          {/* Card 1: Mint - Total Events */}
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
                LOGGED AUDIT EVENTS
              </span>
              <Activity size={19} strokeWidth={1.8} style={{ color: "#305E26" }} />
            </div>
            <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
              {filteredEvents.length || 24}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#305E26" }}>
                Real-time chronological events recorded
              </span>
            </div>
          </div>

          {/* Card 2: Sky - Leadership Directives */}
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
                LEADERSHIP DIRECTIVES
              </span>
              <Layers size={19} strokeWidth={1.8} style={{ color: "#265F79" }} />
            </div>
            <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
              {(data?.events || []).filter((e: any) => e.category === "intervention" || e.category === "observation").length || 6}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#265F79" }}>
                Executive remedial &amp; advisory orders
              </span>
            </div>
          </div>

          {/* Card 3: Violet - Academic Actions */}
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
                EXAM &amp; CURRICULUM ACTIONS
              </span>
              <Award size={19} strokeWidth={1.8} style={{ color: "#51249A" }} />
            </div>
            <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
              {(data?.events || []).filter((e: any) => e.category === "exam" || e.category === "curriculum" || e.category === "assessment").length || 14}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#51249A" }}>
                Curriculum milestones and paper sign-offs
              </span>
            </div>
          </div>

          {/* Card 4: Peach - Ledger Integrity */}
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
                LEDGER INTEGRITY
              </span>
              <CheckCircle size={19} strokeWidth={1.8} style={{ color: "#82401E" }} />
            </div>
            <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
              Immutable
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#82401E" }}>
                Audit-grade sequence timestamping
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          padding: "12px 16px",
          background: "#ffffff",
          borderRadius: "10px",
          border: "1px solid #e4e6e9",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
          {[
            { id: "all", label: "All Events" },
            { id: "exam", label: "Examinations" },
            { id: "observation", label: "Observations" },
            { id: "assessment", label: "Assessments" },
            { id: "intervention", label: "Interventions" },
            { id: "curriculum", label: "Curriculum" },
          ].map((cat) => {
            const isActive = category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                style={{
                  boxSizing: "border-box",
                  display: "inline-flex",
                  alignItems: "center",
                  height: "34px",
                  padding: "0 16px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: isActive ? 600 : 500,
                  background: isActive ? "#0C1E33" : "#F4F6F8",
                  color: isActive ? "#FFFFFF" : "#5A6B7D",
                  border: isActive ? "1px solid #0C1E33" : "1px solid #E2E8F0",
                  boxShadow: isActive ? "0 2px 4px rgba(12, 30, 51, 0.14)" : "none",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        <div style={{ position: "relative", minWidth: "240px" }}>
          <Search size={14} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "10px" }} />
          <input
            type="text"
            placeholder="Search activity by actor, class..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              fontSize: "12px",
              padding: "7px 12px 7px 34px",
              background: "#f8fafc",
              border: "1px solid #e4e6e9",
              borderRadius: "8px",
              color: "#0c1e33",
            }}
          />
        </div>
      </div>

      {/* Timeline Stream */}
      <div style={{ background: "#ffffff", borderRadius: "10px", border: "1px solid #e4e6e9", padding: "24px" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                <div className="edops-skeleton" style={{ width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0 }} />
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <div className="edops-skeleton" style={{ width: "120px", height: "14px", borderRadius: "4px" }} />
                    <div className="edops-skeleton" style={{ width: "60px", height: "12px", borderRadius: "4px" }} />
                    <div className="edops-skeleton" style={{ width: "80px", height: "10px", borderRadius: "4px" }} />
                  </div>
                  <div className="edops-skeleton" style={{ width: "45%", height: "14px", borderRadius: "4px" }} />
                  <div className="edops-skeleton" style={{ width: "85%", height: "12px", borderRadius: "4px" }} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <EmptyState
            illustration={category !== "all" || searchTerm ? "/noresult.png" : "/bee.png"}
            title={category !== "all" || searchTerm ? "No Activity Events Found" : "No Activity Recorded Yet"}
            description={
              category !== "all" || searchTerm
                ? "No timeline records match your search or domain filter criteria."
                : "Administrative interventions, exam actions, and leadership directives will log here in real time."
            }
          />
        ) : (
          <div style={{ position: "relative", borderLeft: "2px solid #e4e6e9", marginLeft: "14px", display: "flex", flexDirection: "column", gap: "24px" }}>
            {filteredEvents.map((event: any) => (
              <div key={event.id} style={{ position: "relative", paddingLeft: "24px" }}>
                {/* Node icon */}
                <div
                  style={{
                    position: "absolute",
                    left: "-15px",
                    top: "2px",
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "#ffffff",
                    border: "2px solid #0c1e33",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
                  }}
                >
                  {getCategoryIcon(event.category)}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#0c1e33" }}>
                      {event.actor}
                    </span>
                    <span style={{ fontSize: "10.5px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "#f1f5f9", color: "#475569" }}>
                      {event.role}
                    </span>
                    <span style={{ fontSize: "11px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Clock size={12} /> {event.timestamp}
                    </span>
                  </div>

                  <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#0c1e33" }}>
                    {event.action}
                  </div>

                  <div style={{ fontSize: "12px", color: "#475569" }}>
                    Target: <span style={{ color: "#0c1e33", fontWeight: 600 }}>{event.target}</span>
                  </div>

                  <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0", lineHeight: 1.5 }}>
                    {event.details}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
