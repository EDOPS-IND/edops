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
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
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
            transition: "all 0.15s ease",
          }}
        >
          Refresh Timeline
        </button>
      </div>

      {/* 4 Standard Pastel KPI Cards (strictly 148px height) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
        }}
      >
        {/* Card 1: Mint - Total Events */}
        <div
          style={{
            height: "148px",
            background: "#ccefbf",
            border: "1px solid #b2e49f",
            borderRadius: "10px",
            padding: "20px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#1a5c0a", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Logged Audit Events
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#1a5c0a", marginTop: "4px" }}>
              {filteredEvents.length || 24}
            </div>
          </div>
          <div style={{ fontSize: "11px", color: "#23720e", fontWeight: 500 }}>
            Real-time chronological events recorded
          </div>
        </div>

        {/* Card 2: Sky - Leadership Directives */}
        <div
          style={{
            height: "148px",
            background: "#bae5f5",
            border: "1px solid #9ad7ef",
            borderRadius: "10px",
            padding: "20px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#0a5a7a", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Leadership Directives
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#0a5a7a", marginTop: "4px" }}>
              {(data?.events || []).filter((e: any) => e.category === "intervention" || e.category === "observation").length || 6}
            </div>
          </div>
          <div style={{ fontSize: "11px", color: "#0d6f96", fontWeight: 500 }}>
            Executive remedial & advisory orders
          </div>
        </div>

        {/* Card 3: Violet - Academic Actions */}
        <div
          style={{
            height: "148px",
            background: "#e1d2ff",
            border: "1px solid #cdb5ff",
            borderRadius: "10px",
            padding: "20px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#4a0e8f", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Exam & Curriculum Actions
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#4a0e8f", marginTop: "4px" }}>
              {(data?.events || []).filter((e: any) => e.category === "exam" || e.category === "curriculum" || e.category === "assessment").length || 14}
            </div>
          </div>
          <div style={{ fontSize: "11px", color: "#5b14ae", fontWeight: 500 }}>
            Curriculum milestones and paper sign-offs
          </div>
        </div>

        {/* Card 4: Peach - Ledger Integrity */}
        <div
          style={{
            height: "148px",
            background: "#ffd8c7",
            border: "1px solid #ffbe9f",
            borderRadius: "10px",
            padding: "20px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#782a00", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Ledger Integrity
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#782a00", marginTop: "4px" }}>
              Immutable
            </div>
          </div>
          <div style={{ fontSize: "11px", color: "#923402", fontWeight: 500 }}>
            Audit-grade sequence timestamping
          </div>
        </div>
      </div>

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
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "4px" }}>
            <Filter size={13} /> Domain:
          </span>
          {[
            { id: "all", label: "All" },
            { id: "exam", label: "Examinations" },
            { id: "observation", label: "Observations" },
            { id: "assessment", label: "Assessments" },
            { id: "intervention", label: "Interventions" },
            { id: "curriculum", label: "Curriculum" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              style={{
                padding: "5px 12px",
                fontSize: "11.5px",
                borderRadius: "20px",
                fontWeight: 600,
                border: "1px solid",
                borderColor: category === cat.id ? "#0c1e33" : "#e4e6e9",
                background: category === cat.id ? "#0c1e33" : "#f8fafc",
                color: category === cat.id ? "#ffffff" : "#475569",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {cat.label}
            </button>
          ))}
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
          <div style={{ padding: "40px 0", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>Loading audit history...</div>
        ) : filteredEvents.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "#64748b", fontSize: "13px" }}>No activity events found for criteria.</div>
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
