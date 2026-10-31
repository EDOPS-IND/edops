"use client";

import React from "react";
import { ArrowLeft, ExternalLink, FileText } from "lucide-react";
import { T, LectureItem } from "./types";

interface LectureReaderViewProps {
  lecture: LectureItem;
  onBack: () => void;
}

export function LectureReaderView({ lecture, onBack }: LectureReaderViewProps) {
  const resourceUrl = lecture.resources || "";
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
            <ArrowLeft size={15} /> Back to Classes
          </button>
          <div style={{ borderLeft: `1px solid ${T.border}`, paddingLeft: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: T.blue, textTransform: "uppercase" }}>
                {lecture.classSection} • {lecture.subjectName}
              </span>
              <span style={{ fontSize: "11px", color: T.slate }}>
                • {lecture.date}
              </span>
            </div>
            <h2 style={{ margin: "2px 0 0", fontSize: "16px", fontWeight: 700, color: T.navy }}>
              {lecture.topic}
            </h2>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {resourceUrl && (
            <a
              href={isWebUrl ? resourceUrl : `/${resourceUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 14px",
                borderRadius: "6px",
                border: `1px solid ${T.border}`,
                background: T.white,
                color: T.slate,
                fontSize: "12px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <ExternalLink size={13} /> Open in External Window
            </a>
          )}
        </div>
      </div>

      {/* Reader Full Page Workspace */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: "16px",
          alignItems: "start",
        }}
      >
        {/* Main Document Viewer Container */}
        <div
          style={{
            background: T.white,
            border: `1px solid ${T.border}`,
            borderRadius: "8px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            minHeight: "680px",
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
              <span>Document &amp; Notes Reader (Full Page)</span>
            </div>
            <span style={{ fontSize: "11px", color: T.slate }}>
              In-App Reader Mode
            </span>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative" }}>
            {isWebUrl || resourceUrl.endsWith(".pdf") || resourceUrl.includes("/") ? (
              <iframe
                src={isWebUrl ? resourceUrl : `/${resourceUrl}`}
                title="Document Preview"
                style={{
                  width: "100%",
                  height: "100%",
                  minHeight: "640px",
                  border: "none",
                  display: "block",
                  background: "#525659",
                }}
              />
            ) : (
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
                <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: T.white, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                  <FileText size={32} color={T.navy} />
                </div>
                <h4 style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 600, color: T.navy }}>
                  Text Asset Recorded
                </h4>
                <p style={{ margin: 0, fontSize: "12px", color: T.slate, maxWidth: "340px", wordBreak: "break-all" }}>
                  {resourceUrl || "No URL provided"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Side Panel: Notes, Homework & Session Details */}
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
              Classroom Notes &amp; Highlights
            </span>
            <div style={{ fontSize: "13px", color: T.navy, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {lecture.notes || "No extra notes recorded for this lecture."}
            </div>
          </div>

          {lecture.homework && (
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
                {lecture.homework}
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
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "10px", fontWeight: 700, color: T.slate, textTransform: "uppercase" }}>
              Class Session Info
            </span>
            <div><strong>Section:</strong> {lecture.classSection}</div>
            <div><strong>Subject:</strong> {lecture.subjectName}</div>
            <div><strong>Date:</strong> {lecture.date}</div>
            <div><strong>Topic:</strong> {lecture.topic}</div>
            {lecture.resources && (
              <div style={{ wordBreak: "break-all" }}>
                <strong>Attached Asset:</strong> {lecture.resources}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
