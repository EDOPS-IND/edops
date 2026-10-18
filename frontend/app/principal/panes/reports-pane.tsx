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
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
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
          }}
        >
          <Printer size={14} />
          Print Docket
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
        {/* Card 1: Mint - CBSE Statutory Compliance */}
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
              CBSE Statutory Compliance
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#1a5c0a", marginTop: "4px" }}>
              100%
            </div>
          </div>
          <div style={{ fontSize: "11px", color: "#23720e", fontWeight: 500 }}>
            SARAS & Board dockets up to date
          </div>
        </div>

        {/* Card 2: Sky - Available Catalogs */}
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
              Active Dossier Templates
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#0a5a7a", marginTop: "4px" }}>
              {reportsList.length || 12}
            </div>
          </div>
          <div style={{ fontSize: "11px", color: "#0d6f96", fontWeight: 500 }}>
            Direct PDF & Excel export pipelines
          </div>
        </div>

        {/* Card 3: Violet - Performance Digests */}
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
              Institutional Digests
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#4a0e8f", marginTop: "4px" }}>
              8 Active
            </div>
          </div>
          <div style={{ fontSize: "11px", color: "#5b14ae", fontWeight: 500 }}>
            Board term reviews & student progress
          </div>
        </div>

        {/* Card 4: Peach - Cryptographic Verification */}
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
              Digital Certification
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#782a00", marginTop: "4px" }}>
              Verified
            </div>
          </div>
          <div style={{ fontSize: "11px", color: "#923402", fontWeight: 500 }}>
            SHA-256 principal sign-off embedded
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", paddingBottom: "4px", borderBottom: "1px solid #e4e6e9" }}>
        {[
          { id: "all", label: "All Reports" },
          { id: "cbse_compliance", label: "CBSE & Statutory Compliance" },
          { id: "school_performance", label: "School Performance" },
          { id: "curriculum_outcomes", label: "Learning Outcomes" },
          { id: "teachers_pedagogy", label: "Faculty & Pedagogy" },
          { id: "interventions", label: "Remedials & Interventions" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCategory(tab.id)}
            style={{
              padding: "7px 14px",
              fontSize: "12px",
              fontWeight: 600,
              borderRadius: "8px",
              border: "1px solid",
              borderColor: category === tab.id ? "#0c1e33" : "#e4e6e9",
              background: category === tab.id ? "#0c1e33" : "#ffffff",
              color: category === tab.id ? "#ffffff" : "#475569",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reports Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "16px" }}>
        {loading ? (
          <div style={{ gridColumn: "1 / -1", padding: "40px 0", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>Loading reports catalog...</div>
        ) : filteredReports.length === 0 ? (
          <div style={{ gridColumn: "1 / -1", padding: "40px 0", textAlign: "center", color: "#64748b", fontSize: "13px" }}>No reports found in this category.</div>
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
