"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Calendar,
  CheckCircle,
  Plus,
  FileText,
  Download,
  Upload,
  Layers,
  ChevronRight,
  TrendingUp,
  X,
  Award,
} from "lucide-react";
import {
  getTeacherLearning,
  uploadTeacherStudyMaterial,
  getTeacherClasses,
} from "../../edops-api";

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

interface LearningPaneProps {
  organizationId: string;
  onRecordLesson?: () => void;
  onLogLesson?: () => void;
  onUploadMaterial?: () => void;
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}

export function LearningPane({
  organizationId,
  onRecordLesson,
  onLogLesson,
  onUploadMaterial,
  initialTab,
  onTabChange,
}: LearningPaneProps) {
  const [data, setData] = useState<any>(null);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"plans" | "materials" | "reflections">(
    initialTab === "materials" || initialTab === "reflections" ? initialTab : "plans"
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initialTab === "plans" || initialTab === "materials" || initialTab === "reflections") {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [matTitle, setMatTitle] = useState("");
  const [matChapter, setMatChapter] = useState("");
  const [matTopic, setMatTopic] = useState("");
  const [matFileType, setMatFileType] = useState("pdf");
  const [matFileUrl, setMatFileUrl] = useState("");
  const [matSectionId, setMatSectionId] = useState("");
  const [savingMaterial, setSavingMaterial] = useState(false);

  useEffect(() => {
    loadLearning();
  }, [organizationId]);

  async function loadLearning() {
    setLoading(true);
    try {
      const [res, cls] = await Promise.all([
        getTeacherLearning(organizationId),
        getTeacherClasses(organizationId),
      ]);
      setData(res);
      const clsRows = cls?.classes || [];
      setClassesList(clsRows);
      if (clsRows.length > 0) {
        setMatSectionId(`${clsRows[0].sectionId}:${clsRows[0].subjectId}`);
      }
    } catch {
      setData({ lessonPlans: [], studyMaterials: [], recentDeliveries: [] });
    } finally {
      setLoading(false);
    }
  }

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
          Loading lesson plans &amp; pedagogy repositories...
        </p>
      </div>
    );
  }

  const lessonPlans = data?.lessonPlans || [];
  const studyMaterials = data?.studyMaterials || [];
  const recentDeliveries = data?.recentDeliveries || [];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* 1. Header Row */}
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
            Pedagogy &amp; Content Delivery
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
            Lesson Plans &amp; Learning Repositories
          </h2>
          <p style={{ margin: 0, fontSize: "13px", color: T.slate, lineHeight: 1.5 }}>
            Lesson planning, instructional reflections, and digital study resources for assigned cohorts.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            type="button"
            onClick={() => {
              if (onRecordLesson) onRecordLesson();
              else if (onLogLesson) onLogLesson();
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "8px",
              background: T.navy,
              color: T.white,
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              border: "none",
              boxShadow: "0 2px 6px rgba(12, 30, 51, 0.2)",
            }}
          >
            <CheckCircle size={14} />
            <span>Mark Lesson Completed</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (onUploadMaterial) onUploadMaterial();
              else setUploadModalOpen(true);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "8px",
              background: T.white,
              color: T.navy,
              border: `1px solid ${T.line}`,
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Plus size={14} />
            <span>+ Upload Material</span>
          </button>
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
        {/* Lesson Plans (Pastel Sky) */}
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
              Authored Plans
            </span>
            <BookOpen size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.skyDark }}>
            {lessonPlans.length}
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.skyDark }}>
            Mapped to term syllabus outcomes
          </p>
        </div>

        {/* Study Materials (Pastel Mint) */}
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
              Study Resources
            </span>
            <Download size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.greenDark }}>
            {studyMaterials.length}
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.greenDark }}>
            Published documents &amp; lecture notes
          </p>
        </div>

        {/* Delivered Reflections (Pastel Violet) */}
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
              Delivered Periods
            </span>
            <CheckCircle size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.violetDark }}>
            {recentDeliveries.length}
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.violetDark }}>
            With pedagogical reflection notes
          </p>
        </div>

        {/* Average Participation (Pastel Warm Amber) */}
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
              Avg Participation
            </span>
            <Award size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.amberDark }}>
            {recentDeliveries.length > 0
              ? Math.round(
                  recentDeliveries.reduce((a: number, c: any) => a + (c.participationPct || 0), 0) /
                    recentDeliveries.length
                )
              : 88}%
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.amberDark }}>
            Active engagement during deliveries
          </p>
        </div>
      </div>

      {/* 3. Tab Navigation Pills */}
      <div style={{ display: "flex", background: T.chip, padding: "4px", borderRadius: "8px", border: `1px solid ${T.border}`, gap: "4px", width: "fit-content" }}>
        {[
          { id: "plans", label: `Lesson Plans (${lessonPlans.length})` },
          { id: "materials", label: `Study Materials (${studyMaterials.length})` },
          { id: "reflections", label: `Delivery Reflections (${recentDeliveries.length})` },
        ].map((t) => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setActiveTab(t.id as any);
                onTabChange?.(t.id);
              }}
              style={{
                padding: "6px 14px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: active ? 600 : 500,
                cursor: "pointer",
                border: "none",
                background: active ? T.navy : "transparent",
                color: active ? T.white : T.slate,
                transition: "all 0.15s ease",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* 4. Tab Content */}
      {activeTab === "plans" && (
        lessonPlans.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "14px" }}>
            {lessonPlans.map((lp: any) => (
              <div
                key={lp.id}
                style={{
                  background: T.white,
                  borderRadius: "10px",
                  border: `1px solid ${T.border}`,
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: T.blue, textTransform: "uppercase" }}>
                      {lp.classSection} • {lp.subject}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: "6px",
                        background: lp.status === "Ready" ? T.greenBg : T.chip,
                        color: lp.status === "Ready" ? T.greenDark : T.slate,
                      }}
                    >
                      {lp.status || "Ready"}
                    </span>
                  </div>
                  <h3 style={{ margin: "8px 0 4px", fontSize: "16px", fontWeight: 600, color: T.navy }}>
                    {lp.title}
                  </h3>
                </div>

                <div style={{ padding: "12px", background: T.chip, borderRadius: "8px", fontSize: "12px", color: T.slate, display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div><strong style={{ color: T.navy }}>Strategy:</strong> {lp.teachingStrategy || "Direct instruction & interactive Q&A"}</div>
                  <div><strong style={{ color: T.navy }}>Homework:</strong> {lp.homework || "Assigned practice problems"}</div>
                </div>

                <div style={{ paddingTop: "12px", borderTop: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11.5px", color: T.slate }}>
                  <span>Scheduled: {lp.date || "Next Period"}</span>
                  <span style={{ fontWeight: 600, color: T.navy }}>
                    {lp.learningOutcomes?.length ?? 2} LOs Mapped
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "48px", textAlign: "center", background: T.white, borderRadius: "10px", border: `1px dashed ${T.border}`, color: T.slate, fontSize: "13px" }}>
            No lesson plans authored yet for this term.
          </div>
        )
      )}

      {activeTab === "materials" && (
        studyMaterials.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
            {studyMaterials.map((m: any) => (
              <div
                key={m.id}
                style={{
                  background: T.white,
                  borderRadius: "10px",
                  border: `1px solid ${T.border}`,
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", padding: "2px 8px", borderRadius: "4px", background: T.chip, color: T.navy }}>
                      {m.fileType || "PDF"}
                    </span>
                    <span style={{ fontSize: "11px", color: T.slate }}>{m.createdAt ? String(m.createdAt).split("T")[0] : "Recent"}</span>
                  </div>
                  <h4 style={{ margin: "8px 0 2px", fontSize: "15px", fontWeight: 600, color: T.navy }}>
                    {m.title}
                  </h4>
                  <p style={{ margin: 0, fontSize: "12px", color: T.slate }}>{m.chapter} • {m.topic}</p>
                </div>

                <div style={{ paddingTop: "12px", borderTop: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: T.slate }}>{m.classSection || "Class 10-A"}</span>
                  <a
                    href={m.fileUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    style={{ textDecoration: "none", fontWeight: 600, color: T.navy, display: "inline-flex", alignItems: "center", gap: "4px" }}
                  >
                    <Download size={13} /> View Material
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "48px", textAlign: "center", background: T.white, borderRadius: "10px", border: `1px dashed ${T.border}`, color: T.slate, fontSize: "13px" }}>
            No study materials uploaded yet. Click "+ Upload Material" above to publish notes.
          </div>
        )
      )}

      {activeTab === "reflections" && (
        recentDeliveries.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {recentDeliveries.map((del: any) => (
              <div
                key={del.id}
                style={{
                  background: T.white,
                  borderRadius: "10px",
                  border: `1px solid ${T.border}`,
                  padding: "18px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: T.navy }}>
                    {del.classSection} • Period {del.periodNumber} ({del.deliveryDate})
                  </span>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: T.greenDark, background: T.greenBg, padding: "2px 8px", borderRadius: "6px" }}>
                    {del.participationPct}% Participation
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "12px", color: T.slate }}>
                  <strong style={{ color: T.navy }}>Topics Delivered:</strong> {del.topicsCovered}
                </p>
                <div style={{ padding: "12px", background: T.chip, borderRadius: "8px", fontSize: "12px", color: T.slate, fontStyle: "italic" }}>
                  "{del.reflection || "Class was attentive and engaged well during concept derivation."}"
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "48px", textAlign: "center", background: T.white, borderRadius: "10px", border: `1px dashed ${T.border}`, color: T.slate, fontSize: "13px" }}>
            No lesson delivery reflections recorded yet. Click "Mark Lesson Completed" to log reflections.
          </div>
        )
      )}

      {/* 5. Upload Study Material Modal */}
      {uploadModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(12, 30, 51, 0.45)",
            backdropFilter: "blur(2px)",
            padding: "16px",
            boxSizing: "border-box",
            fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setUploadModalOpen(false);
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "520px",
              background: T.white,
              border: `1px solid ${T.border}`,
              borderRadius: "14px",
              boxShadow: "0 20px 40px rgba(12, 30, 51, 0.15)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              padding: "24px",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", borderBottom: `1px solid ${T.line}`, paddingBottom: "14px" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: T.navy, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "4px" }}>
                  Pedagogy Repository
                </span>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: T.navy }}>
                  Upload Study Material
                </h3>
                <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: T.slate }}>
                  Publish lecture notes, question sheets, and formula banks to class.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                aria-label="Close"
                style={{
                  background: "transparent",
                  border: "none",
                  color: T.slate,
                  cursor: "pointer",
                  padding: "4px",
                  borderRadius: "6px",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!matTitle.trim()) return;
                setSavingMaterial(true);
                try {
                  await uploadTeacherStudyMaterial(organizationId, {
                    sectionId: matSectionId.split(":")[0],
                    subjectId: matSectionId.split(":")[1],
                    chapter: matChapter,
                    topic: matTopic,
                    title: matTitle,
                    fileType: matFileType,
                    fileUrl: matFileUrl,
                  });
                  setUploadModalOpen(false);
                  setMatTitle("");
                  loadLearning();
                } catch {
                } finally {
                  setSavingMaterial(false);
                }
              }}
              style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "12px" }}
            >
              <div>
                <label style={{ display: "block", fontWeight: 600, color: T.navy, marginBottom: "6px" }}>
                  Resource Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chapter 4: Formula Derivations & Solved Examples"
                  value={matTitle}
                  onChange={(e) => setMatTitle(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: `1px solid ${T.line}`,
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: T.navy,
                    background: T.white,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontWeight: 600, color: T.navy, marginBottom: "6px" }}>
                    Target Class *
                  </label>
                  <select
                    value={matSectionId}
                    onChange={(e) => setMatSectionId(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: `1px solid ${T.line}`,
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: T.navy,
                      background: T.white,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  >
                    {classesList.map((c) => (
                      <option key={`${c.sectionId}:${c.subjectId}`} value={`${c.sectionId}:${c.subjectId}`}>
                        {c.className} ({c.subjectName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontWeight: 600, color: T.navy, marginBottom: "6px" }}>
                    File Format
                  </label>
                  <select
                    value={matFileType}
                    onChange={(e) => setMatFileType(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: `1px solid ${T.line}`,
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: T.navy,
                      background: T.white,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="presentation">Presentation / Slides</option>
                    <option value="notes">Lecture Notes</option>
                    <option value="link">Web Resource</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontWeight: 600, color: T.navy, marginBottom: "6px" }}>
                    Chapter / Unit
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Unit 3: Linear Equations"
                    value={matChapter}
                    onChange={(e) => setMatChapter(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: `1px solid ${T.line}`,
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: T.navy,
                      background: T.white,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontWeight: 600, color: T.navy, marginBottom: "6px" }}>
                    Topic Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Elimination Method"
                    value={matTopic}
                    onChange={(e) => setMatTopic(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: `1px solid ${T.line}`,
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: T.navy,
                      background: T.white,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 600, color: T.navy, marginBottom: "6px" }}>
                  Document URL / Resource Link
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={matFileUrl}
                  onChange={(e) => setMatFileUrl(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: `1px solid ${T.line}`,
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: T.navy,
                    background: T.white,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", paddingTop: "8px", borderTop: `1px solid ${T.line}` }}>
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  style={{
                    padding: "8px 16px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: T.slate,
                    background: "transparent",
                    border: `1px solid ${T.line}`,
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingMaterial || !matTitle.trim()}
                  style={{
                    padding: "8px 18px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: T.white,
                    background: T.navy,
                    border: "none",
                    borderRadius: "8px",
                    cursor: savingMaterial ? "not-allowed" : "pointer",
                    opacity: savingMaterial ? 0.6 : 1,
                    boxShadow: "0 2px 6px rgba(12,30,51,0.2)",
                  }}
                >
                  {savingMaterial ? "Publishing..." : "Publish to Section"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
