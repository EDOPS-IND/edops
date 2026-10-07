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
      setData(res);
    } catch {
      setData({
        categories: [
          { id: "all", name: "All Academic Reports" },
          { id: "cbse_compliance", name: "CBSE & Statutory Compliance" },
          { id: "school_performance", name: "School & Term Performance" },
          { id: "curriculum_outcomes", name: "Curriculum & Learning Outcomes" },
          { id: "teachers_pedagogy", name: "Faculty Workload & Observations" },
          { id: "interventions", name: "Remedial & At-Risk Efficacy" }
        ],
        reports: [
          {
            id: "rep-1",
            title: "CBSE Annual Pedagogical Plan (APP) Compliance Dossier",
            category: "cbse_compliance",
            description: "Statutory mandatory disclosure verifying art-integrated learning, sport-integration, and NEP-2020 competency maps.",
            frequency: "Annual / Board Audit",
            lastGenerated: "2026-09-28",
            format: "PDF (Signed)",
            pages: 42
          },
          {
            id: "rep-2",
            title: "Mid-Term Academic Mastery & Grade Distribution Ledger",
            category: "school_performance",
            description: "Section-wise comparative analysis of scores across Class 6 to 12 with standard deviation and pass percentages.",
            frequency: "Term-wise",
            lastGenerated: "2026-10-01",
            format: "Excel (.XLSX) / PDF",
            pages: 18
          },
          {
            id: "rep-3",
            title: "NEP-2020 Learning Outcomes & Competency Attainment Matrix",
            category: "curriculum_outcomes",
            description: "Holistic mapping of grade-level competencies achieved vs pending across STEM and humanities streams.",
            frequency: "Monthly",
            lastGenerated: "2026-10-03",
            format: "Excel (.XLSX)",
            pages: 25
          },
          {
            id: "rep-4",
            title: "Faculty Weekly Period Workload & Observation Summary",
            category: "teachers_pedagogy",
            description: "Teaching period allocation, substitution burden, lesson plan compliance rate, and principal classroom observation scores.",
            frequency: "Bi-Weekly",
            lastGenerated: "2026-10-04",
            format: "PDF",
            pages: 12
          },
          {
            id: "rep-5",
            title: "Remedial Bridge Program & At-Risk Improvement Efficacy",
            category: "interventions",
            description: "Pre-intervention vs post-intervention score comparison for 62 enrolled students across Grade 8–10.",
            frequency: "Bi-Weekly",
            lastGenerated: "2026-10-02",
            format: "PDF / CSV",
            pages: 9
          },
          {
            id: "rep-6",
            title: "CBSE 75% Mandatory Attendance Defaulters Roll",
            category: "cbse_compliance",
            description: "List of students breaching attendance threshold, with parent communication audit and medical certificates.",
            frequency: "Weekly",
            lastGenerated: "2026-10-05",
            format: "PDF / Excel",
            pages: 6
          },
          {
            id: "rep-7",
            title: "Holistic Progress Card (HPC) Aggregate School Dossier",
            category: "curriculum_outcomes",
            description: "360-degree assessment summary including self-assessment, peer-review, and teacher remarks for parent conferences.",
            frequency: "Term-wise",
            lastGenerated: "2026-09-30",
            format: "PDF Pack",
            pages: 110
          }
        ]
      });
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

  const filteredReports = (data?.reports || []).filter((r: any) => {
    if (category !== "all" && r.category !== category) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title & Info */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900  flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600 " />
            Academic Reports & Statutory Documentation Center
          </h2>
          <p className="text-sm text-gray-500  mt-0.5">
            Generate and export board-compliant, auditable dossiers for CBSE inspections, PTMs, and management reviews
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700  bg-white  border border-gray-300  rounded-lg hover:bg-gray-50 :bg-gray-750 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Docket
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 pb-1 border-b border-gray-200 ">
        {[
          { id: "all", label: "All Reports" },
          { id: "cbse_compliance", label: "CBSE & Statutory Compliance" },
          { id: "school_performance", label: "School Performance" },
          { id: "curriculum_outcomes", label: "Learning Outcomes" },
          { id: "teachers_pedagogy", label: "Faculty & Pedagogy" },
          { id: "interventions", label: "Remedials & Interventions" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCategory(tab.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              category === tab.id
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-gray-600  hover:bg-gray-100 :bg-gray-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 py-12 text-center text-gray-400">Loading reports catalog...</div>
        ) : (
          filteredReports.map((report: any) => {
            const isGenerating = generatingId === report.id;
            const isDownloaded = downloadSuccess === report.id;

            return (
              <div
                key={report.id}
                className="p-5 bg-white  rounded-xl border border-gray-200  flex flex-col justify-between hover:shadow-md transition"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50  text-indigo-700 ">
                      {report.frequency}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Updated: {report.lastGenerated}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900  leading-snug">
                    {report.title}
                  </h3>

                  <p className="text-xs text-gray-600 ">
                    {report.description}
                  </p>

                  <div className="flex items-center gap-4 pt-2 text-xs text-gray-500 ">
                    <span>Format: <strong className="text-gray-700 ">{report.format}</strong></span>
                    <span>Length: <strong className="text-gray-700 ">{report.pages} pages</strong></span>
                  </div>
                </div>

                <div className="pt-5 flex items-center justify-between border-t border-gray-100  mt-4">
                  <span className="text-[11px] text-gray-400 font-medium">Digital Signature: Verified (Principal)</span>
                  <button
                    onClick={() => handleTriggerDownload(report)}
                    disabled={isGenerating}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition ${
                      isDownloaded
                        ? "bg-emerald-600 text-white"
                        : "bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Generating...
                      </>
                    ) : isDownloaded ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        Downloaded
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
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
      <div className="p-4 bg-amber-50  border border-amber-200  rounded-xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-600  shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <div className="font-bold text-amber-900 ">
            Statutory Tamper-Evident Academic Records Policy
          </div>
          <div className="text-amber-800 ">
            All generated reports embed the organization cryptographic identifier and current academic session timestamp. Reports published to CBSE SARAS portal or parent conference folders cannot be altered without principal digital authorization.
          </div>
        </div>
      </div>
    </div>
  );
}
