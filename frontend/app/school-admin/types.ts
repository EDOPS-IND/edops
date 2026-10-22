export type SchoolAdminTab =
  | "dashboard"
  | "students"
  | "teachers"
  | "staff"
  | "parents"
  | "departments"
  | "academics"
  | "timetable"
  | "attendance"
  | "learning"
  | "examinations"
  | "assignments"
  | "exams"
  | "results"
  | "finance"
  | "communication"
  | "operations"
  | "discipline"
  | "documents"
  | "reports"
  | "alerts"
  | "settings"
  | "audit";

export interface StudentRecord {
  id: string;
  admissionNo: string;
  name: string;
  phone?: string;
  rollNo: string;
  grade: string;
  section: string;
  gender: string;
  house: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  attendancePct: number;
  feeStatus: "Paid" | "Pending" | "Overdue";
  academicStatus: "Good Standing" | "Needs Attention" | "Honor Roll";
  status: "Active" | "Transferred" | "Graduated" | "Pending" | "Pending Invite" | string;
  bloodGroup: string;
  dob: string;
  address: string;
  emergencyContact: string;
  medicalNotes?: string;
  gpa?: number;
  inviteStatus?: "accepted" | "pending" | "not_sent" | string;
  inviteToken?: string | null;
  inviteExpiresAt?: string | null;
  [key: string]: any;
}

export interface TeacherRecord {
  id: string;
  userId?: string;
  empId?: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  subjects: string[];
  classes: string[];
  joiningDate: string;
  employmentType?: "Full Time" | "Part Time" | "Contract" | "Visiting" | string;
  weeklyPeriods: number;
  maxPeriods: number;
  status: "Active" | "On Leave" | "Inactive" | "Pending Invite" | string;
  inviteToken?: string | null;
  inviteExpiresAt?: string | null;
  [key: string]: any;
}

export interface StaffRecord {
  id: string;
  empId: string;
  name: string;
  email: string;
  phone: string;
  department: "Administration" | "Finance" | "IT" | "Library" | "Transport" | "Medical" | "Security" | "Support";
  designation: string;
  employmentType: "Full Time" | "Part Time" | "Contract" | "Temporary";
  joiningDate: string;
  status: "Active" | "On Leave" | "Inactive" | "Pending Invite" | string;
  inviteToken?: string | null;
  inviteExpiresAt?: string | null;
}

export interface ParentRecord {
  id: string;
  name: string;
  email: string;
  mobile: string;
  relationship: "Father" | "Mother" | "Guardian" | "Other";
  occupation: string;
  address: string;
  emergencyContact: string;
  accountStatus: "Active" | "Invited" | "Inactive";
  invitationStatus: "Accepted" | "Pending" | "Expired" | "Revoked";
  inviteToken?: string | null;
  inviteExpiresAt?: string | null;
  children: { studentId: string; studentName: string; grade: string; section: string }[];
  permissions: {
    attendance: boolean;
    fees: boolean;
    exams: boolean;
    assignments: boolean;
    communication: boolean;
    transport: boolean;
  };
}

export interface DepartmentRecord {
  id: string;
  name: string;
  code: string;
  headName: string;
  headEmail?: string;
  teachersCount: number;
  staffCount?: number;
  studentsCount?: number;
  classesCount?: number;
  subjectsCount?: number;
  budgetAllocated?: number;
  budgetSpent?: number;
  avgAttendancePct?: number;
  syllabusCompletionPct?: number;
  status?: "Active" | "Inactive";
  location?: string;
  subjects?: { id: string; name: string; code?: string }[];
  [key: string]: any;
}

export interface ClassSectionRecord {
  id: string;
  grade: string;
  section: string;
  room: string;
  capacity: number;
  studentCount: number;
  classTeacher: string;
  shift: "Morning" | "Afternoon";
}

export interface CurriculumChapter {
  id: string;
  subject: string;
  grade: string;
  unit: string;
  chapter: string;
  learningOutcomes: string;
  completionPct: number;
  teacherName: string;
  status: "Completed" | "In Progress" | "Pending";
}

export interface TimetableSlot {
  id: string;
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";
  period: number;
  time: string;
  grade: string;
  section: string;
  subject: string;
  teacherName: string;
  room: string;
  hasConflict?: boolean;
  conflictReason?: string;
}

export interface AttendanceRecord {
  date: string;
  grade: string;
  section: string;
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  onLeave: number;
  submittedBy: string;
  status: "Submitted" | "Pending";
}

export interface LeaveRequestRecord {
  id: string;
  applicantType: "Student" | "Teacher" | "Staff";
  applicantName: string;
  detail: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
}

export interface ExamRecord {
  id: string;
  name: string;
  examType: "Unit Test" | "Periodic Test" | "Half Yearly" | "Pre-Board" | "Annual";
  grade: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  isPublished: boolean;
  passingMarks: number;
  totalMarks: number;
}

export interface FeeStructureRecord {
  id: string;
  grade: string;
  tuitionFee: number;
  annualFee: number;
  transportFee: number;
  examFee: number;
  totalFee: number;
  frequency: "Annual" | "Quarterly" | "Monthly";
}

export interface FeeDefaulterRecord {
  id: string;
  studentName: string;
  admissionNo: string;
  grade: string;
  section: string;
  parentName: string;
  parentPhone: string;
  amountDue: number;
  daysOverdue: number;
  lastPaymentDate: string;
}

export interface BroadcastRecord {
  id: string;
  title: string;
  message: string;
  audience: "Entire School" | "Students" | "Parents" | "Teachers" | "Staff";
  channels: ("In-App" | "SMS" | "WhatsApp" | "Email")[];
  sentAt: string;
  sentBy: string;
  deliveryStats: { sent: number; delivered: number; failed: number };
}

export interface CommunicationTicket {
  id: string;
  senderName: string;
  senderRole: "Parent" | "Teacher" | "Staff";
  subject: string;
  snippet: string;
  priority: "Urgent" | "High" | "Medium" | "Low";
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  timestamp: string;
  assignedTo: string;
}

export interface TransportVehicle {
  id: string;
  busNo: string;
  route: string;
  driverName: string;
  driverPhone: string;
  capacity: number;
  enrolledStudents: number;
  currentStatus: "On Route" | "At School" | "Idle";
}

export interface LibraryBook {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  totalCopies: number;
  issuedCopies: number;
}

export interface SchoolAsset {
  id: string;
  assetId: string;
  category: "Computers & IT" | "Lab Equipment" | "Furniture" | "Sports" | "Audio Visual";
  name: string;
  location: string;
  condition: "Good" | "Needs Maintenance" | "Damaged";
  assignedTo: string;
  purchaseDate: string;
  value: number;
  warrantyUntil: string;
}

export interface PtmSchedule {
  id: string;
  title: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  targetGrades: string[];
  totalSlots: number;
  bookedSlots: number;
  status: "open" | "completed" | "draft" | string;
}

export interface DisciplineIncident {
  id: string;
  studentName: string;
  admissionNo: string;
  grade: string;
  incidentType: string;
  severity: "Low" | "Medium" | "High" | "minor" | "moderate" | "severe" | string;
  reportedBy: string;
  date: string;
  description: string;
  status: string;
}

export interface AuditLogItem {
  id: string;
  actor: string;
  role: string;
  action: string;
  resource: string;
  resourceId: string;
  timestamp: string;
  ip: string;
  previousValue?: string;
  newValue?: string;
  reason?: string;
}
