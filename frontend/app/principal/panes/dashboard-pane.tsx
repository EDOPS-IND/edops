"use client";

import React from "react";
import {
  Users,
  GraduationCap,
  Layers,
  BookOpen,
  Calendar,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  Award,
  ArrowRight,
  ClipboardList,
  Activity,
  Plus,
} from "lucide-react";
import { PrincipalSchoolKpis, TodayAcademicOperations } from "../types";

export function DashboardPane({
  schoolKpis,
  academicHealth,
  todayOperations,
  academicPerformance,
  teachingExecution,
  examinationStatus,
  recentActivity = [],
  onOpenHealthModal,
  onNavigateTab,
  onTriggerAction,
  organizationId,
}: {
  schoolKpis?: PrincipalSchoolKpis;
  academicHealth?: { score: number; status: string; breakdown: any };
  todayOperations?: TodayAcademicOperations;
  academicPerformance?: any;
  teachingExecution?: any;
  examinationStatus?: any;
  recentActivity?: any[];
  onOpenHealthModal: () => void;
  onNavigateTab?: (tab: string) => void;
  onNavigate?: (tab: string) => void;
  onTriggerAction?: (actionType: string) => void;
  organizationId?: string;
  onOpenTeacherProfile?: (id: string) => void;
  onOpenStudent360?: (id: string) => void;
}) {
  const [liveData, setLiveData] = React.useState<any>(null);

  React.useEffect(() => {
    if (!organizationId) return;
    import("../../edops-api").then(({ getPrincipalDashboard }) => {
      getPrincipalDashboard(organizationId)
        .then((data) => setLiveData(data))
        .catch(() => null);
    });
  }, [organizationId]);

  const kpis = liveData?.schoolKpis || schoolKpis || {
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalSections: 0,
    totalSubjects: 0,
    activeAcademicYear: "2026-27",
  };

  const healthScore = liveData?.academicHealth?.score || academicHealth?.score || 0;
  const healthBreakdown = liveData?.academicHealth?.breakdown || academicHealth?.breakdown;
  const operations = liveData?.todayOperations || todayOperations;
  const performance = liveData?.academicPerformance || academicPerformance;
  const execution = liveData?.teachingExecution || teachingExecution;
  const exams = liveData?.examinationStatus || examinationStatus;
  const activities = (liveData?.recentActivity && liveData.recentActivity.length > 0) ? liveData.recentActivity : recentActivity;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 1. School Academic Header KPI Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: "12px" }}>
        {[
          { label: "Enrolled Students", value: kpis.totalStudents, icon: GraduationCap },
          { label: "Teaching Faculty", value: kpis.totalTeachers, icon: Users },
          { label: "Active Grades", value: kpis.totalClasses, icon: Layers },
          { label: "Class Sections", value: kpis.totalSections, icon: ClipboardList },
          { label: "Academic Subjects", value: kpis.totalSubjects, icon: BookOpen },
          { label: "Academic Session", value: kpis.activeAcademicYear, icon: Calendar },
        ].map((item, idx) => (
          <div
            key={idx}
            style={{
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: "12px",
              padding: "16px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              transition: "border-color 0.15s ease, box-shadow 0.15s ease",
            }}
          >
            <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "#F8FAFC", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", color: "#0F172A", flexShrink: 0 }}>
              <item.icon size={18} />
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{item.label}</div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 2. Top Row: Explainable Academic Health Score & Today's Academic Operations */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Explainable Academic Health Score Card (Clickable per Section 7 & 80) */}
        <div
          onClick={onOpenHealthModal}
          style={{
            background: "#FFFFFF",
            border: "1px solid #BBF7D0",
            borderRadius: "12px",
            padding: "20px 24px",
            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.08)",
            cursor: "pointer",
            transition: "transform 0.15s, box-shadow 0.15s",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 20px rgba(16, 185, 129, 0.15)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.08)";
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#DCFCE7", color: "#15803D", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1E293B" }}>Academic Health Score</h3>
                  <span style={{ fontSize: "11px", color: "#166534", fontWeight: 600 }}>Click for explainable factor breakdown & underlying actions</span>
                </div>
              </div>
              <span style={{ background: "#DCFCE7", color: "#166534", fontSize: "11px", fontWeight: 700, padding: "4px 8px", borderRadius: "6px" }}>
                Live Index
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: "10px", margin: "16px 0 12px" }}>
              <div style={{ fontSize: "44px", fontWeight: 900, color: "#15803D" }}>{healthScore}</div>
              <div style={{ fontSize: "20px", fontWeight: 600, color: "#166534" }}>/ 100</div>
              <span style={{ marginLeft: "auto", fontSize: "12px", color: "#15803D", fontWeight: 700, background: "#F0FDF4", padding: "4px 10px", borderRadius: "100px", border: "1px solid #BBF7D0" }}>
                {healthScore >= 80 ? "Optimal Academic Health" : "Intervention Indicated"}
              </span>
            </div>

            {/* Metric progress bars */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "12px", color: "#475569" }}>
              <div>• Curriculum Execution: <b>{healthBreakdown?.curriculumExecution ?? 0}%</b></div>
              <div>• Assessment Completion: <b>{healthBreakdown?.assessmentCompletion ?? 0}%</b></div>
              <div>• Student Learning Index: <b>{healthBreakdown?.studentPerformance ?? 0}%</b></div>
              <div>• Teacher Activity: <b>{healthBreakdown?.teacherAcademicActivity ?? 0}%</b></div>
              <div>• Campus Attendance: <b>{healthBreakdown?.attendanceRate ?? 0}%</b></div>
              <div>• Intervention On-Track: <b>{healthBreakdown?.interventionCompletion ?? 0}%</b></div>
            </div>
          </div>

          <div style={{ marginTop: "18px", paddingTop: "12px", borderTop: "1px dashed #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#15803D", fontWeight: 600 }}>
            <span>Drill down to classes, teachers & students</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>Open Dossier <ArrowRight size={14} /></span>
          </div>
        </div>

        {/* Today's Academic Snapshot (Section 77) */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1E293B" }}>Today’s Academic Operations</h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748B" }}>Real-time instructional delivery & campus coverage snapshot</p>
            </div>
            <span style={{ background: "#F1F5F9", color: "#475569", padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 600 }}>
              Live Roster
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            {[
              { label: "Classes Active", value: operations?.classesRunning ?? 0, sub: "All sections running", color: "#1E293B" },
              { label: "Faculty Teaching", value: operations?.teachersTeaching ?? 0, sub: "Faculty on active roster", color: "#065F46" },
              { label: "Exams / Tests Today", value: operations?.examsToday ?? 0, sub: "Scheduled today", color: "#B45309" },
              { label: "Scheduled Assessments", value: operations?.assessmentsScheduled ?? 0, sub: "Formative & summative", color: "#2563EB" },
              { label: "Pending Reviews", value: operations?.pendingReviews ?? 0, sub: "Awaiting review", color: "#7C3AED" },
              { label: "Open Alerts", value: operations?.openAlerts ?? 0, sub: "Action items", color: "#0F766E" },
            ].map((stat, idx) => (
              <div key={idx} style={{ background: "#F8FAFC", border: "1px solid #F1F5F9", borderRadius: "8px", padding: "10px 12px" }}>
                <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 600 }}>{stat.label}</div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: stat.color, margin: "2px 0" }}>{stat.value}</div>
                <div style={{ fontSize: "10px", color: "#94A3B8" }}>{stat.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "#B45309", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
              <AlertTriangle size={14} /> Active instructional operations verified
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab ? onNavigateTab("timetable") : (onNavigate ? onNavigate("timetable") : null)}
              style={{ background: "transparent", border: "none", color: "#1D4ED8", fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
            >
              Timetable View <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Core Academic Domains: Performance, Teaching Execution, Examinations */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
        {/* Academic Performance Overview */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#1E293B" }}>School Academic Performance</h4>
            <button onClick={() => onNavigateTab ? onNavigateTab("academics") : (onNavigate ? onNavigate("academics") : null)} style={{ background: "none", border: "none", color: "#2563EB", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>Details</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748B" }}>Overall Average:</span>
              <span style={{ fontWeight: 700, color: "#1E293B" }}>{performance?.overallSchoolAverage ?? 0}%</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748B" }}>Pass Percentage:</span>
              <span style={{ fontWeight: 700, color: "#15803D" }}>{performance?.passPercentage ?? 0}%</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748B" }}>Average Assessment Score:</span>
              <span style={{ fontWeight: 700, color: "#1E293B" }}>{performance?.averageAssessmentScore ?? 0}%</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748B" }}>Learning Outcome Achievement:</span>
              <span style={{ fontWeight: 700, color: "#065F46" }}>{performance?.learningOutcomeAchievement ?? 0}%</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748B" }}>Curriculum Completion:</span>
              <span style={{ fontWeight: 700, color: "#1E293B" }}>{performance?.curriculumCompletion ?? 0}%</span>
            </div>
          </div>
        </div>

        {/* Teaching Execution */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#1E293B" }}>Teaching-Learning Execution</h4>
            <button onClick={() => onNavigateTab ? onNavigateTab("learning") : (onNavigate ? onNavigate("learning") : null)} style={{ background: "none", border: "none", color: "#2563EB", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>Details</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748B" }}>Lesson Plans Completed:</span>
              <span style={{ fontWeight: 700, color: "#15803D" }}>{execution?.lessonPlansCompleted ?? 0}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748B" }}>Lessons Delivered on Time:</span>
              <span style={{ fontWeight: 700, color: "#1E293B" }}>{execution?.lessonsDelivered ?? 0}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748B" }}>Syllabus Completion:</span>
              <span style={{ fontWeight: 700, color: "#065F46" }}>{execution?.syllabusCompletion ?? 0}%</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748B" }}>Pending Lesson Plans:</span>
              <span style={{ fontWeight: 700, color: "#B45309" }}>{execution?.pendingLessonPlans ?? 0} awaiting review</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748B" }}>Pending Evaluations:</span>
              <span style={{ fontWeight: 700, color: (execution?.pendingEvaluations ?? 0) > 0 ? "#DC2626" : "#15803D" }}>{execution?.pendingEvaluations ?? 0} items</span>
            </div>
          </div>
        </div>

        {/* Examination & Board Projections */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#1E293B" }}>Examinations & Results</h4>
            <button onClick={() => onNavigateTab ? onNavigateTab("examinations") : (onNavigate ? onNavigate("examinations") : null)} style={{ background: "none", border: "none", color: "#2563EB", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>Details</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748B" }}>Upcoming Major Exams:</span>
              <span style={{ fontWeight: 700, color: "#1E293B" }}>{exams?.upcomingExams ?? 0} scheduled</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748B" }}>Results Verification Status:</span>
              <span style={{ fontWeight: 700, color: "#065F46" }}>{exams?.resultsPublished ?? 0} Published</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748B" }}>Results Published & Locked:</span>
              <span style={{ fontWeight: 700, color: "#15803D" }}>{exams?.resultsPublished ?? 0} locked</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748B" }}>Pending Principal Approval:</span>
              <span style={{ fontWeight: 700, color: "#B45309" }}>{exams?.resultsPending ?? 0} records</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748B" }}>Papers Evaluated:</span>
              <span style={{ fontWeight: 700, color: "#1E293B" }}>{exams?.papersEvaluated ?? 0} evaluated</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Attention Required & Recent Academic Activity */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "20px" }}>
        {/* Academic Action Triggers */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertTriangle size={18} color="#D97706" />
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1E293B" }}>
                Academic Attention Triggers (Action Engine)
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab ? onNavigateTab("alerts") : (onNavigate ? onNavigate("alerts") : null)}
              style={{ background: "none", border: "none", color: "#2563EB", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
            >
              View All Alerts
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              {
                title: "Active Academic Operations Verified",
                desc: `${kpis.totalClasses} grade sections and ${kpis.totalTeachers} teaching faculty currently configured.`,
                action: "View Faculty",
                actionType: "people",
              },
              {
                title: "Curriculum Tracking Status",
                desc: `${performance?.curriculumCompletion ?? 0}% overall syllabus completion logged in system.`,
                action: "Curriculum View",
                actionType: "academics",
              },
            ].map((alert, idx) => (
              <div
                key={idx}
                style={{
                  border: "1px solid #FEF3C7",
                  background: "#FFFBEB",
                  borderRadius: "8px",
                  padding: "12px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#92400E" }}>{alert.title}</div>
                  <div style={{ fontSize: "12px", color: "#B45309", marginTop: "2px" }}>{alert.desc}</div>
                </div>
                <button
                  type="button"
                  onClick={() => onTriggerAction ? onTriggerAction(alert.actionType) : (onNavigate ? onNavigate(alert.actionType) : null)}
                  style={{
                    background: "#064E3B",
                    color: "#F8E7C9",
                    border: "none",
                    borderRadius: "6px",
                    padding: "6px 12px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    marginLeft: "12px",
                  }}
                >
                  {alert.action}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Academic Activity Log */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1E293B" }}>Recent Academic Activity</h3>
            <button onClick={() => onNavigateTab ? onNavigateTab("activity") : (onNavigate ? onNavigate("activity") : null)} style={{ background: "none", border: "none", color: "#2563EB", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Audit Log</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {activities.length === 0 ? (
              <div style={{ fontSize: "12px", color: "#94A3B8", textAlign: "center", padding: "16px 0" }}>No recent audit events logged.</div>
            ) : (
              activities.map((act: any) => (
                <div key={act.id} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "12px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#065F46", marginTop: "5px", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600, color: "#1E293B" }}>{act.title}</div>
                    <div style={{ color: "#64748B", fontSize: "11px" }}>{act.author} · {act.time}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

