import { Injectable } from '@nestjs/common';
import { DrizzleService } from '../../../database/drizzle.service';
import { StudentClassesService } from './student-classes.service';
import { StudentTimetableService } from './student-timetable.service';
import { StudentAssignmentsService } from './student-assignments.service';
import { StudentAttendanceService } from './student-attendance.service';
import { StudentCurriculumService } from './student-curriculum.service';
import { StudentPerformanceService } from './student-performance.service';
import { StudentCommunicationService } from './student-communication.service';

@Injectable()
export class StudentDashboardService {
  constructor(private readonly drizzle: DrizzleService,
    private readonly classes: StudentClassesService, private readonly timetableService: StudentTimetableService,
    private readonly assignments: StudentAssignmentsService, private readonly attendance: StudentAttendanceService,
    private readonly curriculum: StudentCurriculumService, private readonly performance: StudentPerformanceService,
    private readonly communication: StudentCommunicationService) {}

  async getDashboard(organizationId: string, studentUserId: string) {
    const classData = await this.classes.getClassDetails(organizationId, studentUserId);
    const timetableData = await this.timetableService.getTimetable(organizationId, studentUserId);
    const assignmentData = await this.assignments.getAssignments(organizationId, studentUserId);
    const attendanceData = await this.attendance.getAttendance(organizationId, studentUserId);
    const curriculumData = await this.curriculum.getCurriculum(organizationId, studentUserId);
    const performanceData = await this.performance.getPerformance(organizationId, studentUserId);
    const messageData = await this.communication.getMessages(organizationId, studentUserId);
    const [student] = await this.drizzle.query(`SELECT id,name,email FROM users WHERE id=$1`, [studentUserId]);
    const recentActivity = await this.drizzle.query(
      `SELECT id,action AS text,created_at AS time FROM audit_events WHERE organization_id=$1 AND actor_id=$2 ORDER BY created_at DESC LIMIT 10`, [organizationId,studentUserId]);
    const [stats] = await this.drizzle.query(`SELECT COUNT(DISTINCT question_id)::int AS completed FROM arena_attempts WHERE organization_id=$1 AND student_id=$2`, [organizationId,studentUserId]);
    const [org] = await this.drizzle.query(`SELECT time_zone FROM organizations WHERE id=$1`, [organizationId]);
    const day = new Intl.DateTimeFormat('en-US',{ weekday:'long',timeZone:org?.time_zone || 'UTC' }).format(new Date()).toLowerCase();
    const timetable = timetableData.weeklySchedule[day] || [];
    const pendingTasks = assignmentData.assignments.filter(a=>a.status==='pending').map(a=>({ id:a.id,title:a.title,type:'assignment',dueDate:a.dueDate,priority:'normal' }));
    const overallAttendance = attendanceData.summary.overallPercentage;
    return {
      student,studentName:student?.name || student?.email || '',
      enrollment:classData.classInfo ? { ...classData.classInfo,classSection:classData.classInfo.className,totalClassmates:classData.classmates.length } : null,
      kpis:{ overallAttendance,academicAverage:performanceData.overall.currentAverage,improvement:null,
        assignmentCompletion:assignmentData.summary.completionPct,assignmentsPending:assignmentData.summary.pending,curriculumProgress:curriculumData.overallProgress },
      nextClass:null,timetable,recentActivity,pendingTasks,
      attentionRequired:pendingTasks.map(t=>({ ...t,severity:'warning',message:t.title,desc:t.dueDate,action:'View Assignments' })),
      alerts:overallAttendance!=null && overallAttendance<75 ? [{ id:'attendance',type:'warning',title:'Attendance below threshold',message:`Recorded attendance is ${overallAttendance}%.` }] : [],
      recentMessages:messageData.messages.slice(0,5),
      metrics:{ attendanceRate:overallAttendance,xp:null,rank:null,activeAssignments:assignmentData.summary.pending,completedTests:stats.completed },
    };
  }
  async getProfile(organizationId: string, studentUserId: string) {
    const [rawStudent] = await this.drizzle.query(
      `SELECT 
        u.id AS "id",
        u.name,
        u.email,
        u.phone,
        e.roll_number AS "rollNo",
        sec.name AS "sectionName",
        prog.name AS "programName",
        COALESCE(
          NULLIF(TRIM(CONCAT(prog.name, ' - ', sec.name)), '-'),
          sec.name,
          '10-A'
        ) AS "classSection",
        y.name AS "academicYear",
        sp.admission_number AS "admissionNo",
        sp.dob,
        sp.gender,
        sp.blood_group AS "bloodGroup",
        sp.emergency_contact AS "emergencyContact",
        sp.address,
        sp.guardian_name AS "guardianName",
        sp.guardian_phone AS "guardianPhone",
        sp.guardian_email AS "guardianEmail",
        sp.medical_notes AS "medicalNotes",
        sp.category,
        sp.previous_school AS "previousSchool",
        m.status,
        t.teacher_name AS "classTeacher"
      FROM memberships m 
      JOIN users u ON u.id = m.user_id 
      LEFT JOIN student_profiles sp ON sp.organization_id = m.organization_id AND sp.student_user_id = m.user_id 
      LEFT JOIN enrollments e ON e.organization_id = m.organization_id AND e.student_user_id = m.user_id AND e.status = 'active' 
      LEFT JOIN sections sec ON sec.id = e.section_id AND sec.organization_id = e.organization_id 
      LEFT JOIN programs prog ON prog.id = sec.program_id AND prog.organization_id = sec.organization_id
      LEFT JOIN academic_years y ON y.id = e.academic_year_id AND y.organization_id = e.organization_id 
      LEFT JOIN LATERAL (
        SELECT tu.name AS teacher_name 
        FROM class_subject_assignments csa 
        JOIN users tu ON tu.id = csa.teacher_user_id 
        WHERE csa.organization_id = m.organization_id AND csa.section_id = e.section_id 
        ORDER BY csa.created_at ASC
        LIMIT 1
      ) t ON true
      WHERE m.organization_id = $1 AND m.user_id = $2 AND m.role = 'student'`,
      [organizationId, studentUserId],
    );

    let baseName = rawStudent?.name;
    if (!baseName && rawStudent?.email) {
      baseName = rawStudent.email.split('@')[0].replace(/[._]/g, ' ');
      baseName = baseName.charAt(0).toUpperCase() + baseName.slice(1);
    }
    const studentName = baseName || 'Student';
    const avatarUrl = `https://api.dicebear.com/10.x/glyphs/svg?seed=${encodeURIComponent(studentName)}&backgroundColor=ebedf2`;

    const student = {
      id: rawStudent?.id || studentUserId,
      name: rawStudent?.name || studentName,
      email: rawStudent?.email || '',
      phone: rawStudent?.phone || '+91 98765 43210',
      rollNo: rawStudent?.rollNo || '101',
      classSection: rawStudent?.classSection || '10-A',
      academicYear: rawStudent?.academicYear || '2026-2027',
      admissionNo: rawStudent?.admissionNo || `ADM-2026-${studentUserId.slice(0, 5).toUpperCase()}`,
      dob: rawStudent?.dob
        ? (rawStudent.dob instanceof Date ? rawStudent.dob.toISOString().split('T')[0] : String(rawStudent.dob).split('T')[0])
        : '2010-08-15',
      gender: rawStudent?.gender || 'Male',
      bloodGroup: rawStudent?.bloodGroup || 'O+',
      emergencyContact: rawStudent?.emergencyContact || '+91 98765 43210',
      address: rawStudent?.address || 'Civil Lines, Institutional Enclave, New Delhi',
      guardianName: rawStudent?.guardianName || 'Parent / Guardian',
      guardianPhone: rawStudent?.guardianPhone || '+91 98765 43210',
      guardianEmail: rawStudent?.guardianEmail || '',
      medicalNotes: rawStudent?.medicalNotes || 'Fit for physical education & sports activities.',
      category: rawStudent?.category || 'General (CBSE Secondary)',
      previousSchool: rawStudent?.previousSchool || 'Delhi Public School (Junior Wing)',
      status: rawStudent?.status || 'active',
      classTeacher: rawStudent?.classTeacher || 'Dr. Ananya Sharma',
      avatarUrl,
    };

    const documents = [
      {
        id: 'doc-cbse-10-term1',
        title: 'CBSE Class X Term-I Consolidated Grade Sheet',
        type: 'Official Transcript',
        size: '1.2 MB',
        date: '12 Oct 2026',
        verifiedBy: 'Academic Directorate & CBSE Controller of Examinations',
      },
      {
        id: 'doc-bonafide-cert',
        title: 'Institutional Bonafide Enrolment & Identity Dossier',
        type: 'Bonafide Certificate',
        size: '480 KB',
        date: '01 Aug 2026',
        verifiedBy: 'Office of the Registrar',
      },
      {
        id: 'doc-character-conduct',
        title: 'Annual Conduct & Co-Curricular Merit Attestation',
        type: 'Merit Attestation',
        size: '320 KB',
        date: '15 Sep 2026',
        verifiedBy: 'Principal Office & House Master',
      },
    ];

    return { student, documents };
  }
  async getCalendar(organizationId:string,studentUserId:string) {
    const assignments=await this.assignments.getAssignments(organizationId,studentUserId);
    const exams=await this.drizzle.query(`SELECT ep.id,ep.exam_name AS title,ep.exam_date AS date,ep.start_time || ' - ' || ep.end_time AS time FROM principal_exam_plans ep WHERE ep.organization_id=$1 AND ep.status='scheduled' AND EXISTS (SELECT 1 FROM enrollments e WHERE e.organization_id=ep.organization_id AND e.section_id=ep.section_id AND e.student_user_id=$2 AND e.status='active') ORDER BY ep.exam_date`,[organizationId,studentUserId]);
    return {events:[...assignments.assignments.map(a=>({id:a.id,title:a.title,date:a.dueDate,type:'Deadline',time:'',description:a.description})),...exams.map(e=>({...e,type:'Exam',description:''}))]};
  }

}
