import { MigrationInterface, QueryRunner } from 'typeorm';

export class PrincipalControlCenter1789516800000 implements MigrationInterface {
  async up(r: QueryRunner): Promise<void> {
    await r.query(`
      -- Update membership and invitation role check constraints to allow 'principal'
      ALTER TABLE memberships DROP CONSTRAINT IF EXISTS memberships_role_check;
      ALTER TABLE memberships ADD CONSTRAINT memberships_role_check CHECK (role IN ('school_admin', 'principal', 'teacher', 'student', 'parent'));

      ALTER TABLE invitations DROP CONSTRAINT IF EXISTS invitations_role_check;
      ALTER TABLE invitations ADD CONSTRAINT invitations_role_check CHECK (role IN ('school_admin', 'principal', 'teacher', 'student'));

      -- 1. Annual Academic & Pedagogical Plans
      CREATE TABLE IF NOT EXISTS principal_academic_plans (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        academic_year_id uuid REFERENCES academic_years(id),
        title varchar(200) NOT NULL,
        board varchar(50) NOT NULL DEFAULT 'CBSE',
        academic_objectives text NOT NULL DEFAULT '',
        learning_outcomes_strategy text NOT NULL DEFAULT '',
        teaching_pedagogy_strategy text NOT NULL DEFAULT '',
        assessment_strategy text NOT NULL DEFAULT '',
        teacher_development_goals text NOT NULL DEFAULT '',
        student_support_strategy text NOT NULL DEFAULT '',
        remedial_plan text NOT NULL DEFAULT '',
        enrichment_plan text NOT NULL DEFAULT '',
        status varchar(30) NOT NULL DEFAULT 'In Progress' CHECK(status IN ('Draft', 'Review', 'Approved', 'In Progress', 'Completed')),
        approved_by uuid REFERENCES users(id),
        approved_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      -- 2. School Academic Targets & Goals
      CREATE TABLE IF NOT EXISTS principal_academic_targets (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        academic_year_id uuid REFERENCES academic_years(id),
        title varchar(200) NOT NULL,
        category varchar(80) NOT NULL DEFAULT 'Performance',
        baseline_value varchar(50) NOT NULL DEFAULT '0%',
        target_value varchar(50) NOT NULL,
        current_value varchar(50) NOT NULL DEFAULT '0%',
        progress_percentage integer NOT NULL DEFAULT 0,
        owner_name varchar(120) NOT NULL DEFAULT 'Academic Council',
        deadline date NOT NULL,
        status varchar(30) NOT NULL DEFAULT 'In Progress' CHECK(status IN ('Not Started', 'In Progress', 'Achieved', 'At Risk')),
        created_at timestamptz NOT NULL DEFAULT now()
      );

      -- 3. Academic Action Plans (Decision & Intervention Engine)
      CREATE TABLE IF NOT EXISTS principal_action_plans (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        issue varchar(255) NOT NULL,
        evidence text NOT NULL DEFAULT '',
        root_cause text NOT NULL DEFAULT '',
        action text NOT NULL,
        owner_name varchar(120) NOT NULL,
        owner_user_id uuid REFERENCES users(id),
        deadline date NOT NULL,
        expected_result text NOT NULL DEFAULT '',
        review_date date NOT NULL,
        status varchar(30) NOT NULL DEFAULT 'Active' CHECK(status IN ('Planned', 'Active', 'Monitoring', 'Resolved', 'Overdue')),
        created_at timestamptz NOT NULL DEFAULT now()
      );

      -- 4. Academic Review Meetings
      CREATE TABLE IF NOT EXISTS principal_academic_meetings (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        meeting_type varchar(80) NOT NULL DEFAULT 'Weekly Review',
        meeting_date date NOT NULL DEFAULT CURRENT_DATE,
        participants text[] NOT NULL DEFAULT '{}',
        agenda text NOT NULL,
        findings text NOT NULL DEFAULT '',
        decisions text NOT NULL DEFAULT '',
        action_items jsonb NOT NULL DEFAULT '[]',
        status varchar(30) NOT NULL DEFAULT 'Completed' CHECK(status IN ('Scheduled', 'In Progress', 'Completed')),
        created_at timestamptz NOT NULL DEFAULT now()
      );

      -- 5. Teacher Academic Observations
      CREATE TABLE IF NOT EXISTS principal_teacher_observations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        teacher_user_id uuid NOT NULL REFERENCES users(id),
        observer_user_id uuid NOT NULL REFERENCES users(id),
        observer_name varchar(120) NOT NULL DEFAULT 'Principal',
        observation_date date NOT NULL DEFAULT CURRENT_DATE,
        class_name varchar(60) NOT NULL,
        subject_name varchar(100) NOT NULL,
        lesson_topic varchar(200) NOT NULL,
        observation_type varchar(60) NOT NULL DEFAULT 'Formal Classroom Walkthrough',
        planning_score integer NOT NULL DEFAULT 4,
        pedagogy_score integer NOT NULL DEFAULT 4,
        engagement_score integer NOT NULL DEFAULT 4,
        differentiation_score integer NOT NULL DEFAULT 4,
        assessment_score integer NOT NULL DEFAULT 4,
        overall_rating varchar(20) NOT NULL DEFAULT 'Good' CHECK(overall_rating IN ('Needs Support', 'Satisfactory', 'Good', 'Exemplary')),
        strengths text NOT NULL DEFAULT '',
        areas_for_improvement text NOT NULL DEFAULT '',
        action_items text NOT NULL DEFAULT '',
        follow_up_date date,
        status varchar(30) NOT NULL DEFAULT 'Completed' CHECK(status IN ('Draft', 'Completed', 'Follow-up Required', 'Closed')),
        created_at timestamptz NOT NULL DEFAULT now()
      );

      -- 6. Teacher Professional Development
      CREATE TABLE IF NOT EXISTS principal_teacher_developments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        teacher_user_id uuid NOT NULL REFERENCES users(id),
        title varchar(200) NOT NULL,
        category varchar(80) NOT NULL DEFAULT 'Pedagogy',
        provider varchar(150) NOT NULL DEFAULT 'CBSE COE / In-House',
        training_hours integer NOT NULL DEFAULT 6,
        status varchar(30) NOT NULL DEFAULT 'Recommended' CHECK(status IN ('Recommended', 'Assigned', 'In Progress', 'Completed')),
        assigned_by_user_id uuid REFERENCES users(id),
        completed_at date,
        notes text DEFAULT '',
        created_at timestamptz NOT NULL DEFAULT now()
      );

      -- 7. Curriculum Nodes & Progress (CBSE / State Boards)
      CREATE TABLE IF NOT EXISTS principal_curriculum_nodes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        academic_year_id uuid REFERENCES academic_years(id),
        board varchar(50) NOT NULL DEFAULT 'CBSE',
        grade varchar(50) NOT NULL,
        subject_id uuid REFERENCES subjects(id),
        subject_name varchar(100) NOT NULL,
        unit_name varchar(150) NOT NULL,
        chapter_name varchar(150) NOT NULL,
        expected_completion_week integer NOT NULL DEFAULT 10,
        actual_completion_percentage integer NOT NULL DEFAULT 0,
        learning_outcomes text[] NOT NULL DEFAULT '{}',
        competencies text[] NOT NULL DEFAULT '{}',
        status varchar(30) NOT NULL DEFAULT 'On Track' CHECK(status IN ('On Track', 'Needs Attention', 'Behind Schedule', 'Completed')),
        created_at timestamptz NOT NULL DEFAULT now()
      );

      -- 8. Lesson Plans & Principal Review
      CREATE TABLE IF NOT EXISTS principal_lesson_plans (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        teacher_user_id uuid NOT NULL REFERENCES users(id),
        teacher_name varchar(120) NOT NULL,
        class_section varchar(60) NOT NULL,
        subject_name varchar(100) NOT NULL,
        topic varchar(200) NOT NULL,
        planned_date date NOT NULL,
        learning_outcomes text NOT NULL DEFAULT '',
        teaching_strategy text NOT NULL DEFAULT '',
        activities text NOT NULL DEFAULT '',
        assessment_method text NOT NULL DEFAULT '',
        resources text NOT NULL DEFAULT '',
        homework text NOT NULL DEFAULT '',
        reflection text NOT NULL DEFAULT '',
        status varchar(30) NOT NULL DEFAULT 'Submitted' CHECK(status IN ('Draft', 'Submitted', 'Approved', 'Needs Revision', 'Completed')),
        principal_feedback text NOT NULL DEFAULT '',
        reviewed_by uuid REFERENCES users(id),
        reviewed_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      -- 9. Question Papers & Blueprint Review
      CREATE TABLE IF NOT EXISTS principal_question_papers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        title varchar(200) NOT NULL,
        subject_name varchar(100) NOT NULL,
        grade varchar(50) NOT NULL,
        term varchar(60) NOT NULL DEFAULT 'Mid-Term Exam',
        total_marks integer NOT NULL DEFAULT 80,
        duration_minutes integer NOT NULL DEFAULT 180,
        difficulty_easy_pct integer NOT NULL DEFAULT 30,
        difficulty_medium_pct integer NOT NULL DEFAULT 50,
        difficulty_hard_pct integer NOT NULL DEFAULT 20,
        blueprint_json jsonb NOT NULL DEFAULT '{}',
        competency_mapped boolean NOT NULL DEFAULT true,
        submitted_by_name varchar(120) NOT NULL,
        submitted_by_user_id uuid REFERENCES users(id),
        status varchar(30) NOT NULL DEFAULT 'Under Review' CHECK(status IN ('Draft', 'Submitted', 'Under Review', 'Approved', 'Published')),
        review_comments text NOT NULL DEFAULT '',
        approved_by uuid REFERENCES users(id),
        approved_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      -- 10. Exam Marks & Controlled Publishing Workflow
      CREATE TABLE IF NOT EXISTS principal_exam_results (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        exam_name varchar(150) NOT NULL,
        term varchar(60) NOT NULL,
        class_name varchar(50) NOT NULL,
        section_name varchar(50) NOT NULL,
        subject_name varchar(100) NOT NULL,
        student_user_id uuid NOT NULL REFERENCES users(id),
        student_name varchar(120) NOT NULL,
        marks_obtained numeric(5,2) NOT NULL DEFAULT 0,
        max_marks numeric(5,2) NOT NULL DEFAULT 100,
        percentage numeric(5,2) NOT NULL DEFAULT 0,
        grade varchar(10) NOT NULL DEFAULT 'B1',
        status varchar(30) NOT NULL DEFAULT 'Verified' CHECK(status IN ('Entered', 'Verified', 'Approved', 'Published')),
        is_locked boolean NOT NULL DEFAULT false,
        published_by uuid REFERENCES users(id),
        published_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(organization_id, exam_name, class_name, section_name, subject_name, student_user_id)
      );

      -- 11. Student Academic Interventions
      CREATE TABLE IF NOT EXISTS principal_student_interventions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        student_user_id uuid NOT NULL REFERENCES users(id),
        student_name varchar(120) NOT NULL,
        class_section varchar(60) NOT NULL,
        problem_area varchar(150) NOT NULL,
        evidence text NOT NULL DEFAULT '',
        goal text NOT NULL,
        intervention_strategy text NOT NULL,
        responsible_teacher_name varchar(120) NOT NULL,
        responsible_teacher_id uuid REFERENCES users(id),
        start_date date NOT NULL DEFAULT CURRENT_DATE,
        review_date date NOT NULL,
        expected_outcome text NOT NULL DEFAULT '',
        status varchar(30) NOT NULL DEFAULT 'Active' CHECK(status IN ('Planned', 'Active', 'Monitoring', 'Improved', 'Closed')),
        notes text NOT NULL DEFAULT '',
        created_at timestamptz NOT NULL DEFAULT now()
      );

      -- 12. Remedial & Enrichment Programs
      CREATE TABLE IF NOT EXISTS principal_remedial_programs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        title varchar(150) NOT NULL,
        subject_name varchar(100) NOT NULL,
        class_name varchar(50) NOT NULL,
        assigned_teacher_name varchar(120) NOT NULL,
        assigned_teacher_id uuid REFERENCES users(id),
        schedule varchar(120) NOT NULL,
        enrolled_student_count integer NOT NULL DEFAULT 0,
        target_competency text NOT NULL DEFAULT '',
        progress_notes text NOT NULL DEFAULT '',
        status varchar(30) NOT NULL DEFAULT 'Active' CHECK(status IN ('Planned', 'Active', 'Completed')),
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS principal_enrichment_programs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        title varchar(150) NOT NULL,
        category varchar(80) NOT NULL DEFAULT 'Olympiad & Research',
        assigned_mentor_name varchar(120) NOT NULL,
        assigned_mentor_id uuid REFERENCES users(id),
        enrolled_student_count integer NOT NULL DEFAULT 0,
        schedule varchar(120) NOT NULL,
        achievements text NOT NULL DEFAULT '',
        status varchar(30) NOT NULL DEFAULT 'Active' CHECK(status IN ('Active', 'Completed')),
        created_at timestamptz NOT NULL DEFAULT now()
      );

      -- 13. Academic Alerts (Attention Required Center)
      CREATE TABLE IF NOT EXISTS principal_academic_alerts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        category varchar(80) NOT NULL DEFAULT 'Academic Performance',
        severity varchar(20) NOT NULL DEFAULT 'high' CHECK(severity IN ('low', 'medium', 'high', 'critical')),
        title varchar(255) NOT NULL,
        description text NOT NULL,
        entity_type varchar(50) NOT NULL DEFAULT 'class',
        entity_id varchar(100),
        status varchar(20) NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'investigating', 'action_assigned', 'resolved')),
        assigned_to_name varchar(120) DEFAULT '',
        resolution_notes text DEFAULT '',
        resolved_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      -- 14. Parent Academic Queries & Complaints Workflow
      CREATE TABLE IF NOT EXISTS principal_parent_queries (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        parent_name varchar(120) NOT NULL,
        parent_email varchar(254) NOT NULL,
        student_name varchar(120) NOT NULL,
        class_section varchar(60) NOT NULL,
        subject varchar(100) NOT NULL DEFAULT 'Academics',
        query_text text NOT NULL,
        status varchar(30) NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'investigating', 'assigned', 'resolved', 'closed')),
        assigned_teacher_name varchar(120) DEFAULT '',
        assigned_teacher_id uuid REFERENCES users(id),
        resolution_notes text DEFAULT '',
        resolved_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      -- 15. Academic Audit Execution Logs
      CREATE TABLE IF NOT EXISTS principal_academic_audits (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        week_number integer NOT NULL,
        class_name varchar(50) NOT NULL,
        teacher_user_id uuid REFERENCES users(id),
        teacher_name varchar(120) NOT NULL,
        expected_activities integer NOT NULL DEFAULT 40,
        completed_activities integer NOT NULL DEFAULT 36,
        execution_score numeric(5,2) NOT NULL DEFAULT 90.0,
        breakdown_json jsonb NOT NULL DEFAULT '{}',
        audit_date date NOT NULL DEFAULT CURRENT_DATE,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      -- 16. CBSE Holistic Progress Card (Multi-dimensional Assessment)
      CREATE TABLE IF NOT EXISTS principal_holistic_progress (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        student_user_id uuid NOT NULL REFERENCES users(id),
        academic_year_id uuid REFERENCES academic_years(id),
        term varchar(50) NOT NULL DEFAULT 'Term 1',
        cognitive_summary text NOT NULL DEFAULT '',
        affective_summary text NOT NULL DEFAULT '',
        socio_emotional_summary text NOT NULL DEFAULT '',
        psychomotor_summary text NOT NULL DEFAULT '',
        creative_summary text NOT NULL DEFAULT '',
        self_assessment_score integer NOT NULL DEFAULT 4,
        peer_assessment_score integer NOT NULL DEFAULT 4,
        teacher_reflection text NOT NULL DEFAULT '',
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(organization_id, student_user_id, term)
      );

      -- High-Performance Tenant Isolation Indexes
      CREATE INDEX IF NOT EXISTS idx_principal_plans_org ON principal_academic_plans(organization_id, status);
      CREATE INDEX IF NOT EXISTS idx_principal_targets_org ON principal_academic_targets(organization_id, status);
      CREATE INDEX IF NOT EXISTS idx_principal_actions_org ON principal_action_plans(organization_id, status);
      CREATE INDEX IF NOT EXISTS idx_principal_obs_org ON principal_teacher_observations(organization_id, teacher_user_id);
      CREATE INDEX IF NOT EXISTS idx_principal_curric_org ON principal_curriculum_nodes(organization_id, grade, subject_name);
      CREATE INDEX IF NOT EXISTS idx_principal_lesson_org ON principal_lesson_plans(organization_id, teacher_user_id, status);
      CREATE INDEX IF NOT EXISTS idx_principal_results_org ON principal_exam_results(organization_id, exam_name, class_name);
      CREATE INDEX IF NOT EXISTS idx_principal_interventions_org ON principal_student_interventions(organization_id, status);
      CREATE INDEX IF NOT EXISTS idx_principal_alerts_org ON principal_academic_alerts(organization_id, status);
      CREATE INDEX IF NOT EXISTS idx_principal_parent_queries_org ON principal_parent_queries(organization_id, status);
      CREATE INDEX IF NOT EXISTS idx_principal_audits_org ON principal_academic_audits(organization_id, week_number);
    `);
  }

  async down(r: QueryRunner): Promise<void> {
    await r.query(`
      DROP TABLE IF EXISTS principal_holistic_progress;
      DROP TABLE IF EXISTS principal_academic_audits;
      DROP TABLE IF EXISTS principal_parent_queries;
      DROP TABLE IF EXISTS principal_academic_alerts;
      DROP TABLE IF EXISTS principal_enrichment_programs;
      DROP TABLE IF EXISTS principal_remedial_programs;
      DROP TABLE IF EXISTS principal_student_interventions;
      DROP TABLE IF EXISTS principal_exam_results;
      DROP TABLE IF EXISTS principal_question_papers;
      DROP TABLE IF EXISTS principal_lesson_plans;
      DROP TABLE IF EXISTS principal_curriculum_nodes;
      DROP TABLE IF EXISTS principal_teacher_developments;
      DROP TABLE IF EXISTS principal_teacher_observations;
      DROP TABLE IF EXISTS principal_academic_meetings;
      DROP TABLE IF EXISTS principal_action_plans;
      DROP TABLE IF EXISTS principal_academic_targets;
      DROP TABLE IF EXISTS principal_academic_plans;
    `);
  }
}
