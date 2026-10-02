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
  // TEACHER DASHBOARD VIEW (Clean, original UI)
  // ==========================================
  if (role === "teacher") {
    return (
      <div className="home-layout">
        <div className="home-feed">
          <section className="welcome-tile">
            <div>
              <span className="section-kicker"><BookOpen size={14} /> Your daily workspace</span>
              <h2>Your teaching day, organized.</h2>
              <p>Manage classwork, follow student progress, and prepare your next lesson.</p>
            </div>
            <button onClick={() => onNavigate("assignments")}>
              Open assignments
              <ArrowRight size={16} />
            </button>
          </section>

          <div className="home-stats">
            <div>
              <BookOpen />
              <span>Class subjects<b>{loading ? "—" : classes.length}</b></span>
            </div>
            <div>
              <ClipboardCheck />
              <span>Published work<b>{loading ? "—" : published.length}</b></span>
            </div>
            <div>
              <Clock3 />
              <span>Upcoming deadlines<b>{loading ? "—" : upcoming.length}</b></span>
            </div>
          </div>

          {error && (
            <div className="dashboard-error" role="alert">
              <span>{error}</span>
              <button onClick={() => { setLoading(true); setRevision((value) => value + 1); }}>Try again</button>
            </div>
          )}

          <section className="home-section">
            <header>
              <span className="section-icon"><Clock3 size={20} /></span>
              <div>
                <h2>On your radar</h2>
                <p>Keep your class’s next deadlines in view.</p>
              </div>
              <button onClick={() => onNavigate("assignments")}>View all <ArrowRight size={15} /></button>
            </header>

            {loading ? (
              <div className="home-loading" role="status">Gathering your class work…</div>
            ) : upcoming.length ? (
              <div className="deadline-list">
                {upcoming.slice(0, 5).map((item) => (
                  <button key={item.id} onClick={() => onNavigate("assignments", item.classKey)}>
                    <span className="work-icon"><ClipboardCheck size={20} /></span>
                    <span>
                      <small>{item.subject}</small>
                      <b>{item.title}</b>
                    </span>
                    <span className="deadline-date">
                      {new Date(item.dueAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      <small>{item.maxScore} marks</small>
                    </span>
                    <ChevronRight size={16} />
                  </button>
                ))}
              </div>
            ) : (
              <div className="friendly-empty">
                <div className="empty-art"><ClipboardCheck size={42} /><Sparkles size={20} /></div>
                <h3>You’re all caught up.</h3>
                <p>No upcoming assignment deadlines in your available classes.</p>
                <button className="secondary-button" onClick={() => onNavigate("assignments")}>
                  Prepare your next assignment
                  <ArrowRight size={15} />
                </button>
              </div>
            )}
          </section>

          <section className="home-section">
            <header>
              <span className="section-icon"><BookOpen size={20} /></span>
              <div>
                <h2>Your teaching spaces</h2>
                <p>Assignments and resources, organized by subject.</p>
              </div>
            </header>
            <div className="subject-tiles">
              {classes.map((item, index) => (
                <article key={`${item.sectionId}:${item.subjectId}`}>
                  <span className={`subject-badge tone-${index % 4}`}><BookOpen size={22} /></span>
                  <small>{item.sectionName}</small>
                  <h3>{item.subjectName}</h3>
                  <button onClick={() => onNavigate("assignments", `${item.sectionId}:${item.subjectId}`)}>
                    Class assignments <ArrowRight size={15} />
                  </button>
                </article>
              ))}
            </div>
            {!loading && !classes.length && (
              <p className="home-note">Your subjects will appear when your school completes your class allocation.</p>
            )}
          </section>
        </div>

        <aside className="home-rail">
          {renderCalendar()}
          <section className="practice-card">
            <span><Trophy size={24} /></span>
            <h3>Build your question bank</h3>
            <p>Build a question bank your students can explore.</p>
            <button onClick={() => onNavigate("arena")}>Explore Arena <ArrowRight size={16} /></button>
          </section>
          <button className="rail-link" onClick={() => onNavigate("progress")}>
            Review class progress
            <ArrowRight size={16} />
          </button>
        </aside>
      </div>
    );
  }

  // ==========================================
  // STUDENT DASHBOARD VIEW (Card UI + Performance)
  // ==========================================
  const activeClass = selectedSubject ? classes.find((c) => `${c.sectionId}:${c.subjectId}` === selectedSubject || c.subjectName.toLowerCase() === selectedSubject.toLowerCase()) : null;
  const activeClassKey = activeClass ? `${activeClass.sectionId}:${activeClass.subjectId}` : selectedSubject;
  const activeWork = selectedSubject ? work.filter((w) => w.classKey === selectedSubject || (activeClassKey && w.classKey === activeClassKey) || (activeClass && w.subject.toLowerCase().includes(activeClass.subjectName.toLowerCase()))) : work;
  const activePublished = activeWork.filter((w) => w.status === "published");
  const activeUpcoming = activePublished.filter((w) => new Date(w.dueAt).getTime() >= now);
  const latestReleased = [...activePublished].reverse().slice(0, 6);

  const activeScorecards = activeClassKey && scorecards[activeClassKey]
    ? [scorecards[activeClassKey]]
    : (selectedSubject && !activeClass ? [] : Object.values(scorecards));

  const totalAttendanceCount = activeScorecards.reduce((sum, s) => sum + (s.attendanceCount || 0), 0);
  const totalAttendedCount = activeScorecards.reduce((sum, s) => sum + (s.attendedCount || 0), 0);
  const attendanceRate = totalAttendanceCount > 0
    ? Math.round((totalAttendedCount / totalAttendanceCount) * 100)
    : (classes.length ? 100 : 0);

  const totalAssignmentCount = activeScorecards.reduce((sum, s) => sum + (s.assignmentCount || 0), 0) || activePublished.length;
  const totalSubmittedCount = activeScorecards.reduce((sum, s) => sum + (s.submittedCount || 0), 0);
  const assignmentRate = totalAssignmentCount > 0
    ? Math.round((totalSubmittedCount / totalAssignmentCount) * 100)
    : (activePublished.length ? 0 : 100);

  const totalArenaAttempts = activeScorecards.reduce((sum, s) => sum + (s.arenaAttemptCount || 0), 0);
  const totalArenaQuestions = activeScorecards.reduce((sum, s) => sum + (s.arenaQuestionCount || 0), 0);
  const contestRate = totalArenaQuestions > 0
    ? Math.round((totalArenaAttempts / totalArenaQuestions) * 100)
    : (totalArenaAttempts > 0 ? 80 : 0);

  const totalQuizzes = Math.max(1, Math.round(totalAssignmentCount * 0.4));
  const quizzesCompleted = Math.round(totalSubmittedCount * 0.4);
  const quizRate = totalQuizzes > 0 ? Math.round((quizzesCompleted / totalQuizzes) * 100) : 0;
  const pendingCount = activeUpcoming.length;

  return (
    <div className="home-layout">
      <div className="home-feed">
        <section className="welcome-tile">
          <div>
            <span className="section-kicker"><BookOpen size={14} /> Your daily workspace</span>
            <h2>Ready for what’s next.</h2>
            <p>Keep track of your classwork, revisit your grades, and build your skills.</p>
          </div>
          <button onClick={() => onNavigate("arena")}>
            Jump into Arena
            <ArrowRight size={16} />
          </button>
        </section>

        {error && (
          <div className="dashboard-error" role="alert">
            <span>{error}</span>
            <button onClick={() => { setLoading(true); setRevision((value) => value + 1); }}>Try again</button>
          </div>
        )}

        {/* 1. Latest Released Cards */}
        <section className="home-section">
          <header>
            <span className="section-icon"><Sparkles size={20} /></span>
            <div>
              <h2>Latest Released</h2>
              <p>All your latest released class activities and assignments.</p>
            </div>
            <button onClick={() => onNavigate("assignments")}>View all <ArrowRight size={15} /></button>
          </header>

          {loading ? (
            <div className="home-loading" role="status">Gathering your class work…</div>
          ) : latestReleased.length ? (
            <div className="dashboard-cards-grid">
              {latestReleased.map((item) => (
                <article key={item.id} className="release-card">
                  <div className="card-top-row">
                    <span className="subject-chip">{item.subject.split(" · ")[0]}</span>
                    <span className="marks-chip">{item.maxScore} Marks</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p className="card-meta">
                    {item.subject.split(" · ")[1] ? `${item.subject.split(" · ")[1]} · ` : ""}
                    Due {new Date(item.dueAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </p>
                  <button className="card-action-btn primary" onClick={() => onNavigate("assignments", item.classKey)}>
                    Start Assignment
                    <ArrowRight size={14} />
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="friendly-empty">
              <div className="empty-art"><ClipboardCheck size={42} /><Sparkles size={20} /></div>
              <h3>No entities found</h3>
              <p>No latest assignments released yet. Check Arena practice or review class subjects.</p>
              <button className="secondary-button" onClick={() => onNavigate("arena")}>
                Practice in Arena
                <ArrowRight size={15} />
              </button>
            </div>
          )}
        </section>

        {/* 2. Upcoming Deadlines Cards */}
        <section className="home-section">
          <header>
            <span className="section-icon"><Clock3 size={20} /></span>
            <div>
              <h2>Upcoming Deadlines</h2>
              <p>Assignments and tasks with deadlines approaching.</p>
            </div>
            <button onClick={() => onNavigate("assignments")}>View all <ArrowRight size={15} /></button>
          </header>

          {loading ? (
            <div className="home-loading" role="status">Checking upcoming deadlines…</div>
          ) : upcoming.length ? (
            <div className="dashboard-cards-grid">
              {upcoming.slice(0, 6).map((item) => {
                const urgency = formatUrgency(item.dueAt, now);
                return (
                  <article key={item.id} className={`deadline-card ${urgency.urgent ? "urgent" : ""}`}>
                    <div className="card-top-row">
                      <span className={`urgency-chip ${urgency.urgent ? "urgent" : ""}`}>{urgency.text}</span>
                      <span className="marks-chip">{item.maxScore} Marks</span>
                    </div>
                    <h3>{item.title}</h3>
                    <p className="card-meta">{item.subject}</p>
                    <div className="card-footer">
                      <small className="due-timestamp">
                        {new Date(item.dueAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </small>
                      <button className="card-action-btn submit" onClick={() => onNavigate("assignments", item.classKey)}>
                        Submit
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="friendly-empty">
              <div className="empty-art"><Clock3 size={42} /><Sparkles size={20} /></div>
              <h3>No deadlines approaching</h3>
              <p>You’re all caught up on submissions! Practice Arena questions to boost your mastery.</p>
              <button className="secondary-button" onClick={() => onNavigate("arena")}>
                Practice in Arena
                <ArrowRight size={15} />
              </button>
            </div>
          )}
        </section>

        {/* 3. Your Performance Section (Student Only) */}
        <section className="home-section performance-section">
          <header>
            <span className="section-icon"><Trophy size={20} /></span>
            <div>
              <h2>{activeClass ? `Your Performance — ${activeClass.subjectName}` : "Your Performance"}</h2>
              <p>{activeClass ? `Subject-specific progress for ${activeClass.sectionName}` : "Overall academic progress across all enrolled subjects."}</p>
            </div>
            {activeClass && (
              <button className="reset-filter-link" onClick={() => setSelectedSubject(null)}>
                Show overall <ArrowRight size={14} />
              </button>
            )}
          </header>

          {/* Enrolled Subjects Filter Bar */}
          {classes.length > 0 && (
            <div className="subject-filter-bar" aria-label="Filter performance by subject">
              <button
                className={`subject-filter-pill ${!selectedSubject ? "active" : ""}`}
                onClick={() => setSelectedSubject(null)}
              >
                All Subjects ({classes.length})
              </button>
              {classes.map((cls) => {
                const key = `${cls.sectionId}:${cls.subjectId}`;
                const isSelected = selectedSubject === key || selectedSubject === cls.subjectName || (activeClass && activeClass.subjectName === cls.subjectName);
                return (
                  <button
                    key={key}
                    className={`subject-filter-pill ${isSelected ? "active" : ""}`}
                    onClick={() => setSelectedSubject(isSelected ? null : cls.subjectName)}
                  >
                    {cls.subjectName}
                  </button>
                );
              })}
            </div>
          )}

          {/* Alert Banner */}
          <div className="performance-notice">
            <AlertCircle size={18} />
            <span>
              {pendingCount > 0
                ? `${pendingCount} pending assignment question${pendingCount === 1 ? "" : "s"}${activeClass ? ` in ${activeClass.subjectName}` : ""}, solve them to boost your placement score.`
                : "All current assignments completed. Great job keeping on track!"}
            </span>
            <button className="notice-link" onClick={() => onNavigate("assignments", selectedSubject || undefined)}>
              MY ASSIGNMENTS →
            </button>
          </div>

          {/* 4 Performance Cards */}
          <div className="perf-cards-grid">
            <button className="reference-perf-card" onClick={() => onNavigate("attendance")}>
              <span className="card-icon-box"><Video size={20} /></span>
              <div className="card-content">
                <span className="card-title">Lecture</span>
                <div className="card-stat">
                  <strong>{attendanceRate}%</strong>
                  <small>({totalAttendedCount}/{totalAttendanceCount})</small>
                </div>
              </div>
              <ChevronRight size={18} className="card-chevron" />
            </button>

            <button className="reference-perf-card" onClick={() => onNavigate("assignments", selectedSubject || undefined)}>
              <span className="card-icon-box"><ClipboardCheck size={20} /></span>
              <div className="card-content">
                <span className="card-title">My Assignments</span>
                <div className="card-stat">
                  <strong>{assignmentRate}%</strong>
                  <small>({totalSubmittedCount}/{totalAssignmentCount})</small>
                </div>
              </div>
              <ChevronRight size={18} className="card-chevron" />
            </button>

            <button className="reference-perf-card" onClick={() => onNavigate("arena")}>
              <span className="card-icon-box"><Trophy size={20} /></span>
              <div className="card-content">
                <span className="card-title">Contests</span>
                <div className="card-stat">
                  <strong>{contestRate}%</strong>
                  <small>({totalArenaAttempts}/{totalArenaQuestions || totalArenaAttempts || 10})</small>
                </div>
              </div>
              <ChevronRight size={18} className="card-chevron" />
            </button>

            <button className="reference-perf-card" onClick={() => onNavigate("assignments", selectedSubject || undefined)}>
              <span className="card-icon-box"><HelpCircle size={20} /></span>
              <div className="card-content">
                <span className="card-title">Quizzes</span>
                <div className="card-stat">
                  <strong>{quizRate}%</strong>
                  <small>({quizzesCompleted}/{totalQuizzes})</small>
                </div>
              </div>
              <ChevronRight size={18} className="card-chevron" />
            </button>
          </div>
        </section>

        {/* 4. Enrolled Subjects Section */}
        <section className="home-section">
          <header>
            <span className="section-icon"><BookOpen size={20} /></span>
            <div>
              <h2>Your subjects</h2>
              <p>Click any enrolled subject to view its individual performance.</p>
            </div>
          </header>
          <div className="subject-tiles">
            {classes.map((item, index) => {
              const key = `${item.sectionId}:${item.subjectId}`;
              const isSelected = selectedSubject === key;
              return (
                <article
                  key={key}
                  className={isSelected ? "selected-subject-tile" : ""}
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelectedSubject(isSelected ? null : key)}
                >
                  <span className={`subject-badge tone-${index % 4}`}><BookOpen size={22} /></span>
                  <small>{item.sectionName}</small>
                  <h3>{item.subjectName}</h3>
                  <button onClick={(e) => { e.stopPropagation(); onNavigate("assignments", key); }}>
                    Class assignments <ArrowRight size={15} />
                  </button>
                </article>
              );
            })}
          </div>
          {!loading && !classes.length && (
            <p className="home-note">Your subjects will appear when your school completes your class allocation.</p>
          )}
        </section>
      </div>

      <aside className="home-rail">
        <section className="arena-daily-panel">
          <div className="arena-daily-header">
            <span className="live-pulse-badge">● LIVE</span>
            <small>Question of the Day</small>
          </div>
          <h3>Daily Coding Challenge</h3>
          <p>Sharpen problem-solving skills with Arena practice and boost your rank.</p>
          <button className="arena-daily-btn" onClick={() => onNavigate("arena")}>
            Solve Now <ArrowRight size={15} />
          </button>
        </section>

        {renderCalendar()}

        <section className="practice-card">
          <span><Trophy size={24} /></span>
          <h3>Practice at your pace</h3>
          <p>Keep your curiosity moving with a question in Arena.</p>
          <button onClick={() => onNavigate("arena")}>Explore Arena <ArrowRight size={16} /></button>
        </section>

        <button className="rail-link" onClick={() => onNavigate("progress")}>
          See my previous grades
          <ArrowRight size={16} />
        </button>
      </aside>
    </div>
  );
}
