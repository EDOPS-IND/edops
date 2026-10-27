"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Bell,
  Plus,
  Search,
  Calendar,
  Users,
  X,
  CheckCircle2,
  AlertTriangle,
  Megaphone,
  Send,
  MessageSquare,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import {
  getCommunicationNotices,
  createCommunicationNotice,
  getTeacherBroadcastSections,
  getAcademicSections,
  getAcademicPrograms,
} from "../edops-api";
import { CommunicationChat } from "./communication-chat";

export type NoticeRecord = {
  id: string;
  title: string;
  message: string;
  targetAudience: string;
  priority: "low" | "normal" | "high" | "urgent";
  sentBy: string;
  senderName: string;
  createdAt: string;
  sectionName?: string;
};

interface NoticeBoardProps {
  organizationId: string;
  role: "school_admin" | "principal" | "teacher" | "student" | "parent";
  isCompact?: boolean;
  onNavigateToFull?: () => void;
  style?: React.CSSProperties;
}

export function NoticeBoard({
  organizationId,
  role,
  isCompact = false,
  onNavigateToFull,
  style,
}: NoticeBoardProps) {
  const [notices, setNotices] = useState<NoticeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedNotice, setSelectedNotice] = useState<NoticeRecord | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeTitle, setComposeTitle] = useState("");
  const [composeMessage, setComposeMessage] = useState("");
  const [composePriority, setComposePriority] = useState<"normal" | "high" | "urgent">("normal");
  const [composeAudience, setComposeAudience] = useState("all");
  const [teacherSections, setTeacherSections] = useState<any[]>([]);
  const [allSections, setAllSections] = useState<any[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const canPost = role === "school_admin" || role === "principal" || role === "teacher";

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const data = await getCommunicationNotices(organizationId);
      setNotices(Array.isArray(data) ? data : []);
    } catch {
      setNotices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchNotices();
    }
  }, [organizationId]);

  const formatClassSection = (s: any): string => {
    const prog = (s.programName || s.className || "").trim();
    const sec = (s.name || s.sectionName || "").trim();
    if (prog && sec) {
      const prefix = /^class|grade/i.test(prog) ? prog : `Class ${prog}`;
      return `${prefix} ${sec}`;
    }
    if (prog) return /^class|grade/i.test(prog) ? prog : `Class ${prog}`;
    if (sec) return /^class|grade/i.test(sec) ? sec : `Class ${sec}`;
    return "Unknown Class";
  };

  // Load sections when compose opens
  useEffect(() => {
    if (!isComposeOpen || !organizationId) return;

    if (role === "teacher") {
      getTeacherBroadcastSections(organizationId)
        .then((secs: any) => {
          setTeacherSections(Array.isArray(secs) ? secs : []);
          if (secs?.length > 0) {
            setComposeAudience(`section:${secs[0].id}`);
          }
        })
        .catch(() => setTeacherSections([]));
    } else if (role === "school_admin" || role === "principal") {
      Promise.all([
        getAcademicSections(organizationId),
        getAcademicPrograms(organizationId),
      ])
        .then(([secs, progs]: [any, any]) => {
          const secList = Array.isArray(secs) ? secs : secs?.items || [];
          const progList = Array.isArray(progs) ? progs : progs?.items || [];
          const progMap = new Map<string, string>();
          progList.forEach((p: any) => {
            if (p.id && p.name) progMap.set(p.id, p.name);
          });
          const mapped = secList.map((s: any) => ({
            ...s,
            programName: s.programName || progMap.get(s.programId || s.program_id) || "",
          }));
          setAllSections(mapped);
        })
        .catch(() => setAllSections([]));
    }
  }, [isComposeOpen, organizationId, role]);

  const handlePostNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTitle.trim() || !composeMessage.trim()) {
      setErrorMsg("Title and Notice content are required.");
      return;
    }
    setErrorMsg("");
    setIsPosting(true);
    try {
      await createCommunicationNotice(organizationId, {
        title: composeTitle.trim(),
        message: composeMessage.trim(),
        targetAudience: composeAudience,
        priority: composePriority,
      });
      setIsComposeOpen(false);
      setComposeTitle("");
      setComposeMessage("");
      setComposePriority("normal");
      await fetchNotices();
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to post notice.");
    } finally {
      setIsPosting(false);
    }
  };

  const filteredNotices = useMemo(() => {
    return notices.filter((n) => {
      const matchSearch =
        search === "" ||
        n.title?.toLowerCase().includes(search.toLowerCase()) ||
        n.message?.toLowerCase().includes(search.toLowerCase()) ||
        n.senderName?.toLowerCase().includes(search.toLowerCase());

      const matchPriority =
        priorityFilter === "all" || n.priority === priorityFilter;

      return matchSearch && matchPriority;
    });
  }, [notices, search, priorityFilter]);

  const audienceLabel = (target: string, sectionName?: string) => {
    if (target === "all") return "🌐 Entire School";
    if (target === "teachers") return "👨‍🏫 Faculty Directives";
    if (target === "parents") return "👨‍👩‍👧 Parents Circular";
    if (target === "students") return "🎓 Students Notice";
    if (target.startsWith("section:")) {
      const sName = (sectionName || "").trim();
      if (!sName) return "🏫 Specific Class";
      return /^class|grade/i.test(sName) ? `🏫 ${sName}` : `🏫 Class ${sName}`;
    }
    return target;
  };

  if (isCompact) {
    return (
      <div
        style={{
          background: "#ffffff",
          borderRadius: "10px",
          border: "1px solid #e4e6e9",
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          ...style,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                background: "#f0fdf4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#166534",
              }}
            >
              <Megaphone size={16} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "14.5px", fontWeight: 700, color: "#0c1e33" }}>
                Official Notice Board
              </h3>
            </div>
          </div>
          {onNavigateToFull && (
            <button
              onClick={onNavigateToFull}
              style={{
                all: "unset",
                fontSize: "12px",
                fontWeight: 600,
                color: "#0369a1",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "2px",
              }}
            >
              View All ({notices.length}) <ChevronRight size={14} />
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ padding: "20px 0", textAlign: "center", color: "#64748b", fontSize: "12.5px" }}>
            Loading notices...
          </div>
        ) : notices.length === 0 ? (
          <div style={{ padding: "20px 0", textAlign: "center", color: "#64748b", fontSize: "12.5px" }}>
            No circulars or notices posted yet.
          </div>
        ) : (
          <div style={{ display: "grid", gap: "10px", flex: 1, alignContent: "start" }}>
            {notices.slice(0, 3).map((n) => (
              <div
                key={n.id}
                onClick={() => setSelectedNotice(n)}
                style={{
                  padding: "12px 14px",
                  borderRadius: "8px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#f8fafc")}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <span
                    style={{
                      fontSize: "10.5px",
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: "4px",
                      background:
                        n.priority === "urgent"
                          ? "#fee2e2"
                          : n.priority === "high"
                          ? "#fef3c7"
                          : "#e2e8f0",
                      color:
                        n.priority === "urgent"
                          ? "#991b1b"
                          : n.priority === "high"
                          ? "#92400e"
                          : "#334155",
                      textTransform: "uppercase",
                    }}
                  >
                    {n.priority}
                  </span>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>
                    {new Date(n.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                  </span>
                </div>
                <div style={{ fontWeight: 600, fontSize: "13px", color: "#0c1e33" }}>{n.title}</div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#475569",
                    marginTop: "3px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {n.message}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* ── Top Bar: Header, Search, Post Notice ─────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
          background: "#ffffff",
          padding: "18px 24px",
          borderRadius: "10px",
          border: "1px solid #e4e6e9",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "#0c1e33",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Megaphone size={18} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#0c1e33" }}>
                Official Notice Board & Circulars
              </h2>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                Official administrative directives, circulars, and class broadcasts
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {canPost && (
            <button
              onClick={() => setIsComposeOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                borderRadius: "8px",
                background: "#0c1e33",
                color: "#ffffff",
                border: "none",
                fontWeight: 600,
                fontSize: "12.5px",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(12, 30, 51, 0.2)",
              }}
            >
              <Plus size={15} />
              Post Notice / Broadcast
            </button>
          )}
        </div>
      </div>

      {/* ── Filter & Search Bar ─────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: "6px", overflowX: "auto" }}>
          {[
            { id: "all", label: "All Notices" },
            { id: "urgent", label: "Urgent" },
            { id: "high", label: "High Priority" },
            { id: "normal", label: "Normal" },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setPriorityFilter(pill.id)}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: priorityFilter === pill.id ? 700 : 500,
                border: "1px solid",
                borderColor: priorityFilter === pill.id ? "#0c1e33" : "#e2e8f0",
                background: priorityFilter === pill.id ? "#0c1e33" : "#ffffff",
                color: priorityFilter === pill.id ? "#ffffff" : "#475569",
                cursor: "pointer",
              }}
            >
              {pill.label}
            </button>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "#ffffff",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            padding: "6px 12px",
            width: "min(280px, 100%)",
          }}
        >
          <Search size={14} color="#64748b" />
          <input
            type="text"
            placeholder="Search circulars..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              border: "none",
              outline: "none",
              width: "100%",
              fontSize: "12.5px",
              color: "#0c1e33",
            }}
          />
        </div>
      </div>

      {/* ── Notices Grid / List ─────────────────────────────────────── */}
      {loading ? (
        <div
          style={{
            background: "#ffffff",
            padding: "40px",
            borderRadius: "10px",
            textAlign: "center",
            color: "#64748b",
            fontSize: "13px",
            border: "1px solid #e4e6e9",
          }}
        >
          Loading official notices...
        </div>
      ) : filteredNotices.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            padding: "48px 24px",
            borderRadius: "10px",
            textAlign: "center",
            border: "1px solid #E0E5EB",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          <img
            src={search || priorityFilter !== "all" ? "/noresult.png" : "/bee.png"}
            alt=""
            style={{
              width: search || priorityFilter !== "all" ? "120px" : "96px",
              height: "auto",
              maxHeight: "100px",
              objectFit: "contain",
              marginBottom: "16px",
              opacity: 0.95,
            }}
          />
          <b style={{ fontSize: "15px", fontWeight: 700, color: "#0C1E33", marginBottom: "6px" }}>
            {search || priorityFilter !== "all" ? "No Matching Notices Found" : "No Circulars or Notices Yet"}
          </b>
          <p style={{ margin: 0, fontSize: "12.5px", color: "#64748B", maxWidth: "440px", lineHeight: 1.55 }}>
            {search || priorityFilter !== "all"
              ? "We couldn't find any circulars matching your search query or priority filters."
              : "Official institution circulars, broadcasts, and announcements will appear here once published."}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "14px" }}>
          {filteredNotices.map((n) => {
            const isUrgent = n.priority === "urgent";
            const isHigh = n.priority === "high";

            return (
              <div
                key={n.id}
                onClick={() => setSelectedNotice(n)}
                style={{
                  background: "#ffffff",
                  borderRadius: "10px",
                  border: isUrgent ? "1px solid #fca5a5" : "1px solid #e4e6e9",
                  borderLeft: isUrgent
                    ? "4px solid #ef4444"
                    : isHigh
                    ? "4px solid #f59e0b"
                    : "4px solid #0c1e33",
                  padding: "18px 22px",
                  cursor: "pointer",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  transition: "transform 0.1s ease, box-shadow 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.07)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "12px",
                    flexWrap: "wrap",
                    marginBottom: "8px",
                  }}
                >
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
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
                      {audienceLabel(n.targetAudience, n.sectionName)}
                    </span>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "10.5px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        background: isUrgent ? "#fee2e2" : isHigh ? "#fef3c7" : "#f1f5f9",
                        color: isUrgent ? "#991b1b" : isHigh ? "#92400e" : "#475569",
                      }}
                    >
                      {n.priority}
                    </span>
                  </div>

                  <span style={{ fontSize: "11.5px", color: "#64748b" }}>
                    {new Date(n.createdAt).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>

                <h3
                  style={{
                    margin: "0 0 6px",
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#0c1e33",
                    lineHeight: 1.4,
                  }}
                >
                  {n.title}
                </h3>

                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    color: "#334155",
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                    maxHeight: "80px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {n.message}
                </p>

                <div
                  style={{
                    marginTop: "12px",
                    paddingTop: "10px",
                    borderTop: "1px solid #f1f5f9",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "11.5px",
                    color: "#64748b",
                  }}
                >
                  <div>
                    Issued by: <b>{n.senderName}</b>
                  </div>
                  <span style={{ color: "#0369a1", fontWeight: 600 }}>
                    Click to read full circular &rarr;
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Detail Drawer / Modal ────────────────────────────────────── */}
      {selectedNotice && (
        <>
          <div
            onClick={() => setSelectedNotice(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.45)",
              backdropFilter: "blur(2px)",
              zIndex: 1100,
            }}
          />
          <aside
            role="dialog"
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              height: "100vh",
              width: "min(500px, 94vw)",
              background: "#ffffff",
              boxShadow: "-12px 0 30px rgba(0, 0, 0, 0.15)",
              zIndex: 1101,
              display: "flex",
              flexDirection: "column",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#f8fafc",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: 700,
                    background: "#0c1e33",
                    color: "#ffffff",
                  }}
                >
                  {audienceLabel(selectedNotice.targetAudience, selectedNotice.sectionName)}
                </span>
                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    background:
                      selectedNotice.priority === "urgent"
                        ? "#fee2e2"
                        : selectedNotice.priority === "high"
                        ? "#fef3c7"
                        : "#e2e8f0",
                    color:
                      selectedNotice.priority === "urgent"
                        ? "#991b1b"
                        : selectedNotice.priority === "high"
                        ? "#92400e"
                        : "#334155",
                  }}
                >
                  {selectedNotice.priority}
                </span>
              </div>

              <button
                onClick={() => setSelectedNotice(null)}
                style={{
                  all: "unset",
                  cursor: "pointer",
                  padding: "6px",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#6b7280",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "grid", gap: "18px" }}>
              <div>
                <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
                  Official Subject
                </span>
                <h2 style={{ margin: "6px 0 0", fontSize: "18px", fontWeight: 700, color: "#0c1e33", lineHeight: 1.4 }}>
                  {selectedNotice.title}
                </h2>
              </div>

              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "14px",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  fontSize: "12px",
                }}
              >
                <div>
                  <div style={{ color: "#64748b" }}>Issued By</div>
                  <div style={{ fontWeight: 600, color: "#0c1e33", marginTop: "2px" }}>
                    {selectedNotice.senderName}
                  </div>
                </div>
                <div>
                  <div style={{ color: "#64748b" }}>Published Date</div>
                  <div style={{ fontWeight: 600, color: "#0c1e33", marginTop: "2px" }}>
                    {new Date(selectedNotice.createdAt).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </div>
                </div>
              </div>

              <div>
                <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
                  Circular Content
                </span>
                <div
                  style={{
                    marginTop: "6px",
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "18px",
                    fontSize: "13.5px",
                    lineHeight: 1.65,
                    color: "#1e293b",
                    whiteSpace: "pre-wrap",
                    minHeight: "180px",
                  }}
                >
                  {selectedNotice.message}
                </div>
              </div>
            </div>

            <div
              style={{
                padding: "16px 24px",
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "flex-end",
                background: "#f8fafc",
              }}
            >
              <button
                onClick={() => setSelectedNotice(null)}
                style={{
                  padding: "8px 18px",
                  background: "#0c1e33",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Close Circular
              </button>
            </div>
          </aside>
        </>
      )}

      {/* ── Compose Broadcast Modal ─────────────────────────────────── */}
      {isComposeOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1200,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "10px",
              padding: "24px",
              maxWidth: "520px",
              width: "100%",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0c1e33" }}>
                Broadcast Official Notice
              </h3>
              <button onClick={() => setIsComposeOpen(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            {errorMsg && (
              <div
                style={{
                  padding: "8px 12px",
                  background: "#fef2f2",
                  border: "1px solid #fca5a5",
                  borderRadius: "6px",
                  color: "#991b1b",
                  fontSize: "12px",
                  marginBottom: "12px",
                }}
              >
                {errorMsg}
              </div>
            )}

            <form onSubmit={handlePostNotice} style={{ display: "grid", gap: "12px", fontSize: "12.5px" }}>
              <div>
                <label style={{ fontWeight: 600, color: "#0c1e33" }}>Notice Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Sports Day Circular / Math Unit Test"
                  value={composeTitle}
                  onChange={(e) => setComposeTitle(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #d1d5db", marginTop: "4px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontWeight: 600, color: "#0c1e33" }}>Target Scope / Audience *</label>
                  {role === "teacher" ? (
                    <select
                      value={composeAudience}
                      onChange={(e) => setComposeAudience(e.target.value)}
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #d1d5db", marginTop: "4px" }}
                    >
                      {teacherSections.map((s) => (
                        <option key={s.id} value={`section:${s.id}`}>
                          {formatClassSection(s)} {s.isClassTeacher ? "(Class Teacher)" : ""}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={composeAudience}
                      onChange={(e) => setComposeAudience(e.target.value)}
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #d1d5db", marginTop: "4px" }}
                    >
                      <option value="all">Entire School (All Users)</option>
                      <option value="teachers">All Faculty & Teachers</option>
                      <option value="parents">All Parents</option>
                      <option value="students">All Students</option>
                      {allSections.map((s) => (
                        <option key={s.id} value={`section:${s.id}`}>
                          Specific Class: {formatClassSection(s)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label style={{ fontWeight: 600, color: "#0c1e33" }}>Priority Level</label>
                  <select
                    value={composePriority}
                    onChange={(e: any) => setComposePriority(e.target.value)}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #d1d5db", marginTop: "4px" }}
                  >
                    <option value="normal">Normal Circular</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent Attention</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontWeight: 600, color: "#0c1e33" }}>Detailed Notice Message *</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Write official notice details..."
                  value={composeMessage}
                  onChange={(e) => setComposeMessage(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #d1d5db", marginTop: "4px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  style={{
                    padding: "8px 14px",
                    background: "#f1f5f9",
                    color: "#334155",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPosting}
                  style={{
                    padding: "8px 18px",
                    background: "#0c1e33",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: 700,
                    cursor: isPosting ? "wait" : "pointer",
                    opacity: isPosting ? 0.7 : 1,
                  }}
                >
                  {isPosting ? "Publishing..." : "Publish Circular"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Reusable Hub component providing Sub-Tabs:
 * [ 📢 Official Notice Board ]  [ 💬 Direct Messages ]
 */
export function UnifiedCommunicationHub({
  organizationId,
  role,
}: {
  organizationId: string;
  role: "school_admin" | "principal" | "teacher" | "student" | "parent";
}) {
  const [activeSubTab, setActiveSubTab] = useState<"notices" | "chat">("notices");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* ── Subtab Switcher ── */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          background: "#ffffff",
          padding: "6px",
          borderRadius: "10px",
          border: "1px solid #e4e6e9",
          width: "fit-content",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveSubTab("notices")}
          style={{
            all: "unset",
            padding: "8px 16px",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: activeSubTab === "notices" ? 700 : 500,
            background: activeSubTab === "notices" ? "#0c1e33" : "transparent",
            color: activeSubTab === "notices" ? "#ffffff" : "#475569",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.15s ease",
          }}
        >
          <Megaphone size={15} />
          <span>Official Notice Board</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("chat")}
          style={{
            all: "unset",
            padding: "8px 16px",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: activeSubTab === "chat" ? 700 : 500,
            background: activeSubTab === "chat" ? "#0c1e33" : "transparent",
            color: activeSubTab === "chat" ? "#ffffff" : "#475569",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.15s ease",
          }}
        >
          <MessageSquare size={15} />
          <span>Direct Messages</span>
        </button>
      </div>

      {/* ── Active Content ── */}
      {activeSubTab === "notices" ? (
        <NoticeBoard organizationId={organizationId} role={role} />
      ) : (
        <CommunicationChat organizationId={organizationId} title="Direct Messages" />
      )}
    </div>
  );
}
