export type ParentTab =
  | 'overview'
  | 'academics'
  | 'attendance'
  | 'fees'
  | 'ptm'
  | 'notices'
  | 'communication';

export interface WardInfo {
  studentUserId: string;
  name: string;
  email: string;
  rollNumber: string;
  sectionName: string;
  programName: string;
  attendancePct: number;
  todayAttendance: string;
  data?: any;
  organizationId?: string;
  refresh?: () => Promise<void>;
  checkInTime?: string;
  avatar?: string;
  gpa?: string;
  gradeScore?: number;
  pendingHomeworkCount?: number;
}

export interface LeaveApplication {
  id: string;
  studentUserId: string;
  childName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'approved' | 'pending' | 'rejected';
  submittedAt: string;
  attachmentUrl?: string;
}

export interface ParentQuery {
  id: string;
  studentUserId: string;
  childName: string;
  subject: string;
  category: string;
  queryText: string;
  status: 'open' | 'investigating' | 'resolved';
  submittedAt: string;
  response?: string;
}

export interface FeeItem {
  id: string;
  studentUserId: string;
  term: string;
  academicYear: string;
  title: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: 'paid' | 'due' | 'overdue';
  breakdown: {
    tuitionFee: number;
    labFee: number;
    sportsFee: number;
    examFee: number;
    transportFee: number;
  };
  paidAt?: string;
  receiptNumber?: string;
}

export interface PtmSlot {
  id: string;
  teacherId: string;
  teacherName: string;
  subject: string;
  timeSlot: string; // e.g. "10:00 AM - 10:15 AM"
  date: string;
  isBooked: boolean;
}

export interface PtmBooking {
  id: string;
  studentUserId: string;
  childName: string;
  teacherId: string;
  teacherName: string;
  subject: string;
  date: string;
  timeSlot: string;
  meetingMode: 'in_person' | 'video_conference';
  meetingLink?: string;
  status: 'confirmed' | 'completed' | 'cancelled';
  parentNotes?: string;
  bookedAt: string;
}
