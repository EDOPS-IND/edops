const assert = require('node:assert/strict');
const { test } = require('node:test');
const { PrincipalDashboardService } = require('../dist/modules/principal/services/principal-dashboard.service');

test('principal dashboard uses recorded metrics and leaves missing metrics empty', async () => {
  const rows = {
    memberships: { totalStudents: 24, totalTeachers: 3 },
    'FROM programs': { totalClasses: 2, totalSections: 4, totalSubjects: 6, activeYear: null },
    principal_academic_alerts: { openAlerts: 1 },
    'at_risk': { students: 0 },
    attendance_records: { total_records: 0, present_records: 0 },
    principal_curriculum_nodes: { completion: 45, learning: 40, competency: null },
    submissions: { total_submissions: 2, graded_submissions: 1, average_score: 70 },
    principal_exam_results: { average: 72, published: 2, locked: 1, pending: 1 },
    principal_question_papers: { total: 2, published: 1, pending: 1 },
    principal_lesson_plans: { total: 4, completed: 2, pending: 1 },
    principal_student_interventions: { total: 0, completed: 0 },
    'FROM slots': { classes: 1, teachers: 1, substitutions: 0 },
    exam_evaluations: { total_evaluations: 1 },
    teacher_lesson_deliveries: { total_delivered: 3, delivered_today: 1 },
  };
  const service = new PrincipalDashboardService({
    query: async (sql) => {
      if (sql.includes('FROM audit_events')) return [];
      const key = Object.keys(rows).find((part) => sql.includes(part));
      assert.ok(key, `unexpected query: ${sql}`);
      return [rows[key]];
    },
  });

  const dashboard = await service.getDashboard('org-1', {});
  assert.equal(dashboard.schoolKpis.activeAcademicYear, null);
  assert.equal(dashboard.academicPerformance.overallSchoolAverage, 72);
  assert.equal(dashboard.academicPerformance.curriculumCompletion, 45);
  assert.equal(dashboard.academicPerformance.averageAssessmentScore, 70);
  assert.equal(dashboard.academicHealth.score, null);
  assert.equal(dashboard.academicHealth.breakdown.attendanceRate, null);
  assert.equal(dashboard.todayOperations.classesRunning, 1);
  assert.equal(dashboard.todayOperations.examsToday, null);
  assert.equal(dashboard.examinationStatus.resultsLocked, 1);
});
