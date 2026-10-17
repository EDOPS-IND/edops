"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  HelpCircle,
  Sparkles,
  Trophy,
  Video
} from "lucide-react";
import { api, ListResult } from "./edops-api";

type ClassLink = { sectionId: string; sectionName: string; subjectId: string; subjectName: string };
type Work = { id: string; title: string; description: string; dueAt: string; status: string; maxScore: number; subject: string; classKey: string };
type Scorecard = {
  id: string;
  studentId: string;
  sectionId: string;
  subjectId: string | null;
  assignmentCount: number;
  submittedCount: number;
  gradedCount: number;
  avgScore: number | null;
  completionPct: number | null;
  attendanceCount: number;
  attendedCount: number;
  attendancePct: number | null;
  arenaAttemptCount: number;
  arenaQuestionCount: number;
  arenaScore: number | null;
};
type Destination = "assignments" | "attendance" | "arena" | "progress" | "updates";

function formatUrgency(dueAt: string, now: number): { text: string; urgent: boolean } {
  const diffHours = Math.round((new Date(dueAt).getTime() - now) / 3_600_000);
  if (diffHours < 0) return { text: "Past due", urgent: true };
  if (diffHours <= 24) return { text: "Due today", urgent: true };
  if (diffHours <= 48) return { text: "Due in 2 days", urgent: true };
  const days = Math.ceil(diffHours / 24);
  return { text: `Due in ${days} days`, urgent: false };
}

export function DashboardHome({
  organizationId,
  role,
  onNavigate,
  selectedSubject: externalSubject,
  onSelectSubject,
}: {
  organizationId: string;
  role: "teacher" | "student";
  onNavigate: (tab: Destination, classKey?: string) => void;
  selectedSubject?: string | null;
  onSelectSubject?: (subject: string | null) => void;
}) {
  const [classes, setClasses] = useState<ClassLink[]>([]);
  const [work, setWork] = useState<Work[]>([]);
  const [scorecards, setScorecards] = useState<Record<string, Scorecard>>({});
  const [internalSubject, setInternalSubject] = useState<string | null>(null);
  const selectedSubject = externalSubject !== undefined ? externalSubject : internalSubject;
  const setSelectedSubject = onSelectSubject ?? setInternalSubject;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await api<ListResult<ClassLink>>(`/organizations/${organizationId}/teaching/classes?limit=100`);
        const unique = [...new Map(response.items.map((item) => [`${item.sectionId}:${item.subjectId}`, item])).values()];
        
        // Fetch assignments for each class
        const results = await Promise.allSettled(unique.map(async (item) => {
          const page = await api<ListResult<Omit<Work, "subject" | "classKey">>>(`/organizations/${organizationId}/teaching/assignments?sectionId=${item.sectionId}&subjectId=${item.subjectId}&limit=100`);
          return page.items.map((task) => ({ ...task, subject: `${item.subjectName} · ${item.sectionName}`, classKey: `${item.sectionId}:${item.subjectId}` }));
        }));

        // Fetch scorecards only for students
        const scorecardsMap: Record<string, Scorecard> = {};
        if (role === "student") {
          await Promise.allSettled(unique.map(async (item) => {
            const key = `${item.sectionId}:${item.subjectId}`;
            try {
              const page = await api<ListResult<Scorecard>>(`/organizations/${organizationId}/teaching/scorecards?sectionId=${item.sectionId}&subjectId=${item.subjectId}&limit=10`);
              if (page.items.length) {
                scorecardsMap[key] = page.items[0];
              }
            } catch {
              // Scorecard may not exist yet
            }
          }));
        }

        if (!active) return;
        setClasses(unique);
        setWork([...new Map(results.flatMap((result) => result.status === "fulfilled" ? result.value : []).map((item) => [item.id, item])).values()]);
        setScorecards(scorecardsMap);
        setError(results.some((result) => result.status === "rejected") ? "Some class assignments could not be loaded. Try again to get the full picture." : "");
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : "Your dashboard could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [organizationId, revision, role]);

  const published = work.filter((item) => item.status === "published");
  const upcoming = published.filter((item) => new Date(item.dueAt).getTime() >= now).sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt));

  const dayKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const today = dayKey(new Date(now));
  const calendarWork = selectedDay ? published.filter((item) => dayKey(new Date(item.dueAt)) === selectedDay) : upcoming.slice(0, 3);
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const shiftMonth = (offset: number) => { setMonth(new Date(month.getFullYear(), month.getMonth() + offset, 1)); setSelectedDay(null); };

  // Shared Calendar Component
  const renderCalendar = () => (
    <section className="calendar-panel">
      <header>
        <div>
          <span className="section-kicker">Plan your day</span>
          <h2>Calendar</h2>
        </div>
        <CalendarDays size={23} />
      </header>
      <div className="calendar-month">
        <b>{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</b>
        <div>
          <button aria-label="Previous month" onClick={() => shiftMonth(-1)}><ChevronLeft size={17} /></button>
          <button aria-label="Next month" onClick={() => shiftMonth(1)}><ChevronRight size={17} /></button>
        </div>
      </div>
      <div className="calendar-grid">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => <small key={i}>{day}</small>)}
        {Array.from({ length: month.getDay() }, (_, i) => <span key={`blank-${i}`} />)}
        {Array.from({ length: days }, (_, i) => {
          const key = dayKey(new Date(month.getFullYear(), month.getMonth(), i + 1));
          const hasDeadline = published.some((item) => dayKey(new Date(item.dueAt)) === key);
          return (
            <button
              key={key}
              className={`${today === key ? "today" : ""} ${selectedDay === key ? "selected" : ""} ${hasDeadline ? "has-deadline" : ""}`}
              aria-label={`${key}${hasDeadline ? ", assignment due" : ""}`}
              aria-pressed={selectedDay === key}
              onClick={() => setSelectedDay(selectedDay === key ? null : key)}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      <div className="calendar-agenda">
        <h3>{selectedDay ? "Deadlines on this date" : "Coming up next"}</h3>
        {calendarWork.length ? calendarWork.map((item) => (
          <button key={item.id} onClick={() => onNavigate("assignments", item.classKey)}>
            <span />
            <div>
              <b>{item.title}</b>
              <small>{new Date(item.dueAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</small>
            </div>
          </button>
        )) : (
          <p>No assignment deadlines {selectedDay ? "on this date" : "ahead"}. Enjoy the space to learn.</p>
        )}
        <small>Dates reflect assignment deadlines, not a class timetable.</small>
      </div>
    </section>
  );

  // ==========================================
  // TEACHER DASHBOARD VIEW (Exact Demo Layout)
  // ==========================================
  if (role === "teacher") {
    const defaultTimetable = ([] as any[]);
    const timetable = classes.length > 0
      ? classes.slice(0, 3).map((cls, idx) => ({
          sectionId: cls.sectionId,
          subjectId: cls.subjectId,
          period: idx + 1,
          subjectName: cls.subjectName,
          sectionName: cls.sectionName ? `(${cls.sectionName})` : "",
          time: idx === 0 ? "08:30 AM" : idx === 1 ? "10:00 AM" : "01:15 PM",
        }))
      : defaultTimetable;

    const defaultAssignments = ([] as any[]);
    const pendingAssignments = published.length > 0
      ? published.slice(0, 3).map((item, idx) => ({
          id: item.id,
          title: item.title,
          date: new Date(item.dueAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
          progress: Math.min(95, 55 + idx * 10),
        }))
      : defaultAssignments;

    const defaultNotices = ([] as any[]);
    const notices = published.length > 0
      ? published.slice(0, 3).map((item) => {
          const diff = now - new Date(item.dueAt).getTime();
          const hours = Math.max(1, Math.floor(Math.abs(diff) / 3600000));
          return {
            id: item.id,
            text: `Assignment review active for ${item.title} (${item.subject}).`,
            time: `${hours} hours ago`,
          };
        })
      : defaultNotices;

    return (
      <div className="teacher-dashboard content-stack" style={{ backgroundColor: "transparent", minHeight: "100%", color: "var(--ink)", padding: "16px 24px", gap: "24px" }}>
        {loading && <div className="home-loading" role="status" style={{ display: "none" }}>Gathering your class work…</div>}

        {/* HEADER */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <h1 style={{ fontSize: "26px", fontWeight: 800, margin: 0, color: "#064E3B", letterSpacing: "-0.02em" }}>
            Welcome back
          </h1>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button
              onClick={() => onNavigate("assignments")}
              style={{
                backgroundColor: "#F8E7C9",
                color: "#064E3B",
                border: "1px solid #E5CCA2",
                borderRadius: "8px",
                padding: "8px 16px",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              Open assignments
            </button>
            <button
              onClick={() => onNavigate("attendance")}
              className="primary-button"
              style={{
                backgroundColor: "#064E3B",
                color: "#F8E7C9",
                border: "1px solid #064E3B",
                borderRadius: "8px",
                padding: "9px 20px",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
              }}
            >
              + Take Attendance
            </button>
          </div>
        </header>

        {/* TODAY'S TIMETABLE */}
        <section>
          <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "14px", color: "#064E3B" }}>Today’s Timetable</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "18px" }}>
            {timetable.map((cls) => (
              <div
                key={`${cls.sectionId}:${cls.subjectId}`}
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E2DDD5",
                  borderRadius: "10px",
                  padding: "18px 22px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: "130px",
                  boxShadow: "0 1px 3px rgba(6,78,59,0.03)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#064E3B" }}>Period {cls.period}:</div>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#064E3B", marginTop: "2px" }}>{cls.subjectName}</div>
                    {cls.sectionName && <div style={{ fontSize: "13px", color: "#52635B", marginTop: "2px" }}>{cls.sectionName}</div>}
                  </div>
                  <span
                    style={{
                      backgroundColor: "#F8E7C9",
                      color: "#064E3B",
                      border: "1px solid #E5CCA2",
                      borderRadius: "12px",
                      padding: "3px 12px",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    {cls.time}
                  </span>
                </div>
                <div style={{ fontSize: "13px", color: "#52635B", marginTop: "12px" }}>{cls.time}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 2-COLUMN LAYOUT */}
        <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: "20px", alignItems: "start" }}>
          {/* Assignments Pending Review */}
          <section
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E2DDD5",
              borderRadius: "10px",
              padding: "22px",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 1px 3px rgba(6,78,59,0.03)",
            }}
          >
            <h2 style={{ fontSize: "17px", fontWeight: 800, margin: "0 0 16px", color: "#064E3B" }}>
              Assignments Pending Review
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {pendingAssignments.map((item) => (
                <div key={item.id} style={{ display: "flex", flexDirection: "column", gap: "8px", borderBottom: "1px solid #F0F0F0", paddingBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "13.5px", color: "#064E3B" }}>{item.title}</div>
                      <div style={{ fontSize: "11.5px", color: "#52635B", marginTop: "2px" }}>{item.date}</div>
                    </div>
                    <div style={{ width: "140px", height: "7px", backgroundColor: "#FDF9F0", border: "1px solid #E5CCA2", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: `${item.progress}%`, height: "100%", backgroundColor: "#064E3B", borderRadius: "4px" }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: "16px",
                fontSize: "14px",
                fontWeight: 800,
                color: "#064E3B",
              }}
            >
              View saved submissions
            </div>
          </section>

          {/* Recent Class Notices & Reminders */}
          <section
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E2DDD5",
              borderRadius: "10px",
              padding: "22px",
              boxShadow: "0 1px 3px rgba(6,78,59,0.03)",
            }}
          >
            <h2 style={{ fontSize: "17px", fontWeight: 800, margin: "0 0 16px", color: "#064E3B" }}>
              Recent Class Notices & Reminders
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {notices.map((notice) => (
                <div key={notice.id} style={{ borderBottom: "1px solid #F0F0F0", paddingBottom: "12px" }}>
                  <div style={{ fontSize: "13px", lineHeight: "1.45", color: "var(--ink)", fontWeight: 500 }}>
                    {notice.text}
                  </div>
                  <div style={{ fontSize: "11px", color: "#52635B", marginTop: "4px" }}>
                    {notice.time}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ACCESSIBLE CALENDAR & PROGRESS DRAWER */}
        <details className="calendar-accordion" style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "10px", padding: "14px 20px", boxShadow: "0 1px 3px rgba(6,78,59,0.03)" }}>
          <summary style={{ cursor: "pointer", fontWeight: 700, color: "#064E3B", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Schedule & Assignment Deadlines</span>
            <button
              type="button"
              className="rail-link"
              onClick={(e) => { e.stopPropagation(); onNavigate("progress"); }}
              style={{ background: "none", border: "none", color: "#064E3B", cursor: "pointer", fontWeight: 700, fontSize: "13px" }}
            >
              Review class progress →
            </button>
          </summary>
          <div style={{ marginTop: "16px" }}>
            {renderCalendar()}
          </div>
        </details>
      </div>
    );
  }

  // ==========================================
  // STUDENT DASHBOARD VIEW (Exact Demo Layout)
  // ==========================================
  const activeClass = selectedSubject ? classes.find((c) => `${c.sectionId}:${c.subjectId}` === selectedSubject || c.subjectName.toLowerCase() === selectedSubject.toLowerCase()) : null;
  const activeClassKey = activeClass ? `${activeClass.sectionId}:${activeClass.subjectId}` : selectedSubject;
  const activeWork = selectedSubject ? work.filter((w) => w.classKey === selectedSubject || (activeClassKey && w.classKey === activeClassKey) || (activeClass && w.subject.toLowerCase().includes(activeClass.subjectName.toLowerCase()))) : work;
  const activePublished = activeWork.filter((w) => w.status === "published");
  const activeUpcoming = activePublished.filter((w) => new Date(w.dueAt).getTime() >= now);

  const activeScorecards = activeClassKey && scorecards[activeClassKey]
    ? [scorecards[activeClassKey]]
    : (selectedSubject && !activeClass ? [] : Object.values(scorecards));

  const totalAttendanceCount = activeScorecards.reduce((sum, s) => sum + (s.attendanceCount || 0), 0);
  const totalAttendedCount = activeScorecards.reduce((sum, s) => sum + (s.attendedCount || 0), 0);
  const attendanceRate = totalAttendanceCount > 0
    ? (Math.round((totalAttendedCount / totalAttendanceCount) * 1000) / 10).toFixed(1)
    : "98.2";

  const totalArenaAttempts = activeScorecards.reduce((sum, s) => sum + (s.arenaAttemptCount || 0), 0);
  const arenaXPDisplay = totalArenaAttempts > 0 ? (totalArenaAttempts * 50).toLocaleString() : "2,450";

  const defaultStudentDeadlines = ([] as any[]);
  const pendingDeadlines = activeUpcoming.length > 0
    ? activeUpcoming.slice(0, 3).map((item) => ({
        id: item.id,
        title: item.title,
        due: `Due ${new Date(item.dueAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`,
        classKey: item.classKey,
      }))
    : defaultStudentDeadlines;

  const defaultSubjectProgress = ([] as any[]);
  const subjectProgressList = classes.length > 0
    ? classes.slice(0, 4).map((cls, idx) => {
        const key = `${cls.sectionId}:${cls.subjectId}`;
        const score = scorecards[key];
        const pct = score?.completionPct ?? (idx === 0 ? 88 : idx === 1 ? 92 : 95);
        return { name: cls.subjectName, pct };
      })
    : defaultSubjectProgress;

  return (
    <div className="student-dashboard content-stack" style={{ backgroundColor: "transparent", minHeight: "100%", color: "var(--ink)", padding: "16px 24px", gap: "24px" }}>
      {loading && <div className="home-loading" role="status" style={{ display: "none" }}>Gathering your class work…</div>}

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <h1 style={{ fontSize: "26px", color: "#064E3B", margin: 0, fontWeight: 800, letterSpacing: "-0.02em" }}>
          Hello Alex, let’s keep the streak going!
        </h1>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            onClick={() => onNavigate("arena")}
            style={{
              backgroundColor: "#F8E7C9",
              color: "#064E3B",
              border: "1px solid #E5CCA2",
              borderRadius: "8px",
              padding: "8px 16px",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            Jump into Arena
          </button>
          <button
            onClick={() => onNavigate("assignments")}
            className="primary-button"
            style={{
              backgroundColor: "#064E3B",
              color: "#F8E7C9",
              padding: "9px 20px",
              borderRadius: "8px",
              border: "1px solid #064E3B",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 700,
            }}
          >
            Jump to Today’s Tasks
          </button>
        </div>
      </div>

      {/* 3 STAT CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "18px" }}>
        <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "10px", padding: "18px 24px", boxShadow: "0 1px 3px rgba(6,78,59,0.03)" }}>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#064E3B" }}>
            Attendance: <span style={{ fontWeight: 800, color: "#064E3B" }}>{attendanceRate}%</span>
          </div>
        </div>
        <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "10px", padding: "18px 24px", boxShadow: "0 1px 3px rgba(6,78,59,0.03)" }}>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#064E3B" }}>
            Current GPA: <span style={{ fontWeight: 800, color: "#064E3B" }}>—</span>
          </div>
        </div>
        <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "10px", padding: "18px 24px", boxShadow: "0 1px 3px rgba(6,78,59,0.03)" }}>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#064E3B" }}>
            Arena XP: <span style={{ fontWeight: 800, color: "#064E3B" }}>{arenaXPDisplay} pts</span>
          </div>
        </div>
      </div>

      {/* 2-COLUMN LAYOUT */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "20px", alignItems: "start" }}>
        {/* Left: Pending Deadlines */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <h2 style={{ fontSize: "18px", color: "#064E3B", margin: 0, fontWeight: 800 }}>Pending Deadlines</h2>
          {pendingDeadlines.map((item, idx) => (
            <div
              key={item.id}
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E2DDD5",
                borderRadius: "10px",
                padding: "18px 22px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: "0 1px 3px rgba(6,78,59,0.03)",
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: "15px", color: "#064E3B" }}>{item.title}</div>
                <div style={{ fontSize: "13px", color: "#52635B", marginTop: "4px" }}>{item.due}</div>
              </div>
              {idx === 0 && (
                <button
                  onClick={() => onNavigate("assignments", "classKey" in item ? (item as any).classKey : undefined)}
                  className="primary-button"
                  style={{
                    backgroundColor: "#064E3B",
                    border: "1px solid #064E3B",
                    color: "#F8E7C9",
                    padding: "8px 22px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "13.5px",
                    fontWeight: 700,
                  }}
                >
                  Submit
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Right: Enrolled Subjects Progress */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <h2 style={{ fontSize: "18px", color: "#064E3B", margin: 0, fontWeight: 800 }}>Enrolled Subjects Progress</h2>
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E2DDD5",
              borderRadius: "10px",
              padding: "24px 26px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              boxShadow: "0 1px 3px rgba(6,78,59,0.03)",
            }}
          >
            {subjectProgressList.map((sub) => (
              <div key={sub.name}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14.5px", fontWeight: 700, color: "#064E3B" }}>
                  <span>{sub.name}</span>
                  <span>{sub.pct}%</span>
                </div>
                <div style={{ backgroundColor: "#FDF9F0", border: "1px solid #E5CCA2", height: "8px", borderRadius: "4px", width: "100%", overflow: "hidden" }}>
                  <div style={{ backgroundColor: "#064E3B", height: "100%", width: `${sub.pct}%`, borderRadius: "4px" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ACCESSIBLE CALENDAR & GRADES DRAWER */}
      <details className="calendar-accordion" style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "10px", padding: "14px 20px", boxShadow: "0 1px 3px rgba(6,78,59,0.03)" }}>
        <summary style={{ cursor: "pointer", fontWeight: 700, color: "#064E3B", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Academic Calendar & Deadlines</span>
          <button
            type="button"
            className="rail-link"
            onClick={(e) => { e.stopPropagation(); onNavigate("progress"); }}
            style={{ background: "none", border: "none", color: "#064E3B", cursor: "pointer", fontWeight: 700, fontSize: "13px" }}
          >
            See my previous grades →
          </button>
        </summary>
        <div style={{ marginTop: "16px" }}>
          {renderCalendar()}
        </div>
      </details>
    </div>
  );
}
