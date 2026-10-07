import { MigrationInterface, QueryRunner } from 'typeorm';

export class TeacherControlCenter1789603200000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`
      -- 1. Teacher Timetable Slots
      CREATE TABLE IF NOT EXISTS teacher_timetable_slots (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        teacher_user_id uuid NOT NULL,
        section_id uuid NOT NULL,
        subject_id uuid NOT NULL,
        day_of_week varchar(16) NOT NULL CHECK (day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
        period_number smallint NOT NULL CHECK (period_number BETWEEN 1 AND 20),
        start_time varchar(8) NOT NULL,
        end_time varchar(8) NOT NULL,
        room varchar(64) NOT NULL DEFAULT 'Classroom',
        is_substitution boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (organization_id, id),
        FOREIGN KEY (organization_id, section_id) REFERENCES sections(organization_id, id),
        FOREIGN KEY (organization_id, subject_id) REFERENCES subjects(organization_id, id),
        FOREIGN KEY (organization_id, teacher_user_id) REFERENCES memberships(organization_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_teacher_timetable ON teacher_timetable_slots(organization_id, teacher_user_id, day_of_week, period_number);

      -- 2. Teacher Lesson Deliveries (Post-lesson reflection & curriculum log)
      CREATE TABLE IF NOT EXISTS teacher_lesson_deliveries (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        lesson_plan_id uuid,
        teacher_user_id uuid NOT NULL,
        section_id uuid NOT NULL,
        subject_id uuid NOT NULL,
        delivery_date date NOT NULL,
        period_number smallint NOT NULL CHECK (period_number BETWEEN 1 AND 20),
        topics_covered text NOT NULL,
        participation_pct smallint NOT NULL DEFAULT 85 CHECK (participation_pct BETWEEN 0 AND 100),
        homework_assigned text,
        reflection text,
        status varchar(24) NOT NULL DEFAULT 'conducted' CHECK (status IN ('scheduled', 'conducted', 'cancelled')),
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (organization_id, id),
        FOREIGN KEY (organization_id, section_id) REFERENCES sections(organization_id, id),
        FOREIGN KEY (organization_id, subject_id) REFERENCES subjects(organization_id, id),
        FOREIGN KEY (organization_id, teacher_user_id) REFERENCES memberships(organization_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_teacher_deliveries ON teacher_lesson_deliveries(organization_id, teacher_user_id, delivery_date);

      -- 3. Teacher Study Materials
      CREATE TABLE IF NOT EXISTS teacher_study_materials (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        teacher_user_id uuid NOT NULL,
        section_id uuid NOT NULL,
        subject_id uuid NOT NULL,
        unit varchar(120),
        chapter varchar(120) NOT NULL,
        topic varchar(200) NOT NULL,
        title varchar(200) NOT NULL,
        description text,
        file_type varchar(32) NOT NULL DEFAULT 'pdf' CHECK (file_type IN ('pdf', 'document', 'video', 'link', 'presentation', 'image')),
        file_url text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (organization_id, id),
        FOREIGN KEY (organization_id, section_id) REFERENCES sections(organization_id, id),
        FOREIGN KEY (organization_id, subject_id) REFERENCES subjects(organization_id, id),
        FOREIGN KEY (organization_id, teacher_user_id) REFERENCES memberships(organization_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_teacher_study_mat ON teacher_study_materials(organization_id, section_id, subject_id, chapter);

      -- 4. Teacher Academic Tasks (Action items: attendance, evaluations, interventions)
      CREATE TABLE IF NOT EXISTS teacher_academic_tasks (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        teacher_user_id uuid NOT NULL,
        task_type varchar(32) NOT NULL CHECK (task_type IN ('attendance', 'evaluation', 'lesson_plan', 'marks', 'intervention', 'meeting')),
        title varchar(255) NOT NULL,
        description text,
        due_date date NOT NULL,
        status varchar(24) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'snoozed')),
        priority varchar(16) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
        entity_id text,
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (organization_id, id),
        FOREIGN KEY (organization_id, teacher_user_id) REFERENCES memberships(organization_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_teacher_tasks ON teacher_academic_tasks(organization_id, teacher_user_id, status, due_date);

      -- 5. Teacher In-App Academic Messages
      CREATE TABLE IF NOT EXISTS teacher_messages (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        sender_id uuid NOT NULL,
        recipient_id uuid NOT NULL,
        recipient_role varchar(24) NOT NULL CHECK (recipient_role IN ('student', 'parent', 'principal', 'school_admin')),
        section_id uuid,
        subject_id uuid,
        subject_line varchar(255) NOT NULL,
        body text NOT NULL,
        priority varchar(16) NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent')),
        is_read boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (organization_id, id),
        FOREIGN KEY (organization_id, sender_id) REFERENCES memberships(organization_id, user_id),
        FOREIGN KEY (organization_id, recipient_id) REFERENCES memberships(organization_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_teacher_msgs_inbox ON teacher_messages(organization_id, recipient_id, is_read);
      CREATE INDEX IF NOT EXISTS idx_teacher_msgs_sent ON teacher_messages(organization_id, sender_id);
    `);
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query(`
      DROP TABLE IF EXISTS teacher_messages;
      DROP TABLE IF EXISTS teacher_academic_tasks;
      DROP TABLE IF EXISTS teacher_study_materials;
      DROP TABLE IF EXISTS teacher_lesson_deliveries;
      DROP TABLE IF EXISTS teacher_timetable_slots;
    `);
  }
}
