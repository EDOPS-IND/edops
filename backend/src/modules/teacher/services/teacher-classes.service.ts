import { DrizzleService } from '../../../database/drizzle.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../../auth/user.entity';

@Injectable()
export class TeacherClassesService {
  constructor(private readonly drizzle: DrizzleService) {}
  async getMyClasses(organizationId: string, user: User) {
    const classes = await this.drizzle.query(
      `SELECT c.section_id AS "sectionId",c.subject_id AS "subjectId",sec.name AS "className",sub.name AS "subjectName",sub.code AS "subjectCode",
        (SELECT COUNT(*)::int FROM enrollments e WHERE e.organization_id=c.organization_id AND e.section_id=c.section_id AND e.status='active') AS "studentCount",
        (SELECT AVG(100.0*s.score/NULLIF(a.max_score,0)) FROM assignments a JOIN submissions s ON s.organization_id=a.organization_id AND s.assignment_id=a.id WHERE a.organization_id=c.organization_id AND a.section_id=c.section_id AND a.subject_id=c.subject_id AND s.status='graded') AS "subjectAverage"
       FROM class_subject_assignments c JOIN sections sec ON sec.id=c.section_id AND sec.organization_id=c.organization_id
       JOIN subjects sub ON sub.id=c.subject_id AND sub.organization_id=c.organization_id
       WHERE c.organization_id=$1 AND c.teacher_user_id=$2 ORDER BY sec.name,sub.name`, [organizationId,user.id]);
    return { classes:classes.map(c=>({...c,subjectAverage:c.subjectAverage==null?null:Number(c.subjectAverage),attendanceRate:null,assignmentCompletionRate:null,curriculumProgress:null,statusDistribution:null})) };
  }
  async getClassDetails(organizationId: string, user: User, sectionId: string) {
    const data=await this.getMyClasses(organizationId,user);
    const selected=data.classes.find(c=>c.sectionId===sectionId);
    if (!selected) throw new NotFoundException('Assigned class not found');
    const students=await this.drizzle.query(`SELECT u.id,u.name,u.email,e.roll_number AS "rollNumber" FROM enrollments e JOIN users u ON u.id=e.student_user_id WHERE e.organization_id=$1 AND e.section_id=$2 AND e.status='active' ORDER BY e.roll_number`, [organizationId,sectionId]);
    const chapters=await this.drizzle.query(`SELECT n.id,n.chapter_name AS name,n.status,n.actual_completion_percentage AS "completionPct" FROM principal_curriculum_nodes n JOIN sections sec ON sec.organization_id=n.organization_id AND sec.id=$3 WHERE n.organization_id=$1 AND n.subject_id=$2 AND (n.grade=sec.name OR n.grade=(SELECT p.name FROM programs p WHERE p.id=sec.program_id) OR n.grade=(SELECT REPLACE(p.name, 'Class ', '') FROM programs p WHERE p.id=sec.program_id)) AND n.academic_year_id=sec.academic_year_id ORDER BY n.created_at`, [organizationId,selected.subjectId,sectionId]);
    return { overview:{...selected,sectionName:selected.className,attendance:null,highestScore:null,lowestScore:null,medianScore:null,passRate:null,assignmentCompletion:null,learningOutcomeAchievement:null},
      students:students.map(s=>({...s,attendance:null,subjectAverage:null,assignmentCompletion:null,assessmentScore:null,status:'Enrolled'})),chapters };
  }
}
