export type PrincipalTab =
  | "dashboard"
  | "planning"
  | "teachers"
  | "academics"
  | "timetable"
  | "attendance"
  | "learning"
  | "assessments"
  | "examinations"
  | "students"
  | "communication"
  | "analytics_audit"
  | "alerts"
  | "reports"
  | "activity";

export interface PrincipalSchoolKpis {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalSections: number;
  totalSubjects: number;
  activeAcademicYear: string | null;
}

export interface AcademicHealthBreakdown {
  curriculumExecution: number | null;
  assessmentCompletion: number | null;
  studentPerformance: number | null;
  teacherAcademicActivity: number | null;
  attendanceRate: number | null;
  assignmentCompletion: number | null;
  interventionCompletion: number | null;
}

export interface AcademicHealthComponent {
  name: string;
  score: number | null;
  weight: string;
  status: string;
  underlyingMetric: string;
  flaggedClasses: string[];
  recommendedAction: string;
}

export interface TodayAcademicOperations {
  classesRunning: number;
  teachersTeaching: number;
  teachersAbsent: number | null;
  substitutionsCovered: number;
  currentPeriod?: number | null;
  examsToday: number | null;
  assessmentsScheduled: number | null;
  pendingReviews: number;
  openAlerts: number;
}

export interface TeacherAcademicItem {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  department: string;
  subjects: string[];
  classes: string[];
  weeklyPeriods: number;
  maxWeeklyPeriods: number;
  workloadStatus: "Underutilized" | "Balanced" | "Heavy" | "Overloaded";
  lessonPlanCompliance: number;
  curriculumCompletion: number;
  assignmentActivity: number;
  assessmentActivity: number;
  studentAverageScore: number;
  attendanceRate: number;
  observationsCount: number;
  developmentStatus: string;
}

export interface ClassPerformanceItem {
  id: string;
  className: string;
  sectionName: string;
  displayName: string;
  studentCount: number;
  averageScore: number;
  medianScore: number;
  passRate: number;
  attendanceRate: number;
  assignmentCompletion: number;
  curriculumCompletion: number;
  trend: string;
}

export interface SubjectSectionDetail {
  sectionId: string;
  sectionName: string;
  programName: string;
  displayName: string;
  teacherUserId?: string | null;
  teacherName: string;
  teacherEmail?: string | null;
  studentCount: number;
  averageScore: number | null;
  assignmentRate: number | null;
  passRate: number | null;
  attendanceRate: number | null;
  status: string;
}

export interface SubjectPerformanceItem {
  id: string;
  name: string;
  code?: string;
  isElective?: boolean;
  teacher: string;
  classes: string;
  sectionCount?: number;
  teacherCount?: number;
  average: number | null;
  passRate: number | null;
  assignmentRate?: number | null;
  curriculum: number | null;
  expectedCurriculum: number | null;
  gap: number | null;
  status: string;
  sections?: SubjectSectionDetail[];
}

export interface CurriculumNodeItem {
  id: string;
  grade: string;
  subject: string;
  unit: string;
  chapter: string;
  expectedWeek: number;
  expectedProgress: number;
  actualProgress: number;
  gap: number;
  status: string;
  learningOutcomes: string[];
  competency: string;
}

export interface LessonPlanItem {
  id: string;
  teacherName: string;
  classSection: string;
  subject: string;
  topic: string;
  plannedDate: string;
  learningOutcomes: string;
  teachingStrategy: string;
  assessmentMethod: string;
  status: string;
  principalFeedback?: string;
}

export interface QuestionPaperItem {
  id: string;
  title: string;
  subjectName: string;
  grade: string;
  term: string;
  totalMarks: number;
  durationMinutes: number;
  difficultyEasyPct: number;
  difficultyMediumPct: number;
  difficultyHardPct: number;
  competencyMapped: boolean;
  submittedByName: string;
  status: string;
  reviewComments?: string;
}

export interface ExamResultItem {
  id: string;
  examName: string;
  term: string;
  className: string;
  sectionName: string;
  subjectName: string;
  studentName: string;
  marksObtained: number;
  maxMarks: number;
  percentage: number;
  grade: string;
  status: string;
  isLocked: boolean;
}

export interface StudentListItem {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  className: string;
  sectionName: string;
  overallAverage: number;
  attendanceRate: number;
  assignmentCompletion: number;
  riskStatus: string;
  needsIntervention: boolean;
}

export interface AcademicAlertItem {
  id: string;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  entityType: string;
  entityId?: string;
  status: "open" | "investigating" | "action_assigned" | "resolved";
  assignedToName?: string;
  createdAt: string;
}

export interface SubstitutionItem {
  id: string;
  date: string;
  period: number;
  className: string;
  subject: string;
  originalTeacher: string;
  originalTeacherStatus: string;
  substituteTeacher: string;
  substituteStatus: string;
  lessonPlanned: string;
  coverageStatus: string;
  academicImpact: string;
}
