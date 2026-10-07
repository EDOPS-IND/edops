export type TeacherTab =
  | "dashboard"
  | "classes"
  | "timetable"
  | "attendance"
  | "learning"
  | "assignments"
  | "arena"
  | "assessment"
  | "exams"
  | "students"
  | "curriculum"
  | "communication"
  | "workload"
  | "calendar"
  | "reports"
  | "activity";

export interface TeacherSummary {
  id: string;
  name: string;
  email: string;
  primarySubject: string;
  assignedClassesCount: number;
  totalStudents: number;
}

export interface TodayPeriod {
  period: number;
  time: string;
  classSection: string;
  subject: string;
  room: string;
  attendanceDone: boolean;
  status: "completed" | "now" | "upcoming" | "substitution";
}

export interface TeacherKPIs {
  classesToday: number;
  periodsToday: number;
  studentsToday: number;
  pendingAttendance: number;
  pendingAssignments: number;
  pendingEvaluations: number;
  upcomingAssessments: number;
  curriculumProgress: number;
  unreadMessages: number;
}

export interface NextClassHero {
  classSection: string;
  sectionId: string;
  subject: string;
  subjectId: string;
  startTime: string;
  endTime: string;
  room: string;
  topic: string;
  lessonPlanStatus: string;
  startsInMinutes: number;
}

export interface AttentionItem {
  id: string;
  type: string;
  message: string;
  severity: "critical" | "warning" | "info";
  action: string;
}

export interface ActivityEvent {
  id: string;
  text: string;
  time: string;
}

export interface TeacherDashboardData {
  teacher: TeacherSummary;
  kpis: TeacherKPIs;
  nextClass: NextClassHero | null;
  todaySchedule: TodayPeriod[];
  attentionRequired: AttentionItem[];
  recentActivity: ActivityEvent[];
}
