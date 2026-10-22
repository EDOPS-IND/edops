const assert = require('node:assert/strict');
const { test } = require('node:test');
const { PrincipalAcademicsService } = require('../dist/modules/principal/services/principal-academics.service');

test('principal academics uses stored records without sample performance scores', async () => {
  const service = new PrincipalAcademicsService({
    query: async (sql) => {
      if (sql.includes('UPDATE sections')) return [{ id: 'section-1', classTeacherUserId: 'teacher-1' }];
      if (sql.includes('FROM sections s')) return [{ id: 'section-1', name: 'A', programName: 'Grade 10', capacity: 40, enrolledCount: '2', classTeacherUserId: 'teacher-1', classTeacherName: 'Teacher One' }];
      if (sql.includes('FROM subjects sub') || sql.includes('FROM subjects s')) return [{ id: 'subject-1', name: 'Mathematics', subjectId: 'subject-1', subjectName: 'Mathematics', sectionCount: 1, teachers: 'Teacher One', teacherName: 'Teacher One', completionPct: 40 }];
      if (sql.includes('FROM academic_years')) return [];
      if (sql.includes('FROM enrollments e')) return [{ studentId: 'student-1', name: 'Student One', rollNo: 'ROLL-001', attendanceRate: 95 }];
      if (sql.includes('FROM users u')) return [{ id: 'teacher-1', name: 'Teacher One' }];
      if (sql.includes('FROM principal_curriculum_nodes')) return [{ id: 'node-1', grade: 'Grade 10', subject_name: 'Mathematics', unit_name: 'Algebra', chapter_name: 'Quadratics', expected_completion_week: 12, actual_completion_percentage: 40, learning_outcomes: ['Solve equations'], competencies: ['Application'], status: 'On Track' }];
      if (sql.includes('FROM principal_lesson_plans')) return [{ id: 'plan-1', teacher_name: 'Teacher One', class_section: 'A', subject_name: 'Mathematics', topic: 'Quadratics', plannedDate: '2026-10-11', learning_outcomes: 'Solve equations', teaching_strategy: 'Practice', assessment_method: 'Quiz', status: 'Submitted', principal_feedback: '' }];
      return [];
    },
  });

  const result = await service.getAcademicsOverview('org-1', {});
  assert.equal(result.classes[0].studentCount, 2);
  assert.equal(result.classes[0].code, 'Grade 10 A');
  assert.equal(result.classes[0].classTeacherName, 'Teacher One');
  assert.equal(result.classes[0].averageScore, null);
  assert.equal(result.subjects[0].name, 'Mathematics');
  assert.equal(result.subjects[0].average, null);
  assert.equal(result.curriculumNodes[0].actualProgress, 40);
  assert.equal(result.curriculumNodes[0].expectedProgress, null);
  assert.equal(result.lessonPlans[0].topic, 'Quadratics');

  const detail = await service.getSectionDetail('org-1', 'section-1');
  assert.equal(detail.section.id, 'section-1');
  assert.equal(detail.section.code, 'Grade 10 A');
  assert.equal(detail.students[0].rollNo, '001');
  assert.equal(Array.isArray(detail.availableSubjects), true);

  const updated = await service.updateClassTeacher('org-1', 'section-1', 'teacher-1');
  assert.equal(updated.success, true);
  assert.equal(updated.classTeacherUserId, 'teacher-1');
});

test('principal academics allocates and removes subjects for a specific class section', async () => {
  const service = new PrincipalAcademicsService({
    query: async (sql, params) => {
      if (sql.includes('SELECT s.id, s.name, s.class_teacher_user_id')) {
        return [{ id: 'section-1', name: 'A', classTeacherUserId: 'teacher-1' }];
      }
      if (sql.includes('SELECT id FROM subjects')) {
        return [{ id: 'subject-1' }];
      }
      if (sql.includes('SELECT u.id FROM users u') || sql.includes('SELECT u.id, u.name FROM users u')) {
        return [{ id: 'teacher-1', name: 'Teacher One' }];
      }
      if (sql.includes('INSERT INTO class_subject_assignments')) {
        return [{ id: 'csa-1', sectionId: 'section-1', subjectId: 'subject-1', teacherUserId: 'teacher-1' }];
      }
      if (sql.includes('DELETE FROM')) {
        return [];
      }
      return [];
    },
  });

  const allocated = await service.allocateSectionSubject('org-1', 'section-1', {
    subjectId: 'subject-1',
    teacherUserId: 'teacher-1',
  });
  assert.equal(allocated.success, true);
  assert.equal(allocated.sectionId, 'section-1');
  assert.equal(allocated.subjectId, 'subject-1');
  assert.equal(allocated.teacherUserId, 'teacher-1');

  const removed = await service.removeSectionSubject('org-1', 'section-1', 'subject-1');
  assert.equal(removed.success, true);
  assert.equal(removed.sectionId, 'section-1');
  assert.equal(removed.subjectId, 'subject-1');
});
