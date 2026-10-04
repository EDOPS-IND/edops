import { MigrationInterface, QueryRunner } from 'typeorm';

export class SchoolAdminControlCenter1789430400000 implements MigrationInterface {
  async up(r: QueryRunner): Promise<void> {
    await r.query(`
      -- 1. School Departments
      CREATE TABLE IF NOT EXISTS school_departments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        name varchar(100) NOT NULL,
        code varchar(30) NOT NULL,
        head_teacher_id uuid REFERENCES users(id),
        head_teacher_name varchar(120) NOT NULL DEFAULT '',
        faculty_count integer NOT NULL DEFAULT 0,
        student_load integer NOT NULL DEFAULT 0,
        syllabus_progress integer NOT NULL DEFAULT 0,
        attendance_rate integer NOT NULL DEFAULT 95,
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(organization_id, code)
      );

      -- 2. Student 360 Profiles
      CREATE TABLE IF NOT EXISTS student_profiles (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        student_user_id uuid NOT NULL REFERENCES users(id),
        admission_number varchar(50) NOT NULL,
        dob date,
        gender varchar(20) DEFAULT 'Not Specified',
        blood_group varchar(10) DEFAULT 'O+',
        emergency_contact varchar(50) DEFAULT '',
        address text DEFAULT '',
        guardian_name varchar(120) DEFAULT '',
        guardian_phone varchar(50) DEFAULT '',
        guardian_email varchar(255) DEFAULT '',
        medical_notes text DEFAULT '',
        category varchar(50) DEFAULT 'General',
        previous_school varchar(150) DEFAULT '',
        status varchar(30) NOT NULL DEFAULT 'active',
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(organization_id, student_user_id)
      );

      -- 3. Leave Requests
      CREATE TABLE IF NOT EXISTS leave_requests (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        user_id uuid NOT NULL REFERENCES users(id),
        applicant_name varchar(120) NOT NULL,
        applicant_role varchar(30) NOT NULL DEFAULT 'student',
        leave_type varchar(50) NOT NULL,
        start_date date NOT NULL,
        end_date date NOT NULL,
        days_count integer NOT NULL DEFAULT 1,
        reason text NOT NULL DEFAULT '',
        status varchar(20) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
        reviewed_by uuid REFERENCES users(id),
        reviewed_at timestamptz,
        review_notes text,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      -- 4. Fee Structures
      CREATE TABLE IF NOT EXISTS fee_structures (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        name varchar(120) NOT NULL,
        grade varchar(50) NOT NULL,
        academic_year_id uuid REFERENCES academic_years(id),
        tuition_fee integer NOT NULL DEFAULT 0,
        development_fee integer NOT NULL DEFAULT 0,
        lab_fee integer NOT NULL DEFAULT 0,
        library_fee integer NOT NULL DEFAULT 0,
        transport_fee integer NOT NULL DEFAULT 0,
        total_annual integer NOT NULL DEFAULT 0,
        installments_count integer NOT NULL DEFAULT 4,
        due_dates jsonb NOT NULL DEFAULT '[]',
        created_at timestamptz NOT NULL DEFAULT now()
      );

      -- 5. Student Fee Dues & Recovery
      CREATE TABLE IF NOT EXISTS student_fee_dues (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        student_user_id uuid NOT NULL REFERENCES users(id),
        student_name varchar(120) NOT NULL,
        roll_number varchar(30) NOT NULL DEFAULT '',
        section_name varchar(60) NOT NULL DEFAULT '',
        fee_structure_id uuid REFERENCES fee_structures(id),
        total_due integer NOT NULL DEFAULT 0,
        amount_paid integer NOT NULL DEFAULT 0,
        amount_pending integer NOT NULL DEFAULT 0,
        concession_amount integer NOT NULL DEFAULT 0,
        concession_reason text,
        due_date date NOT NULL,
        days_overdue integer NOT NULL DEFAULT 0,
        status varchar(20) NOT NULL DEFAULT 'pending' CHECK(status IN ('paid','partial','pending','overdue')),
        last_reminder_sent_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(organization_id, student_user_id, due_date)
      );

      -- 6. Multi-Channel School Broadcasts
      CREATE TABLE IF NOT EXISTS school_broadcasts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        title varchar(255) NOT NULL,
        message text NOT NULL,
        channels text[] NOT NULL DEFAULT '{"in_app"}',
        target_audience varchar(50) NOT NULL DEFAULT 'all',
        priority varchar(20) NOT NULL DEFAULT 'normal' CHECK(priority IN ('low','normal','high','urgent')),
        sent_by uuid NOT NULL REFERENCES users(id),
        sender_name varchar(120) NOT NULL DEFAULT 'School Admin',
        recipient_count integer NOT NULL DEFAULT 0,
        delivery_stats jsonb NOT NULL DEFAULT '{"sent": 0, "delivered": 0, "failed": 0}',
        created_at timestamptz NOT NULL DEFAULT now()
      );

      -- 7. Transport Fleet
      CREATE TABLE IF NOT EXISTS transport_fleet (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        vehicle_number varchar(30) NOT NULL,
        route_name varchar(120) NOT NULL,
        capacity integer NOT NULL DEFAULT 40,
        students_assigned integer NOT NULL DEFAULT 0,
        driver_name varchar(120) NOT NULL,
        driver_phone varchar(50) NOT NULL,
        gps_device_id varchar(100),
        status varchar(30) NOT NULL DEFAULT 'on_route' CHECK(status IN ('on_route','idle','maintenance')),
        insurance_expiry date,
        fitness_expiry date,
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(organization_id, vehicle_number)
      );

      -- 8. Library Catalog & Circulation
      CREATE TABLE IF NOT EXISTS library_catalog (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        isbn varchar(30) NOT NULL,
        title varchar(255) NOT NULL,
        author varchar(150) NOT NULL,
        category varchar(80) NOT NULL DEFAULT 'General',
        total_copies integer NOT NULL DEFAULT 1,
        available_copies integer NOT NULL DEFAULT 1,
        issued_copies integer NOT NULL DEFAULT 0,
        shelf_location varchar(50) NOT NULL DEFAULT 'A-1',
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(organization_id, isbn)
      );

      -- 9. School Assets & Inventory
      CREATE TABLE IF NOT EXISTS school_assets (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        asset_code varchar(50) NOT NULL,
        name varchar(150) NOT NULL,
        category varchar(80) NOT NULL,
        location varchar(100) NOT NULL,
        purchase_date date NOT NULL DEFAULT CURRENT_DATE,
        purchase_cost integer NOT NULL DEFAULT 0,
        warranty_until date,
        condition varchar(30) NOT NULL DEFAULT 'good' CHECK(condition IN ('good','needs_maintenance','damaged')),
        custodian_name varchar(120) NOT NULL DEFAULT '',
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(organization_id, asset_code)
      );

      -- 10. Discipline Incidents
      CREATE TABLE IF NOT EXISTS discipline_incidents (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        incident_code varchar(30) NOT NULL,
        student_user_id uuid REFERENCES users(id),
        student_name varchar(120) NOT NULL,
        class_section varchar(60) NOT NULL DEFAULT '',
        incident_type varchar(80) NOT NULL,
        severity varchar(20) NOT NULL DEFAULT 'minor' CHECK(severity IN ('minor','moderate','severe')),
        description text NOT NULL DEFAULT '',
        action_taken text NOT NULL DEFAULT '',
        reported_by_name varchar(120) NOT NULL DEFAULT 'Staff Member',
        parent_notified boolean NOT NULL DEFAULT false,
        status varchar(20) NOT NULL DEFAULT 'open' CHECK(status IN ('open','resolved','escalated')),
        incident_date date NOT NULL DEFAULT CURRENT_DATE,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      -- 11. PTM Schedules
      CREATE TABLE IF NOT EXISTS ptm_schedules (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        title varchar(150) NOT NULL,
        event_date date NOT NULL,
        start_time varchar(20) NOT NULL,
        end_time varchar(20) NOT NULL,
        slot_duration_minutes integer NOT NULL DEFAULT 15,
        target_grades text[] NOT NULL DEFAULT '{}',
        total_slots integer NOT NULL DEFAULT 0,
        booked_slots integer NOT NULL DEFAULT 0,
        status varchar(20) NOT NULL DEFAULT 'open' CHECK(status IN ('draft','open','completed')),
        created_at timestamptz NOT NULL DEFAULT now()
      );

      -- 12. Timetable Entries
      CREATE TABLE IF NOT EXISTS timetable_entries (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        academic_year_id uuid NOT NULL REFERENCES academic_years(id),
        section_id uuid NOT NULL REFERENCES sections(id),
        subject_id uuid NOT NULL REFERENCES subjects(id),
        teacher_user_id uuid NOT NULL REFERENCES users(id),
        day_of_week smallint NOT NULL CHECK(day_of_week BETWEEN 1 AND 6),
        period_number smallint NOT NULL CHECK(period_number BETWEEN 1 AND 8),
        start_time varchar(10) NOT NULL,
        end_time varchar(10) NOT NULL,
        room_number varchar(50) NOT NULL DEFAULT '',
        created_at timestamptz NOT NULL DEFAULT now()
      );

      -- Indexes for High Performance Tenant Isolation
      CREATE INDEX IF NOT EXISTS idx_student_profiles_org ON student_profiles(organization_id, student_user_id);
      CREATE INDEX IF NOT EXISTS idx_leave_requests_org ON leave_requests(organization_id, status);
      CREATE INDEX IF NOT EXISTS idx_fee_dues_org ON student_fee_dues(organization_id, status, days_overdue);
      CREATE INDEX IF NOT EXISTS idx_broadcasts_org ON school_broadcasts(organization_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_discipline_org ON discipline_incidents(organization_id, status);
      CREATE INDEX IF NOT EXISTS idx_timetable_org ON timetable_entries(organization_id, section_id, day_of_week);
      CREATE INDEX IF NOT EXISTS idx_timetable_teacher_conflict ON timetable_entries(organization_id, teacher_user_id, day_of_week, period_number);
    `);
  }

  async down(r: QueryRunner): Promise<void> {
    await r.query(`
      DROP TABLE IF EXISTS timetable_entries;
      DROP TABLE IF EXISTS ptm_schedules;
      DROP TABLE IF EXISTS discipline_incidents;
      DROP TABLE IF EXISTS school_assets;
      DROP TABLE IF EXISTS library_catalog;
      DROP TABLE IF EXISTS transport_fleet;
      DROP TABLE IF EXISTS school_broadcasts;
      DROP TABLE IF EXISTS student_fee_dues;
      DROP TABLE IF EXISTS fee_structures;
      DROP TABLE IF EXISTS leave_requests;
      DROP TABLE IF EXISTS student_profiles;
      DROP TABLE IF EXISTS school_departments;
    `);
  }
}
