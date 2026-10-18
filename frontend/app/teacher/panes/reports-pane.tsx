'use client';

import React, { useState, useEffect } from 'react';
import { getTeacherReports, getTeacherClasses } from '../../edops-api';
import { Download, Printer, Users, Award, TrendingUp, AlertTriangle } from 'lucide-react';

const T = {
  navy: '#0c1e33',
  slate: '#495d72',
  muted: '#a6abb5',
  faint: '#b3b3b3',
  bg: '#f4f6f7',
  white: '#ffffff',
  border: '#e4e6e9',
  line: '#ced8e5',
  chip: '#f5f6f8',
  blue: '#17a1fa',
  greenBg: '#d9eed1',
  green: '#61a249',
  greenDk: '#1a5c0a',
};

const pastelViolet = { bg: '#e1d2ff', text: '#4a0e8f' };
const pastelMint = { bg: '#ccefbf', text: '#1a5c0a' };
const pastelBlue = { bg: '#d0e6ff', text: '#0a3a7a' };
const pastelPeach = { bg: '#ffd8c7', text: '#782a00' };

interface ReportsPaneProps {
  organizationId: string;
}

export const ReportsPane: React.FC<ReportsPaneProps> = ({ organizationId }) => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [activeTab, setActiveTab] = useState<'loHeatmap' | 'cohortSummary' | 'cbseRegister'>('loHeatmap');

  useEffect(() => {
    loadClasses();
  }, [organizationId]);

  useEffect(() => {
    if (selectedClass) {
      loadReports();
    }
  }, [organizationId, selectedClass]);

  const loadClasses = async () => {
    try {
      const res = await getTeacherClasses(organizationId);
      const cls = res?.classes || [];
      setClassesList(cls);
      if (cls.length > 0) {
        setSelectedClass(cls[0].sectionId);
      } else {
        setSelectedClass('');
        setLoading(false);
      }
    } catch {
      setClassesList([]);
      setSelectedClass('');
      setLoading(false);
    }
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await getTeacherReports(organizationId, selectedClass);
      setReportData(res);
    } catch (err) {
      console.error(err);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    if (format === 'pdf') { window.print(); return; }
    const rows = [['Student', 'Class', 'Subject', 'Average'], ...(reportData?.students || []).map((s: any) => [s.name, s.className, s.subject, s.avg ?? ''])];
    const csv = rows.map(row => row.map((v: any) => '"' + String(v ?? '').replaceAll('"', '""') + '"').join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a'); link.href = url; link.download = 'academic-report.csv'; link.click(); URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div style={{ padding: "64px 0", textAlign: "center", color: T.slate, fontFamily: "'Poppins', sans-serif" }}>
        <div
          style={{
            width: "32px",
            height: "32px",
            border: `3px solid ${T.line}`,
            borderTopColor: T.navy,
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 12px",
          }}
        />
        <p style={{ fontSize: "13px", fontWeight: 600, color: T.slate, margin: 0 }}>
          Generating competency audit &amp; LO heatmaps...
        </p>
      </div>
    );
  }

  const outcomes: any[] = reportData?.outcomes || [];
  const students = reportData?.students || [];

  const strongCount = students.filter((s: any) => s.avg >= 80).length;
  const onTrackCount = students.filter((s: any) => s.avg >= 60 && s.avg < 80).length;
  const needsSupportCount = students.filter((s: any) => s.avg >= 45 && s.avg < 60).length;
  const criticalCount = students.filter((s: any) => s.avg != null && s.avg < 45).length;
  const totalCount = students.length || 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", fontFamily: "'Poppins', sans-serif" }}>
      {/* 1. Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontSize: "10px", fontWeight: 600, color: T.slate, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            COMPETENCY AUDIT &amp; HEATMAPS
          </span>
          <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: T.navy, letterSpacing: "-0.01em" }}>
            Academic Mastery Reports &amp; LO Heatmap
          </h1>
          <p style={{ margin: 0, fontSize: "13px", color: T.slate }}>
            Subject-level competency tracking, learning outcome heatmaps, and printable report registers
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            style={{
              padding: "9px 12px",
              background: "#ffffff",
              border: `1px solid ${T.line}`,
              borderRadius: "6px",
              fontSize: "12.5px",
              fontWeight: 600,
              color: T.navy,
              outline: "none",
              cursor: "pointer",
            }}
          >
            {classesList.length > 0 ? (
              classesList.map((c) => (
                <option key={c.sectionId || c.className} value={c.sectionId || c.className}>
                  {c.className} ({c.subjectName})
                </option>
              ))
            ) : (
              <option value="">No assigned classes</option>
            )}
          </select>
          <button
            onClick={() => handleExport('pdf')}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 14px",
              background: "#ffffff",
              border: `1px solid ${T.border}`,
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              color: T.navy,
              cursor: "pointer",
            }}
          >
            <Printer size={13} />
            <span>PDF Print</span>
          </button>
          <button
            onClick={() => handleExport('excel')}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 14px",
              background: T.navy,
              border: `1px solid ${T.navy}`,
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              color: "#ffffff",
              cursor: "pointer",
            }}
          >
            <Download size={13} />
            <span>Excel Export</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 Pastel Metric Cards (Exact 148px Student Style) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {/* Card 1: Enrolled Cohort */}
        <div
          style={{
            height: '148px',
            background: pastelViolet.bg,
            borderRadius: '10px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: pastelViolet.text }}>Enrolled Cohort</span>
            <Users size={16} color={pastelViolet.text} />
          </div>
          <div>
            <div style={{ fontSize: '36px', fontWeight: 700, color: pastelViolet.text, lineHeight: 1 }}>
              {totalCount}
            </div>
            <div style={{ fontSize: '11px', color: pastelViolet.text, opacity: 0.85, marginTop: '4px' }}>
              Students in selected section
            </div>
          </div>
        </div>

        {/* Card 2: High Mastery */}
        <div
          style={{
            height: '148px',
            background: pastelMint.bg,
            borderRadius: '10px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: pastelMint.text }}>Mastery (≥80%)</span>
            <Award size={16} color={pastelMint.text} />
          </div>
          <div>
            <div style={{ fontSize: '36px', fontWeight: 700, color: pastelMint.text, lineHeight: 1 }}>
              {strongCount}
            </div>
            <div style={{ fontSize: '11px', color: pastelMint.text, opacity: 0.85, marginTop: '4px' }}>
              {totalCount ? Math.round((strongCount / totalCount) * 100) : 0}% of cohort excelling
            </div>
          </div>
        </div>

        {/* Card 3: Proficient */}
        <div
          style={{
            height: '148px',
            background: pastelBlue.bg,
            borderRadius: '10px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: pastelBlue.text }}>On Track (60-79%)</span>
            <TrendingUp size={16} color={pastelBlue.text} />
          </div>
          <div>
            <div style={{ fontSize: '36px', fontWeight: 700, color: pastelBlue.text, lineHeight: 1 }}>
              {onTrackCount}
            </div>
            <div style={{ fontSize: '11px', color: pastelBlue.text, opacity: 0.85, marginTop: '4px' }}>
              {totalCount ? Math.round((onTrackCount / totalCount) * 100) : 0}% meeting benchmarks
            </div>
          </div>
        </div>

        {/* Card 4: Support Required */}
        <div
          style={{
            height: '148px',
            background: pastelPeach.bg,
            borderRadius: '10px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: pastelPeach.text }}>Support / Remedial</span>
            <AlertTriangle size={16} color={pastelPeach.text} />
          </div>
          <div>
            <div style={{ fontSize: '36px', fontWeight: 700, color: pastelPeach.text, lineHeight: 1 }}>
              {needsSupportCount + criticalCount}
            </div>
            <div style={{ fontSize: '11px', color: pastelPeach.text, opacity: 0.85, marginTop: '4px' }}>
              {totalCount ? Math.round(((needsSupportCount + criticalCount) / totalCount) * 100) : 0}% need remedial focus
            </div>
          </div>
        </div>
      </div>

      {/* 3. Tabs */}
      <div style={{ display: "flex", background: T.chip, padding: "4px", borderRadius: "10px", border: `1px solid ${T.border}`, gap: "4px", width: "fit-content" }}>
        {[
          { id: 'loHeatmap', label: 'LO Heatmap' },
          { id: 'cohortSummary', label: 'Cohort Mastery Breakdown' },
          { id: 'cbseRegister', label: 'Official Register' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            style={{
              all: "unset",
              padding: "6px 14px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              background: activeTab === t.id ? T.navy : "transparent",
              color: activeTab === t.id ? "#ffffff" : T.slate,
              transition: "all 0.15s ease",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 4. Heatmap Matrix */}
      {activeTab === 'loHeatmap' && (
        <div style={{ background: "#ffffff", borderRadius: "10px", border: `1px solid ${T.border}`, padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: T.navy }}>
              Learning Outcomes Competency Grid
            </h3>
            <span style={{ fontSize: "11px", color: T.slate }}>
              Score colors: Green (≥80%), Blue (60–79%), Amber (45–59%), Coral (&lt;45%)
            </span>
          </div>

          <div style={{ overflowX: "auto", border: `1px solid ${T.border}`, borderRadius: "8px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: T.chip, borderBottom: `1px solid ${T.border}`, color: T.slate, fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  <th style={{ padding: "10px 14px" }}>Student</th>
                  <th style={{ padding: "10px 14px" }}>Avg</th>
                  {outcomes.map((lo: any, idx: number) => (
                    <th key={idx} style={{ padding: "10px 12px", textAlign: "center", minWidth: "70px" }}>
                      {lo.code || `LO-${idx + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={2 + outcomes.length} style={{ padding: "32px", textAlign: "center", color: T.slate }}>
                      No students found in this section.
                    </td>
                  </tr>
                ) : (
                  students.map((s: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: "10px 14px", fontWeight: 600, color: T.navy }}>
                        {s.name}
                      </td>
                      <td style={{ padding: "10px 14px", fontWeight: 700, color: T.navy }}>
                        {s.avg ?? 0}%
                      </td>
                      {outcomes.map((_: any, lIdx: number) => {
                        const val = s.scores?.[lIdx] ?? 0;
                        const bg = val >= 80 ? T.greenBg : val >= 60 ? "#d0e6ff" : val >= 45 ? "#fde1ac" : "#ffd6d6";
                        const col = val >= 80 ? T.greenDk : val >= 60 ? "#0a3a7a" : val >= 45 ? "#614400" : "#7a1a1a";
                        return (
                          <td key={lIdx} style={{ padding: "6px", textAlign: "center" }}>
                            <span style={{ display: "inline-block", padding: "4px 8px", borderRadius: "4px", background: bg, color: col, fontWeight: 700, fontSize: "11px", minWidth: "32px" }}>
                              {val}%
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cohort Summary */}
      {activeTab === 'cohortSummary' && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
          <div style={{ background: "#ffffff", padding: "20px", borderRadius: "10px", border: `1px solid ${T.border}` }}>
            <span style={{ fontSize: "10px", fontWeight: 600, color: T.greenDk, textTransform: "uppercase", letterSpacing: "0.06em" }}>Mastery (≥80%)</span>
            <div style={{ fontSize: "28px", fontWeight: 700, color: T.greenDk, margin: "6px 0" }}>{strongCount} Students</div>
            <span style={{ fontSize: "11.5px", color: T.slate }}>{totalCount ? Math.round((strongCount / totalCount) * 100) : 0}% of class</span>
          </div>

          <div style={{ background: "#ffffff", padding: "20px", borderRadius: "10px", border: `1px solid ${T.border}` }}>
            <span style={{ fontSize: "10px", fontWeight: 600, color: "#0a3a7a", textTransform: "uppercase", letterSpacing: "0.06em" }}>On Track (60–79%)</span>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "#0a3a7a", margin: "6px 0" }}>{onTrackCount} Students</div>
            <span style={{ fontSize: "11.5px", color: T.slate }}>{totalCount ? Math.round((onTrackCount / totalCount) * 100) : 0}% of class</span>
          </div>

          <div style={{ background: "#ffffff", padding: "20px", borderRadius: "10px", border: `1px solid ${T.border}` }}>
            <span style={{ fontSize: "10px", fontWeight: 600, color: "#614400", textTransform: "uppercase", letterSpacing: "0.06em" }}>Needs Support (45–59%)</span>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "#614400", margin: "6px 0" }}>{needsSupportCount} Students</div>
            <span style={{ fontSize: "11.5px", color: "#614400", fontWeight: 600 }}>{totalCount ? Math.round((needsSupportCount / totalCount) * 100) : 0}% of class</span>
          </div>

          <div style={{ background: "#ffffff", padding: "20px", borderRadius: "10px", border: `1px solid ${T.border}` }}>
            <span style={{ fontSize: "10px", fontWeight: 600, color: "#7a1a1a", textTransform: "uppercase", letterSpacing: "0.06em" }}>Remedial Required (&lt;45%)</span>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "#7a1a1a", margin: "6px 0" }}>{criticalCount} Students</div>
            <span style={{ fontSize: "11.5px", color: "#7a1a1a", fontWeight: 600 }}>{totalCount ? Math.round((criticalCount / totalCount) * 100) : 0}% of class</span>
          </div>
        </div>
      )}

      {/* Official CBSE Register View */}
      {activeTab === 'cbseRegister' && (
        <div style={{ background: "#ffffff", borderRadius: "10px", border: `1px solid ${T.border}`, padding: "24px" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12.5px" }}>
              <thead>
                <tr style={{ background: T.chip, borderBottom: `1px solid ${T.border}`, color: T.slate, fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  <th style={{ padding: "10px 14px" }}>Student</th>
                  <th style={{ padding: "10px 14px" }}>Class</th>
                  <th style={{ padding: "10px 14px" }}>Subject</th>
                  <th style={{ padding: "10px 14px" }}>Average Marks</th>
                  <th style={{ padding: "10px 14px" }}>Grade</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s: any, idx: number) => {
                  const avg = s.avg ?? 0;
                  const grade = avg >= 90 ? 'A1' : avg >= 80 ? 'A2' : avg >= 70 ? 'B1' : avg >= 60 ? 'B2' : avg >= 50 ? 'C1' : avg >= 40 ? 'C2' : 'D';
                  return (
                    <tr key={idx} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: "10px 14px", fontWeight: 600, color: T.navy }}>{s.name}</td>
                      <td style={{ padding: "10px 14px", color: T.slate }}>{s.className}</td>
                      <td style={{ padding: "10px 14px", color: T.navy, fontWeight: 600 }}>{s.subject}</td>
                      <td style={{ padding: "10px 14px", fontWeight: 700, color: T.navy }}>{avg}%</td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ fontWeight: 600, padding: "2px 8px", borderRadius: "4px", background: T.chip, border: `1px solid ${T.border}`, color: T.navy, fontSize: "11px" }}>
                          {grade}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
