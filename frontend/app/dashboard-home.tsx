"use client";

import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, CalendarDays, ChevronLeft, ChevronRight, ClipboardCheck, Clock3, Sparkles, Trophy } from "lucide-react";
import { api, ListResult } from "./edops-api";

type ClassLink = { sectionId: string; sectionName: string; subjectId: string; subjectName: string };
type Work = { id: string; title: string; description: string; dueAt: string; status: string; maxScore: number; subject: string; classKey: string };
type Destination = "assignments" | "attendance" | "arena" | "progress" | "updates";

export function DashboardHome({ organizationId, role, onNavigate }: { organizationId: string; role: "teacher" | "student"; onNavigate: (tab: Destination, classKey?: string) => void }) {
  const [classes, setClasses] = useState<ClassLink[]>([]);
  const [work, setWork] = useState<Work[]>([]);
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
        const results = await Promise.allSettled(unique.map(async (item) => {
          const page = await api<ListResult<Omit<Work, "subject" | "classKey">>>(`/organizations/${organizationId}/teaching/assignments?sectionId=${item.sectionId}&subjectId=${item.subjectId}&limit=100`);
          return page.items.map((task) => ({ ...task, subject: `${item.subjectName} · ${item.sectionName}`, classKey: `${item.sectionId}:${item.subjectId}` }));
        }));
        if (!active) return;
        setClasses(unique);
        setWork([...new Map(results.flatMap((result) => result.status === "fulfilled" ? result.value : []).map((item) => [item.id, item])).values()]);
        setError(results.some((result) => result.status === "rejected") ? "Some class assignments could not be loaded. Try again to get the full picture." : "");
      } catch (reason) { if (active) setError(reason instanceof Error ? reason.message : "Your dashboard could not be loaded."); }
      finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [organizationId, revision]);
  const published = work.filter((item) => item.status === "published");
  const upcoming = published.filter((item) => new Date(item.dueAt).getTime() >= now).sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt));
  const dayKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const today = dayKey(new Date(now));
  const calendarWork = selectedDay ? published.filter((item) => dayKey(new Date(item.dueAt)) === selectedDay) : upcoming.slice(0, 3);
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const shiftMonth = (offset: number) => { setMonth(new Date(month.getFullYear(), month.getMonth() + offset, 1)); setSelectedDay(null); };
  return <div className="home-layout">
    <div className="home-feed">
      <section className="welcome-tile"><div><span className="section-kicker"><BookOpen size={14} /> Your daily workspace</span><h2>{role === "student" ? "Ready for what’s next." : "Your teaching day, organized."}</h2><p>{role === "student" ? "Keep track of your classwork, revisit your grades, and build your skills." : "Manage classwork, follow student progress, and prepare your next lesson."}</p></div><button onClick={() => onNavigate(role === "student" ? "arena" : "assignments")}>{role === "student" ? "Jump into Arena" : "Open assignments"}<ArrowRight size={16} /></button></section>
      <div className="home-stats"><div><BookOpen /><span>Class subjects<b>{loading ? "—" : classes.length}</b></span></div><div><ClipboardCheck /><span>Published work<b>{loading ? "—" : published.length}</b></span></div><div><Clock3 /><span>Upcoming deadlines<b>{loading ? "—" : upcoming.length}</b></span></div></div>
      {error && <div className="dashboard-error" role="alert"><span>{error}</span><button onClick={() => { setLoading(true); setRevision((value) => value + 1); }}>Try again</button></div>}
      <section className="home-section"><header><span className="section-icon"><Clock3 size={20} /></span><div><h2>On your radar</h2><p>{role === "student" ? "Published assignments with a deadline ahead." : "Keep your class’s next deadlines in view."}</p></div><button onClick={() => onNavigate("assignments")}>View all <ArrowRight size={15} /></button></header>{loading ? <div className="home-loading" role="status">Gathering your class work…</div> : upcoming.length ? <div className="deadline-list">{upcoming.slice(0, 5).map((item) => <button key={item.id} onClick={() => onNavigate("assignments", item.classKey)}><span className="work-icon"><ClipboardCheck size={20} /></span><span><small>{item.subject}</small><b>{item.title}</b></span><span className="deadline-date">{new Date(item.dueAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}<small>{item.maxScore} marks</small></span><ChevronRight size={16} /></button>)}</div> : <div className="friendly-empty"><div className="empty-art"><ClipboardCheck size={42} /><Sparkles size={20} /></div><h3>You’re all caught up.</h3><p>No upcoming assignment deadlines in your available classes.</p><button className="secondary-button" onClick={() => onNavigate(role === "student" ? "arena" : "assignments")}>{role === "student" ? "Try a practice question" : "Prepare your next assignment"}<ArrowRight size={15} /></button></div>}</section>
      <section className="home-section"><header><span className="section-icon"><BookOpen size={20} /></span><div><h2>{role === "student" ? "Your subjects" : "Your teaching spaces"}</h2><p>Assignments and resources, organized by subject.</p></div></header><div className="subject-tiles">{classes.map((item, index) => <article key={`${item.sectionId}:${item.subjectId}`}><span className={`subject-badge tone-${index % 4}`}><BookOpen size={22} /></span><small>{item.sectionName}</small><h3>{item.subjectName}</h3><button onClick={() => onNavigate("assignments", `${item.sectionId}:${item.subjectId}`)}>Class assignments <ArrowRight size={15} /></button></article>)}</div>{!loading && !classes.length && <p className="home-note">Your subjects will appear when your school completes your class allocation.</p>}</section>
    </div>
    <aside className="home-rail"><section className="calendar-panel"><header><div><span className="section-kicker">Plan your day</span><h2>Calendar</h2></div><CalendarDays size={23} /></header><div className="calendar-month"><b>{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</b><div><button aria-label="Previous month" onClick={() => shiftMonth(-1)}><ChevronLeft size={17} /></button><button aria-label="Next month" onClick={() => shiftMonth(1)}><ChevronRight size={17} /></button></div></div><div className="calendar-grid">{["S", "M", "T", "W", "T", "F", "S"].map((day, i) => <small key={i}>{day}</small>)}{Array.from({ length: month.getDay() }, (_, i) => <span key={`blank-${i}`} />)}{Array.from({ length: days }, (_, i) => { const key = dayKey(new Date(month.getFullYear(), month.getMonth(), i + 1)); const hasDeadline = published.some((item) => dayKey(new Date(item.dueAt)) === key); return <button key={key} className={`${today === key ? "today" : ""} ${selectedDay === key ? "selected" : ""} ${hasDeadline ? "has-deadline" : ""}`} aria-label={`${key}${hasDeadline ? ", assignment due" : ""}`} aria-pressed={selectedDay === key} onClick={() => setSelectedDay(selectedDay === key ? null : key)}>{i + 1}</button>; })}</div><div className="calendar-agenda"><h3>{selectedDay ? "Deadlines on this date" : "Coming up next"}</h3>{calendarWork.length ? calendarWork.map((item) => <button key={item.id} onClick={() => onNavigate("assignments", item.classKey)}><span /><div><b>{item.title}</b><small>{new Date(item.dueAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</small></div></button>) : <p>No assignment deadlines {selectedDay ? "on this date" : "ahead"}. Enjoy the space to learn.</p>}<small>Dates reflect assignment deadlines, not a class timetable.</small></div></section><section className="practice-card"><span><Trophy size={24} /></span><h3>{role === "student" ? "Practice at your pace" : "Build your question bank"}</h3><p>{role === "student" ? "Keep your curiosity moving with a question in Arena." : "Build a question bank your students can explore."}</p><button onClick={() => onNavigate("arena")}>Explore Arena <ArrowRight size={16} /></button></section><button className="rail-link" onClick={() => onNavigate("progress")}> {role === "student" ? "See my previous grades" : "Review class progress"}<ArrowRight size={16} /></button></aside>
  </div>;
}
