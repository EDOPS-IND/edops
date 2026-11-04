"use client";

import React from "react";

export function StudentProfileEmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        width: "100%",
        textAlign: "center",
        boxSizing: "border-box",
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: "8px",
      }}
    >
      <img
        src="/bee.png"
        alt=""
        style={{
          width: "92px",
          height: "auto",
          maxHeight: "92px",
          objectFit: "contain",
          marginBottom: "14px",
          opacity: 0.95,
        }}
      />
      <b
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: "14.5px",
          fontWeight: 700,
          color: "#0C1E33",
          marginBottom: "6px",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </b>
      <p
        style={{
          margin: 0,
          fontFamily: "'Poppins', sans-serif",
          fontSize: "12px",
          color: "#64748B",
          maxWidth: "380px",
          lineHeight: 1.55,
        }}
      >
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          style={{
            marginTop: "14px",
            padding: "6px 16px",
            borderRadius: "6px",
            background: "#0C1E33",
            color: "#FFFFFF",
            border: "none",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'Poppins', sans-serif",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#1B3554")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#0C1E33")}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function getStudentTabEmptyMeta(tab: string, studentName: string, admissionNo?: string) {
  switch (tab) {
    case "assignments":
      return {
        title: "No Assignments Found",
        description: `There are currently no homework or assignment submissions on file for ${studentName}.`,
      };
    case "exams":
      return {
        title: "No Scheduled Exams",
        description: `No upcoming or previous examination schedules recorded for ${studentName}.`,
      };
    case "results":
      return {
        title: "No Examination Results",
        description: `Academic evaluations and report cards have not been published for ${studentName} yet.`,
      };
    case "leave":
      return {
        title: "No Leave Requests",
        description: `No formal leave applications or excused absence records submitted for ${studentName}.`,
      };
    case "discipline":
      return {
        title: "No Disciplinary Incidents",
        description: `Student has a clean behavioral track record. No disciplinary infractions or incident logs recorded.`,
      };
    case "documents":
      return {
        title: "No Documents Uploaded",
        description: `No identity documents, medical forms, or statutory certificates attached to ${studentName}'s record.`,
      };
    case "communication":
      return {
        title: "No Communication Logs",
        description: `No direct messages, broadcast notices, or SMS dispatches logged for ${studentName}.`,
      };
    case "activity":
      return {
        title: "No Audit Logs",
        description: `No administrative audit events or profile modification history found for this record.`,
      };
    default:
      return {
        title: `No ${tab.charAt(0).toUpperCase() + tab.slice(1)} Records`,
        description: `No recorded ${tab} entries on file for ${studentName}${admissionNo ? ` (Admission #${admissionNo})` : ""}.`,
      };
  }
}

export function StudentSkeletonRows({ rows = 6 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => {
        const isEven = rIdx % 2 === 0;
        return (
          <div
            key={rIdx}
            style={{
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              padding: "0 8px",
              width: "100%",
              height: "52px",
              minHeight: "52px",
              background: isEven ? "#FFFFFF" : "#F8FAFC",
              borderBottom: "1px solid #E0E5EB",
            }}
          >
            <div style={{ flex: "2.5 1 220px", display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                className="edops-skeleton"
                style={{ width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0 }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "130px" }}>
                <div className="edops-skeleton" style={{ height: "12px", width: "85%" }} />
                <div className="edops-skeleton" style={{ height: "9px", width: "60%" }} />
              </div>
            </div>
            <div style={{ flex: "1.2 1 120px" }}>
              <div className="edops-skeleton" style={{ height: "12px", width: "70px" }} />
            </div>
            <div style={{ flex: "1.3 1 130px" }}>
              <div className="edops-skeleton" style={{ height: "12px", width: "80px" }} />
            </div>
            <div style={{ flex: "1.1 1 110px" }}>
              <div className="edops-skeleton" style={{ height: "18px", width: "60px", borderRadius: "10px" }} />
            </div>
            <div style={{ flex: "1.3 1 130px" }}>
              <div className="edops-skeleton" style={{ height: "18px", width: "70px", borderRadius: "10px" }} />
            </div>
            <div style={{ flex: "0 0 110px", display: "flex", justifyContent: "flex-end" }}>
              <div className="edops-skeleton" style={{ height: "26px", width: "56px", borderRadius: "6px" }} />
            </div>
          </div>
        );
      })}
    </>
  );
}

export function TeacherSkeletonRows({ rows = 6 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => {
        const isEven = rIdx % 2 === 0;
        return (
          <div
            key={rIdx}
            style={{
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              padding: "0 8px",
              width: "100%",
              height: "52px",
              minHeight: "52px",
              background: isEven ? "#FFFFFF" : "#F8FAFC",
              borderBottom: "1px solid #E0E5EB",
            }}
          >
            <div style={{ flex: "2.2 1 200px", display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                className="edops-skeleton"
                style={{ width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0 }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "120px" }}>
                <div className="edops-skeleton" style={{ height: "12px", width: "85%" }} />
                <div className="edops-skeleton" style={{ height: "9px", width: "60%" }} />
              </div>
            </div>
            <div style={{ flex: "1.3 1 120px" }}>
              <div className="edops-skeleton" style={{ height: "12px", width: "75px" }} />
            </div>
            <div style={{ flex: "1.3 1 120px" }}>
              <div className="edops-skeleton" style={{ height: "12px", width: "85px" }} />
            </div>
            <div style={{ flex: "1.3 1 120px" }}>
              <div className="edops-skeleton" style={{ height: "12px", width: "85px" }} />
            </div>
            <div style={{ flex: "1.1 1 100px" }}>
              <div className="edops-skeleton" style={{ height: "20px", width: "65px", borderRadius: "4px" }} />
            </div>
            <div style={{ flex: "1.1 1 100px" }}>
              <div className="edops-skeleton" style={{ height: "20px", width: "60px", borderRadius: "10px" }} />
            </div>
            <div style={{ flex: "0 0 110px", display: "flex", justifyContent: "flex-end" }}>
              <div className="edops-skeleton" style={{ height: "26px", width: "60px", borderRadius: "6px" }} />
            </div>
          </div>
        );
      })}
    </>
  );
}
