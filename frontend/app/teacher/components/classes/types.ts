export const T = {
  navy: "#0c1e33",
  slate: "#495d72",
  muted: "#a6abb5",
  faint: "#b3b3b3",
  pageBg: "#f4f6f7",
  white: "#ffffff",
  border: "#e4e6e9",
  line: "#ced8e5",
  chip: "#f5f6f8",
  blue: "#17a1fa",
  greenBg: "#ccefbf",
  greenDark: "#1a5c0a",
  skyBg: "#d0e6ff",
  skyDark: "#0a3a7a",
  amberBg: "#fde1ac",
  amberDark: "#614400",
  roseBg: "#ffd6d6",
  roseDark: "#7a1a1a",
  violetBg: "#e1d2ff",
  violetDark: "#4a0e8f",
};

export interface TeacherClass {
  sectionId: string;
  subjectId: string;
  className: string;
  subjectName: string;
  subjectCode?: string;
  studentCount?: number;
  subjectAverage?: number | null;
  attendanceRate?: number | null;
}

export interface LectureItem {
  id: string;
  topic: string;
  subjectName: string;
  classSection: string;
  teacherName?: string;
  date: string;
  periodInfo?: string;
  resources?: string;
  homework?: string;
  notes?: string;
  status?: string;
  createdAt?: string;
}

export interface TimetableSlotItem {
  id?: string;
  period: number;
  startTime?: string;
  endTime?: string;
  classSection?: string;
  sectionId?: string;
  subject?: string;
  room?: string | null;
  status?: string;
}
