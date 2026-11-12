export type StudentTab =
  | 'dashboard'
  | 'class'
  | 'subjects'
  | 'timetable'
  | 'assignments'
  | 'arena'
  | 'assessments'
  | 'exams'
  | 'attendance'
  | 'performance'
  | 'curriculum'
  | 'resources'
  | 'calendar'
  | 'communication'
  | 'progress'
  | 'profile';

export interface StudentEnrollmentInfo {
  classSection: string;
  academicYear: string;
  rollNumber: string;
  sectionId: string;
  classTeacher: string;
  totalClassmates: number;
  totalSubjects: number;
}

export interface StudentKPIs {
  overallAttendance: number;
  subjectWiseAttendance: { subject: string; percentage: number }[];
  academicAverage: number;
  previousAverage: number;
  improvement: number;
  assignmentCompletion: number;
  assignmentsPending: number;
  assignmentsSubmitted: number;
  assignmentsLate: number;
  curriculumProgress: number;
}

export interface StudentNextClass {
  subject: string;
  classSection: string;
  teacher: string;
  room: string;
  startTime: string;
  endTime: string;
  topic: string;
  lessonStatus: string;
  hasStudyMaterial: boolean;
  hasRecordedLecture: boolean;
}

export interface StudentPeriod {
  periodNumber: number;
  startTime: string;
  endTime: string;
  subjectName: string;
  teacherName: string;
  room: string;
  status: 'completed' | 'now' | 'upcoming';
}

export interface StudentAlert {
  id: string;
  type: 'warning' | 'exam' | 'result' | 'info';
  title: string;
  message: string;
}
