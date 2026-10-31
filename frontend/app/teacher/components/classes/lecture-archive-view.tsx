"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  FileText,
  ExternalLink,
  BookOpen,
  Plus,
} from "lucide-react";
import { T, TeacherClass, LectureItem } from "./types";

interface LectureArchiveViewProps {
  currentClass: TeacherClass;
  lectures: LectureItem[];
  inspectedLectureId: string | null;
  onSelectLecture: (lectureId: string) => void;
  onBack: () => void;
  onOpenLogDrawer: (classSection: string, subjectName: string) => void;
}

export function LectureArchiveView({
  currentClass,
  lectures,
  inspectedLectureId,
  onSelectLecture,
  onBack,
  onOpenLogDrawer,
}: LectureArchiveViewProps) {
  const classLectures = lectures.filter(
    (l) => l.classSection === currentClass.className && l.subjectName === currentClass.subjectName
  );
  const activeLec = classLectures.find((l) => l.id === inspectedLectureId) || classLectures[0];
  const resourceUrl = activeLec?.resources || "";
  const isWebUrl = resourceUrl.startsWith("http://") || resourceUrl.startsWith("https://");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        width: "100%",
      }}
    >
      {/* Top Header Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: T.white,
          border: `1px solid ${T.border}`,
          borderRadius: "8px",
          padding: "12px 20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 14px",
              borderRadius: "6px",
              border: `1px solid ${T.border}`,
              background: T.chip,
              color: T.navy,
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <ArrowLeft size={15} /> Back to Dashboard
          </button>
          <div style={{ borderLeft: `1px solid ${T.border}`, paddingLeft: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: T.blue, textTransform: "uppercase" }}>
                {currentClass.className} • {currentClass.subjectName}
              </span>
              <span style={{ fontSize: "11px", color: T.slate }}>
                • Complete Curriculum Archive ({classLectures.length} Lectures)
              </span>
            </div>
            <h2 style={{ margin: "2px 0 0", fontSize: "16px", fontWeight: 700, color: T.navy }}>
              {activeLec?.topic || `${currentClass.className} Lecture Archive`}
            </h2>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={() => onOpenLogDrawer(currentClass.className, currentClass.subjectName)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "6px",
              background: T.navy,
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            <Plus size={14} /> Log Class Session
          </button>
        </div>
      </div>

      {/* Master-Detail Workspace: Left Master Lecture List + Right Side-by-Side Canvas */}
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "16px", alignItems: "start" }}>
        {/* Master List of Lectures (Left) */}
        <div
          style={{
            background: T.white,
            border: `1px solid ${T.border}`,
            borderRadius: "8px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            maxHeight: "calc(100vh - 180px)",
            overflowY: "auto",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "8px", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: T.navy, textTransform: "uppercase" }}>
              Class Sessions ({classLectures.length})
            </span>
            <span style={{ fontSize: "11px", color: T.slate }}>
              Chronological
            </span>
          </div>

          {classLectures.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", color: T.slate, fontSize: "12px", fontStyle: "italic" }}>
              No lectures logged yet. Click &quot;Log Class Session&quot; to begin.
            </div>
          ) : (
            classLectures.map((lec) => {
              const isActive = activeLec?.id === lec.id;
              return (
                <div
                  key={lec.id}
                  onClick={() => onSelectLecture(lec.id)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: "8px",
                    border: isActive ? `2px solid ${T.navy}` : `1px solid ${T.border}`,
                    background: isActive ? T.chip : T.white,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "12.5px", fontWeight: 700, color: T.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {lec.topic}
                    </span>
                    <ChevronRight size={14} color={isActive ? T.navy : T.slate} />
                  </div>
                  <div style={{ fontSize: "11px", color: T.slate, display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    <span>{lec.date}</span>
                    {lec.periodInfo && (
                      <span style={{ fontSize: "10px", fontWeight: 600, background: T.chip, color: T.navy, padding: "1px 5px", borderRadius: "4px", border: `1px solid ${T.border}` }}>
                        {lec.periodInfo}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                    {lec.homework && (
                      <span style={{ fontSize: "9.5px", fontWeight: 600, padding: "2px 6px", borderRadius: "4px", background: "#fef3c7", color: "#92400e" }}>
                        Homework
                      </span>
                    )}
                    {lec.resources ? (
                      <span style={{ fontSize: "9.5px", fontWeight: 600, padding: "2px 6px", borderRadius: "4px", background: T.skyBg, color: T.skyDark }}>
                        Study Material
                      </span>
                    ) : (
                      <span style={{ fontSize: "9.5px", color: T.slate, background: T.chip, padding: "2px 6px", borderRadius: "4px" }}>
                        Whiteboard only
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Side-by-Side Canvas (Left: Document Embed / Right: Key Notes & Homework) */}
        {activeLec ? (
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "16px", alignItems: "start" }}>
            {/* Left Sub-Column: Study Material & Document View */}
            <div
              style={{
                background: T.white,
                border: `1px solid ${T.border}`,
                borderRadius: "8px",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                minHeight: "620px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{
                  padding: "10px 16px",
                  background: T.chip,
                  borderBottom: `1px solid ${T.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: 600, color: T.navy }}>
                  <FileText size={15} color={T.blue} />
                  <span>Study Material &amp; Document View</span>
                </div>
                {resourceUrl && (
                  <a
                    href={isWebUrl ? resourceUrl : `/${resourceUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: T.blue,
                      textDecoration: "none",
                    }}
                  >
                    <ExternalLink size={12} /> Open in New Tab
                  </a>
                )}
              </div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative" }}>
                {resourceUrl ? (
                  isWebUrl || resourceUrl.endsWith(".pdf") || resourceUrl.includes("/") || resourceUrl.startsWith("data:") ? (
                    <iframe
                      src={isWebUrl ? resourceUrl : `/${resourceUrl}`}
                      title="Lecture Document"
                      style={{
                        width: "100%",
                        height: "100%",
                        minHeight: "580px",
                        border: "none",
                        display: "block",
                        background: "#525659",
                      }}
                    />
                  ) : (
                    <div style={{ padding: "32px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" }}>
                      <FileText size={36} color={T.navy} />
                      <h4 style={{ margin: "12px 0 4px", fontSize: "15px", color: T.navy }}>{resourceUrl}</h4>
                      <span style={{ fontSize: "12px", color: T.slate }}>Document attached for this session.</span>
                    </div>
                  )
                ) : (
                  /* SVG Illustration when no study material is available */
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "48px 24px",
                      textAlign: "center",
                      background: T.pageBg,
                    }}
                  >
                    <div
                      style={{
                        marginBottom: "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg width="220" height="160" viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="70" y="24" width="95" height="18" rx="9" fill="#E2E8F0" />
                        <rect x="35" y="46" width="145" height="34" rx="17" fill="#F1F5F9" />
                        <rect x="30" y="96" width="155" height="38" rx="19" fill="#F1F5F9" />
                        <line x1="48" y1="16" x2="44" y2="24" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
                        <line x1="32" y1="28" x2="42" y2="28" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
                        <line x1="38" y1="40" x2="45" y2="34" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
                        <path
                          d="M72 32H120C125 32 128 35 128 39V54H58C52 54 48 58 48 64V116C48 120 51 123 55 123H115"
                          stroke="#94A3B8"
                          strokeWidth="2"
                          strokeDasharray="4 4"
                          strokeLinecap="round"
                        />
                        <g transform="translate(68, 48)">
                          <rect x="66" y="66" width="14" height="34" rx="4" transform="rotate(-45 66 66)" fill="#94A3B8" />
                          <rect x="65" y="65" width="6" height="10" rx="1" transform="rotate(-45 65 65)" fill="#CBD5E1" />
                          <circle cx="42" cy="42" r="38" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="5" />
                          <circle cx="42" cy="42" r="32" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="2" />
                          <text
                            x="42"
                            y="52"
                            textAnchor="middle"
                            fontSize="32"
                            fontWeight="700"
                            fontFamily="system-ui, -apple-system, sans-serif"
                            fill="#94A3B8"
                          >
                            ?
                          </text>
                        </g>
                      </svg>
                    </div>
                    <h4 style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: 700, color: T.navy }}>
                      No Document Uploaded for this Period
                    </h4>
                    <p style={{ margin: 0, fontSize: "12.5px", color: T.slate, maxWidth: "340px", lineHeight: 1.55 }}>
                      This session was conducted via whiteboard &amp; verbal discussion. Review key formulas and assigned homework on the right.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Sub-Column: Notes & Homework */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div
                style={{
                  background: T.white,
                  border: `1px solid ${T.border}`,
                  borderRadius: "8px",
                  padding: "18px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <span style={{ fontSize: "11px", fontWeight: 700, color: T.slate, textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                  Key Concepts &amp; Classroom Notes
                </span>
                <div style={{ fontSize: "13px", color: T.navy, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {activeLec.notes || "No extra notes recorded for this lecture."}
                </div>
              </div>

              {activeLec.homework && (
                <div
                  style={{
                    background: "#fffbeb",
                    border: "1px solid #fef3c7",
                    borderRadius: "8px",
                    padding: "18px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  }}
                >
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#b45309", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                    Assigned Homework
                  </span>
                  <div style={{ fontSize: "13px", color: "#92400e", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {activeLec.homework}
                  </div>
                </div>
              )}

              <div
                style={{
                  background: T.chip,
                  border: `1px solid ${T.border}`,
                  borderRadius: "8px",
                  padding: "14px 18px",
                  fontSize: "12px",
                  color: T.slate,
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <span style={{ fontSize: "10px", fontWeight: 700, color: T.slate, textTransform: "uppercase" }}>
                  Session Info
                </span>
                <div><strong>Class:</strong> {currentClass.className}</div>
                <div><strong>Subject:</strong> {currentClass.subjectName}</div>
                <div><strong>Date:</strong> {activeLec.date}</div>
                {activeLec.periodInfo && <div><strong>Timetable Period:</strong> {activeLec.periodInfo}</div>}
                <div><strong>Topic:</strong> {activeLec.topic}</div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
