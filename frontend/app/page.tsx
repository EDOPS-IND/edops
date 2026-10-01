"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AcademicYear, api, createResource, loadRoleWorkspace, loadSchool, login, logout, Member, Organization, OrganizationSummary, Profile, Program, profile as getProfile, RoleWorkspaceData, SchoolData, updateResource } from "./edops-api";
import { LearningWorkspace, SchoolBilling } from "./learning-workspace";
import { PlatformWorkspace } from "./platform-workspace";
import { DashboardHome } from "./dashboard-home";
import { BarChart3, Bell, BookOpen, CalendarCheck2, CalendarDays, ClipboardCheck, CreditCard, Database, GraduationCap, Home as HomeIcon, LayoutDashboard, LogOut, Network, Settings as SettingsIcon, ShieldCheck, Sparkles, Trophy, UserRound, Users, Video } from "lucide-react";

type Panel = "overview" | "academics" | "people" | "assignments" | "attendance" | "updates" | "recordings" | "arena" | "progress" | "billing" | "settings";
type Action = "year" | "program" | "subject" | "section" | "teacherAssignment" | "enrollment" | "invite" | "school" | null;
type MemberRole = Exclude<OrganizationSummary["role"], "school_admin">;

const roleNames: Record<OrganizationSummary["role"] | "platform", string> = { platform: "Platform administrator", school_admin: "School administrator", teacher: "Teacher", student: "Student", parent: "Parent" };
const rolePanels: Record<MemberRole, { intro: string; panels: { id: string; icon: string; label: string; title: string; copy: string; items: [string, string][] }[] }> = {
  teacher: { intro: "Plan lessons, follow your classes and keep daily teaching work together.", panels: [
    { id: "overview", icon: "⌂", label: "Overview", title: "Teaching overview", copy: "A focused view of your day at school.", items: [["My classes", "Assigned sections and subjects"], ["Assignments", "Coursework shared with students"], ["Attendance", "Daily class attendance"]] },
    { id: "assignments", icon: "✓", label: "Assignments", title: "Assignments", copy: "Create, publish and grade class work.", items: [] },
    { id: "attendance", icon: "◎", label: "Attendance", title: "Attendance", copy: "Take attendance and review class registers.", items: [] },
    { id: "updates", icon: "◇", label: "Updates", title: "Class updates", copy: "Notifications and published class activity.", items: [] },
    { id: "recordings", icon: "▶", label: "Recordings", title: "Recordings", copy: "Upload and publish recorded lessons.", items: [] },
    { id: "arena", icon: "◈", label: "Arena", title: "Arena", copy: "Create objective practice for your classes.", items: [] },
    { id: "progress", icon: "↗", label: "Progress", title: "Class progress", copy: "Review scorecards across your class.", items: [] },
  ] },
  student: { intro: "See your learning, schedule and school progress in one place.", panels: [
    { id: "overview", icon: "⌂", label: "Overview", title: "Student overview", copy: "Your current learning activity at a glance.", items: [["My subjects", "Subjects in your current section"], ["Due work", "Assignments to complete"], ["Attendance", "Your attendance summary"]] },
    { id: "progress", icon: "↗", label: "Previous grades", title: "Previous grades", copy: "Your marks, completion and academic progress.", items: [] },
    { id: "assignments", icon: "✓", label: "Assignments", title: "Assignments", copy: "Open your current work and teacher feedback.", items: [] },
    { id: "attendance", icon: "◎", label: "Attendance", title: "My attendance", copy: "Review finalized attendance records.", items: [] },
    { id: "recordings", icon: "▶", label: "Recordings", title: "Class recordings", copy: "Watch lessons shared by your teachers.", items: [] },
    { id: "arena", icon: "◈", label: "Arena", title: "Practice Arena", copy: "Practice questions and improve your score.", items: [] },
    { id: "updates", icon: "◇", label: "Updates", title: "My updates", copy: "Messages and activity addressed to you.", items: [] },
  ] },
  parent: { intro: "Stay informed about your children’s school life and progress.", panels: [
    { id: "overview", icon: "⌂", label: "Overview", title: "Family overview", copy: "The latest school information for your family.", items: [["Children", "Linked student profiles"], ["Attendance", "Recent attendance updates"], ["Notices", "Messages from school"]] },
    { id: "children", icon: "♙", label: "Children", title: "Children", copy: "Linked student profiles and learning summaries will appear here.", items: [["Learning", "Subjects and coursework"], ["Progress", "Results and teacher feedback"], ["Schedule", "Classes and school dates"]] },
    { id: "attendance", icon: "✓", label: "Attendance", title: "Attendance", copy: "Review attendance details for your linked children.", items: [["Today", "Latest attendance status"], ["History", "Attendance across the term"], ["Absence notes", "Updates shared with school"]] },
    { id: "notices", icon: "◇", label: "Notices", title: "School notices", copy: "Announcements and messages from school will appear here.", items: [["Announcements", "Whole-school updates"], ["Class messages", "Updates from teachers"], ["Reminders", "Dates and actions to remember"]] },
  ] },
};

function formatDate(value: string) { return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(new Date(value)); }
function isMemberWorkspace(item: OrganizationSummary): item is OrganizationSummary & { role: MemberRole } { return item.role !== "school_admin"; }

export default function Home() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [workspace, setWorkspace] = useState("");
  const [school, setSchool] = useState<SchoolData | null>(null);
  const [panel, setPanel] = useState<Panel>("overview");
  const [action, setAction] = useState<Action>(null);
  const [invitation, setInvitation] = useState<{ token: string; email: string; expiresAt: string } | null>(null);
  const [inviteMode, setInviteMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const membership = profile?.organizations.find((item) => item.id === workspace);
  const schoolId = membership?.role === "school_admin" ? membership.id : "";

  function selectInitialWorkspace(current: Profile) {
    return current.organizations.find((item) => item.role === "school_admin" && item.status === "active")?.id
      ?? current.organizations.find((item) => item.status === "active")?.id
      ?? (current.user.isPlatformAdmin ? "platform" : current.organizations[0]?.id ?? "");
  }
  async function refresh(id = schoolId) {
    if (!id) return;
    setSchool(await loadSchool(id));
  }

  useEffect(() => {
    const invite = new URLSearchParams(window.location.search).get("invite");
    if (invite) setInviteMode(true);
    getProfile().then((current) => {
      setProfile(current);
      setWorkspace(selectInitialWorkspace(current));
    }).catch(() => undefined).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!schoolId) { setSchool(null); return; }
    setSchool(null); setLoading(true); setError("");
    refresh(schoolId).catch((reason) => setError(reason.message)).finally(() => setLoading(false));
  }, [schoolId]);

  const setup = useMemo(() => school?.organization ? [
    ["School profile", Boolean(school.organization.name && school.organization.timeZone)],
    ["Current academic year", school.years.items.some((item) => item.isCurrent)],
    ["Programs", school.programs.total > 0],
    ["Subjects", school.subjects.total > 0],
    ["Sections", school.sections.total > 0],
    ["Teachers and students", school.members.total > 0],
  ] as const : [], [school]);
  const completed = setup.filter((item) => item[1]).length;

  function flash(message: string) { setNotice(message); window.setTimeout(() => setNotice(""), 2600); }
  async function mutate(task: () => Promise<unknown>, message: string) {
    setBusy(true); setError("");
    try { await task(); setAction(null); await refresh(); flash(message); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Something went wrong"); }
    finally { setBusy(false); }
  }

  if (loading && !profile) return <LoadingScreen />;
  if (inviteMode) return <InviteScreen signedIn={Boolean(profile)} onDone={() => { setInviteMode(false); window.history.replaceState({}, "", "/"); }} />;
  if (!profile) return <LoginScreen onLogin={(current) => { setProfile(current); setWorkspace(selectInitialWorkspace(current)); }} onInvite={() => setInviteMode(true)} />;
  const signOut = async () => { await logout(); setProfile(null); setSchool(null); setWorkspace(""); };
  const switchWorkspace = (value: string) => { setWorkspace(value); setPanel("overview"); };
  if (workspace === "platform" || !membership) return <PlatformScreen profile={profile} workspace={workspace} onWorkspace={switchWorkspace} onLogout={signOut} />;
  if (isMemberWorkspace(membership)) return <RoleWorkspace key={workspace} profile={profile} membership={membership} workspace={workspace} onWorkspace={switchWorkspace} onLogout={signOut} />;

  const memberCounts = school?.members.items.reduce((counts, member) => ({ ...counts, [member.role]: (counts[member.role] ?? 0) + (member.status === "active" ? 1 : 0) }), {} as Record<string, number>) ?? {};
  const currentYear = school?.years.items.find((item) => item.isCurrent);
  const activeEnrollments = school?.enrollments.items.filter((item) => item.status === "active").length ?? 0;

  return (
    <div className="app-shell">
      <header className="topbar">
        <Brand />
        <div className="api-status"><span /> Connected to EDOPS API</div>
        <div className="top-actions">
          <WorkspaceSelect profile={profile} value={workspace} onChange={switchWorkspace} />
          <ProfileMenu email={profile.user.email} role="School administrator" onLogout={signOut} />
        </div>
      </header>

      <aside className="sidebar" aria-label="School navigation">
        <div className="nav-section"><p className="eyebrow">School workspace</p>{[["overview", "Overview"], ["academics", "Academics"], ["people", "People"], ["assignments", "Assignments"], ["attendance", "Attendance"], ["updates", "Updates"], ["recordings", "Recordings"], ["arena", "Arena"], ["progress", "Progress"], ["billing", "Billing"], ["settings", "Settings"]].map(([key, label]) => <button key={key} className={panel === key ? "nav-item active" : "nav-item"} onClick={() => setPanel(key as Panel)}><span><NavIcon id={key} /></span>{label}</button>)}</div>
        {currentYear && <div className="term-card sidebar-term"><span>{currentYear.name}</span><p>Current academic year</p></div>}
      </aside>

      <main id="content" className="main-content">
        {error && <div className="error-banner" role="alert"><b>Couldn’t complete that request.</b><span>{error}</span><button onClick={() => setError("")}>×</button></div>}
        {loading || !school?.organization ? <DashboardSkeleton /> : <>
          <section className="welcome-row"><div><p className="date-line">{new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long" }).format(new Date())}</p><h1>{panel === "overview" ? school.organization.name : panel[0].toUpperCase() + panel.slice(1)}</h1><p>{panel === "overview" ? "Your live school setup and roster at a glance." : `Manage ${panel} for ${school.organization.name}.`}</p></div>{(["overview", "academics", "people", "settings"] as Panel[]).includes(panel) && <button className="primary-button" onClick={() => setAction(panel === "people" ? "invite" : panel === "settings" ? "school" : "section")}><span>＋</span>{panel === "people" ? "Invite person" : panel === "settings" ? "Edit school" : "Create section"}</button>}</section>

          {panel === "overview" && <Overview school={school} setup={setup} completed={completed} teachers={memberCounts.teacher ?? 0} students={memberCounts.student ?? 0} activeEnrollments={activeEnrollments} onAction={setAction} />}
          {panel === "academics" && <Academics school={school} onAction={setAction} />}
          {panel === "people" && <People members={school.members.items} onInvite={() => setAction("invite")} onStatus={(member) => mutate(() => updateResource(`/organizations/${schoolId}/members/${member.userId}`, { status: member.status === "active" ? "inactive" : "active" }), `${member.email} ${member.status === "active" ? "deactivated" : "activated"}`)} />}
          {(["assignments", "attendance", "updates", "recordings", "arena", "progress"] as Panel[]).includes(panel) && <LearningWorkspace key={panel} organizationId={schoolId} role="school_admin" initialTab={panel as "assignments" | "attendance" | "updates" | "recordings" | "arena" | "progress"} hideTabs />}
          {panel === "billing" && <SchoolBilling organizationId={schoolId} />}
          {panel === "settings" && <Settings organization={school.organization} onEdit={() => setAction("school")} />}
        </>}
      </main>

      {action && school?.organization && <ActionModal action={action} school={school} busy={busy} onClose={() => setAction(null)} onSubmit={(body) => {
        const root = `/organizations/${schoolId}`; const academics = `${root}/academics`;
        if (action === "school") return mutate(() => updateResource(root, body), "School settings updated");
        if (action === "invite") {
          setBusy(true); setError("");
          createResource<{ invitations: { token: string; email: string; expiresAt: string }[] }>(`${root}/invitations`, body).then(async (result) => { setInvitation(result.invitations[0]); setAction(null); await refresh(); }).catch((reason) => setError(reason.message)).finally(() => setBusy(false));
          return;
        }
        if (action === "teacherAssignment") return mutate(() => createResource(`${academics}/teacher-assignments`, body), "Teacher assigned");
        if (action === "enrollment") return mutate(() => createResource(`${academics}/enrollments`, body), "Student enrolled");
        return mutate(() => createResource(`${academics}/${action === "year" ? "years" : action + "s"}`, body), `${action[0].toUpperCase() + action.slice(1)} created`);
      }} />}
      {invitation && <div className="modal-backdrop"><section className="action-modal token-modal" role="dialog" aria-modal="true" aria-labelledby="token-title"><button className="modal-close" onClick={() => setInvitation(null)} aria-label="Close">×</button><span className="success-mark">✓</span><h2 id="token-title">Invitation created</h2><p>Deliver this one-time token privately to <b>{invitation.email}</b>. EDOPS cannot retrieve it later.</p><code>{invitation.token}</code><small>Expires {formatDate(invitation.expiresAt)}</small><div className="modal-actions"><button className="secondary-button" onClick={() => setInvitation(null)}>Done</button><button className="primary-button" onClick={() => navigator.clipboard.writeText(invitation.token)}>Copy token</button></div></section></div>}
      {notice && <div className="toast" role="status"><span>✓</span>{notice}</div>}
    </div>
  );
}

export function EdopsLogo({ size = "sm", className = "", style }: { size?: "sm" | "md" | "lg"; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`edops-pill-logo ${size} ${className}`.trim()} style={style} aria-label="EDOPS">
      <div className="edops-logo-inner">
        <svg className="edops-logo-wing" viewBox="0 0 300 140" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M 170 8 C 175 40 210 75 288 132 C 275 110 245 80 205 60 C 185 45 175 25 170 8 Z" fill="#5e17eb" />
          <path d="M 85 32 C 120 60 180 85 284 129 C 250 115 195 95 130 65 C 105 50 90 40 85 32 Z" fill="#ffffff" />
          <path d="M 10 97 C 35 112 65 125 105 133 C 145 135 220 130 288 132 C 240 125 180 127 125 122 C 75 118 40 108 10 97 Z" fill="#5e17eb" />
        </svg>
        <div className="edops-logo-text">
          <span className="edops-purple">ED</span>
          <span className="edops-white">O</span>
          <span className="edops-purple">PS</span>
        </div>
      </div>
    </div>
  );
}

function Brand() { return <a className="brand" href="#content" aria-label="EDOPS dashboard"><EdopsLogo size="sm" /></a>; }
function NavIcon({ id }: { id: string }) { const Icon = ({ overview: LayoutDashboard, academics: GraduationCap, people: Users, assignments: ClipboardCheck, attendance: CalendarCheck2, updates: Bell, recordings: Video, arena: Trophy, progress: BarChart3, billing: CreditCard, settings: SettingsIcon, children: Users, notices: Bell } as Record<string, typeof LayoutDashboard>)[id] ?? BookOpen; return <Icon size={18} strokeWidth={1.8} aria-hidden="true" />; }
function ProfileMenu({ email, role, onLogout }: { email: string; role: string; onLogout: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const menu = useRef<HTMLDetailsElement>(null);
  return <><details className="profile-menu" ref={menu} onKeyDown={(event) => { if (event.key === "Escape" && menu.current) menu.current.open = false; }}><summary className="avatar" aria-label="Open profile menu"><UserRound size={18} aria-hidden="true" /></summary><div><header><span><UserRound size={20} /></span><div><b>{email}</b><small>{role}</small></div></header><button type="button" onClick={() => { if (menu.current) menu.current.open = false; dialog.current?.showModal(); }}><ShieldCheck size={16} /> My profile</button><button type="button" onClick={onLogout}><LogOut size={16} /> Log out</button></div></details><dialog ref={dialog} className="profile-dialog" aria-labelledby="profile-heading"><form method="dialog"><button className="secondary-button">Close</button></form><span className="profile-portrait"><UserRound size={32} /></span><p className="section-kicker">Your EDOPS account</p><h2 id="profile-heading">My profile</h2><dl><div><dt>Email address</dt><dd>{email}</dd></div><div><dt>Current role</dt><dd>{role}</dd></div></dl><p>Your school manages your membership and class access.</p></dialog></>;
}
function LoadingScreen() { return <div className="loading-screen"><EdopsLogo size="md" /><span className="loading-wordmark" style={{ display: "none" }}>EDOPS</span><i /></div>; }
function DashboardSkeleton() { return <div className="dashboard-skeleton"><div /><div /><div /><div /></div>; }

function LoginScreen({ onLogin, onInvite }: { onLogin: (profile: Profile) => void; onInvite: () => void }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setError(""); const data = new FormData(event.currentTarget); try { onLogin(await login(String(data.get("email")), String(data.get("password")))); } catch (reason) { setError(reason instanceof Error ? reason.message : "Sign in failed"); } finally { setBusy(false); } }
  return <main className="auth-page"><section className="auth-brand"><EdopsLogo size="lg" /><div><p className="eyebrow">Connected school operations</p><h1>Everything your school needs. Nothing it doesn’t.</h1><p>A focused workspace for administrators, teachers, and students.</p></div><small>Secure. Clear. Built for learning.</small></section><section className="auth-panel"><form className="auth-form" onSubmit={submit}><p className="eyebrow">Welcome back</p><h2>Sign in to EDOPS</h2><p>Use the account created through your EDOPS invitation.</p>{error && <div className="form-error" role="alert">{error}</div>}<label>Email address<input name="email" type="email" autoComplete="email" required placeholder="you@school.edu" /></label><label>Password<input name="password" type="password" autoComplete="current-password" required /></label><button className="primary-button" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button><button type="button" className="link-button" onClick={onInvite}>Accept an invitation</button><small>Your session is protected by EDOPS.</small></form></section></main>;
}

function InviteScreen({ signedIn, onDone }: { signedIn: boolean; onDone: () => void }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [success, setSuccess] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); const data = new FormData(event.currentTarget);
    const body: Record<string, string> = { token: String(data.get("token")) };
    if (!signedIn) body.password = String(data.get("password"));
    const specialty = String(data.get("specialty") || "").trim();
    if (specialty) body.specialty = specialty;
    try {
      await api("/auth/invitations/accept", { method: "POST", body });
      setSuccess(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Invitation could not be accepted");
    } finally {
      setBusy(false);
    }
  }
  return <main className="standalone-page"><section className="standalone-card"><div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}><EdopsLogo size="md" /></div>{success ? <><span className="success-mark">✓</span><h1>Invitation accepted</h1><p>{signedIn ? "Your school membership is ready. Refresh your dashboard to continue." : "Your account is ready. Sign in with your email and new password."}</p><button className="primary-button" onClick={onDone}>Continue to sign in</button></> : <form className="auth-form" onSubmit={submit}><p className="eyebrow">School invitation</p><h2>Join your EDOPS workspace</h2><p>{signedIn ? "Paste the invitation token sent to your account." : "Paste your invitation token and choose a password of at least 12 characters."}</p>{error && <div className="form-error" role="alert">{error}</div>}<label>Invitation token<input name="token" minLength={64} maxLength={64} required defaultValue={typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("invite") ?? "" : ""} /></label>{!signedIn && <label>Create password<input name="password" type="password" minLength={12} maxLength={128} required autoComplete="new-password" /></label>}<label>Subject Specialty <span style={{ opacity: 0.65, fontSize: "0.85em" }}>(for teachers, e.g. Mathematics)</span><input name="specialty" placeholder="e.g. Mathematics, Physics, Chemistry" maxLength={100} /></label><button className="primary-button" disabled={busy}>{busy ? "Accepting…" : "Accept invitation"}</button><button type="button" className="link-button" onClick={onDone}>Back to sign in</button></form>}</section></main>;
}

function WorkspaceSelect({ profile, value, onChange }: { profile: Profile; value: string; onChange: (value: string) => void }) {
  return <select className="school-select" aria-label="Current workspace" value={value} onChange={(event) => onChange(event.target.value)}>{profile.user.isPlatformAdmin && <option value="platform">EDOPS Platform — Platform admin</option>}{profile.organizations.map((item) => <option key={item.id} value={item.id}>{item.name} — {roleNames[item.role]}</option>)}</select>;
}

function getSubjectIcon(name: string, index: number) {
  const lower = name.toLowerCase().trim();
  if (lower.includes("machine") || lower.includes("learn") || lower.includes("ai") || lower === "ml" || lower.includes("intel")) {
    return <Sparkles size={17} strokeWidth={1.8} />;
  }
  if (lower.includes("data") || lower.includes("struct") || lower.includes("db") || lower.includes("sql") || lower === "ds" || lower === "dbms") {
    return <Database size={17} strokeWidth={1.8} />;
  }
  if (lower.includes("math") || lower.includes("algo") || lower.includes("stat") || lower.includes("calc") || lower.includes("net") || lower.includes("logic")) {
    return <Network size={17} strokeWidth={1.8} />;
  }
  const icons = [<Sparkles size={17} key="s" />, <Database size={17} key="d" />, <Network size={17} key="n" />, <BookOpen size={17} key="b" />];
  return icons[index % icons.length];
}

function RoleWorkspace({ profile, membership, workspace, onWorkspace, onLogout }: { profile: Profile; membership: OrganizationSummary & { role: MemberRole }; workspace: string; onWorkspace: (value: string) => void; onLogout: () => void }) {
  const config = rolePanels[membership.role];
  const panels = config.panels;
  const [panelId, setPanelId] = useState("overview");
  const [initialClassKey, setInitialClassKey] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [data, setData] = useState<RoleWorkspaceData | null>(null);
  const [loading, setLoading] = useState(membership.role !== "parent");
  const [error, setError] = useState("");
  const panel = panels.find((item) => item.id === panelId) ?? panels[0];

  const studentSubjects = useMemo(() => {
    if (data?.subjects && data.subjects.length > 0) {
      return data.subjects.map((item) => {
        const anyItem = item as any;
        const name = item.subjectName || anyItem.name || anyItem.title || item.subjectCode || "Subject";
        return {
          id: anyItem.subjectId || anyItem.id || item.subjectCode || name,
          name,
          code: item.subjectCode || "",
        };
      });
    }
    return [
      { id: "ml", name: "Machine Learning", code: "ML" },
      { id: "ds", name: "Data Structures", code: "DS" },
      { id: "math", name: "Mathematics", code: "MATH" },
    ];
  }, [data?.subjects]);

  useEffect(() => {
    if (membership.role === "parent") return;
    setLoading(true); setError("");
    loadRoleWorkspace(membership.id).then(setData).catch((reason) => setError(reason instanceof Error ? reason.message : "Academic records could not be loaded")).finally(() => setLoading(false));
  }, [membership.id, membership.role]);
  return <div className="app-shell role-workspace">
    <header className="topbar"><Brand /><div className="api-status"><span /> {membership.name}</div><div className="top-actions"><WorkspaceSelect profile={profile} value={workspace} onChange={onWorkspace} /><ProfileMenu email={profile.user.email} role={roleNames[membership.role]} onLogout={onLogout} /></div></header>
    {membership.role === "student" ? (
      <aside className="sidebar student-sidebar" aria-label="Student navigation">
        <div className="nav-section">
          <button
            type="button"
            className={panelId === "overview" && !selectedSubject ? "nav-item student-nav-home active" : "nav-item student-nav-home"}
            onClick={() => { setPanelId("overview"); setSelectedSubject(null); }}
          >
            <span><HomeIcon size={18} strokeWidth={1.8} /></span>
            Home
          </button>

          <div className="student-nav-heading">Enrolled Subjects</div>
          <div className="student-subjects-list">
            {studentSubjects.map((sub, idx) => {
              const displayName = sub.name?.trim() || sub.code?.trim() || "Subject";
              const isSelected = panelId === "overview" && (selectedSubject === sub.name || selectedSubject === displayName);
              return (
                <button
                  key={sub.id || idx}
                  type="button"
                  title={displayName}
                  aria-label={`Subject: ${displayName}`}
                  className={isSelected ? "nav-item student-subject-item active" : "nav-item student-subject-item"}
                  onClick={() => {
                    setPanelId("overview");
                    setSelectedSubject(selectedSubject === displayName ? null : displayName);
                  }}
                >
                  <span className="student-subject-icon" aria-hidden="true">{getSubjectIcon(displayName, idx)}</span>
                  <span className="student-subject-title">{displayName}</span>
                </button>
              );
            })}
          </div>

          <hr className="student-nav-divider" />

          <button
            type="button"
            className={panelId === "progress" ? "nav-item active" : "nav-item"}
            onClick={() => { setPanelId("progress"); setSelectedSubject(null); }}
          >
            <span><BarChart3 size={18} strokeWidth={1.8} /></span>
            Scorecard
          </button>
          <button
            type="button"
            className={panelId === "arena" && selectedSubject === "leaderboard" ? "nav-item active" : "nav-item"}
            onClick={() => { setPanelId("arena"); setSelectedSubject("leaderboard"); }}
          >
            <span><Trophy size={18} strokeWidth={1.8} /></span>
            Leaderboard
          </button>
          <button
            type="button"
            className={panelId === "overview" && selectedSubject === "calendar" ? "nav-item active" : "nav-item"}
            onClick={() => {
              setPanelId("overview");
              setSelectedSubject("calendar");
              const cal = typeof document !== "undefined" ? document.querySelector(".calendar-panel") : null;
              if (cal) cal.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <span><CalendarDays size={18} strokeWidth={1.8} /></span>
            Calendar
          </button>
          <button
            type="button"
            className={panelId === "arena" && selectedSubject !== "leaderboard" ? "nav-item active" : "nav-item"}
            onClick={() => { setPanelId("arena"); setSelectedSubject(null); }}
          >
            <span><Trophy size={18} strokeWidth={1.8} /></span>
            Arena
          </button>
        </div>
        <div className={`term-card sidebar-term ${membership.status === "suspended" ? "suspended" : ""}`}>
          <span>{membership.name}</span>
          <p>{membership.status === "active" ? "Active school" : "School access suspended"}</p>
        </div>
      </aside>
    ) : (
      <aside className="sidebar" aria-label={`${roleNames[membership.role]} navigation`}><div className="nav-section"><p className="eyebrow">{roleNames[membership.role]}</p>{panels.map((item) => <button key={item.id} className={panel.id === item.id ? "nav-item active" : "nav-item"} onClick={() => setPanelId(item.id)}><span><NavIcon id={item.id} /></span>{item.label}</button>)}</div><div className={`term-card sidebar-term ${membership.status === "suspended" ? "suspended" : ""}`}><span>{membership.name}</span><p>{membership.status === "active" ? "Active school" : "School access suspended"}</p></div></aside>
    )}
    <main id="content" className="main-content"><section className="welcome-row"><div><p className="date-line">{membership.name} · {roleNames[membership.role]}</p><h1>{panel.title}</h1><p>{panel.id === "overview" ? config.intro : panel.copy}</p></div><span className={`membership-badge ${membership.status}`}>{membership.status}</span></section>{membership.status === "suspended" && <div className="error-banner" role="alert"><b>This school workspace is suspended.</b><span>Contact a school or platform administrator to restore access.</span></div>}{error && <div className="error-banner" role="alert"><b>Couldn’t load your academic records.</b><span>{error}</span></div>}{membership.role === "parent" ? <><section className="role-card-grid">{panel.items.map(([title, copy], index) => <article className="role-card" key={title}><span>{panel.icon}</span><div><p className="eyebrow">{String(index + 1).padStart(2, "0")}</p><h2>{title}</h2><p>{copy}</p></div></article>)}</section><section className="data-card role-coming-soon"><div className="data-head"><div><h2>{panel.title}</h2><p>{panel.copy}</p></div><span className="table-pill">Not available in API</span></div><div><span>◇</span><h3>Parent data is not implemented</h3><p>The backend must add parent-to-student relationships before this workspace can show real records.</p></div></section></> : <>{loading && !data ? <DashboardSkeleton /> : panel.id === "overview" ? <><DashboardHome organizationId={membership.id} role={membership.role} selectedSubject={selectedSubject} onSelectSubject={setSelectedSubject} onNavigate={(tab, classKey) => { setInitialClassKey(classKey ?? ""); setPanelId(tab); }} /><details className="academic-details"><summary>My academic details</summary>{data && <RoleAcademicData data={data} />}</details></> : <LearningWorkspace key={panel.id} initialClassKey={initialClassKey} organizationId={membership.id} role={membership.role} initialTab={panel.id as "assignments" | "attendance" | "updates" | "recordings" | "arena" | "progress"} hideTabs />}</>}</main>
  </div>;
}

function RoleAcademicData({ data }: { data: RoleWorkspaceData }) {
  if (data.role === "teacher") return <div className="content-stack"><ReadOnlySection title="My teaching assignments" empty="No section or subject has been assigned to you yet." rows={data.assignments.map((item) => [item.subjectName, item.sectionName, item.subjectCode])} /><ReadOnlySection title="Students in my sections" empty="No active students are enrolled in your assigned sections yet." rows={data.students.map((item) => [item.email, item.sectionName, `Roll ${item.rollNumber}`])} /></div>;
  const enrollment = data.enrollment;
  return <div className="content-stack"><ReadOnlySection title="My enrollment" empty="You do not have an active section enrollment yet." rows={enrollment ? [[enrollment.sectionName, `${enrollment.programName} · ${enrollment.academicYearName}`, `Roll ${enrollment.rollNumber}`]] : []} /><ReadOnlySection title="My subjects and teachers" empty="No teachers have been assigned to subjects in your section yet." rows={data.subjects.map((item) => [item.subjectName, item.teacherEmail, item.subjectCode])} /></div>;
}

function ReadOnlySection({ title, empty, rows }: { title: string; empty: string; rows: string[][] }) {
  return <section className="data-card"><div className="data-head"><h2>{title}</h2><span className="table-pill">Live</span></div>{rows.length ? <div className="simple-table">{rows.map((row, index) => <div key={`${row[0]}-${index}`}><b>{row[0]}</b><span>{row[1]}</span><small>{row[2]}</small></div>)}</div> : <div className="empty-state"><span>◇</span><h3>{empty}</h3><p>Ask your school administrator if you believe this is incorrect.</p></div>}</section>;
}

function PlatformScreen({ profile, workspace, onWorkspace, onLogout }: { profile: Profile; workspace: string; onWorkspace: (value: string) => void; onLogout: () => void }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [result, setResult] = useState<{ invitation: { token: string; email: string; expiresAt: string }; organization: Organization } | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setError(""); const data = new FormData(event.currentTarget); try { setResult(await createResource("/platform/organizations", { name: data.get("name"), slug: data.get("slug"), adminEmail: data.get("adminEmail"), timeZone: data.get("timeZone"), locale: data.get("locale") }, false)); } catch (reason) { setError(reason instanceof Error ? reason.message : "School could not be created"); } finally { setBusy(false); } }
  return <main className="standalone-page platform-page"><header><EdopsLogo size="sm" /><div className="top-actions">{profile.organizations.length > 0 && <WorkspaceSelect profile={profile} value={workspace} onChange={onWorkspace} />}<ProfileMenu email={profile.user.email} role="Platform administrator" onLogout={onLogout} /></div></header><section className="platform-card"><p className="eyebrow">Platform administration</p><h1>{profile.user.isPlatformAdmin ? "Platform overview" : "No active workspace"}</h1><p>{profile.user.isPlatformAdmin ? "Manage your schools, subscription plans, and billing in one place." : "Your account has no school membership. Ask a platform administrator for an invitation."}</p>{profile.user.isPlatformAdmin && !result && <details className="provision-panel"><summary>Add a new school</summary><form className="form-grid platform-form" onSubmit={submit}>{error && <div className="form-error wide">{error}</div>}<label>School name<input name="name" required maxLength={120} /></label><label>URL slug<input name="slug" required maxLength={63} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="greenfield-school" /></label><label>Administrator email<input name="adminEmail" type="email" required /></label><label>Timezone<input name="timeZone" required defaultValue={Intl.DateTimeFormat().resolvedOptions().timeZone} /></label><label>Locale<select name="locale" defaultValue="en-IN"><option value="en-IN">English (India)</option><option value="hi-IN">Hindi (India)</option><option value="en-US">English (US)</option></select></label><button className="primary-button" disabled={busy}>{busy ? "Creating…" : "Create school"}</button></form></details>}{result && <div className="invite-result"><span className="success-mark">✓</span><h2>{result.organization.name} created</h2><p>Copy this one-time invitation token and deliver it privately to <b>{result.invitation.email}</b>. It cannot be retrieved later.</p><code>{result.invitation.token}</code><small>Expires {formatDate(result.invitation.expiresAt)}</small><button className="primary-button" onClick={() => navigator.clipboard.writeText(result.invitation.token)}>Copy invitation token</button><button className="secondary-button" onClick={() => setResult(null)}>Provision another school</button></div>}</section>{profile.user.isPlatformAdmin && <PlatformWorkspace />}</main>;
}

function Overview({ school, setup, completed, teachers, students, activeEnrollments, onAction }: { school: SchoolData; setup: readonly (readonly [string, boolean])[]; completed: number; teachers: number; students: number; activeEnrollments: number; onAction: (action: Action) => void }) {
  const next = setup.find((item) => !item[1]);
  return <><section className="metric-grid"><Metric label="Teachers" value={teachers} note="Active memberships" tone="indigo" icon="♙" /><Metric label="Students" value={students} note="Active memberships" tone="teal" icon="◎" /><Metric label="Sections" value={school.sections.total} note={`${school.programs.total} programs`} tone="orange" icon="▤" /><Metric label="Enrollments" value={activeEnrollments} note="Active records" tone="rose" icon="✓" /></section><section className="setup-banner"><div className="setup-mark"><span>{completed}</span><small>/6</small></div><div className="setup-copy"><p className="banner-kicker">School readiness</p><h2>{completed === 6 ? "Your school foundation is complete." : `${6 - completed} setup ${6 - completed === 1 ? "step" : "steps"} remaining.`}</h2><p>{next ? `Next: ${next[0]}.` : "Academic structure and roster are ready."}</p></div><div className="setup-actions"><div className="progress-track"><span style={{ width: `${completed / 6 * 100}%` }} /></div><button onClick={() => onAction(next?.[0] === "Current academic year" ? "year" : next?.[0] === "Programs" ? "program" : next?.[0] === "Subjects" ? "subject" : next?.[0] === "Sections" ? "section" : next ? "invite" : "school")}>{next ? "Continue setup" : "Review settings"} <span>→</span></button></div></section><div className="dashboard-grid"><section className="feed"><div className="feed-head"><div><h2>Academic structure</h2><p>Live records from the EDOPS API</p></div></div><RecordRows school={school} /></section><aside className="right-rail"><section className="rail-card"><div className="rail-heading"><div><p className="eyebrow">Setup checklist</p><h2>{completed} of 6 complete</h2></div></div><div className="check-list">{setup.map(([label, done]) => <div key={label}><span className={done ? "complete" : ""}>{done ? "✓" : "○"}</span><b>{label}</b><small>{done ? "Ready" : "Required"}</small></div>)}</div></section><section className="rail-card"><div className="rail-heading"><div><p className="eyebrow">School details</p><h2>{school.organization.name}</h2></div></div><dl className="detail-list"><div><dt>Status</dt><dd><span className="live-dot" />{school.organization.status}</dd></div><div><dt>Timezone</dt><dd>{school.organization.timeZone}</dd></div><div><dt>Locale</dt><dd>{school.organization.locale}</dd></div><div><dt>Slug</dt><dd>{school.organization.slug}</dd></div></dl></section></aside></div></>;
}

function Metric({ label, value, note, tone, icon }: { label: string; value: number; note: string; tone: string; icon: string }) { const id = label === "Teachers" || label === "Students" ? "people" : label === "Enrollments" ? "assignments" : "academics"; return <article className="metric-card"><div><p>{label}</p><strong>{value.toLocaleString()}</strong></div><span className={`metric-icon ${tone}`} aria-label={icon}><NavIcon id={id} /></span><small>{note}</small></article>; }
function RecordRows({ school }: { school: SchoolData }) { const rows = [{ label: "Academic years", value: school.years.total, detail: school.years.items.find((item) => item.isCurrent)?.name ?? "No current year" }, { label: "Programs", value: school.programs.total, detail: school.programs.items.slice(0, 3).map((item) => item.name).join(", ") || "None created" }, { label: "Subjects", value: school.subjects.total, detail: school.subjects.items.slice(0, 3).map((item) => item.code).join(", ") || "None created" }, { label: "Teacher assignments", value: school.assignments.total, detail: "Section and subject links" }, { label: "Invitation batches", value: school.batches.total, detail: "Roster provisioning batches" }]; return <div className="record-rows">{rows.map((row) => <div key={row.label}><span className="record-icon">{row.label[0]}</span><div><b>{row.label}</b><p>{row.detail}</p></div><strong>{row.value}</strong></div>)}</div>; }

function Academics({ school, onAction }: { school: SchoolData; onAction: (action: Action) => void }) { return <div className="content-stack"><DataSection title="Academic years" action="Add year" onAction={() => onAction("year")} empty="No academic years yet." rows={school.years.items.map((item) => [item.name, `${item.startDate} – ${item.endDate}`, item.isCurrent ? "Current" : "Not current"])} /><DataSection title="Programs" action="Add program" onAction={() => onAction("program")} empty="No programs yet." rows={school.programs.items.map((item) => [item.name, `Sequence ${item.sequenceOrder}`, "Program"])} /><DataSection title="Subjects" action="Add subject" onAction={() => onAction("subject")} empty="No subjects yet." rows={school.subjects.items.map((item) => [item.name, item.code, "Subject"])} /><DataSection title="Sections" action="Add section" onAction={() => onAction("section")} empty="No sections yet." rows={school.sections.items.map((item) => [item.name, programName(school.programs.items, item.programId), `Capacity ${item.capacity}`])} /><DataSection title="Teacher assignments" action="Assign teacher" onAction={() => onAction("teacherAssignment")} empty="No teachers assigned yet." rows={school.assignments.items.map((item) => [memberEmail(school.members.items, item.teacherUserId), `${sectionName(school, item.sectionId)} · ${subjectName(school, item.subjectId)}`, "Teacher"])} /><DataSection title="Student enrollments" action="Enroll student" onAction={() => onAction("enrollment")} empty="No students enrolled yet." rows={school.enrollments.items.map((item) => [memberEmail(school.members.items, item.studentUserId), sectionName(school, item.sectionId), `${item.rollNumber} · ${item.status}`])} /></div>; }
function People({ members, onInvite, onStatus }: { members: Member[]; onInvite: () => void; onStatus: (member: Member) => void }) { return <section className="data-card"><div className="data-head"><div><h2>Teachers and students</h2><p>Manage the people who can use this school workspace.</p></div><button className="primary-button" onClick={onInvite}>＋ Invite person</button></div>{members.length ? <div className="member-table member-actions-table"><div className="table-head"><span>Person</span><span>Role</span><span>Membership</span><span>Account</span><span>Actions</span></div>{members.map((member) => <div key={member.userId}><span><b>{member.email}</b><small>{member.userId}</small></span><span className="table-pill">{member.role}</span><span className={`table-pill ${member.status}`}>{member.status}</span><span>{member.accountActive ? "Active" : "Inactive"}</span><span><button className="secondary-button" onClick={() => onStatus(member)}>{member.status === "active" ? "Deactivate" : "Activate"}</button></span></div>)}</div> : <EmptyState title="No teachers or students" copy="Invite your first person to begin building the school roster." action="Invite person" onAction={onInvite} />}</section>; }
function Settings({ organization, onEdit }: { organization: Organization; onEdit: () => void }) { return <section className="data-card settings-card"><div className="data-head"><div><h2>School profile</h2><p>Settings stored for this organization.</p></div><button className="secondary-button" onClick={onEdit}>Edit settings</button></div><dl className="settings-grid"><div><dt>School name</dt><dd>{organization.name}</dd></div><div><dt>Organization ID</dt><dd><code>{organization.id}</code></dd></div><div><dt>Slug</dt><dd>{organization.slug}</dd></div><div><dt>Status</dt><dd>{organization.status}</dd></div><div><dt>Timezone</dt><dd>{organization.timeZone}</dd></div><div><dt>Locale</dt><dd>{organization.locale}</dd></div><div><dt>Created</dt><dd>{formatDate(organization.createdAt)}</dd></div><div><dt>Last updated</dt><dd>{formatDate(organization.updatedAt)}</dd></div></dl></section>; }
function DataSection({ title, action, onAction, empty, rows }: { title: string; action: string; onAction: () => void; empty: string; rows: string[][] }) { return <section className="data-card"><div className="data-head"><h2>{title}</h2><button className="secondary-button" onClick={onAction}>＋ {action}</button></div>{rows.length ? <div className="simple-table">{rows.map((row, index) => <div key={`${row[0]}-${index}`}><b>{row[0]}</b><span>{row[1]}</span><small>{row[2]}</small></div>)}</div> : <EmptyState title={empty} copy="Create the first record to continue school setup." action={action} onAction={onAction} />}</section>; }
function EmptyState({ title, copy, action, onAction }: { title: string; copy: string; action: string; onAction: () => void }) { return <div className="empty-state"><span>＋</span><h3>{title}</h3><p>{copy}</p><button className="primary-button" onClick={onAction}>{action}</button></div>; }
function programName(programs: Program[], id: string) { return programs.find((item) => item.id === id)?.name ?? "Unknown program"; }
function memberEmail(members: Member[], id: string) { return members.find((item) => item.userId === id)?.email ?? "Unknown member"; }
function sectionName(school: SchoolData, id: string) { return school.sections.items.find((item) => item.id === id)?.name ?? "Unknown section"; }
function subjectName(school: SchoolData, id: string) { return school.subjects.items.find((item) => item.id === id)?.name ?? "Unknown subject"; }

function ActionModal({ action, school, busy, onClose, onSubmit }: { action: Exclude<Action, null>; school: SchoolData; busy: boolean; onClose: () => void; onSubmit: (body: Record<string, unknown>) => void }) {
  const labels = { year: "Academic year", program: "Program", subject: "Subject", section: "Section", teacherAssignment: "Assign teacher", enrollment: "Enroll student", invite: "Invite person", school: "School settings" };
  const activeTeachers = school.members.items.filter((item) => item.role === "teacher" && item.status === "active" && item.accountActive);
  const activeStudents = school.members.items.filter((item) => item.role === "student" && item.status === "active" && item.accountActive);
  const canSubmit = action === "teacherAssignment" ? Boolean(activeTeachers.length && school.sections.total && school.subjects.total) : action === "enrollment" ? Boolean(activeStudents.length && school.sections.total) : true;
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)); let body: Record<string, unknown> = data; if (action === "year") body = { ...data, isCurrent: data.isCurrent === "on" }; if (action === "program") body = { name: data.name, sequenceOrder: Number(data.sequenceOrder || 0) }; if (action === "section") body = { ...data, capacity: Number(data.capacity) }; onSubmit(body); }
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="action-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button className="modal-close" onClick={onClose} aria-label="Close">×</button><p className="eyebrow">EDOPS setup</p><h2 id="modal-title">{labels[action]}</h2><form className="modal-form" onSubmit={submit}>{action === "year" && <><label>Name<input name="name" required maxLength={120} placeholder="2026–27" /></label><div className="form-grid"><label>Start date<input name="startDate" type="date" required /></label><label>End date<input name="endDate" type="date" required /></label></div><label className="checkbox"><input name="isCurrent" type="checkbox" /> Set as current academic year</label></>}{action === "program" && <><label>Program name<input name="name" required maxLength={120} placeholder="Grade 10" /></label><label>Sequence order<input name="sequenceOrder" type="number" min="0" max="10000" defaultValue="0" /></label></>}{action === "subject" && <><label>Subject name<input name="name" required maxLength={120} placeholder="Mathematics" /></label><label>Subject code<input name="code" required maxLength={32} pattern="[A-Za-z0-9][A-Za-z0-9_-]*" placeholder="MATH" /></label></>}{action === "section" && <><label>Academic year<select name="academicYearId" required defaultValue=""><option value="" disabled>Select year</option>{school.years.items.map((item: AcademicYear) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Program<select name="programId" required defaultValue=""><option value="" disabled>Select program</option>{school.programs.items.map((item: Program) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><div className="form-grid"><label>Section name<input name="name" required maxLength={120} placeholder="10-A" /></label><label>Capacity<input name="capacity" type="number" min="1" max="5000" required /></label></div></>}{action === "teacherAssignment" && <><label>Teacher<select name="teacherUserId" required defaultValue=""><option value="" disabled>Select teacher</option>{activeTeachers.map((item) => <option key={item.userId} value={item.userId}>{item.email}</option>)}</select></label><label>Section<select name="sectionId" required defaultValue=""><option value="" disabled>Select section</option>{school.sections.items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Subject<select name="subjectId" required defaultValue=""><option value="" disabled>Select subject</option>{school.subjects.items.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.code})</option>)}</select></label>{!canSubmit && <p className="form-note">Create a section and subject, then invite a teacher and wait for the invitation to be accepted.</p>}</>}{action === "enrollment" && <><label>Student<select name="studentUserId" required defaultValue=""><option value="" disabled>Select student</option>{activeStudents.map((item) => <option key={item.userId} value={item.userId}>{item.email}</option>)}</select></label><label>Section<select name="sectionId" required defaultValue=""><option value="" disabled>Select section</option>{school.sections.items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Roll number<input name="rollNumber" required maxLength={32} placeholder="01" /></label>{!canSubmit && <p className="form-note">Create a section, then invite a student and wait for the invitation to be accepted.</p>}</>}{action === "invite" && <><label>Email address<input name="email" type="email" required /></label><label>School role<select name="role" defaultValue="teacher"><option value="teacher">Teacher</option><option value="student">Student</option></select></label><p className="form-note">The API returns a private, single-use token. Automatic email delivery is not implemented by the backend.</p></>}{action === "school" && <><label>School name<input name="name" required defaultValue={school.organization.name} /></label><label>Timezone<input name="timeZone" required defaultValue={school.organization.timeZone} /></label><label>Locale<select name="locale" defaultValue={school.organization.locale}><option value="en-IN">English (India)</option><option value="hi-IN">Hindi (India)</option><option value="en-US">English (US)</option></select></label></>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={busy || !canSubmit}>{busy ? "Saving…" : "Save"}</button></div></form></section></div>;
}
