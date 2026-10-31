"use client";

import React from "react";
import { X, BookOpen } from "lucide-react";
import { T, LectureItem } from "./types";

interface LectureDetailsDrawerProps {
  lecture: LectureItem | null;
  onClose: () => void;
  onOpenReader: (lecture: LectureItem) => void;
}

export function LectureDetailsDrawer({
  lecture,
  onClose,
  onOpenReader,
}: LectureDetailsDrawerProps) {
  if (!lecture) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(12, 30, 51, 0.55)",
        backdropFilter: "blur(2px)",
        zIndex: 1000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          height: "100%",
          width: "min(580px, 100vw)",
          background: T.white,
          boxShadow: "-12px 0 30px rgba(0,0,0,0.18)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "18px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <span style={{ fontSize: "11px", fontWeight: 700, color: T.blue, textTransform: "uppercase" }}>
              {lecture.classSection} • {lecture.subjectName}
            </span>
            <h3 style={{ margin: "4px 0 0", fontSize: "17px", fontWeight: 700, color: T.navy }}>
              {lecture.topic}
            </h3>
            <span style={{ fontSize: "12px", color: T.slate }}>
              Conducted on {lecture.date}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: T.slate, padding: "4px" }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "18px" }}>
          <div style={{ background: T.chip, padding: "16px", borderRadius: "8px", border: `1px solid ${T.border}` }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: T.slate, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
              Classroom Notes &amp; Highlights
            </span>
            <div style={{ fontSize: "13px", color: T.navy, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {lecture.notes || "No additional lecture notes recorded."}
            </div>
          </div>

          {lecture.homework && (
            <div style={{ background: "#fffbeb", padding: "16px", borderRadius: "8px", border: "1px solid #fef3c7" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#b45309", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                Assigned Homework
              </span>
              <div style={{ fontSize: "13px", color: "#92400e", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {lecture.homework}
              </div>
            </div>
          )}

          {lecture.resources && (
            <div style={{ background: T.skyBg, padding: "16px", borderRadius: "8px", border: `1px solid ${T.line}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: T.skyDark, textTransform: "uppercase" }}>
                  Study Material &amp; Resources
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onOpenReader(lecture);
                    onClose();
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "5px 12px",
                    borderRadius: "6px",
                    background: T.navy,
                    color: "#ffffff",
                    border: "none",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <BookOpen size={12} /> Open Full Page Inside App
                </button>
              </div>
              <div style={{ fontSize: "13px", color: T.skyDark, wordBreak: "break-all" }}>
                {lecture.resources}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "flex-end", background: "#f8fafc", flexShrink: 0 }}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: "8px 18px", borderRadius: "6px", border: `1px solid ${T.border}`, background: T.white, fontSize: "12px", fontWeight: 600, color: T.navy, cursor: "pointer" }}
          >
            Close
          </button>
        </div>
      </aside>
    </div>
  );
}
