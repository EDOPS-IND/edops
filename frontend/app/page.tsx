"use client";

export const dynamic = "force-static";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  AcademicYear,
  api,
  createResource,
  getInvitationInfo,
  InvitationInfo,
  loadRoleWorkspace,
  loadSchool,
  login,
  logout,
  Member,
  Organization,
  OrganizationSummary,
  Profile,
  Program,
  profile as getProfile,
  RoleWorkspaceData,
  SchoolData,
  updateResource,
  forgotPassword,
  verifyResetToken,
  resetPassword,
} from "./edops-api";
import { LearningWorkspace, SchoolBilling } from "./learning-workspace";
import { PlatformWorkspace } from "./platform-workspace";
import { GlobalPortalSearch } from "./components/global-portal-search";
import { DashboardHome } from "./dashboard-home";
import { ParentDashboard } from "./parent-dashboard";
import { ParentWorkspace } from "./parent";
import { useDashboardNavigation } from "./dashboard-navigation";
import { PrincipalWorkspace } from "./principal";
import { TeacherWorkspace } from "./teacher";
import { StudentWorkspace } from "./student";
import { SchoolAdminWorkspace } from "./school-admin";
import { NotificationBellDropdown } from "./components/notification-bell-dropdown";
import { LoginScreen, ForgotPasswordModal, ResetPasswordScreen, InviteScreen } from "./auth";
import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarCheck2,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  Database,
  Eye,
  EyeOff,
  GraduationCap,
  Home as HomeIcon,
  LayoutDashboard,
  LogOut,
  Network,
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserRound,
  Users,
  Video,
  Building2,
  Search,
} from "lucide-react";
import {
  parseDashboardRoute,
  updateDashboardUrl,
  resolveOrgFromRoute,
  slugify,
  useDashboardRoute,
} from "./dashboard-routing";

type Panel =
  | "overview"
  | "principal"
  | "parent"
  | "academics"
  | "people"
  | "assignments"
  | "attendance"
  | "updates"
  | "recordings"
  | "arena"
  | "progress"
  | "billing"
  | "settings";
type Action =
  | "year"
  | "program"
  | "subject"
  | "section"
  | "teacherAssignment"
  | "enrollment"
  | "invite"
  | "school"
  | null;
type MemberRole = Exclude<
  OrganizationSummary["role"],
  "school_admin" | "principal"
>;

const roleNames: Record<OrganizationSummary["role"] | "platform", string> = {
  platform: "Platform administrator",
  school_admin: "School administrator",
  principal: "Principal",
  teacher: "Teacher",
  student: "Student",
  parent: "Parent",
};
const rolePanels: Record<
  MemberRole,
  {
    intro: string;
    panels: {
      id: string;
      icon: string;
      label: string;
      title: string;
      copy: string;
      items: [string, string][];
    }[];
  }
> = {
  teacher: {
    intro:
      "Plan lessons, follow your classes and keep daily teaching work together.",
    panels: [
      {
        id: "overview",
        icon: "⌂",
        label: "Overview",
        title: "Teaching overview",
        copy: "A focused view of your day at school.",
        items: [
          ["My classes", "Assigned sections and subjects"],
          ["Assignments", "Coursework shared with students"],
          ["Attendance", "Daily class attendance"],
        ],
      },
      {
        id: "assignments",
        icon: "✓",
        label: "Assignments",
        title: "Assignments",
        copy: "Create, publish and grade class work.",
        items: [],
      },
      {
        id: "attendance",
        icon: "◎",
        label: "Attendance",
        title: "Attendance",
        copy: "Take attendance and review class registers.",
        items: [],
      },
      {
        id: "updates",
        icon: "◇",
        label: "Updates",
        title: "Class updates",
        copy: "Notifications and published class activity.",
        items: [],
      },
      {
        id: "recordings",
        icon: "▶",
        label: "Recordings",
        title: "Recordings",
        copy: "Upload and publish recorded lessons.",
        items: [],
      },
      {
        id: "arena",
        icon: "◈",
        label: "Arena",
        title: "Arena",
        copy: "Create objective practice for your classes.",
        items: [],
      },
      {
        id: "progress",
        icon: "↗",
        label: "Progress",
        title: "Class progress",
        copy: "Review scorecards across your class.",
        items: [],
      },
    ],
  },
  student: {
    intro: "See your learning, schedule and school progress in one place.",
    panels: [
      {
        id: "overview",
        icon: "⌂",
        label: "Overview",
        title: "Student overview",
        copy: "Your current learning activity at a glance.",
        items: [
          ["My subjects", "Subjects in your current section"],
          ["Due work", "Assignments to complete"],
          ["Attendance", "Your attendance summary"],
        ],
      },
      {
        id: "progress",
        icon: "↗",
        label: "Previous grades",
        title: "Previous grades",
        copy: "Your marks, completion and academic progress.",
        items: [],
      },
      {
        id: "assignments",
        icon: "✓",
        label: "Assignments",
        title: "Assignments",
        copy: "Open your current work and teacher feedback.",
        items: [],
      },
      {
        id: "attendance",
        icon: "◎",
        label: "Attendance",
        title: "My attendance",
        copy: "Review finalized attendance records.",
        items: [],
      },
      {
        id: "recordings",
        icon: "▶",
        label: "Recordings",
        title: "Class recordings",
        copy: "Watch lessons shared by your teachers.",
        items: [],
      },
      {
        id: "arena",
        icon: "◈",
        label: "Arena",
        title: "Practice Arena",
        copy: "Practice questions and improve your score.",
        items: [],
      },
      {
        id: "updates",
        icon: "◇",
        label: "Updates",
        title: "My updates",
        copy: "Messages and activity addressed to you.",
        items: [],
      },
    ],
  },
  parent: {
    intro: "Stay informed about your children’s school life and progress.",
    panels: [
      {
        id: "overview",
        icon: "⌂",
        label: "Overview",
        title: "Family overview",
        copy: "The latest school information for your family.",
        items: [
          ["Children", "Linked student profiles"],
          ["Attendance", "Recent attendance updates"],
          ["Notices", "Messages from school"],
        ],
      },
      {
        id: "children",
        icon: "♙",
        label: "Children",
        title: "Children",
        copy: "Linked student profiles and learning summaries will appear here.",
        items: [
          ["Learning", "Subjects and coursework"],
          ["Progress", "Results and teacher feedback"],
          ["Schedule", "Classes and school dates"],
        ],
      },
      {
        id: "attendance",
        icon: "✓",
        label: "Attendance",
        title: "Attendance",
        copy: "Review attendance details for your linked children.",
        items: [
          ["Today", "Latest attendance status"],
          ["History", "Attendance across the term"],
          ["Absence notes", "Updates shared with school"],
        ],
      },
      {
        id: "notices",
        icon: "◇",
        label: "Notices",
        title: "School notices",
        copy: "Announcements and messages from school will appear here.",
        items: [
          ["Announcements", "Whole-school updates"],
          ["Class messages", "Updates from teachers"],
          ["Reminders", "Dates and actions to remember"],
        ],
      },
    ],
  },
};

function formatDate(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
function isMemberWorkspace(
  item: OrganizationSummary,
): item is OrganizationSummary & { role: MemberRole } {
  return item.role !== "school_admin" && item.role !== "principal";
}

export default function Home() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [workspace, setWorkspace] = useState("");
  const [school, setSchool] = useState<SchoolData | null>(null);
  const [panel, setPanel] = useState<Panel>("overview");
  const [action, setAction] = useState<Action>(null);
  const [invitation, setInvitation] = useState<{
    token: string;
    email: string;
    expiresAt: string;
  } | null>(null);
  const [inviteMode, setInviteMode] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [resetMode, setResetMode] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const handleExpired = () => {
      if (profile) {
        setSessionExpired(true);
      }
    };
    window.addEventListener("edops:session-expired", handleExpired);
    return () => window.removeEventListener("edops:session-expired", handleExpired);
  }, [profile]);

  const { route, navigate } = useDashboardRoute();

  const membership = profile?.organizations.find(
    (item) => item.id === workspace,
  );
  const schoolId = membership?.role === "school_admin" ? membership.id : "";

  function selectInitialWorkspace(current: Profile) {
    const initialRoute = parseDashboardRoute();
    if (initialRoute.role === "platform" && current.user.isPlatformAdmin) {
      return "platform";
    }

    if (initialRoute.orgSlug && initialRoute.orgSlug !== "login") {
      const matched = resolveOrgFromRoute(
        current.organizations,
        initialRoute.orgSlug,
      );
      if (matched) {
        if (initialRoute.role) {
          const roleMatch = current.organizations.find(
            (o) =>
              (slugify(o.slug) === slugify(initialRoute.orgSlug) ||
                slugify(o.name) === slugify(initialRoute.orgSlug) ||
                o.id === initialRoute.orgSlug) &&
              o.role === initialRoute.role,
          );
          if (roleMatch) return roleMatch.id;
        }
        return matched.id;
      }
    }

    return (
      current.organizations.find(
        (item) =>
          (item.role === "school_admin" || item.role === "principal") &&
          item.status === "active",
      )?.id ??
      current.organizations.find((item) => item.status === "active")?.id ??
      (current.user.isPlatformAdmin
        ? "platform"
        : (current.organizations[0]?.id ?? ""))
    );
  }

  async function refresh(id = schoolId) {
    if (!id) return;
    setSchool(await loadSchool(id));
  }

  useEffect(() => {
    const initialRoute = parseDashboardRoute();
    if (initialRoute.isInvite) setInviteMode(true);
    if (initialRoute.isResetPassword) {
      setResetToken(initialRoute.queryParams.reset || "token");
      setResetMode(true);
    }
    const previewRole = initialRoute.queryParams.preview;
    if (previewRole) {
      const roleMap: Record<string, OrganizationSummary["role"]> = {
        student: "student",
        teacher: "teacher",
        principal: "principal",
        parent: "parent",
        "school-admin": "school_admin",
        admin: "school_admin",
      };
      if (previewRole === "platform") {
        const previewProfile: Profile = {
          user: {
            id: "preview-admin",
            email: "admin@edops.com",
            name: "Platform Admin",
            isPlatformAdmin: true,
          },
          organizations: [],
        };
        setProfile(previewProfile);
        setWorkspace("platform");
        setLoading(false);
        return;
      }
      const role = roleMap[previewRole] || "student";
      const previewOrg: OrganizationSummary = {
        id: "e13019ee-fedf-4a62-a39e-cc6a67e783b4",
        name: "VJS Academy",
        slug: "vjs",
        status: "active",
        role,
      };
      const previewProfile: Profile = {
        user: {
          id: "eca6c9f4-490b-4330-ab50-ec3f8a36db92",
          email: "vjs@gmail.com",
          name: "Vikash",
          isPlatformAdmin: false,
        },
        organizations: [previewOrg],
      };
      setProfile(previewProfile);
      setWorkspace(previewOrg.id);
      setLoading(false);
      return;
    }
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 4000);

    getProfile()
      .then((current) => {
        setSessionExpired(false);
        setProfile(current);
        const chosen = selectInitialWorkspace(current);
        setWorkspace(chosen);

        // If path is root or empty or /login, sync URL with chosen workspace
        if (
          initialRoute.pathname === "/" ||
          initialRoute.pathname === "" ||
          initialRoute.pathname === "/login" ||
          initialRoute.pathname === "/login/"
        ) {
          if (chosen === "platform") {
            updateDashboardUrl({ role: "platform", section: "overview" }, true);
          } else {
            const org = current.organizations.find((o) => o.id === chosen);
            if (org) {
              const defaultSection =
                org.role === "parent" ? "overview" : "dashboard";
              updateDashboardUrl(
                {
                  orgSlug: org.slug || org.name,
                  role: org.role,
                  section: defaultSection,
                },
                true,
              );
            }
          }
        }
      })
      .catch(() => undefined)
      .finally(() => {
        clearTimeout(safetyTimer);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!schoolId) {
      setSchool(null);
      return;
    }
    setSchool(null);
    setLoading(true);
    setError("");
    refresh(schoolId)
      .catch((reason) => setError(reason.message))
      .finally(() => setLoading(false));
  }, [schoolId]);

  const setup = useMemo(
    () =>
      school?.organization
        ? ([
            [
              "School profile",
              Boolean(school.organization.name && school.organization.timeZone),
            ],
            [
              "Current academic year",
              school.years.items.some((item) => item.isCurrent),
            ],
            ["Programs", school.programs.total > 0],
            ["Subjects", school.subjects.total > 0],
            ["Sections", school.sections.total > 0],
            ["Teachers and students", school.members.total > 0],
          ] as const)
        : [],
    [school],
  );
  const completed = setup.filter((item) => item[1]).length;

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  }
  async function mutate(task: () => Promise<unknown>, message: string) {
    setBusy(true);
    setError("");
    try {
      await task();
      setAction(null);
      await refresh();
      flash(message);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Something went wrong",
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading && !profile) return <LoadingScreen />;
  if (resetMode && resetToken) {
    return (
      <ResetPasswordScreen
        token={resetToken}
        onDone={() => {
          setResetMode(false);
          setResetToken(null);
          window.history.replaceState({}, "", "/");
          flash(
            "Password updated successfully. Please sign in with your new password.",
          );
        }}
        onCancel={() => {
          setResetMode(false);
          setResetToken(null);
          window.history.replaceState({}, "", "/");
        }}
      />
    );
  }
  if (inviteMode)
    return (
      <InviteScreen
        signedIn={Boolean(profile)}
        onDone={() => {
          setInviteMode(false);
          window.history.replaceState({}, "", "/");
        }}
      />
    );
  if (!profile) {
    return (
      <>
        <LoginScreen
          onLogin={(current) => {
            setSessionExpired(false);
            setProfile(current);
            const chosen = selectInitialWorkspace(current);
            setWorkspace(chosen);
            if (chosen === "platform") {
              updateDashboardUrl(
                { role: "platform", section: "overview" },
                true,
              );
            } else {
              const org = current.organizations.find((o) => o.id === chosen);
              if (org) {
                const defaultSection =
                  org.role === "parent" ? "overview" : "dashboard";
                updateDashboardUrl(
                  {
                    orgSlug: org.slug || org.name,
                    role: org.role,
                    section: defaultSection,
                  },
                  true,
                );
              }
            }
          }}
          onInvite={() => setInviteMode(true)}
          onForgotPassword={() => setForgotMode(true)}
          initialNotice={notice}
        />
        {forgotMode && (
          <ForgotPasswordModal
            onClose={() => setForgotMode(false)}
            onSent={() =>
              flash(
                "If an account exists, password reset instructions have been dispatched via Brevo.",
              )
            }
          />
        )}
      </>
    );
  }
  const signOut = async () => {
    try {
      await logout();
    } catch {
      // safe fallback
    }
    setProfile(null);
    setSchool(null);
    setWorkspace("");
    setSessionExpired(false);
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", "/login");
      window.dispatchEvent(
        new CustomEvent("edops-route-change", { detail: { url: "/login" } }),
      );
    }
  };
  const switchWorkspace = (value: string) => {
    setWorkspace(value);
    setPanel("overview");
    if (value === "platform") {
      updateDashboardUrl({ role: "platform", section: "overview" });
    } else {
      const targetOrg = profile?.organizations.find((o) => o.id === value);
      if (targetOrg) {
        const defaultSection =
          targetOrg.role === "parent" ? "overview" : "dashboard";
        updateDashboardUrl({
          orgSlug: targetOrg.slug || targetOrg.name,
          role: targetOrg.role,
          section: defaultSection,
        });
      }
    }
  };

  const sessionExpiredModal = sessionExpired ? (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(12, 30, 51, 0.7)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
      }}
    >
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "12px",
          padding: "28px",
          maxWidth: "420px",
          width: "90%",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            background: "#FEF2F2",
            color: "#DC2626",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <LogOut size={24} />
        </div>
        <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 700, color: "#0C1E33" }}>
          Session Expired
        </h3>
        <p style={{ margin: "0 0 20px", fontSize: "13px", color: "#64748B", lineHeight: 1.5 }}>
          Your login session has expired for security. Please sign in again to continue your work safely.
        </p>
        <button
          type="button"
          onClick={() => {
            setSessionExpired(false);
            setNotice("Your session expired. Please sign in again.");
            signOut();
          }}
          style={{
            width: "100%",
            padding: "10px 16px",
            background: "#064E3B",
            color: "#F8E7C9",
            border: "none",
            borderRadius: "8px",
            fontWeight: 700,
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Sign In Again
        </button>
      </div>
    </div>
  ) : null;

  if (workspace === "platform" || !membership)
    return (
      <>
        {sessionExpiredModal}
        <PlatformScreen
          profile={profile}
          workspace={workspace}
          onWorkspace={switchWorkspace}
          onLogout={signOut}
        />
      </>
    );

  if (membership.role === "principal") {
    const validPrincipalPanes = [
      "dashboard",
      "planning",
      "people",
      "teachers",
      "academics",
      "timetable",
      "attendance",
      "learning",
      "assessment",
      "assessments",
      "examinations",
      "students",
      "communication",
      "analytics",
      "alerts",
      "reports",
      "activity",
    ];
    const principalPane = validPrincipalPanes.includes(route.section)
      ? route.section === "teachers"
        ? "people"
        : route.section === "assessments"
          ? "assessment"
          : route.section
      : "dashboard";

    return (
      <>
        {sessionExpiredModal}
        <PrincipalWorkspace
          key={workspace}
          organization={membership}
          onLogout={signOut}
          onSwitchOrganization={switchWorkspace}
          organizations={profile.organizations}
          userProfile={profile.user}
          activePane={principalPane}
          activeSubTab={route.tab || ""}
          initialModal={route.modal}
          initialTeacherId={route.teacherId}
          initialStudentId={route.studentId}
          onNavigate={(pane, subTab) => {
            updateDashboardUrl({
              orgSlug: membership.slug || membership.name,
              role: "principal",
              section: pane,
              tab: subTab,
              academicYear: route.academicYear,
            });
          }}
        />
      </>
    );
  }

  if (membership.role === "teacher") {
    const validTeacherTabs = [
      "dashboard",
      "classes",
      "timetable",
      "attendance",
      "learning",
      "assignments",
      "arena",
      "assessment",
      "assessments",
      "exams",
      "students",
      "curriculum",
      "workload",
      "calendar",
      "reports",
      "activity",
      "communication",
    ];
    const teacherTab = validTeacherTabs.includes(route.section)
      ? route.section === "assessments"
        ? "assessment"
        : route.section
      : "dashboard";

    return (
      <>
        {sessionExpiredModal}
        <TeacherWorkspace
          key={workspace}
          organization={membership}
          onLogout={signOut}
          onSwitchOrganization={switchWorkspace}
          organizations={profile.organizations}
          userProfile={profile.user}
          activeTab={teacherTab as any}
          activeSubTab={route.tab || ""}
          initialModal={route.modal}
          initialStudentId={route.studentId}
          onNavigate={(tab, subTab) => {
            updateDashboardUrl({
              orgSlug: membership.slug || membership.name,
              role: "teacher",
              section: tab,
              tab: subTab || "",
              academicYear: route.academicYear,
            });
          }}
        />
      </>
    );
  }

  if (membership.role === "student") {
    const validStudentTabs = [
      "dashboard",
      "class",
      "subjects",
      "timetable",
      "assignments",
      "arena",
      "assessments",
      "exams",
      "attendance",
      "performance",
      "curriculum",
      "resources",
      "calendar",
      "communication",
      "progress",
      "profile",
    ];
    const studentTab = validStudentTabs.includes(route.section)
      ? route.section
      : "dashboard";

    return (
      <>
        {sessionExpiredModal}
        <StudentWorkspace
          key={workspace}
          organization={membership}
          onLogout={signOut}
          onSwitchOrganization={switchWorkspace}
          organizations={profile.organizations}
          userProfile={profile.user}
          activeTab={studentTab as any}
          activeSubTab={route.tab || ""}
          initialModal={route.modal}
          onNavigate={(tab, subTab) => {
            updateDashboardUrl({
              orgSlug: membership.slug || membership.name,
              role: "student",
              section: tab,
              tab: subTab || "",
              academicYear: route.academicYear,
            });
          }}
        />
      </>
    );
  }

  if (membership.role === "parent") {
    const validParentTabs = [
      "overview",
      "academics",
      "attendance",
      "fees",
      "ptm",
      "notices",
      "communication",
    ];
    const parentTab = validParentTabs.includes(route.section)
      ? route.section === "communication"
        ? "notices"
        : route.section
      : "overview";

    return (
      <>
        {sessionExpiredModal}
        <ParentWorkspace
          key={workspace}
          organization={membership}
          onLogout={signOut}
          onSwitchOrganization={switchWorkspace}
          organizations={profile.organizations}
          activeTab={parentTab as any}
          initialWardId={route.studentId || ""}
          initialModal={route.modal}
          onNavigate={(tab, wardId) => {
            updateDashboardUrl({
              orgSlug: membership.slug || membership.name,
              role: "parent",
              section: tab,
              studentId: wardId,
              academicYear: route.academicYear,
            });
          }}
        />
      </>
    );
  }

  if (isMemberWorkspace(membership))
    return (
      <>
        {sessionExpiredModal}
        <RoleWorkspace
          key={workspace}
          profile={profile}
          membership={membership}
          workspace={workspace}
          onWorkspace={switchWorkspace}
          onLogout={signOut}
        />
      </>
    );

  const memberCounts =
    school?.members.items.reduce(
      (counts, member) => ({
        ...counts,
        [member.role]:
          (counts[member.role] ?? 0) + (member.status === "active" ? 1 : 0),
      }),
      {} as Record<string, number>,
    ) ?? {};
  const currentYear = school?.years.items.find((item) => item.isCurrent);
  const activeEnrollments =
    school?.enrollments.items.filter((item) => item.status === "active")
      .length ?? 0;

  const validSchoolAdminTabs = [
    "dashboard",
    "students",
    "teachers",
    "staff",
    "parents",
    "departments",
    "academics",
    "timetable",
    "attendance",
    "learning",
    "examinations",
    "assignments",
    "exams",
    "results",
    "finance",
    "communication",
    "operations",
    "discipline",
    "documents",
    "reports",
    "alerts",
    "settings",
    "audit",
  ];
  const schoolAdminTab = validSchoolAdminTabs.includes(route.section)
    ? route.section
    : "dashboard";

  return (
    <div className="app-shell" style={{ minHeight: "100vh" }}>
      {sessionExpiredModal}
      {error && (
        <div
          className="error-banner"
          role="alert"
          style={{
            position: "fixed",
            top: "16px",
            left: "270px",
            right: "16px",
            zIndex: 200,
          }}
        >
          <b>Couldn't complete that request.</b>
          <span>{error}</span>
          <button onClick={() => setError("")}>×</button>
        </div>
      )}

      <div aria-label="School workspace">
        <SchoolAdminWorkspace
          schoolName={school?.organization?.name || membership.name}
          organizationId={schoolId}
          activeTab={schoolAdminTab as any}
          activeSubTab={route.tab || ""}
          onTabChange={(tab) => {
            updateDashboardUrl({
              orgSlug: membership.slug || membership.name,
              role: "school_admin",
              section: tab,
              academicYear: route.academicYear,
            });
          }}
          onSubTabChange={(tab, subTab) => {
            updateDashboardUrl({
              orgSlug: membership.slug || membership.name,
              role: "school_admin",
              section: tab,
              tab: subTab,
              academicYear: route.academicYear,
            });
          }}
          onOpenAction={(act) => setAction(act as Action)}
          onLogout={signOut}
        />
      </div>

      {action && school?.organization && (
        <ActionModal
          action={action}
          school={school}
          busy={busy}
          onClose={() => setAction(null)}
          onSubmit={(body) => {
            const root = `/organizations/${schoolId}`;
            const academics = `${root}/academics`;
            if (action === "school")
              return mutate(
                () => updateResource(root, body),
                "School settings updated",
              );
            if (action === "invite") {
              setBusy(true);
              setError("");
              createResource<{
                invitations: {
                  token: string;
                  email: string;
                  expiresAt: string;
                }[];
              }>(`${root}/invitations`, body)
                .then(async (result) => {
                  setInvitation(result.invitations[0]);
                  setAction(null);
                  await refresh();
                })
                .catch((reason) => setError(reason.message))
                .finally(() => setBusy(false));
              return;
            }
            if (action === "teacherAssignment")
              return mutate(
                () => createResource(`${academics}/teacher-assignments`, body),
                "Teacher assigned",
              );
            if (action === "enrollment")
              return mutate(
                () => createResource(`${academics}/enrollments`, body),
                "Student enrolled",
              );
            return mutate(
              () =>
                createResource(
                  `${academics}/${action === "year" ? "years" : action + "s"}`,
                  body,
                ),
              `${action[0].toUpperCase() + action.slice(1)} created`,
            );
          }}
        />
      )}

      {invitation && (
        <div className="modal-backdrop">
          <section
            className="action-modal token-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="token-title"
          >
            <button
              className="modal-close"
              onClick={() => setInvitation(null)}
              aria-label="Close"
            >
              ×
            </button>
            <span className="success-mark">✓</span>
            <h2 id="token-title">Invitation created</h2>
            <p>
              Deliver this one-time token privately to <b>{invitation.email}</b>
              . EDOPS cannot retrieve it later.
            </p>
            <code>{invitation.token}</code>
            <small>Expires {formatDate(invitation.expiresAt)}</small>
            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() => setInvitation(null)}
              >
                Done
              </button>
              <button
                className="primary-button"
                onClick={() => navigator.clipboard.writeText(invitation.token)}
              >
                Copy token
              </button>
            </div>
          </section>
        </div>
      )}

      {notice && (
        <div className="toast" role="status">
          <span>✓</span>
          {notice}
        </div>
      )}
    </div>
  );
}

export function EdopsLogo({
  size = "sm",
  className = "",
  style,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
  style?: React.CSSProperties;
}) {
  const heights = { sm: "24px", md: "32px", lg: "42px" };
  return (
    <div
      className={`edops-pill-logo ${size} ${className}`.trim()}
      style={style}
      aria-label="EDOPS"
    >
      <img
        src="/EDOPSLogo.png?v=4"
        alt="EDOPS"
        style={{
          height: heights[size] || "24px",
          width: "auto",
          maxWidth: "150px",
          objectFit: "contain",
          display: "block",
          filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.25))",
        }}
      />
    </div>
  );
}

function Brand() {
  return (
    <a className="brand" href="#content" aria-label="EDOPS dashboard">
      <EdopsLogo size="sm" />
    </a>
  );
}
function NavIcon({ id }: { id: string }) {
  const Icon =
    (
      {
        overview: LayoutDashboard,
        principal: ShieldCheck,
        parent: Users,
        academics: GraduationCap,
        people: Users,
        assignments: ClipboardCheck,
        attendance: CalendarCheck2,
        updates: Bell,
        recordings: Video,
        arena: Trophy,
        progress: BarChart3,
        billing: CreditCard,
        settings: SettingsIcon,
        children: Users,
        notices: Bell,
      } as Record<string, typeof LayoutDashboard>
    )[id] ?? BookOpen;
  return <Icon size={18} strokeWidth={1.8} aria-hidden="true" />;
}
function ProfileMenu({
  email,
  role,
  onLogout,
}: {
  email: string;
  role: string;
  onLogout: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const menu = useRef<HTMLDetailsElement>(null);
  return (
    <>
      <details
        className="profile-menu"
        ref={menu}
        onKeyDown={(event) => {
          if (event.key === "Escape" && menu.current) menu.current.open = false;
        }}
      >
        <summary className="avatar" aria-label="Open profile menu">
          <UserRound size={18} aria-hidden="true" />
        </summary>
        <div>
          <header>
            <span>
              <UserRound size={20} />
            </span>
            <div>
              <b>{email}</b>
              <small>{role}</small>
            </div>
          </header>
          <button
            type="button"
            onClick={() => {
              if (menu.current) menu.current.open = false;
              dialog.current?.showModal();
            }}
          >
            <ShieldCheck size={16} /> My profile
          </button>
          <button type="button" onClick={onLogout}>
            <LogOut size={16} /> Log out
          </button>
        </div>
      </details>
      <dialog
        ref={dialog}
        className="profile-dialog"
        aria-labelledby="profile-heading"
      >
        <form method="dialog">
          <button className="secondary-button">Close</button>
        </form>
        <span className="profile-portrait">
          <UserRound size={32} />
        </span>
        <p className="section-kicker">Your EDOPS account</p>
        <h2 id="profile-heading">My profile</h2>
        <dl>
          <div>
            <dt>Email address</dt>
            <dd>{email}</dd>
          </div>
          <div>
            <dt>Current role</dt>
            <dd>{role}</dd>
          </div>
        </dl>
        <p>Your school manages your membership and class access.</p>
      </dialog>
    </>
  );
}
function LoadingScreen() {
  return (
    <div
      className="loading-screen animate-pulse"
      style={{
        height: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "18px",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0b0f19",
      }}
      role="status"
      aria-label="Loading..."
    >
      <img
        src="/EDOPSLogo.png?v=4"
        alt="EDOPS"
        style={{
          height: "52px",
          width: "auto",
          maxWidth: "220px",
          objectFit: "contain",
          filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.4))",
        }}
      />
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <div
          style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            backgroundColor: "#6366f1",
            animation: "edops-dots 1.3s infinite ease-in-out both",
            animationDelay: "0ms",
          }}
        />
        <div
          style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            backgroundColor: "#818cf8",
            animation: "edops-dots 1.3s infinite ease-in-out both",
            animationDelay: "180ms",
          }}
        />
        <div
          style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            backgroundColor: "#a5b4fc",
            animation: "edops-dots 1.3s infinite ease-in-out both",
            animationDelay: "360ms",
          }}
        />
      </div>
      <style>{`
        @keyframes edops-dots {
          0%, 80%, 100% {
            transform: scale(0.65);
            opacity: 0.3;
          }
          40% {
            transform: scale(1.15);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton">
      <div />
      <div />
      <div />
      <div />
    </div>
  );
}

function WorkspaceSelect({
  profile,
  value,
  onChange,
}: {
  profile: Profile;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <select
      className="school-select"
      aria-label="Current workspace"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {profile.user.isPlatformAdmin && (
        <option value="platform">EDOPS Platform — Platform admin</option>
      )}
      {profile.organizations.map((item) => (
        <option key={item.id} value={item.id}>
          {item.name} — {roleNames[item.role]}
        </option>
      ))}
    </select>
  );
}

function getSubjectIcon(name: string, index: number) {
  const lower = name.toLowerCase().trim();
  if (
    lower.includes("machine") ||
    lower.includes("learn") ||
    lower.includes("ai") ||
    lower === "ml" ||
    lower.includes("intel")
  ) {
    return <Sparkles size={17} strokeWidth={1.8} />;
  }
  if (
    lower.includes("data") ||
    lower.includes("struct") ||
    lower.includes("db") ||
    lower.includes("sql") ||
    lower === "ds" ||
    lower === "dbms"
  ) {
    return <Database size={17} strokeWidth={1.8} />;
  }
  if (
    lower.includes("math") ||
    lower.includes("algo") ||
    lower.includes("stat") ||
    lower.includes("calc") ||
    lower.includes("net") ||
    lower.includes("logic")
  ) {
    return <Network size={17} strokeWidth={1.8} />;
  }
  const icons = [
    <Sparkles size={17} key="s" />,
    <Database size={17} key="d" />,
    <Network size={17} key="n" />,
    <BookOpen size={17} key="b" />,
  ];
  return icons[index % icons.length];
}

function RoleWorkspace({
  profile,
  membership,
  workspace,
  onWorkspace,
  onLogout,
}: {
  profile: Profile;
  membership: OrganizationSummary & { role: MemberRole };
  workspace: string;
  onWorkspace: (value: string) => void;
  onLogout: () => void;
}) {
  const config = rolePanels[membership.role];
  const navigation = useDashboardNavigation(membership.id, membership.role);
  const parentSections =
    membership.role === "parent"
      ? navigation.sections
          .map((section) => ({
            ...section,
            panels: section.items.flatMap((item) => {
              const source = config.panels.find(
                (panel) => panel.id === item.key.split(".").at(-1),
              );
              return source ? [{ ...source, label: item.label }] : [];
            }),
          }))
          .filter((section) => section.panels.length)
      : [];
  const panels =
    membership.role === "parent"
      ? parentSections.flatMap((section) => section.panels)
      : config.panels;
  const [panelId, setPanelId] = useState("overview");
  const [initialClassKey, setInitialClassKey] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [data, setData] = useState<RoleWorkspaceData | null>(null);
  const [loading, setLoading] = useState(membership.role !== "parent");
  const [error, setError] = useState("");
  const panel =
    panels.find((item) => item.id === panelId) ?? panels[0] ?? config.panels[0];

  const studentSubjects: { id: string; name: string; code: string }[] =
    useMemo(() => {
      const d = data as any;
      if (d?.subjects && d.subjects.length > 0) {
        return d.subjects.map((item: any) => {
          const name =
            item.subjectName ||
            item.name ||
            item.title ||
            item.subjectCode ||
            "Subject";
          return {
            id: item.subjectId || item.id || item.subjectCode || name,
            name,
            code: item.subjectCode || "",
          };
        });
      }
      return [];
    }, [data]);

  useEffect(() => {
    setLoading(true);
    setError("");
    loadRoleWorkspace(membership.id)
      .then(setData)
      .catch((reason) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Academic records could not be loaded",
        ),
      )
      .finally(() => setLoading(false));
  }, [membership.id, membership.role]);
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#F7F8FA",
        fontFamily: 'var(--font-space-grotesk), "Inter", system-ui, sans-serif',
      }}
    >
      {/* ─── Admin-Style Charcoal Sidebar ─────────────────────────── */}
      <aside
        style={{
          width: "228px",
          flexShrink: 0,
          background: "#111318",
          borderRight: "1px solid #1E2128",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          position: "sticky",
          top: 0,
          overflowY: "auto",
          overflowX: "hidden",
          scrollbarWidth: "none",
          zIndex: 40,
        }}
      >
        {/* Brand Logo - 68px height matching design standards */}
        <div
          style={{
            height: "68px",
            display: "flex",
            alignItems: "center",
            padding: "0 18px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            boxSizing: "border-box",
            gap: "10px",
            flexShrink: 0,
          }}
        >
          <img
            src="/EDOPSLogo.png"
            alt="EDOPS"
            style={{
              height: "36px",
              width: "auto",
              maxWidth: "140px",
              display: "block",
              objectFit: "contain",
              filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.35))",
            }}
          />
        </div>

        {/* Navigation Items */}
        <nav
          style={{
            flex: 1,
            padding: "8px 8px 12px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
        >
          {membership.role === "parent"
            ? parentSections.map((section) => (
                <div
                  key={section.key}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                  }}
                >
                  <div
                    style={{
                      padding: "16px 14px 4px",
                      fontSize: "10px",
                      fontWeight: 600,
                      color: "#444750",
                      letterSpacing: "0.07em",
                      textTransform: "uppercase",
                    }}
                  >
                    {section.label}
                  </div>
                  {section.panels.map((item) => {
                    const isActive = panel.id === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setPanelId(item.id)}
                        style={{
                          all: "unset",
                          boxSizing: "border-box",
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: "9px",
                          padding: "7px 12px 7px 14px",
                          borderRadius: "7px",
                          cursor: "pointer",
                          position: "relative",
                          background: isActive ? "#1E2128" : "transparent",
                          transition: "background 0.12s",
                        }}
                      >
                        {isActive && (
                          <span
                            style={{
                              position: "absolute",
                              left: 0,
                              top: "50%",
                              transform: "translateY(-50%)",
                              width: "2px",
                              height: "16px",
                              borderRadius: "0 2px 2px 0",
                              background: "#FFFFFF",
                            }}
                          />
                        )}
                        <span
                          style={{
                            color: isActive ? "#FFFFFF" : "#8C909A",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <NavIcon id={item.id} />
                        </span>
                        <span
                          style={{
                            fontSize: "13px",
                            fontWeight: isActive ? 600 : 400,
                            color: isActive ? "#FFFFFF" : "#8C909A",
                          }}
                        >
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))
            : panels.map((item) => {
                const isActive = panel.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setPanelId(item.id)}
                    style={{
                      all: "unset",
                      boxSizing: "border-box",
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "9px",
                      padding: "7px 12px 7px 14px",
                      borderRadius: "7px",
                      cursor: "pointer",
                      position: "relative",
                      background: isActive ? "#1E2128" : "transparent",
                      transition: "background 0.12s",
                    }}
                  >
                    {isActive && (
                      <span
                        style={{
                          position: "absolute",
                          left: 0,
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: "2px",
                          height: "16px",
                          borderRadius: "0 2px 2px 0",
                          background: "#FFFFFF",
                        }}
                      />
                    )}
                    <span
                      style={{
                        color: isActive ? "#FFFFFF" : "#8C909A",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <NavIcon id={item.id} />
                    </span>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? "#FFFFFF" : "#8C909A",
                      }}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
        </nav>
      </aside>

      {/* ─── Main Content Canvas ─────────────────────────────────── */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          minHeight: "100vh",
          overflow: "auto",
        }}
      >
        {/* Sticky Top Header Bar */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 30,
            height: "68px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 28px",
            background: "#FFFFFF",
            borderBottom: "1px solid #EAECF0",
            gap: "16px",
            flexShrink: 0,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1
              style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: 600,
                color: "#101828",
                letterSpacing: "-0.02em",
              }}
            >
              {panel.title}
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <NotificationBellDropdown
              organizationId={membership.id}
              role={membership.role as any}
              buttonStyle={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "#F9FAFB",
                border: "1px solid #EAECF0",
                color: "#101828",
              }}
              iconSize={17}
            />
            <WorkspaceSelect
              profile={profile}
              value={workspace}
              onChange={onWorkspace}
            />
            <ProfileMenu
              email={profile.user.email}
              role={roleNames[membership.role]}
              onLogout={onLogout}
            />
          </div>
        </header>

        {/* Content Body Container */}
        <div style={{ padding: "24px 28px", flex: 1 }}>
          {membership.status === "suspended" && (
            <div
              style={{
                background: "#FEF3F2",
                color: "#B42318",
                border: "1px solid #FECDCA",
                padding: "12px 16px",
                borderRadius: "8px",
                marginBottom: "16px",
              }}
              role="alert"
            >
              <b>This school workspace is suspended.</b> Contact a school or
              platform administrator to restore access.
            </div>
          )}
          {error && (
            <div
              style={{
                background: "#FEF3F2",
                color: "#B42318",
                border: "1px solid #FECDCA",
                padding: "12px 16px",
                borderRadius: "8px",
                marginBottom: "16px",
              }}
              role="alert"
            >
              <b>Couldn’t load your academic records.</b> <span>{error}</span>
            </div>
          )}

          {membership.role === "parent" ? (
            navigation.loading || loading ? (
              <DashboardSkeleton />
            ) : navigation.error ? (
              <div role="alert" style={{ color: "#B42318" }}>
                {navigation.error}
              </div>
            ) : !panels.length ? (
              <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "#475467",
                }}
              >
                <h3>No parent features are enabled for this school.</h3>
              </div>
            ) : (
              <ParentDashboard
                view={
                  panel.id as "overview" | "children" | "attendance" | "notices"
                }
                children={data?.role === "parent" ? data.children : []}
                messages={data?.role === "parent" ? data.messages : []}
              />
            )
          ) : (
            <>
              {loading && !data ? (
                <DashboardSkeleton />
              ) : panel.id === "overview" ? (
                <>
                  <DashboardHome
                    organizationId={membership.id}
                    role={membership.role}
                    selectedSubject={selectedSubject}
                    onSelectSubject={setSelectedSubject}
                    onNavigate={(tab, classKey) => {
                      setInitialClassKey(classKey ?? "");
                      setPanelId(tab);
                    }}
                  />
                  <details
                    className="academic-details"
                    style={{ marginTop: "24px" }}
                  >
                    <summary
                      style={{
                        cursor: "pointer",
                        fontWeight: 600,
                        color: "#101828",
                      }}
                    >
                      My academic details
                    </summary>
                    {data && <RoleAcademicData data={data} />}
                  </details>
                </>
              ) : (
                <LearningWorkspace
                  key={panel.id}
                  initialClassKey={initialClassKey}
                  organizationId={membership.id}
                  role={membership.role}
                  initialTab={
                    panel.id as
                      | "assignments"
                      | "attendance"
                      | "updates"
                      | "recordings"
                      | "arena"
                      | "progress"
                  }
                  hideTabs
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function RoleAcademicData({ data }: { data: RoleWorkspaceData }) {
  if (data.role === "teacher")
    return (
      <div className="content-stack">
        <ReadOnlySection
          title="My teaching assignments"
          empty="No section or subject has been assigned to you yet."
          rows={data.assignments.map((item) => [
            item.subjectName,
            item.sectionName,
            item.subjectCode,
          ])}
        />
        <ReadOnlySection
          title="Students in my sections"
          empty="No active students are enrolled in your assigned sections yet."
          rows={data.students.map((item) => [
            item.email,
            item.sectionName,
            `Roll ${item.rollNumber}`,
          ])}
        />
      </div>
    );
  if (data.role === "parent")
    return (
      <div className="content-stack">
        <p>Parent academic details are shown in the Parent Hub above.</p>
      </div>
    );
  const enrollment = data.enrollment;
  return (
    <div className="content-stack">
      <ReadOnlySection
        title="My enrollment"
        empty="You do not have an active section enrollment yet."
        rows={
          enrollment
            ? [
                [
                  enrollment.sectionName,
                  `${enrollment.programName} · ${enrollment.academicYearName}`,
                  `Roll ${enrollment.rollNumber}`,
                ],
              ]
            : []
        }
      />
      <ReadOnlySection
        title="My subjects and teachers"
        empty="No teachers have been assigned to subjects in your section yet."
        rows={data.subjects.map((item) => [
          item.subjectName,
          item.teacherEmail,
          item.subjectCode,
        ])}
      />
    </div>
  );
}

function ReadOnlySection({
  title,
  empty,
  rows,
}: {
  title: string;
  empty: string;
  rows: string[][];
}) {
  return (
    <section className="data-card">
      <div className="data-head">
        <h2>{title}</h2>
        <span className="table-pill">Live</span>
      </div>
      {rows.length ? (
        <div className="simple-table">
          {rows.map((row, index) => (
            <div key={`${row[0]}-${index}`}>
              <b>{row[0]}</b>
              <span>{row[1]}</span>
              <small>{row[2]}</small>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span>◇</span>
          <h3>{empty}</h3>
          <p>Ask your school administrator if you believe this is incorrect.</p>
        </div>
      )}
    </section>
  );
}

function PlatformScreen({
  profile,
  workspace,
  onWorkspace,
  onLogout,
}: {
  profile: Profile;
  workspace: string;
  onWorkspace: (value: string) => void;
  onLogout: () => void;
}) {
  const [panel, setPanel] = useState(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path.startsWith("/platform/schools")) return "schools";
      if (path.startsWith("/platform/subscriptions")) return "subscriptions";
      if (path.startsWith("/platform/logs") || path.startsWith("/platform/security")) return "security";
      if (path.startsWith("/platform/support")) return "support";
    }
    return "overview";
  });
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, []);

  const handleSelectPanel = (p: string) => {
    setPanel(p);
    if (typeof window !== "undefined") {
      if (p === "schools") {
        window.history.pushState(null, "", "/platform/schools");
      } else if (p === "overview") {
        window.history.pushState(null, "", "/platform/overview");
      } else {
        window.history.pushState(null, "", `/platform/${p}`);
      }
    }
  };

  return (
    <div className="app-shell platform-shell">
      <header className="topbar">
        <Brand />
        <div className="api-status">
          <span /> EDOPS Super Admin
        </div>
        <div className="top-actions">
          <div
            onClick={() => setSearchOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#FFFFFF",
              border: "1px solid #E2DDD5",
              borderRadius: "10px",
              padding: "4px 12px",
              cursor: "pointer",
            }}
          >
            <Search size={15} style={{ color: "#064E3B", flexShrink: 0 }} />
            <input
              type="text"
              readOnly
              placeholder="Search platform... (⌘K)"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
              style={{
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: "14px",
                width: "180px",
                color: "#064E3B",
                cursor: "pointer",
              }}
            />
            <span style={{ fontSize: "11px", color: "#6B7280", background: "#F3F4F6", padding: "1px 6px", borderRadius: "4px", border: "1px solid #E5E7EB", fontWeight: 600 }}>⌘K</span>
          </div>
          <NotificationBellDropdown
            organizationId=""
            role="platform"
            onNavigate={(panel) => handleSelectPanel(panel as any)}
            buttonStyle={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "#F3F4F6",
              border: "1px solid #E5E7EB",
              color: "#064E3B",
            }}
            iconSize={18}
            iconColor="#064E3B"
          />
          {profile.organizations.length > 0 && (
            <WorkspaceSelect
              profile={profile}
              value={workspace}
              onChange={onWorkspace}
            />
          )}
          <ProfileMenu
            email={profile.user.email}
            role="Platform administrator"
            onLogout={onLogout}
          />
        </div>
      </header>
      <aside className="sidebar" aria-label="Platform navigation">
        <div className="nav-section">
          <p className="eyebrow">Platform administration</p>
          <button
            className={panel === "overview" ? "nav-item active" : "nav-item"}
            onClick={() => handleSelectPanel("overview")}
          >
            <span>
              <LayoutDashboard size={18} />
            </span>
            Platform Overview
          </button>
          <button
            className={panel === "schools" ? "nav-item active" : "nav-item"}
            onClick={() => handleSelectPanel("schools")}
          >
            <span>
              <Building2 size={18} />
            </span>
            Tenants & Schools
          </button>
          <button
            className={
              panel === "subscriptions" ? "nav-item active" : "nav-item"
            }
            onClick={() => handleSelectPanel("subscriptions")}
          >
            <span>
              <CreditCard size={18} />
            </span>
            Global Subscriptions
          </button>
          <button
            className={(panel === "logs" || panel === "security") ? "nav-item active" : "nav-item"}
            onClick={() => handleSelectPanel("security")}
          >
            <span>
              <Database size={18} />
            </span>
            Security & Logs
          </button>
          <button
            className={panel === "support" ? "nav-item active" : "nav-item"}
            onClick={() => handleSelectPanel("support")}
          >
            <span>
              <ShieldCheck size={18} />
            </span>
            Support & Notices
          </button>
        </div>
      </aside>
      <main id="content" className="main-content">
        <section className="welcome-row" style={{ marginBottom: "20px" }}>
          <div>
            <h1>Dashboard</h1>
            <p>
              Manage your schools, subscription plans, and billing in one place.
            </p>
          </div>
        </section>
        {profile.user.isPlatformAdmin ? (
          <PlatformWorkspace
            activePanel={panel}
            onSelectPanel={handleSelectPanel}
          />
        ) : (
          <div className="error-banner">
            Your account has no school membership. Ask a platform administrator
            for an invitation.
          </div>
        )}
      </main>
      <GlobalPortalSearch
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        role="platform"
        onNavigate={(p) => handleSelectPanel(p)}
      />
    </div>
  );
}

function Overview({
  school,
  setup,
  completed,
  teachers,
  students,
  activeEnrollments,
  onAction,
}: {
  school: SchoolData;
  setup: readonly (readonly [string, boolean])[];
  completed: number;
  teachers: number;
  students: number;
  activeEnrollments: number;
  onAction: (action: Action) => void;
}) {
  const next = setup.find((item) => !item[1]);
  return (
    <>
      <section className="metric-grid">
        <Metric
          label="Teachers"
          value={teachers}
          note="Active memberships"
          tone="indigo"
          icon="♙"
        />
        <Metric
          label="Students"
          value={students}
          note="Active memberships"
          tone="teal"
          icon="◎"
        />
        <Metric
          label="Sections"
          value={school.sections.total}
          note={`${school.programs.total} programs`}
          tone="orange"
          icon="▤"
        />
        <Metric
          label="Enrollments"
          value={activeEnrollments}
          note="Active records"
          tone="rose"
          icon="✓"
        />
      </section>
      <section className="setup-banner">
        <div className="setup-mark">
          <span>{completed}</span>
          <small>/6</small>
        </div>
        <div className="setup-copy">
          <p className="banner-kicker">School readiness</p>
          <h2>
            {completed === 6
              ? "Your school foundation is complete."
              : `${6 - completed} setup ${6 - completed === 1 ? "step" : "steps"} remaining.`}
          </h2>
          <p>
            {next
              ? `Next: ${next[0]}.`
              : "Academic structure and roster are ready."}
          </p>
        </div>
        <div className="setup-actions">
          <div className="progress-track">
            <span style={{ width: `${(completed / 6) * 100}%` }} />
          </div>
          <button
            onClick={() =>
              onAction(
                next?.[0] === "Current academic year"
                  ? "year"
                  : next?.[0] === "Programs"
                    ? "program"
                    : next?.[0] === "Subjects"
                      ? "subject"
                      : next?.[0] === "Sections"
                        ? "section"
                        : next
                          ? "invite"
                          : "school",
              )
            }
          >
            {next ? "Continue setup" : "Review settings"} <span>→</span>
          </button>
        </div>
      </section>
      <div className="dashboard-grid">
        <section className="feed">
          <div className="feed-head">
            <div>
              <h2>Academic structure</h2>
              <p>Live records from the EDOPS API</p>
            </div>
          </div>
          <RecordRows school={school} />
        </section>
        <aside className="right-rail">
          <section
            className="rail-card quick-actions-card"
            style={{
              background: "#FFFFFF",
              border: "1px solid #E2DDD5",
              borderRadius: "10px",
              padding: "18px",
              boxShadow: "0 1px 3px rgba(6,78,59,0.03)",
            }}
          >
            <div className="rail-heading">
              <div style={{ marginBottom: "12px" }}>
                <h2
                  style={{
                    fontSize: "16px",
                    fontWeight: 800,
                    margin: 0,
                    color: "#064E3B",
                  }}
                >
                  Quick Actions
                </h2>
              </div>
            </div>
            <div style={{ display: "grid", gap: "10px" }}>
              <button
                type="button"
                className="primary-button"
                onClick={() => onAction("invite")}
                style={{
                  width: "100%",
                  background: "#064E3B",
                  borderColor: "#064E3B",
                  color: "#F8E7C9",
                  justifyContent: "center",
                  fontWeight: 700,
                }}
              >
                Invite person
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => onAction("section")}
                style={{
                  width: "100%",
                  background: "#064E3B",
                  borderColor: "#064E3B",
                  color: "#F8E7C9",
                  justifyContent: "center",
                  fontWeight: 700,
                }}
              >
                Create section
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => onAction("year")}
                style={{
                  width: "100%",
                  background: "#064E3B",
                  borderColor: "#064E3B",
                  color: "#F8E7C9",
                  justifyContent: "center",
                  fontWeight: 700,
                }}
              >
                Add year
              </button>
            </div>
          </section>
          <section className="rail-card">
            <div className="rail-heading">
              <div>
                <p className="eyebrow">Setup checklist</p>
                <h2>{completed} of 6 complete</h2>
              </div>
            </div>
            <div className="check-list">
              {setup.map(([label, done]) => (
                <div key={label}>
                  <span className={done ? "complete" : ""}>
                    {done ? "✓" : "○"}
                  </span>
                  <b>{label}</b>
                  <small>{done ? "Ready" : "Required"}</small>
                </div>
              ))}
            </div>
          </section>
          <section className="rail-card">
            <div className="rail-heading">
              <div>
                <p className="eyebrow">School details</p>
                <h2>{school.organization.name}</h2>
              </div>
            </div>
            <dl className="detail-list">
              <div>
                <dt>Status</dt>
                <dd>
                  <span className="live-dot" />
                  {school.organization.status}
                </dd>
              </div>
              <div>
                <dt>Timezone</dt>
                <dd>{school.organization.timeZone}</dd>
              </div>
              <div>
                <dt>Locale</dt>
                <dd>{school.organization.locale}</dd>
              </div>
              <div>
                <dt>Slug</dt>
                <dd>{school.organization.slug}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </>
  );
}

function Metric({
  label,
  value,
  note,
  tone,
  icon,
}: {
  label: string;
  value: number;
  note: string;
  tone: string;
  icon: string;
}) {
  const id =
    label === "Teachers" || label === "Students"
      ? "people"
      : label === "Enrollments"
        ? "assignments"
        : "academics";
  return (
    <article className="metric-card">
      <div>
        <p>{label}</p>
        <strong>{value.toLocaleString()}</strong>
      </div>
      <span className={`metric-icon ${tone}`} aria-hidden="true">
        <NavIcon id={id} />
      </span>
      <small>{note}</small>
    </article>
  );
}
function RecordRows({ school }: { school: SchoolData }) {
  const rows = [
    {
      label: "Academic years",
      value: school.years.total,
      detail:
        school.years.items.find((item) => item.isCurrent)?.name ??
        "No current year",
    },
    {
      label: "Programs",
      value: school.programs.total,
      detail:
        school.programs.items
          .slice(0, 3)
          .map((item) => item.name)
          .join(", ") || "None created",
    },
    {
      label: "Subjects",
      value: school.subjects.total,
      detail:
        school.subjects.items
          .slice(0, 3)
          .map((item) => item.code)
          .join(", ") || "None created",
    },
    {
      label: "Teacher assignments",
      value: school.assignments.total,
      detail: "Section and subject links",
    },
    {
      label: "Invitation batches",
      value: school.batches.total,
      detail: "Roster provisioning batches",
    },
  ];
  return (
    <div className="record-rows">
      {rows.map((row) => (
        <div key={row.label}>
          <span className="record-icon">{row.label[0]}</span>
          <div>
            <b>{row.label}</b>
            <p>{row.detail}</p>
          </div>
          <strong>{row.value}</strong>
        </div>
      ))}
    </div>
  );
}

function Academics({
  school,
  onAction,
}: {
  school: SchoolData;
  onAction: (action: Action) => void;
}) {
  return (
    <div className="content-stack">
      <DataSection
        title="Academic years"
        action="Add year"
        onAction={() => onAction("year")}
        empty="No academic years yet."
        rows={school.years.items.map((item) => [
          item.name,
          `${item.startDate} – ${item.endDate}`,
          item.isCurrent ? "Current" : "Not current",
        ])}
      />
      <DataSection
        title="Programs"
        action="Add program"
        onAction={() => onAction("program")}
        empty="No programs yet."
        rows={school.programs.items.map((item) => [
          item.name,
          `Sequence ${item.sequenceOrder}`,
          "Program",
        ])}
      />
      <DataSection
        title="Subjects"
        action="Add subject"
        onAction={() => onAction("subject")}
        empty="No subjects yet."
        rows={school.subjects.items.map((item) => [
          item.name,
          item.code,
          "Subject",
        ])}
      />
      <DataSection
        title="Sections"
        action="Add section"
        onAction={() => onAction("section")}
        empty="No sections yet."
        rows={school.sections.items.map((item) => [
          item.name,
          programName(school.programs.items, item.programId),
          `Capacity ${item.capacity}`,
        ])}
      />
      <DataSection
        title="Teacher assignments"
        action="Assign teacher"
        onAction={() => onAction("teacherAssignment")}
        empty="No teachers assigned yet."
        rows={school.assignments.items.map((item) => [
          memberEmail(school.members.items, item.teacherUserId),
          `${sectionName(school, item.sectionId)} · ${subjectName(school, item.subjectId)}`,
          "Teacher",
        ])}
      />
      <DataSection
        title="Student enrollments"
        action="Enroll student"
        onAction={() => onAction("enrollment")}
        empty="No students enrolled yet."
        rows={school.enrollments.items.map((item) => [
          memberEmail(school.members.items, item.studentUserId),
          sectionName(school, item.sectionId),
          `${item.rollNumber} · ${item.status}`,
        ])}
      />
    </div>
  );
}
function People({
  members,
  onInvite,
  onStatus,
}: {
  members: Member[];
  onInvite: () => void;
  onStatus: (member: Member) => void;
}) {
  return (
    <section className="data-card">
      <div className="data-head">
        <div>
          <h2>Teachers and students</h2>
          <p>Manage the people who can use this school workspace.</p>
        </div>
        <button className="primary-button" onClick={onInvite}>
          ＋ Invite person
        </button>
      </div>
      {members.length ? (
        <div className="member-table member-actions-table">
          <div className="table-head">
            <span>Person</span>
            <span>Role</span>
            <span>Membership</span>
            <span>Account</span>
            <span>Actions</span>
          </div>
          {members.map((member) => (
            <div key={member.userId}>
              <span>
                <b>{member.email}</b>
                <small>{member.userId}</small>
              </span>
              <span className="table-pill">{member.role}</span>
              <span className={`table-pill ${member.status}`}>
                {member.status}
              </span>
              <span>{member.accountActive ? "Active" : "Inactive"}</span>
              <span>
                <button
                  className="secondary-button"
                  onClick={() => onStatus(member)}
                >
                  {member.status === "active" ? "Deactivate" : "Activate"}
                </button>
              </span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No teachers or students"
          copy="Invite your first person to begin building the school roster."
          action="Invite person"
          onAction={onInvite}
        />
      )}
    </section>
  );
}
function Settings({
  organization,
  onEdit,
}: {
  organization: Organization;
  onEdit: () => void;
}) {
  return (
    <section className="data-card settings-card">
      <div className="data-head">
        <div>
          <h2>School profile</h2>
          <p>Settings stored for this organization.</p>
        </div>
        <button className="secondary-button" onClick={onEdit}>
          Edit settings
        </button>
      </div>
      <dl className="settings-grid">
        <div>
          <dt>School name</dt>
          <dd>{organization.name}</dd>
        </div>
        <div>
          <dt>Organization ID</dt>
          <dd>
            <code>{organization.id}</code>
          </dd>
        </div>
        <div>
          <dt>Slug</dt>
          <dd>{organization.slug}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{organization.status}</dd>
        </div>
        <div>
          <dt>Timezone</dt>
          <dd>{organization.timeZone}</dd>
        </div>
        <div>
          <dt>Locale</dt>
          <dd>{organization.locale}</dd>
        </div>
        <div>
          <dt>Created</dt>
          <dd>{formatDate(organization.createdAt)}</dd>
        </div>
        <div>
          <dt>Last updated</dt>
          <dd>{formatDate(organization.updatedAt)}</dd>
        </div>
      </dl>
    </section>
  );
}
function DataSection({
  title,
  action,
  onAction,
  empty,
  rows,
}: {
  title: string;
  action: string;
  onAction: () => void;
  empty: string;
  rows: string[][];
}) {
  return (
    <section className="data-card">
      <div className="data-head">
        <h2>{title}</h2>
        <button className="secondary-button" onClick={onAction}>
          ＋ {action}
        </button>
      </div>
      {rows.length ? (
        <div className="simple-table">
          {rows.map((row, index) => (
            <div key={`${row[0]}-${index}`}>
              <b>{row[0]}</b>
              <span>{row[1]}</span>
              <small>{row[2]}</small>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title={empty}
          copy="Create the first record to continue school setup."
          action={action}
          onAction={onAction}
        />
      )}
    </section>
  );
}
function EmptyState({
  title,
  copy,
  action,
  onAction,
}: {
  title: string;
  copy: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="empty-state">
      <span>＋</span>
      <h3>{title}</h3>
      <p>{copy}</p>
      <button className="primary-button" onClick={onAction}>
        {action}
      </button>
    </div>
  );
}
function programName(programs: Program[], id: string) {
  return programs.find((item) => item.id === id)?.name ?? "Unknown program";
}
function memberEmail(members: Member[], id: string) {
  return members.find((item) => item.userId === id)?.email ?? "Unknown member";
}
function sectionName(school: SchoolData, id: string) {
  return (
    school.sections.items.find((item) => item.id === id)?.name ??
    "Unknown section"
  );
}
function subjectName(school: SchoolData, id: string) {
  return (
    school.subjects.items.find((item) => item.id === id)?.name ??
    "Unknown subject"
  );
}

function ActionModal({
  action,
  school,
  busy,
  onClose,
  onSubmit,
}: {
  action: Exclude<Action, null>;
  school: SchoolData;
  busy: boolean;
  onClose: () => void;
  onSubmit: (body: Record<string, unknown>) => void;
}) {
  const labels = {
    year: "Academic year",
    program: "Program",
    subject: "Subject",
    section: "Section",
    teacherAssignment: "Assign teacher",
    enrollment: "Enroll student",
    invite: "Invite person",
    school: "School settings",
  };
  const activeTeachers = school.members.items.filter(
    (item) =>
      item.role === "teacher" && item.status === "active" && item.accountActive,
  );
  const activeStudents = school.members.items.filter(
    (item) =>
      item.role === "student" && item.status === "active" && item.accountActive,
  );
  const canSubmit =
    action === "teacherAssignment"
      ? Boolean(
          activeTeachers.length &&
          school.sections.total &&
          school.subjects.total,
        )
      : action === "enrollment"
        ? Boolean(activeStudents.length && school.sections.total)
        : true;
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    let body: Record<string, unknown> = data;
    if (action === "year")
      body = { ...data, isCurrent: data.isCurrent === "on" };
    if (action === "program")
      body = {
        name: data.name,
        sequenceOrder: Number(data.sequenceOrder || 0),
      };
    if (action === "section")
      body = { ...data, capacity: Number(data.capacity) };
    onSubmit(body);
  }
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="action-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <p className="eyebrow">EDOPS setup</p>
        <h2 id="modal-title">{labels[action]}</h2>
        <form className="modal-form" onSubmit={submit}>
          {action === "year" && (
            <>
              <label>
                Name
                <input
                  name="name"
                  required
                  maxLength={120}
                  placeholder="2026–27"
                />
              </label>
              <div className="form-grid">
                <label>
                  Start date
                  <input name="startDate" type="date" required />
                </label>
                <label>
                  End date
                  <input name="endDate" type="date" required />
                </label>
              </div>
              <label className="checkbox">
                <input name="isCurrent" type="checkbox" /> Set as current
                academic year
              </label>
            </>
          )}
          {action === "program" && (
            <>
              <label>
                Program name
                <input
                  name="name"
                  required
                  maxLength={120}
                  placeholder="Grade 10"
                />
              </label>
              <label>
                Sequence order
                <input
                  name="sequenceOrder"
                  type="number"
                  min="0"
                  max="10000"
                  defaultValue="0"
                />
              </label>
            </>
          )}
          {action === "subject" && (
            <>
              <label>
                Subject name
                <input
                  name="name"
                  required
                  maxLength={120}
                  placeholder="Mathematics"
                />
              </label>
              <label>
                Subject code
                <input
                  name="code"
                  required
                  maxLength={32}
                  pattern="[A-Za-z0-9][A-Za-z0-9_-]*"
                  placeholder="MATH"
                />
              </label>
            </>
          )}
          {action === "section" && (
            <>
              <label>
                Academic year
                <select name="academicYearId" required defaultValue="">
                  <option value="" disabled>
                    Select year
                  </option>
                  {school.years.items.map((item: AcademicYear) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Program
                <select name="programId" required defaultValue="">
                  <option value="" disabled>
                    Select program
                  </option>
                  {school.programs.items.map((item: Program) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="form-grid">
                <label>
                  Section name
                  <input
                    name="name"
                    required
                    maxLength={120}
                    placeholder="10-A"
                  />
                </label>
                <label>
                  Capacity
                  <input
                    name="capacity"
                    type="number"
                    min="1"
                    max="5000"
                    required
                  />
                </label>
              </div>
            </>
          )}
          {action === "teacherAssignment" && (
            <>
              <label>
                Teacher
                <select name="teacherUserId" required defaultValue="">
                  <option value="" disabled>
                    Select teacher
                  </option>
                  {activeTeachers.map((item) => (
                    <option key={item.userId} value={item.userId}>
                      {item.email}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Section
                <select name="sectionId" required defaultValue="">
                  <option value="" disabled>
                    Select section
                  </option>
                  {school.sections.items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Subject
                <select name="subjectId" required defaultValue="">
                  <option value="" disabled>
                    Select subject
                  </option>
                  {school.subjects.items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.code})
                    </option>
                  ))}
                </select>
              </label>
              {!canSubmit && (
                <p className="form-note">
                  Create a section and subject, then invite a teacher and wait
                  for the invitation to be accepted.
                </p>
              )}
            </>
          )}
          {action === "enrollment" && (
            <>
              <label>
                Student
                <select name="studentUserId" required defaultValue="">
                  <option value="" disabled>
                    Select student
                  </option>
                  {activeStudents.map((item) => (
                    <option key={item.userId} value={item.userId}>
                      {item.email}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Section
                <select name="sectionId" required defaultValue="">
                  <option value="" disabled>
                    Select section
                  </option>
                  {school.sections.items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Roll number
                <input
                  name="rollNumber"
                  required
                  maxLength={32}
                  placeholder="01"
                />
              </label>
              {!canSubmit && (
                <p className="form-note">
                  Create a section, then invite a student and wait for the
                  invitation to be accepted.
                </p>
              )}
            </>
          )}
          {action === "invite" && (
            <>
              <label>
                Full name{" "}
                <span style={{ color: "var(--accent, #e11d48)" }}>*</span>
                <input
                  name="name"
                  required
                  maxLength={120}
                  placeholder="e.g. Rahul Sharma"
                />
              </label>
              <label>
                Email address{" "}
                <span style={{ color: "var(--accent, #e11d48)" }}>*</span>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="name@school.edu"
                />
              </label>
              <label>
                School role
                <select name="role" defaultValue="teacher">
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                  <option value="principal">Principal</option>
                </select>
              </label>
              <p className="form-note">
                The API returns a private, single-use token. Automatic email
                delivery is not implemented by the backend.
              </p>
            </>
          )}
          {action === "school" && (
            <>
              <label>
                School name
                <input
                  name="name"
                  required
                  defaultValue={school.organization.name}
                />
              </label>
              <label>
                Timezone
                <input
                  name="timeZone"
                  required
                  defaultValue={school.organization.timeZone}
                />
              </label>
              <label>
                Locale
                <select name="locale" defaultValue={school.organization.locale}>
                  <option value="en-IN">English (India)</option>
                  <option value="hi-IN">Hindi (India)</option>
                  <option value="en-US">English (US)</option>
                </select>
              </label>
            </>
          )}
          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="primary-button" disabled={busy || !canSubmit}>
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
