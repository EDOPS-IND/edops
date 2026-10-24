"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  X,
  LayoutDashboard,
  Users,
  GraduationCap,
  Briefcase,
  HeartHandshake,
  Building2,
  BookOpen,
  Calendar,
  CalendarDays,
  CalendarCheck2,
  Award,
  CreditCard,
  MessageSquare,
  Bus,
  ShieldAlert,
  FileText,
  Sliders,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  Layers,
  FileCheck2,
  UserPlus,
  Send,
  DollarSign,
  AlertTriangle,
  History,
  LifeBuoy,
  Loader2,
} from "lucide-react";
import { globalSearch } from "../edops-api";

export interface SearchItem {
  id: string;
  title: string;
  subtitle?: string;
  category: "Navigation" | "Quick Actions" | "Academics" | "Finance" | "Settings" | "System" | "Schools" | "Support" | "Plans";
  keywords: string[];
  icon: React.ElementType;
  iconColor?: string;
  badge?: string;
  onSelect: () => void;
}

interface GlobalPortalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  role: "school_admin" | "teacher" | "student" | "parent" | "platform" | "principal";
  onNavigate: (section: string, subTab?: string) => void;
  onOpenAction?: (action: string) => void;
  onSelectSchool?: (schoolId: string) => void;
  onSelectTicket?: (ticketId: string) => void;
}

export function GlobalPortalSearch({
  isOpen,
  onClose,
  role,
  onNavigate,
  onOpenAction,
  onSelectSchool,
  onSelectTicket,
}: GlobalPortalSearchProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [liveResults, setLiveResults] = useState<SearchItem[]>([]);
  const [isSearchingLive, setIsSearchingLive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global keyboard shortcuts (Cmd+K, Escape)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Live global entity search for Super Admin
  useEffect(() => {
    if (!isOpen || role !== "platform") {
      setLiveResults([]);
      return;
    }
    const q = query.trim();
    if (q.length < 2) {
      setLiveResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingLive(true);
      try {
        const res = await globalSearch(q);
        const items: SearchItem[] = (res?.results || []).map((ent: any) => {
          if (ent.type === "school") {
            return {
              id: `school-${ent.id}`,
              title: ent.name,
              subtitle: `${ent.code || ent.slug} · ${ent.city ? `${ent.city}, ` : ""}${ent.board || "CBSE"} · Status: ${ent.status || "active"}`,
              category: "Schools" as const,
              keywords: [ent.name, ent.slug, ent.code, ent.city, ent.board].filter(Boolean),
              icon: Building2,
              iconColor: "#059669",
              badge: "School",
              onSelect: () => {
                if (onSelectSchool) onSelectSchool(ent.id);
                else onNavigate("schools");
              },
            };
          } else if (ent.type === "ticket") {
            return {
              id: `ticket-${ent.id}`,
              title: `${ent.ticketCode || "Ticket"}: ${ent.subject}`,
              subtitle: `Status: ${ent.status} · Priority: ${ent.priority || "medium"}${ent.category ? ` · ${ent.category}` : ""}`,
              category: "Support" as const,
              keywords: [ent.ticketCode, ent.subject, ent.category].filter(Boolean),
              icon: LifeBuoy,
              iconColor: "#EA580C",
              badge: `Ticket (${ent.status})`,
              onSelect: () => {
                if (onSelectTicket) onSelectTicket(ent.id);
                else onNavigate("support");
              },
            };
          } else if (ent.type === "plan") {
            return {
              id: `plan-${ent.id}`,
              title: `${ent.name} Plan`,
              subtitle: `Subscription Tier · Status: ${ent.active ? "Active" : "Retired"}`,
              category: "Plans" as const,
              keywords: [ent.name, "pricing", "plan", "tier"],
              icon: Layers,
              iconColor: "#7C3AED",
              badge: "Plan",
              onSelect: () => onNavigate("plans"),
            };
          } else if (ent.type === "invoice") {
            return {
              id: `inv-${ent.id}`,
              title: `Invoice / Payment: ${ent.paymentReference || ent.id.slice(0, 8)}`,
              subtitle: `Amount: ${ent.currency || "INR"} ${((ent.amountMinor || 0) / 100).toLocaleString()} · Status: ${ent.status}`,
              category: "Finance" as const,
              keywords: [ent.paymentReference, "invoice", "billing", "payment"].filter(Boolean),
              icon: CreditCard,
              iconColor: "#16A34A",
              badge: "Invoice",
              onSelect: () => onNavigate("billing"),
            };
          } else {
            return {
              id: `ann-${ent.id}`,
              title: ent.title,
              subtitle: `Platform Announcement · Priority: ${ent.priority || "normal"}`,
              category: "Quick Actions" as const,
              keywords: [ent.title, "announcement", "broadcast"],
              icon: MessageSquare,
              iconColor: "#0284C7",
              badge: "Broadcast",
              onSelect: () => onNavigate("support"),
            };
          }
        });
        setLiveResults(items);
      } catch {
        setLiveResults([]);
      } finally {
        setIsSearchingLive(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, isOpen, role, onSelectSchool, onSelectTicket, onNavigate]);

  // Catalog definition for each role
  const catalog: SearchItem[] = useMemo(() => {
    switch (role) {
      case "school_admin":
        return [
          {
            id: "sa-dash",
            title: "Command Center & Dashboard",
            subtitle: "Institutional health score, live campus statistics & operational timeline",
            category: "Navigation",
            keywords: ["dashboard", "home", "metrics", "health", "kpi", "overview", "analytics"],
            icon: LayoutDashboard,
            iconColor: "#2563EB",
            onSelect: () => onNavigate("dashboard"),
          },
          {
            id: "sa-students",
            title: "Students 360 & Enrolled Directory",
            subtitle: "Student rosters, admission numbers, roll codes, guardians & profiles",
            category: "Navigation",
            keywords: ["students", "student 360", "enrollment", "roster", "pupils", "admission"],
            icon: GraduationCap,
            iconColor: "#059669",
            badge: "People",
            onSelect: () => onNavigate("students"),
          },
          {
            id: "sa-teachers",
            title: "Teachers & Faculty Dossier",
            subtitle: "Faculty records, department assignments, workload ratios & attendance",
            category: "Navigation",
            keywords: ["teachers", "faculty", "instructors", "educators", "professors", "workload"],
            icon: Users,
            iconColor: "#2563EB",
            badge: "People",
            onSelect: () => onNavigate("teachers"),
          },
          {
            id: "sa-staff",
            title: "Staff & Administrative Personnel",
            subtitle: "Operational staff, administrative roles and employee roster",
            category: "Navigation",
            keywords: ["staff", "employees", "non-teaching", "admin staff", "hr"],
            icon: Briefcase,
            iconColor: "#D97706",
            badge: "People",
            onSelect: () => onNavigate("staff"),
          },
          {
            id: "sa-parents",
            title: "Parents & Guardians Directory",
            subtitle: "Family contacts, student ward links and communication status",
            category: "Navigation",
            keywords: ["parents", "guardians", "father", "mother", "family", "emergency contact"],
            icon: HeartHandshake,
            iconColor: "#E11D48",
            badge: "People",
            onSelect: () => onNavigate("parents"),
          },
          {
            id: "sa-departments",
            title: "School Academic Departments",
            subtitle: "Science, Humanities, Mathematics and faculty lead assignments",
            category: "Academics",
            keywords: ["departments", "faculties", "department lead", "dept"],
            icon: Building2,
            iconColor: "#7C3AED",
            badge: "Academics",
            onSelect: () => onNavigate("departments"),
          },
          {
            id: "sa-academics-years",
            title: "Academic Years & Calendars",
            subtitle: "Annual school sessions, current active session and date bounds",
            category: "Academics",
            keywords: ["academic year", "ay", "session", "term", "calendar", "school year", "dates"],
            icon: CalendarDays,
            iconColor: "#0284C7",
            badge: "Academics",
            onSelect: () => onNavigate("academics", "structure"),
          },
          {
            id: "sa-academics-sections",
            title: "Classes & Classroom Sections",
            subtitle: "Grade levels, divisions (e.g. 10-A), capacities & room allocation",
            category: "Academics",
            keywords: ["classes", "sections", "programs", "grades", "divisions", "capacity"],
            icon: Layers,
            iconColor: "#0D9488",
            badge: "Academics",
            onSelect: () => onNavigate("academics", "sections"),
          },
          {
            id: "sa-academics-subjects",
            title: "Curriculum Subjects & Course Codes",
            subtitle: "Standard courses, subject codes (e.g. MATH), and syllabus units",
            category: "Academics",
            keywords: ["subjects", "courses", "curriculum", "syllabus", "course codes"],
            icon: BookOpen,
            iconColor: "#D97706",
            badge: "Academics",
            onSelect: () => onNavigate("academics", "subjects"),
          },
          {
            id: "sa-timetable",
            title: "Timetable & Master Schedule",
            subtitle: "Period schedules, room routing, teacher substitutions and conflict detection",
            category: "Academics",
            keywords: ["timetable", "schedule", "periods", "routine", "substitutions", "clash"],
            icon: CalendarCheck2,
            iconColor: "#4F46E5",
            badge: "Schedule",
            onSelect: () => onNavigate("timetable"),
          },
          {
            id: "sa-attendance",
            title: "Attendance & Daily Homeroom Registers",
            subtitle: "Campus turnout percentage, daily section status and defaulter lists",
            category: "Navigation",
            keywords: ["attendance", "register", "present", "absent", "turnout", "daily register"],
            icon: FileCheck2,
            iconColor: "#059669",
            badge: "Attendance",
            onSelect: () => onNavigate("attendance", "daily"),
          },
          {
            id: "sa-leaves",
            title: "Faculty & Staff Leave Approvals",
            subtitle: "Review pending employee leave requests, balances and medical notes",
            category: "Navigation",
            keywords: ["leave", "leave requests", "staff leave", "approvals", "time off", "vacation"],
            icon: Clock,
            iconColor: "#EA580C",
            badge: "Attendance",
            onSelect: () => onNavigate("attendance", "leave"),
          },
          {
            id: "sa-exams",
            title: "Examinations, Plans & Report Cards",
            subtitle: "Standardized exam plans, assessment results, marks registers and scorecards",
            category: "Academics",
            keywords: ["exams", "examinations", "marks", "scores", "gradecards", "report cards", "test"],
            icon: Award,
            iconColor: "#D97706",
            badge: "Exams",
            onSelect: () => onNavigate("examinations"),
          },
          {
            id: "sa-finance-structures",
            title: "Fee Structures & Dues Ledger",
            subtitle: "Tuition fee setup, installments, late fee grace periods and dues calculation",
            category: "Finance",
            keywords: ["fees", "fee structure", "tuition", "dues", "installments", "pricing"],
            icon: CreditCard,
            iconColor: "#059669",
            badge: "Finance",
            onSelect: () => onNavigate("finance", "structures"),
          },
          {
            id: "sa-finance-defaulters",
            title: "Fee Defaulters & Outstanding Balances",
            subtitle: "Overdue accounts (>30 days), arrears tracking and collection reminders",
            category: "Finance",
            keywords: ["defaulters", "overdue", "pending fees", "reminders", "arrears", "unpaid"],
            icon: AlertTriangle,
            iconColor: "#DC2626",
            badge: "Finance",
            onSelect: () => onNavigate("finance", "dues"),
          },
          {
            id: "sa-finance-payments",
            title: "Offline Payments & Receipt Register",
            subtitle: "Record counter cash, bank cheques, RTGS/NEFT receipts and audit trail",
            category: "Finance",
            keywords: ["payments", "receipts", "cash payment", "cheque", "offline payment"],
            icon: DollarSign,
            iconColor: "#16A34A",
            badge: "Finance",
            onSelect: () => onNavigate("finance", "transactions"),
          },
          {
            id: "sa-communication",
            title: "Broadcast Notices & Campus Circulars",
            subtitle: "Targeted school announcements to parents, students and faculty",
            category: "Navigation",
            keywords: ["broadcast", "communication", "announcement", "circular", "notice", "alert"],
            icon: MessageSquare,
            iconColor: "#0284C7",
            onSelect: () => onNavigate("communication"),
          },
          {
            id: "sa-operations",
            title: "Operations, Fleet & Transport Routes",
            subtitle: "School buses, transport vehicles, drivers, inventory and assets",
            category: "Navigation",
            keywords: ["operations", "transport", "bus", "vehicles", "fleet", "inventory", "assets"],
            icon: Bus,
            iconColor: "#CA8A04",
            onSelect: () => onNavigate("operations"),
          },
          {
            id: "sa-discipline",
            title: "Discipline Incidents & Conduct Log",
            subtitle: "Incident reports, behavioral violations, resolutions and parent notifications",
            category: "Navigation",
            keywords: ["discipline", "incident", "behavior", "violation", "suspension", "conduct"],
            icon: ShieldAlert,
            iconColor: "#E11D48",
            onSelect: () => onNavigate("discipline"),
          },
          {
            id: "sa-settings",
            title: "School Profile & General Configuration",
            subtitle: "Official email, phone, timezone, school code, affiliation and address",
            category: "Settings",
            keywords: ["settings", "school profile", "config", "phone", "email", "board", "cbse"],
            icon: Sliders,
            iconColor: "#475569",
            badge: "Settings",
            onSelect: () => onNavigate("settings"),
          },
          {
            id: "sa-audit",
            title: "Administrative Security & Audit Trail",
            subtitle: "Immutable activity log of all school administrative actions and logins",
            category: "Settings",
            keywords: ["audit", "logs", "security", "activity", "history", "compliance"],
            icon: History,
            iconColor: "#64748B",
            badge: "Settings",
            onSelect: () => onNavigate("audit"),
          },
          // Quick Actions
          {
            id: "act-admit",
            title: "Admit Student",
            subtitle: "Open quick admission wizard to enroll a new student into a class section",
            category: "Quick Actions",
            keywords: ["admit student", "enroll student", "new student", "add student", "admission"],
            icon: UserPlus,
            iconColor: "#059669",
            badge: "Action",
            onSelect: () => {
              if (onOpenAction) onOpenAction("addStudent");
            },
          },
          {
            id: "act-teacher",
            title: "Add / Invite Teacher",
            subtitle: "Generate an invite token or register a faculty member",
            category: "Quick Actions",
            keywords: ["add teacher", "invite teacher", "hire teacher", "new teacher", "faculty invite"],
            icon: UserPlus,
            iconColor: "#2563EB",
            badge: "Action",
            onSelect: () => {
              if (onOpenAction) onOpenAction("addTeacher");
            },
          },
          {
            id: "act-section",
            title: "Create Academic Section",
            subtitle: "Add a classroom section to a program (e.g. Class 10 Division A)",
            category: "Quick Actions",
            keywords: ["create section", "add section", "new section", "add class"],
            icon: Layers,
            iconColor: "#7C3AED",
            badge: "Action",
            onSelect: () => {
              if (onOpenAction) onOpenAction("addSection");
            },
          },
          {
            id: "act-year",
            title: "Create Academic Year",
            subtitle: "Define a new school session calendar (e.g. 2026-27)",
            category: "Quick Actions",
            keywords: ["create academic year", "add academic year", "new session", "new year"],
            icon: CalendarDays,
            iconColor: "#0284C7",
            badge: "Action",
            onSelect: () => {
              if (onOpenAction) onOpenAction("year");
            },
          },
          {
            id: "act-broadcast",
            title: "Broadcast Urgent Notice",
            subtitle: "Send instant circular notification across parents, students and staff",
            category: "Quick Actions",
            keywords: ["broadcast notice", "send notice", "circular", "announcement", "alert"],
            icon: Send,
            iconColor: "#EA580C",
            badge: "Action",
            onSelect: () => {
              if (onOpenAction) onOpenAction("broadcastNotice");
            },
          },
          {
            id: "act-payment",
            title: "Record Offline Fee Payment",
            subtitle: "Log counter cash, draft or cheque against student fee ledger",
            category: "Quick Actions",
            keywords: ["record payment", "collect fee", "fee receipt", "cash payment"],
            icon: DollarSign,
            iconColor: "#16A34A",
            badge: "Action",
            onSelect: () => {
              if (onOpenAction) onOpenAction("recordPayment");
            },
          },
        ];

      case "teacher":
        return [
          {
            id: "tc-dash",
            title: "Teacher Dashboard",
            subtitle: "Today's teaching overview, schedule and homeroom updates",
            category: "Navigation",
            keywords: ["dashboard", "home", "today", "overview"],
            icon: LayoutDashboard,
            iconColor: "#2563EB",
            onSelect: () => onNavigate("dashboard"),
          },
          {
            id: "tc-classes",
            title: "My Classes & Sections",
            subtitle: "Assigned class divisions, student lists and subject rosters",
            category: "Navigation",
            keywords: ["classes", "sections", "roster", "students", "homeroom"],
            icon: Layers,
            iconColor: "#059669",
            onSelect: () => onNavigate("classes"),
          },
          {
            id: "tc-attendance",
            title: "Take Daily Attendance",
            subtitle: "Mark homeroom roll call, present, late and absent statuses",
            category: "Navigation",
            keywords: ["attendance", "take attendance", "roll call", "present", "absent", "register"],
            icon: FileCheck2,
            iconColor: "#16A34A",
            onSelect: () => onNavigate("attendance"),
          },
          {
            id: "tc-timetable",
            title: "My Teaching Timetable",
            subtitle: "Today's periods, upcoming room assignments and weekly schedule",
            category: "Navigation",
            keywords: ["timetable", "schedule", "periods", "bell schedule", "routine"],
            icon: CalendarCheck2,
            iconColor: "#4F46E5",
            onSelect: () => onNavigate("timetable"),
          },
          {
            id: "tc-curriculum",
            title: "Curriculum & Lesson Progress",
            subtitle: "Track chapter completion, syllabus pacing and lesson notes",
            category: "Academics",
            keywords: ["curriculum", "lessons", "syllabus", "chapters", "units", "pacing"],
            icon: BookOpen,
            iconColor: "#D97706",
            onSelect: () => onNavigate("curriculum"),
          },
          {
            id: "tc-assignments",
            title: "Assignments & Homework",
            subtitle: "Publish homework tasks, review student submissions and grade work",
            category: "Academics",
            keywords: ["assignments", "homework", "tasks", "submissions", "grading"],
            icon: FileText,
            iconColor: "#0284C7",
            onSelect: () => onNavigate("assignments"),
          },
          {
            id: "tc-gradebook",
            title: "Scorecards & Gradebook",
            subtitle: "Record exam marks, term grades and performance comments",
            category: "Academics",
            keywords: ["gradebook", "scores", "marks", "grades", "exams", "report cards"],
            icon: Award,
            iconColor: "#7C3AED",
            onSelect: () => onNavigate("gradebook"),
          },
          {
            id: "tc-communication",
            title: "Communication & Notices",
            subtitle: "Class announcements and direct circulars to parents & students",
            category: "Navigation",
            keywords: ["communication", "messages", "notices", "announcements", "circular"],
            icon: MessageSquare,
            iconColor: "#0D9488",
            onSelect: () => onNavigate("communication"),
          },
          {
            id: "tc-leave",
            title: "Apply for Leave",
            subtitle: "Submit personal leave applications, view leave balance and approvals",
            category: "Navigation",
            keywords: ["leave", "apply leave", "time off", "vacation", "sick leave"],
            icon: Clock,
            iconColor: "#EA580C",
            onSelect: () => onNavigate("leave"),
          },
        ];

      case "student":
        return [
          {
            id: "st-dash",
            title: "Student Dashboard",
            subtitle: "Today's schedule, homework deadlines and attendance summary",
            category: "Navigation",
            keywords: ["dashboard", "home", "today", "overview"],
            icon: LayoutDashboard,
            iconColor: "#2563EB",
            onSelect: () => onNavigate("dashboard"),
          },
          {
            id: "st-class",
            title: "My Class & Homeroom",
            subtitle: "View class details, section division and classmates",
            category: "Navigation",
            keywords: ["class", "section", "homeroom", "classmates"],
            icon: Layers,
            iconColor: "#059669",
            onSelect: () => onNavigate("class"),
          },
          {
            id: "st-subjects",
            title: "Subjects & Teachers",
            subtitle: "My enrolled course subjects, syllabus outlines and assigned teachers",
            category: "Academics",
            keywords: ["subjects", "courses", "teachers", "syllabus"],
            icon: BookOpen,
            iconColor: "#D97706",
            onSelect: () => onNavigate("subjects"),
          },
          {
            id: "st-timetable",
            title: "My Class Timetable",
            subtitle: "Period routine, classroom timings and today's subject schedule",
            category: "Navigation",
            keywords: ["timetable", "schedule", "routine", "periods", "bell schedule"],
            icon: CalendarCheck2,
            iconColor: "#4F46E5",
            onSelect: () => onNavigate("timetable"),
          },
          {
            id: "st-assignments",
            title: "Assignments & Homework",
            subtitle: "Active homework assignments, submission deadlines and teacher grades",
            category: "Academics",
            keywords: ["assignments", "homework", "submit", "tasks", "projects"],
            icon: FileText,
            iconColor: "#0284C7",
            onSelect: () => onNavigate("assignments"),
          },
          {
            id: "st-arena",
            title: "Practice Arena (MCQ & Practice)",
            subtitle: "Interactive practice questions, self-evaluation and skill mastery",
            category: "Academics",
            keywords: ["arena", "practice", "mcq", "quiz", "questions", "skills"],
            icon: Sparkles,
            iconColor: "#7C3AED",
            onSelect: () => onNavigate("arena"),
          },
          {
            id: "st-exams",
            title: "Examinations & Scorecards",
            subtitle: "Exam dates, marks statements and official school report cards",
            category: "Academics",
            keywords: ["exams", "report card", "marks", "scores", "gradecard", "results"],
            icon: Award,
            iconColor: "#E11D48",
            onSelect: () => onNavigate("exams"),
          },
          {
            id: "st-attendance",
            title: "My Attendance Record",
            subtitle: "Personal attendance percentage, present count and leave log",
            category: "Navigation",
            keywords: ["attendance", "present", "absent", "attendance percentage"],
            icon: FileCheck2,
            iconColor: "#16A34A",
            onSelect: () => onNavigate("attendance"),
          },
          {
            id: "st-communication",
            title: "Academic Inbox & Direct Messaging",
            subtitle: "Chat with subject teachers, ask doubts and receive announcements",
            category: "Navigation",
            keywords: ["inbox", "ask teacher", "communication", "chat", "messages", "doubts", "teacher"],
            icon: MessageSquare,
            iconColor: "#0284C7",
            onSelect: () => onNavigate("communication"),
          },
          {
            id: "st-profile",
            title: "My Student Profile",
            subtitle: "Admission number, roll code, parent contact details and school ID",
            category: "Settings",
            keywords: ["profile", "my profile", "roll number", "admission number", "id"],
            icon: Users,
            iconColor: "#475569",
            onSelect: () => onNavigate("profile"),
          },
        ];

      case "parent":
        return [
          {
            id: "pt-overview",
            title: "Ward Academic Overview",
            subtitle: "High-level summary of your child's attendance and academic health",
            category: "Navigation",
            keywords: ["overview", "dashboard", "child", "ward", "summary"],
            icon: LayoutDashboard,
            iconColor: "#2563EB",
            onSelect: () => onNavigate("overview"),
          },
          {
            id: "pt-academics",
            title: "Academic Performance & Grades",
            subtitle: "Detailed subject marks, exam scores and report cards",
            category: "Academics",
            keywords: ["academics", "marks", "grades", "report card", "exam scores"],
            icon: Award,
            iconColor: "#D97706",
            onSelect: () => onNavigate("academics"),
          },
          {
            id: "pt-attendance",
            title: "Attendance Record",
            subtitle: "Monthly attendance turnout, absentees and leave applications",
            category: "Navigation",
            keywords: ["attendance", "present", "absent", "school turnout"],
            icon: FileCheck2,
            iconColor: "#059669",
            onSelect: () => onNavigate("attendance"),
          },
          {
            id: "pt-fees",
            title: "Fees Ledger & Payments",
            subtitle: "Tuition fee dues, outstanding invoices, online receipt history",
            category: "Finance",
            keywords: ["fees", "pay fees", "receipts", "dues", "invoices", "payment"],
            icon: CreditCard,
            iconColor: "#16A34A",
            onSelect: () => onNavigate("fees"),
          },
          {
            id: "pt-ptm",
            title: "Parent-Teacher Meetings (PTM)",
            subtitle: "Scheduled conferences, appointment slots and faculty discussions",
            category: "Navigation",
            keywords: ["ptm", "meetings", "parent teacher meeting", "conference"],
            icon: CalendarDays,
            iconColor: "#7C3AED",
            onSelect: () => onNavigate("ptm"),
          },
          {
            id: "pt-notices",
            title: "School Notices & Circulars",
            subtitle: "Official announcements, holiday updates and emergency alerts",
            category: "Navigation",
            keywords: ["notices", "circulars", "alerts", "announcements", "messages"],
            icon: MessageSquare,
            iconColor: "#0284C7",
            onSelect: () => onNavigate("notices"),
          },
        ];

      case "platform":
        return [
          {
            id: "pf-overview",
            title: "Platform Overview",
            subtitle: "Multi-tenant SaaS metrics, active schools and infrastructure health",
            category: "Navigation",
            keywords: ["overview", "dashboard", "metrics", "tenants", "saas", "kpis"],
            icon: LayoutDashboard,
            iconColor: "#2563EB",
            onSelect: () => onNavigate("overview"),
          },
          {
            id: "pf-schools",
            title: "Schools Directory & Tenants",
            subtitle: "Manage school tenants, provision new campus, suspend or activate",
            category: "Navigation",
            keywords: ["schools", "tenants", "directory", "provision school", "onboard school", "suspend", "campus"],
            icon: Building2,
            iconColor: "#059669",
            onSelect: () => onNavigate("schools"),
          },
          {
            id: "pf-onboarding",
            title: "School Onboarding Wizard",
            subtitle: "Step-by-step institutional setup, admin credentials and plan allocation",
            category: "Quick Actions",
            keywords: ["onboarding", "wizard", "new school", "provision", "add school", "register"],
            icon: Sparkles,
            iconColor: "#059669",
            badge: "Wizard",
            onSelect: () => onNavigate("onboarding"),
          },
          {
            id: "pf-plans",
            title: "Pricing Plans & Tier Management",
            subtitle: "Feature matrices, seat quotas, student limits and pricing structures",
            category: "System",
            keywords: ["plans", "pricing", "tiers", "features", "entitlements", "quotas"],
            icon: Layers,
            iconColor: "#7C3AED",
            onSelect: () => onNavigate("plans"),
          },
          {
            id: "pf-subs",
            title: "Subscriptions Ledger",
            subtitle: "Active school subscriptions, tier renewal dates & grace periods",
            category: "Finance",
            keywords: ["subscriptions", "tenants", "renewal", "grace period", "lifecycle"],
            icon: Calendar,
            iconColor: "#16A34A",
            onSelect: () => onNavigate("subscriptions"),
          },
          {
            id: "pf-billing",
            title: "Billing & Revenue Realization",
            subtitle: "Invoices, payment reconciliation, offline payments & refunds",
            category: "Finance",
            keywords: ["billing", "revenue", "invoices", "payments", "refunds", "receipts", "finance"],
            icon: CreditCard,
            iconColor: "#10B981",
            badge: "Finance",
            onSelect: () => onNavigate("billing"),
          },
          {
            id: "pf-usage",
            title: "Usage & Resource Metering",
            subtitle: "Storage utilization, monthly API call volume & system quotas",
            category: "System",
            keywords: ["usage", "metering", "storage", "api requests", "quotas", "limits"],
            icon: TrendingUp,
            iconColor: "#0D9488",
            onSelect: () => onNavigate("usage"),
          },
          {
            id: "pf-security",
            title: "Security & Global Audit Trail",
            subtitle: "Platform audit events, privileged administrator actions and tokens",
            category: "Settings",
            keywords: ["security", "audit", "logs", "superadmin", "tokens", "staff"],
            icon: ShieldAlert,
            iconColor: "#DC2626",
            onSelect: () => onNavigate("security"),
          },
          {
            id: "pf-support",
            title: "Support Tickets & Escalation Desk",
            subtitle: "Tenant escalations, school admin support and issue resolutions",
            category: "System",
            keywords: ["support", "tickets", "help", "issues", "inquiries", "helpdesk"],
            icon: LifeBuoy,
            iconColor: "#EA580C",
            onSelect: () => onNavigate("support"),
          },
          {
            id: "pf-health",
            title: "System Telemetry & Health",
            subtitle: "Database connection pools, query latency, event buses and storage",
            category: "System",
            keywords: ["health", "telemetry", "database", "latency", "status", "uptime", "server"],
            icon: TrendingUp,
            iconColor: "#0284C7",
            onSelect: () => onNavigate("health"),
          },
          {
            id: "act-onboard",
            title: "Quick Action: Onboard New School",
            subtitle: "Launch institutional onboarding wizard to register a new tenant",
            category: "Quick Actions",
            keywords: ["onboard", "create school", "new school", "register school", "add campus"],
            icon: UserPlus,
            iconColor: "#059669",
            badge: "Action",
            onSelect: () => onNavigate("onboarding"),
          },
          {
            id: "act-broadcast",
            title: "Quick Action: Broadcast Platform Announcement",
            subtitle: "Publish system maintenance, feature updates or alerts to school admins",
            category: "Quick Actions",
            keywords: ["broadcast", "announcement", "notice", "alert", "publish", "notify"],
            icon: Send,
            iconColor: "#0284C7",
            badge: "Action",
            onSelect: () => onOpenAction?.("announcement"),
          },
          {
            id: "act-ticket",
            title: "Quick Action: Create Support Ticket",
            subtitle: "Log administrative ticket or school issue on the support desk",
            category: "Quick Actions",
            keywords: ["create ticket", "new ticket", "issue", "support ticket", "escalate"],
            icon: LifeBuoy,
            iconColor: "#EA580C",
            badge: "Action",
            onSelect: () => onOpenAction?.("ticket"),
          },
          {
            id: "act-plan",
            title: "Quick Action: Create Subscription Plan",
            subtitle: "Define new pricing tier, quota allocations and feature flags",
            category: "Quick Actions",
            keywords: ["create plan", "new plan", "tier", "pricing", "pricing plan"],
            icon: Layers,
            iconColor: "#7C3AED",
            badge: "Action",
            onSelect: () => onOpenAction?.("create_plan"),
          },
        ];

      case "principal":
        return [
          {
            id: "pr-dash",
            title: "Principal Command Center",
            subtitle: "Academic overview, operations checklist, institutional health score",
            category: "Navigation",
            keywords: ["dashboard", "home", "overview", "command center", "kpis", "health"],
            icon: LayoutDashboard,
            iconColor: "#2563EB",
            onSelect: () => onNavigate("dashboard"),
          },
          {
            id: "pr-planning",
            title: "Strategic Academic Planning",
            subtitle: "Institutional goals, annual academic calendars & target benchmarks",
            category: "Academics",
            keywords: ["planning", "strategy", "goals", "annual plan", "academic calendar"],
            icon: Calendar,
            iconColor: "#0284C7",
            onSelect: () => onNavigate("planning"),
          },
          {
            id: "pr-action-plans",
            title: "School Action Plans",
            subtitle: "Quality improvement initiatives, targeted interventions & deadlines",
            category: "Academics",
            keywords: ["action plans", "interventions", "initiatives", "tasks", "milestones"],
            icon: FileCheck2,
            iconColor: "#16A34A",
            onSelect: () => onNavigate("planning", "action_plans"),
          },
          {
            id: "pr-targets",
            title: "Academic Target Benchmarks",
            subtitle: "CBSE pass-rate targets, syllabus pacing goals & subject KPIs",
            category: "Academics",
            keywords: ["targets", "benchmarks", "kpis", "goals", "milestones", "standards"],
            icon: TrendingUp,
            iconColor: "#9333EA",
            onSelect: () => onNavigate("planning", "targets"),
          },
          {
            id: "pr-teachers",
            title: "Instructional Faculty & Teacher Quality",
            subtitle: "Faculty dossiers, teaching quality observations & development reviews",
            category: "Academics",
            keywords: ["teachers", "faculty", "staff", "observations", "teaching quality", "evaluations"],
            icon: Users,
            iconColor: "#2563EB",
            onSelect: () => onNavigate("teachers"),
          },
          {
            id: "pr-academics",
            title: "Curriculum Pacing & Syllabus Coverage",
            subtitle: "CBSE curriculum chapter pacing, lesson progress & syllabus nodes",
            category: "Academics",
            keywords: ["curriculum", "syllabus", "chapters", "lessons", "pacing", "cbse", "coverage"],
            icon: BookOpen,
            iconColor: "#D97706",
            onSelect: () => onNavigate("academics"),
          },
          {
            id: "pr-timetable",
            title: "Master Timetable & Period Allocation",
            subtitle: "Weekly instructional schedule, subject distribution & teacher workload",
            category: "Navigation",
            keywords: ["timetable", "schedule", "periods", "slots", "routine", "workload"],
            icon: CalendarDays,
            iconColor: "#475569",
            onSelect: () => onNavigate("timetable"),
          },
          {
            id: "pr-attendance",
            title: "Campus Attendance & Truancy Tracker",
            subtitle: "Daily class attendance registers, period verification & absenteeism",
            category: "Navigation",
            keywords: ["attendance", "truancy", "absent", "present", "attendance rate", "register"],
            icon: CalendarCheck2,
            iconColor: "#16A34A",
            onSelect: () => onNavigate("attendance"),
          },
          {
            id: "pr-learning",
            title: "Learning Quality & Classroom Observation",
            subtitle: "Pedagogical audits, classroom observations & instructional delivery",
            category: "Academics",
            keywords: ["learning", "observations", "pedagogy", "quality", "classroom"],
            icon: Sparkles,
            iconColor: "#EAB308",
            onSelect: () => onNavigate("learning"),
          },
          {
            id: "pr-assessments",
            title: "Assessment & Class Test Coverage",
            subtitle: "Unit tests, formative evaluations, scorecards & grading records",
            category: "Academics",
            keywords: ["assessments", "tests", "unit tests", "formative", "scorecards", "grading"],
            icon: Award,
            iconColor: "#EA580C",
            onSelect: () => onNavigate("assessments"),
          },
          {
            id: "pr-examinations",
            title: "Board & Term Examination Ledger",
            subtitle: "Term exam schedules, seating arrangements & official score moderation",
            category: "Academics",
            keywords: ["examinations", "exams", "term exam", "board exam", "marks", "scores"],
            icon: FileText,
            iconColor: "#DC2626",
            onSelect: () => onNavigate("examinations"),
          },
          {
            id: "pr-students",
            title: "Student Academic Dossier & At-Risk Roster",
            subtitle: "Student academic profiles, intervention lists & performance trends",
            category: "Navigation",
            keywords: ["students", "at-risk", "dossier", "pupils", "remedial", "intervention"],
            icon: GraduationCap,
            iconColor: "#0D9488",
            onSelect: () => onNavigate("students"),
          },
          {
            id: "pr-communication",
            title: "Internal Staff & Guardian Messages",
            subtitle: "Principal notices, staff announcements & parent escalation desk",
            category: "Navigation",
            keywords: ["communication", "messages", "inbox", "broadcast", "escalations", "parents"],
            icon: MessageSquare,
            iconColor: "#0284C7",
            onSelect: () => onNavigate("communication"),
          },
          {
            id: "pr-analytics",
            title: "Quality Assurance & Academic Audit",
            subtitle: "Week-wise syllabus execution scores, audit metrics & subject parity",
            category: "Academics",
            keywords: ["audit", "qa", "quality assurance", "analytics", "execution score", "week"],
            icon: TrendingUp,
            iconColor: "#7C3AED",
            onSelect: () => onNavigate("analytics_audit"),
          },
          {
            id: "pr-alerts",
            title: "Academic Exceptions & Alerts Desk",
            subtitle: "Urgent flags: behind schedule syllabus, attendance dips & exam dues",
            category: "Navigation",
            keywords: ["alerts", "exceptions", "warnings", "behind schedule", "attention items"],
            icon: ShieldAlert,
            iconColor: "#DC2626",
            onSelect: () => onNavigate("alerts"),
          },
          {
            id: "pr-reports",
            title: "Official Term & SARAS Reports",
            subtitle: "CBSE compliance reporting, SARAS portal submissions & transcripts",
            category: "Settings",
            keywords: ["reports", "saras", "cbse", "transcripts", "compliance", "report cards"],
            icon: FileCheck2,
            iconColor: "#2563EB",
            onSelect: () => onNavigate("reports"),
          },
          {
            id: "pr-health-act",
            title: "Inspect Academic Health Breakdown",
            subtitle: "Open interactive scorecard: Curriculum, Assessment & Student Health",
            category: "Quick Actions",
            keywords: ["health", "academic health", "scorecard", "evaluation", "tier"],
            icon: Sparkles,
            iconColor: "#16A34A",
            onSelect: () => onOpenAction?.("health"),
          },
          {
            id: "pr-entity-search",
            title: "Directory Search: Find Student or Teacher by Name",
            subtitle: "Live database entity lookup for individual student records, faculty or classes",
            category: "Quick Actions",
            keywords: ["search student", "find teacher", "lookup", "directory", "name", "roll"],
            icon: Search,
            iconColor: "#0D9488",
            onSelect: () => onOpenAction?.("entity_search"),
          },
        ];

      default:
        return [];
    }
  }, [role, onNavigate, onOpenAction]);

  // Fuzzy search filter + Live entity search
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filteredCatalog = !q ? catalog : catalog.filter((item) => {
      const inTitle = item.title.toLowerCase().includes(q);
      const inSubtitle = item.subtitle?.toLowerCase().includes(q) ?? false;
      const inCategory = item.category.toLowerCase().includes(q);
      const inKeywords = item.keywords.some((k) => k.toLowerCase().includes(q));
      return inTitle || inSubtitle || inCategory || inKeywords;
    });

    if (liveResults.length > 0) {
      return [...liveResults, ...filteredCatalog];
    }
    return filteredCatalog;
  }, [catalog, query, liveResults]);

  // Keyboard navigation through list (ArrowUp, ArrowDown, Enter)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[selectedIndex]) {
        results[selectedIndex].onSelect();
        onClose();
      }
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = listRef.current?.children[selectedIndex] as HTMLElement | undefined;
    if (selectedElement && listRef.current) {
      selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(12, 30, 51, 0.45)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        zIndex: 9999,
        paddingTop: "70px",
        paddingLeft: "16px",
        paddingRight: "16px",
        animation: "fadeIn 0.15s ease",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Settings and navigation search"
        style={{
          background: "#FFFFFF",
          borderRadius: "14px",
          width: "100%",
          maxWidth: "600px",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 45px -10px rgba(12, 30, 51, 0.25), 0 0 0 1px rgba(12, 30, 51, 0.08)",
          overflow: "hidden",
        }}
      >
        {/* Header Search Input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "14px 18px",
            borderBottom: "1px solid #ECEEF3",
            gap: "12px",
            background: "#FFFFFF",
          }}
        >
          {isSearchingLive ? (
            <Loader2 size={18} color="#059669" className="animate-spin" style={{ flexShrink: 0 }} />
          ) : (
            <Search size={18} color="#495D72" style={{ flexShrink: 0 }} />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              role === "platform"
                ? "Search schools, tickets, plans, invoices, settings & navigation..."
                : role === "school_admin"
                ? "Search settings, timetable, fees, students, attendance, actions..."
                : role === "teacher"
                ? "Search my classes, take attendance, timetable, assignments..."
                : role === "student"
                ? "Search subjects, timetable, practice arena, homework, exams..."
                : "Search portal navigation, features, actions..."
            }
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: "14.5px",
              fontWeight: 500,
              color: "#0C1E33",
              width: "100%",
              fontFamily: "inherit",
            }}
          />
          {query ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setQuery("");
                setSelectedIndex(0);
              }}
              style={{
                all: "unset",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                color: "#8A92A6",
              }}
            >
              <X size={16} />
            </button>
          ) : (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#8A92A6",
                background: "#F4F6F7",
                padding: "3px 7px",
                borderRadius: "5px",
                border: "1px solid #ECEEF3",
                whiteSpace: "nowrap",
              }}
            >
              ESC to close
            </span>
          )}
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "8px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
        >
          {results.length === 0 ? (
            <div style={{ padding: "36px 16px", textAlign: "center", color: "#8A92A6" }}>
              <p style={{ margin: "0 0 6px", fontSize: "14px", fontWeight: 600, color: "#0C1E33" }}>
                No matching settings or destinations found
              </p>
              <p style={{ margin: 0, fontSize: "12.5px" }}>
                Try searching for keywords like "timetable", "attendance", "fees", or "students"
              </p>
            </div>
          ) : (
            results.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.onSelect();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    background: isSelected ? "#F4F6F7" : "transparent",
                    transition: "background 0.1s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        background: isSelected ? "#FFFFFF" : "#F4F6F7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        border: "1px solid #ECEEF3",
                      }}
                    >
                      <Icon size={16} color={item.iconColor || "#2563EB"} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          style={{
                            fontSize: "13.5px",
                            fontWeight: isSelected ? 600 : 500,
                            color: isSelected ? "#0C1E33" : "#1C2337",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.title}
                        </span>
                        {item.badge && (
                          <span
                            style={{
                              fontSize: "10.5px",
                              fontWeight: 600,
                              color: "#495D72",
                              background: "#ECEEF3",
                              padding: "2px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <span
                          style={{
                            fontSize: "11.5px",
                            color: "#8A92A6",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            marginTop: "2px",
                          }}
                        >
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 500,
                        color: isSelected ? "#2563EB" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      Jump to <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div
          style={{
            padding: "10px 18px",
            background: "#FAFBFD",
            borderTop: "1px solid #ECEEF3",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "11.5px",
            color: "#8A92A6",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <span>
              <kbd style={{ background: "#ECEEF3", padding: "2px 5px", borderRadius: "3px", color: "#0C1E33" }}>↑</kbd>
              {" "}
              <kbd style={{ background: "#ECEEF3", padding: "2px 5px", borderRadius: "3px", color: "#0C1E33" }}>↓</kbd>
              {" "}to navigate
            </span>
            <span>
              <kbd style={{ background: "#ECEEF3", padding: "2px 5px", borderRadius: "3px", color: "#0C1E33" }}>↵</kbd>
              {" "}to select
            </span>
          </div>
          <span>
            {results.length} destination{results.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>
    </div>
  );
}
