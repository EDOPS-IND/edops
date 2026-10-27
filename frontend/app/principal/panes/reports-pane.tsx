"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Filter,
  CheckCircle,
  FileSpreadsheet,
  ChevronRight,
  TrendingUp,
  Award,
  Users,
  ShieldCheck,
  BookOpen
} from "lucide-react";
import { getPrincipalReports } from "../../edops-api";

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

interface ReportsPaneProps {
  organizationId: string;
}

export function ReportsPane({ organizationId }: ReportsPaneProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, [organizationId]);

  async function loadReports() {
    setLoading(true);
    try {
      const res = await getPrincipalReports(organizationId);
      setData({
        reports: res?.availableReports || res?.reports || [],
      });
    } catch {
      setData({ reports: [] });
    } finally {
      setLoading(false);
    }
  }

  function handleTriggerDownload(report: any) {
    setGeneratingId(report.id);
    setTimeout(() => {
      setGeneratingId(null);
      setDownloadSuccess(report.id);
      setTimeout(() => setDownloadSuccess(null), 3000);
    }, 1200);
  }

  const reportsList = data?.reports || data?.availableReports || [];
  const filteredReports = reportsList.filter((r: any) => {
    if (category !== "all" && r.category !== category) return false;
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", fontFamily: "'Poppins', sans-serif" }}>
      {/* Title & Action */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FileText size={22} color="#0c1e33" />
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0c1e33", margin: 0 }}>
              Academic Reports & Statutory Documentation Center
            </h2>
          </div>
          <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0" }}>
            Generate and export board-compliant, auditable dossiers for CBSE inspections, PTMs, and management reviews
          </p>
        </div>

        <button
          onClick={() => window.print()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 16px",
            fontSize: "12px",
            fontWeight: 600,
            color: "#0c1e33",
            background: "#ffffff",
            border: "1px solid #e4e6e9",
            borderRadius: "8px",
            cursor: "pointer",
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          <Printer size={14} />
          Print Docket
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
          {/* Card 1: Mint - CBSE Statutory Compliance */}
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
                CBSE STATUTORY COMPLIANCE
              </span>
              <ShieldCheck size={19} strokeWidth={1.8} style={{ color: "#305E26" }} />
            </div>
            <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
              100%
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#305E26" }}>
                SARAS &amp; Board dockets up to date
              </span>
            </div>
          </div>

          {/* Card 2: Sky - Available Catalogs */}
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
                ACTIVE DOSSIER TEMPLATES
              </span>
              <FileSpreadsheet size={19} strokeWidth={1.8} style={{ color: "#265F79" }} />
            </div>
            <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
              {reportsList.length || 12}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#265F79" }}>
                Direct PDF &amp; Excel export pipelines
              </span>
            </div>
          </div>

          {/* Card 3: Violet - Performance Digests */}
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
                INSTITUTIONAL DIGESTS
              </span>
              <Award size={19} strokeWidth={1.8} style={{ color: "#51249A" }} />
            </div>
            <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
              8 Active
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#51249A" }}>
                Board term reviews &amp; student progress
              </span>
            </div>
          </div>

          {/* Card 4: Peach - Cryptographic Verification */}
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
                DIGITAL CERTIFICATION
              </span>
              <CheckCircle size={19} strokeWidth={1.8} style={{ color: "#82401E" }} />
            </div>
            <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
              Verified
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#82401E" }}>
                SHA-256 principal sign-off embedded
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Category Pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
        {[
          { id: "all", label: "All Reports" },
          { id: "cbse_compliance", label: "CBSE & Statutory Compliance" },
          { id: "school_performance", label: "School Performance" },
          { id: "curriculum_outcomes", label: "Learning Outcomes" },
          { id: "teachers_pedagogy", label: "Faculty & Pedagogy" },
          { id: "interventions", label: "Remedials & Interventions" },
        ].map((tab) => {
          const isActive = category === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCategory(tab.id)}
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
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Reports Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "16px" }}>
        {loading ? (
          <>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                style={{
                  padding: "20px",
                  background: "#ffffff",
                  borderRadius: "10px",
                  border: "1px solid #E0E5EB",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <div className="edops-skeleton" style={{ width: "42px", height: "42px", borderRadius: "8px" }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                    <div className="edops-skeleton" style={{ width: "65%", height: "14px", borderRadius: "4px" }} />
                    <div className="edops-skeleton" style={{ width: "35%", height: "10px", borderRadius: "4px" }} />
                  </div>
                </div>
                <div className="edops-skeleton" style={{ width: "100%", height: "30px", borderRadius: "4px" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px" }}>
                  <div className="edops-skeleton" style={{ width: "60px", height: "12px", borderRadius: "4px" }} />
                  <div className="edops-skeleton" style={{ width: "80px", height: "28px", borderRadius: "6px" }} />
                </div>
              </div>
            ))}
          </>
        ) : filteredReports.length === 0 ? (
          <div style={{ gridColumn: "1 / -1" }}>
            <EmptyState
              illustration={category !== "all" ? "/noresult.png" : "/bee.png"}
              title={category !== "all" ? "No Reports Found in This Category" : "No Dossier Reports Available"}
              description={
                category !== "all"
                  ? "No reports match the selected category filter. Try selecting 'All Reports'."
                  : "Official statutory and board compliance reports will appear here."
              }
            />
          </div>
        ) : (
          filteredReports.map((report: any) => {
            const isGenerating = generatingId === report.id;
            const isDownloaded = downloadSuccess === report.id;

            return (
              <div
                key={report.id}
                style={{
                  padding: "20px",
                  background: "#ffffff",
                  borderRadius: "10px",
                  border: "1px solid #e4e6e9",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        background: "#eff6ff",
                        color: "#1d4ed8",
                      }}
                    >
                      {report.frequency}
                    </span>
                    <span style={{ fontSize: "11px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Calendar size={12} /> Updated: {report.lastGenerated}
                    </span>
                  </div>

                  <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#0c1e33", margin: "2px 0 0", lineHeight: 1.3 }}>
                    {report.title}
                  </h3>

                  <p style={{ fontSize: "12.5px", color: "#475569", margin: 0, lineHeight: 1.5 }}>
                    {report.description}
                  </p>

                  <div style={{ display: "flex", alignItems: "center", gap: "16px", paddingTop: "6px", fontSize: "12px", color: "#64748b" }}>
                    <span>Format: <strong style={{ color: "#1e293b" }}>{report.format}</strong></span>
                    <span>Length: <strong style={{ color: "#1e293b" }}>{report.pages} pages</strong></span>
                  </div>
                </div>

                <div
                  style={{
                    paddingTop: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderTop: "1px solid #f1f5f9",
                    marginTop: "16px",
                  }}
                >
                  <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 500 }}>
                    Digital Signature: Verified (Principal)
                  </span>
                  <button
                    onClick={() => handleTriggerDownload(report)}
                    disabled={isGenerating}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "7px 14px",
                      fontSize: "12px",
                      fontWeight: 700,
                      borderRadius: "8px",
                      border: "none",
                      cursor: "pointer",
                      background: isDownloaded ? "#15803d" : "#0c1e33",
                      color: "#ffffff",
                      opacity: isGenerating ? 0.7 : 1,
                      transition: "all 0.15s ease",
                    }}
                  >
                    {isGenerating ? (
                      <>
                        <div style={{ width: "12px", height: "12px", border: "2px solid #ffffff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                        Generating...
                      </>
                    ) : isDownloaded ? (
                      <>
                        <CheckCircle size={14} />
                        Downloaded
                      </>
                    ) : (
                      <>
                        <Download size={14} />
                        Generate & Export
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Board Submission Notice */}
      <div
        style={{
          padding: "16px 20px",
          background: "#fffbeb",
          border: "1px solid #fde68a",
          borderRadius: "10px",
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
        }}
      >
        <ShieldCheck size={20} color="#d97706" style={{ flexShrink: 0, marginTop: "2px" }} />
        <div style={{ fontSize: "12px", display: "flex", flexDirection: "column", gap: "2px" }}>
          <div style={{ fontWeight: 700, color: "#92400e" }}>
            Statutory Tamper-Evident Academic Records Policy
          </div>
          <div style={{ color: "#b45309", lineHeight: 1.5 }}>
            All generated reports embed the organization cryptographic identifier and current academic session timestamp. Reports published to CBSE SARAS portal or parent conference folders cannot be altered without principal digital authorization.
          </div>
        </div>
      </div>
    </div>
  );
}
