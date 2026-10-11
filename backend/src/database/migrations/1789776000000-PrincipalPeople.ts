import { MigrationInterface, QueryRunner } from 'typeorm';

export class PrincipalPeople1789776000000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`
      DELETE FROM school_departments
      WHERE head_teacher_id IS NULL AND (code, name, head_teacher_name, faculty_count, student_load, syllabus_progress, attendance_rate) IN (
        ('MATH', 'Mathematics & Statistics', 'Dr. Anand Kumar', 14, 620, 88, 96),
        ('SCI', 'Natural Sciences & Labs', 'Prof. Meenakshi S.', 18, 580, 92, 94),
        ('ENG', 'English & Modern Languages', 'Mrs. Rekha V.', 12, 640, 95, 97),
        ('SOC', 'Social Sciences & Civics', 'Mr. Tariq Anwar', 10, 520, 85, 93),
        ('CS', 'Computer Science & AI Lab', 'Er. Vikrant Joshi', 8, 480, 96, 98),
        ('SPORTS', 'Physical Education & Sports', 'Coach Baljeet Singh', 6, 750, 100, 99)
      );
      CREATE TABLE principal_academic_coordinators (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        teacher_user_id uuid NOT NULL REFERENCES users(id),
        department_id uuid NOT NULL REFERENCES school_departments(id),
        assigned_by uuid NOT NULL REFERENCES users(id),
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (organization_id, teacher_user_id, department_id)
      );
      CREATE INDEX principal_coordinators_org_idx ON principal_academic_coordinators(organization_id);
    `);
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query('DROP TABLE principal_academic_coordinators');
  }
}
