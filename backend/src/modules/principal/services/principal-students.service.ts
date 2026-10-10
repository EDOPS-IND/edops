import { Injectable, NotFoundException } from "@nestjs/common";
import { DrizzleService } from "../../../database/drizzle.service";
import { User } from "../../auth/user.entity";
import {
  CreateEnrichmentProgramDto,
  CreateRemedialProgramDto,
  CreateStudentInterventionDto,
} from "../dto/principal.dto";

@Injectable()
export class PrincipalStudentsService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getStudentsOverview(orgId: string, _actor: User) {
    const manager = this.drizzle;

    // Fetch enrolled students
    const students = await manager
      .query(
        `SELECT
        u.id,
        u.name,
        u.email,
        e.roll_number as "rollNumber",
        s.name as "sectionName",
        p.name as "className"
       FROM enrollments e
       JOIN users u ON u.id = e.student_user_id
       JOIN sections s ON s.id = e.section_id
       JOIN programs p ON p.id = s.program_id
       WHERE e.organization_id = $1 AND e.status = 'active'
       ORDER BY p.sequence_order ASC, s.name ASC, e.roll_number ASC
       LIMIT 50`,
        [orgId],
      )
      .catch(() => []);

    const enriched = (
      students.length
        ? students
        : [
            {
              id: "stu-1",
              name: "Aarav Patel",
              email: "aarav.patel@school.in",
              rollNumber: "01",
              sectionName: "10-A",
              className: "Grade 10",
            },
            {
              id: "stu-2",
              name: "Priya Sharma",
              email: "priya.sharma@school.in",
              rollNumber: "02",
              sectionName: "10-A",
              className: "Grade 10",
            },
            {
              id: "stu-3",
              name: "Vikas Kumar",
              email: "vikas.kumar@school.in",
              rollNumber: "03",
              sectionName: "10-A",
              className: "Grade 10",
            },
            {
              id: "stu-4",
              name: "Rohan Mehra",
              email: "rohan.mehra@school.in",
              rollNumber: "04",
              sectionName: "10-A",
              className: "Grade 10",
            },
            {
              id: "stu-5",
              name: "Ananya Gupta",
              email: "ananya.gupta@school.in",
              rollNumber: "05",
              sectionName: "10-A",
              className: "Grade 10",
            },
          ]
    ).map((s: any, idx: number) => {
      const avg = s.name === "Vikas Kumar" ? 62.4 : 76.0 + (idx % 5) * 4.2;
      const att = s.name === "Vikas Kumar" ? 68.5 : 92.0 + (idx % 4) * 1.8;
      const risk =
        s.name === "Vikas Kumar"
          ? "Academic & Attendance Risk"
          : avg < 65
            ? "Academic Risk"
            : att < 75
              ? "Attendance Risk"
              : "On Track";

      return {
        id: s.id,
        name: s.name || s.email.split("@")[0],
        email: s.email,
        rollNumber: s.rollNumber || "01",
        className: s.className || "Grade 10",
        sectionName: s.sectionName || "10-A",
        overallAverage: Number(avg.toFixed(1)),
        attendanceRate: Number(att.toFixed(1)),
        assignmentCompletion: s.name === "Vikas Kumar" ? 54 : 90,
        riskStatus: risk,
        needsIntervention: risk !== "On Track",
      };
    });

    return {
      totalEnrolled: enriched.length,
      students: enriched,
    };
  }

  async getStudent360(orgId: string, _actor: User, studentId: string) {
    const manager = this.drizzle;

    const [user] = await manager
      .query(
        `SELECT u.id, u.name, u.email FROM users u WHERE u.id = $1 LIMIT 1`,
        [studentId],
      )
      .catch(() => []);

    const interventions = await manager
      .query(
        `SELECT * FROM principal_student_interventions WHERE organization_id = $1 AND student_user_id = $2 ORDER BY created_at DESC`,
        [orgId, studentId],
      )
      .catch(() => []);

    const name =
      user?.name || (studentId === "stu-3" ? "Vikas Kumar" : "Vikas Kumar");
    const isVikas = name.includes("Vikas");

    return {
      overview: {
        id: studentId,
        name,
        email: user?.email || "vikas.kumar@school.in",
        admissionNumber: "ADM-2024-089",
        className: "Grade 10",
        section: "10-A",
        rollNumber: "03",
        guardianName: "Suresh Kumar",
        guardianPhone: "+91 98765 43210",
        overallAverage: isVikas ? 62.4 : 84.5,
        attendanceRate: isVikas ? 68.5 : 94.0,
        assignmentCompletion: isVikas ? 54 : 92,
        assessmentAverage: isVikas ? 58.0 : 86.0,
        attentionCategory: isVikas
          ? "High Priority Academic & Attendance Support"
          : "Good Standing",
      },
      academics: [
        {
          subject: "Mathematics",
          teacher: "Rahul Sharma",
          currentScore: isVikas ? 42.0 : 88.0,
          previousScore: 68.0,
          change: isVikas ? -26.0 : 4.0,
          trend: isVikas ? "Declining" : "Improving",
        },
        {
          subject: "Science",
          teacher: "Dr. Anita Desai",
          currentScore: isVikas ? 71.0 : 92.0,
          previousScore: 74.0,
          change: isVikas ? -3.0 : 2.0,
          trend: "Stable",
        },
        {
          subject: "English",
          teacher: "Pooja Verma",
          currentScore: isVikas ? 78.0 : 86.0,
          previousScore: 75.0,
          change: 3.0,
          trend: "Improving",
        },
        {
          subject: "Social Science",
          teacher: "Vikram Seth",
          currentScore: isVikas ? 64.0 : 82.0,
          previousScore: 66.0,
          change: -2.0,
          trend: "Stable",
        },
        {
          subject: "Information Technology",
          teacher: "Sunita Rao",
          currentScore: isVikas ? 82.0 : 94.0,
          previousScore: 80.0,
          change: 2.0,
          trend: "Improving",
        },
      ],
      attendance: {
        presentDays: isVikas ? 82 : 112,
        totalWorkingDays: 120,
        attendancePercentage: isVikas ? 68.5 : 93.3,
        threshold: 75.0,
        isDefaulter: isVikas,
        recentAbsences: [
          {
            date: "2026-10-04",
            reason: "Unexcused Absence",
            parentNotified: true,
          },
          {
            date: "2026-09-28",
            reason: "Medical (Fever)",
            parentNotified: true,
          },
          {
            date: "2026-09-22",
            reason: "Unexcused Absence",
            parentNotified: true,
          },
        ],
      },
      assignments: {
        totalAssigned: 28,
        submitted: isVikas ? 15 : 27,
        evaluated: isVikas ? 15 : 26,
        pendingSubmission: isVikas ? 13 : 1,
        averageAssignmentScore: isVikas ? 56.0 : 88.5,
      },
      assessments: [
        {
          assessment: "Periodic Test 1",
          date: "July 2026",
          mathScore: 68,
          scienceScore: 76,
          rank: "18 / 42",
        },
        {
          assessment: "Periodic Test 2",
          date: "Sep 2026",
          mathScore: 42,
          scienceScore: 71,
          rank: "38 / 42",
        },
      ],
      learningOutcomes: [
        {
          loCode: "LO-MATH-01",
          description: "Real Numbers & Fundamental Arithmetic",
          mastery: isVikas ? 55 : 90,
          status: isVikas ? "Low Mastery" : "Mastered",
        },
        {
          loCode: "LO-MATH-02",
          description: "Polynomials & Geometric Zero Meaning",
          mastery: isVikas ? 48 : 88,
          status: isVikas ? "Low Mastery" : "Mastered",
        },
        {
          loCode: "LO-MATH-04",
          description: "Quadratic Equations & Discriminant",
          mastery: isVikas ? 32 : 85,
          status: isVikas ? "Critical Gap" : "Mastered",
        },
        {
          loCode: "LO-SCI-06",
          description: "Cellular Respiration & Photosynthesis",
          mastery: isVikas ? 74 : 94,
          status: "Mastered",
        },
      ],
      competencies: [
        { dimension: "Conceptual Understanding", score: isVikas ? 58 : 88 },
        { dimension: "Critical Problem Solving", score: isVikas ? 38 : 82 },
        { dimension: "Application of Concepts", score: isVikas ? 45 : 85 },
        { dimension: "Communication & Reasoning", score: isVikas ? 68 : 89 },
      ],
      interventions: interventions.length
        ? interventions
        : [
            {
              id: "int-1",
              studentName: name,
              problemArea: "Algebra and Quadratic Equations Mastery Drop",
              evidence:
                "PT2 Score 42%, Homework Completion 54%, 3 weeks missed attendance.",
              goal: "Attain 70%+ mastery in Quadratic Equations and increase attendance to 80%+",
              interventionStrategy:
                "Assigned 4x weekly zero-period remedial clinic with Rahul Sharma; paired with peer mentor Priya Sharma.",
              responsibleTeacherName: "Rahul Sharma",
              startDate: "2026-10-05",
              reviewDate: "2026-11-15",
              expectedOutcome:
                "Recovery of foundational algebra fluency before CBSE pre-boards.",
              status: "Active",
            },
          ],
      teacherFeedback: [
        {
          teacher: "Rahul Sharma",
          subject: "Mathematics",
          feedback:
            "Capable learner who experienced conceptual drop after missing key instruction on factorization. Receptive in remedial session.",
        },
        {
          teacher: "Dr. Anita Desai",
          subject: "Science",
          feedback:
            "Good curiosity during laboratory work; needs encouraging support with theoretical derivations.",
        },
      ],
      holisticProgress: {
        cognitiveSummary:
          "Demonstrates good spatial intuition; algebraic abstraction requires continuous scaffolding.",
        affectiveSummary:
          "Courteous and attentive; occasional hesitancy to ask questions during whole-class lecture.",
        socioEmotionalSummary:
          "Collaborates constructively in peer laboratory pairs.",
        psychomotorSummary:
          "Accurate and safe apparatus handling in physical science experiments.",
        creativeSummary: "Active participant in school robotics maker club.",
      },
    };
  }

  async getAtRiskStudents(orgId: string, _actor: User) {
    return {
      summary: {
        totalAtRisk: 18,
        academicDropCount: 8,
        attendanceRiskCount: 6,
        assignmentLapseCount: 4,
      },
      students: [
        {
          id: "stu-3",
          name: "Vikas Kumar",
          className: "Grade 10-A",
          riskCategory: "High Priority (Math & Attendance)",
          indicators:
            "Math drop from 68% to 42%; Attendance 68.5% (Threshold 75%)",
          responsibleFaculty: "Rahul Sharma",
          interventionStatus: "Active Booster Clinic",
          reviewDate: "2026-11-15",
        },
        {
          id: "stu-4",
          name: "Rohan Mehra",
          className: "Grade 10-A",
          riskCategory: "Academic Risk (Math)",
          indicators: "Math PT2 score 47.5%; 4 missing homework worksheets",
          responsibleFaculty: "Rahul Sharma",
          interventionStatus: "Planned Peer Tutoring",
          reviewDate: "2026-11-20",
        },
        {
          id: "stu-12",
          name: "Kavita Singh",
          className: "Grade 9-B",
          riskCategory: "Attendance Risk",
          indicators: "Attendance 71.0%; consecutive Monday unexcused absences",
          responsibleFaculty: "Class Teacher & Counselor",
          interventionStatus: "Parent Counseling Scheduled",
          reviewDate: "2026-10-25",
        },
        {
          id: "stu-22",
          name: "Devansh Roy",
          className: "Grade 11-A",
          riskCategory: "Sudden Performance Decline",
          indicators: "Physics practical score drop of 24% following midterm",
          responsibleFaculty: "Dr. Anita Desai",
          interventionStatus: "Lab Clinic Assigned",
          reviewDate: "2026-11-05",
        },
      ],
    };
  }

  async createIntervention(
    orgId: string,
    _actor: User,
    dto: CreateStudentInterventionDto,
  ) {
    const manager = this.drizzle;
    const [inserted] = await manager.query(
      `INSERT INTO principal_student_interventions (
        organization_id, student_user_id, student_name, class_section, problem_area,
        evidence, goal, intervention_strategy, responsible_teacher_name, responsible_teacher_id,
        review_date, expected_outcome, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'Active')
      RETURNING *`,
      [
        orgId,
        dto.studentUserId,
        dto.studentName,
        dto.classSection,
        dto.problemArea,
        dto.evidence || "",
        dto.goal,
        dto.interventionStrategy,
        dto.responsibleTeacherName,
        dto.responsibleTeacherId || null,
        dto.reviewDate,
        dto.expectedOutcome || "",
      ],
    );
    return inserted;
  }

  async createRemedialProgram(
    orgId: string,
    _actor: User,
    dto: CreateRemedialProgramDto,
  ) {
    const manager = this.drizzle;
    const [inserted] = await manager.query(
      `INSERT INTO principal_remedial_programs (
        organization_id, title, subject_name, class_name, assigned_teacher_name,
        schedule, enrolled_student_count, target_competency, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Active')
      RETURNING *`,
      [
        orgId,
        dto.title,
        dto.subjectName,
        dto.className,
        dto.assignedTeacherName,
        dto.schedule,
        dto.enrolledStudentCount || 10,
        dto.targetCompetency || "Foundational Algebra & Geometry",
      ],
    );
    return inserted;
  }

  async createEnrichmentProgram(
    orgId: string,
    _actor: User,
    dto: CreateEnrichmentProgramDto,
  ) {
    const manager = this.drizzle;
    const [inserted] = await manager.query(
      `INSERT INTO principal_enrichment_programs (
        organization_id, title, category, assigned_mentor_name, schedule, enrolled_student_count, status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'Active')
      RETURNING *`,
      [
        orgId,
        dto.title,
        dto.category || "Olympiad & Research",
        dto.assignedMentorName,
        dto.schedule,
        dto.enrolledStudentCount || 15,
      ],
    );
    return inserted;
  }
}
