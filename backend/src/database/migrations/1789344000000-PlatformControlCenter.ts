import { MigrationInterface, QueryRunner } from 'typeorm';

export class PlatformControlCenter1789344000000 implements MigrationInterface {
  async up(r: QueryRunner): Promise<void> {
    await r.query(`
      -- 1. Feature Catalog
      CREATE TABLE IF NOT EXISTS feature_catalog (
        key varchar(50) PRIMARY KEY,
        category varchar(30) NOT NULL CHECK(category IN ('academic','administration','finance','communication','operations','advanced')),
        name varchar(100) NOT NULL,
        description text NOT NULL DEFAULT '',
        default_quota integer,
        has_quota boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      -- Seed feature catalog
      INSERT INTO feature_catalog (key, category, name, description, has_quota, default_quota) VALUES
        -- Academic
        ('student_management', 'academic', 'Student Management', 'Core student lifecycle & profile management', false, NULL),
        ('teacher_management', 'academic', 'Teacher Management', 'Teacher profiles, assignments and schedules', false, NULL),
        ('parent_management', 'academic', 'Parent Management', 'Parent portal, linked wards and directory', false, NULL),
        ('class_management', 'academic', 'Class Management', 'Academic classes and curriculum mapping', false, NULL),
        ('section_management', 'academic', 'Section Management', 'Section allocation, roster and capacity', false, NULL),
        ('subject_management', 'academic', 'Subject Management', 'Course codes, syllabi and subject weights', false, NULL),
        ('attendance', 'academic', 'Attendance', 'Daily and period-wise student/staff attendance', false, NULL),
        ('timetable', 'academic', 'Timetable', 'Automated and manual class schedule planner', false, NULL),
        ('homework', 'academic', 'Homework', 'Daily homework tracking and submission checks', false, NULL),
        ('assignments', 'academic', 'Assignments', 'Assignment publishing, grading and rubrics', false, NULL),
        ('study_material', 'academic', 'Study Material', 'Course notes, reference links and study docs', false, NULL),
        ('exams', 'academic', 'Exams', 'Exam schedules, evaluation schemes and marks entry', false, NULL),
        ('results', 'academic', 'Results', 'Mark calculations, grading curves and transcripts', false, NULL),
        ('report_cards', 'academic', 'Report Cards', 'Automated CBSE/ICSE compliant report card generator', false, NULL),

        -- Administration
        ('staff_management', 'administration', 'Staff Management', 'Non-teaching staff profiles and duties', false, NULL),
        ('school_configuration', 'administration', 'School Configuration', 'Branding, shifts, terms and campus params', false, NULL),
        ('academic_year', 'administration', 'Academic Year', 'Multi-year terms, rollovers and milestones', false, NULL),
        ('campus_management', 'administration', 'Campus Management', 'Multi-campus buildings, rooms and facilities', false, NULL),
        ('asset_management', 'administration', 'Asset Management', 'Classroom equipment, lab tools and assets', false, NULL),
        ('document_management', 'administration', 'Document Management', 'Digital locker for transfer certificates and IDs', false, NULL),

        -- Finance
        ('fee_management', 'finance', 'Fee Management', 'Fee structures, installment plans and penalties', false, NULL),
        ('online_payments', 'finance', 'Online Payments', 'Integrated payment gateway for fee collection', false, NULL),
        ('fee_receipts', 'finance', 'Fee Receipts', 'Auto-generated receipts and tax-compliant invoices', false, NULL),
        ('financial_reports', 'finance', 'Financial Reports', 'Collections, dues, ledger and bank reconciliation', false, NULL),
        ('expense_management', 'finance', 'Expense Management', 'Campus operational expenses and purchase orders', false, NULL),

        -- Communication
        ('internal_chat', 'communication', 'Internal Chat', 'Encrypted school staff communication channels', false, NULL),
        ('parent_communication', 'communication', 'Parent Communication', 'Two-way teacher-parent messaging portal', false, NULL),
        ('teacher_communication', 'communication', 'Teacher Communication', 'Departmental boards and staff notices', false, NULL),
        ('email_service', 'communication', 'Email Service', 'Bulk transactional and notification email engine', true, 50000),
        ('sms_service', 'communication', 'SMS Service', 'DLT-registered SMS alerts and OTP delivery', true, 10000),
        ('whatsapp_service', 'communication', 'WhatsApp Service', 'Official WhatsApp Business API notifications', true, 10000),
        ('push_notifications', 'communication', 'Push Notifications', 'Real-time mobile app push alerts', false, NULL),

        -- Operations
        ('transport', 'operations', 'Transport', 'Bus routes, GPS tracking and transport fees', false, NULL),
        ('library', 'operations', 'Library', 'Book catalog, barcode check-in/out and fines', false, NULL),
        ('leave_management', 'operations', 'Leave Management', 'Student and staff leave approval workflows', false, NULL),
        ('visitor_management', 'operations', 'Visitor Management', 'Gate pass, security check and visitor logging', false, NULL),
        ('inventory', 'operations', 'Inventory', 'Uniform, stationery and asset inventory tracking', false, NULL),
        ('events', 'operations', 'Events', 'Annual day, sports day and calendar coordination', false, NULL),

        -- Advanced
        ('advanced_analytics', 'advanced', 'Advanced Analytics', 'Cohort trends, retention, performance metrics', false, NULL),
        ('ai_assistant', 'advanced', 'AI Assistant', 'AI tutor, administrative copilot and drafting', true, 1000),
        ('ai_reports', 'advanced', 'AI Reports', 'Automated student progress narrative summaries', false, NULL),
        ('ai_assignment_gen', 'advanced', 'AI Assignment Generator', 'AI-assisted quiz and question paper generation', false, NULL),
        ('predictive_analytics', 'advanced', 'Predictive Analytics', 'Early dropout and academic struggle warning', false, NULL),
        ('api_access', 'advanced', 'API Access', 'REST API keys for third-party school SIS integration', true, 1000000),
        ('custom_domain', 'advanced', 'Custom Domain', 'White-label custom portal domain (portal.school.edu)', false, NULL),
        ('multi_branch', 'advanced', 'Multi-Branch Support', 'Centralized federation across school chain branches', false, NULL)
      ON CONFLICT (key) DO NOTHING;

      -- 2. Feature Overrides per School
      CREATE TABLE IF NOT EXISTS feature_overrides (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        feature_key varchar(50) NOT NULL REFERENCES feature_catalog(key),
        enabled boolean NOT NULL,
        custom_limit integer,
        custom_quota integer,
        start_date timestamptz NOT NULL DEFAULT now(),
        expiry_date timestamptz,
        reason text NOT NULL DEFAULT '',
        created_by uuid NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(organization_id, feature_key)
      );

      -- 3. Support Tickets
      CREATE TABLE IF NOT EXISTS support_tickets (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_code varchar(20) NOT NULL UNIQUE,
        organization_id uuid REFERENCES organizations(id),
        school_name varchar(150) NOT NULL DEFAULT 'Platform',
        created_by uuid NOT NULL REFERENCES users(id),
        assigned_to uuid REFERENCES users(id),
        category varchar(40) NOT NULL CHECK(category IN ('login','billing','technical','academic','feature_request','bug','security','other')),
        priority varchar(20) NOT NULL DEFAULT 'medium' CHECK(priority IN ('low','medium','high','urgent')),
        status varchar(30) NOT NULL DEFAULT 'open' CHECK(status IN ('open','assigned','in_progress','waiting','resolved','closed')),
        subject varchar(255) NOT NULL,
        description text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      -- 4. Platform Announcements
      CREATE TABLE IF NOT EXISTS platform_announcements (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        title varchar(200) NOT NULL,
        message text NOT NULL,
        type varchar(30) NOT NULL DEFAULT 'general' CHECK(type IN ('general','maintenance','security','feature_release','billing')),
        priority varchar(20) NOT NULL DEFAULT 'normal' CHECK(priority IN ('low','normal','high','critical')),
        audience varchar(30) NOT NULL DEFAULT 'all' CHECK(audience IN ('all','active','trial','enterprise','professional','selected')),
        target_plans text[] NOT NULL DEFAULT '{}',
        channels text[] NOT NULL DEFAULT '{"dashboard"}',
        start_date timestamptz NOT NULL DEFAULT now(),
        end_date timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
        status varchar(20) NOT NULL DEFAULT 'published' CHECK(status IN ('draft','scheduled','published','expired')),
        created_at timestamptz NOT NULL DEFAULT now()
      );

      -- 5. Payments & Refunds
      CREATE TABLE IF NOT EXISTS payments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_id uuid NOT NULL REFERENCES invoices(id),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        amount_minor integer NOT NULL CHECK(amount_minor >= 0),
        currency varchar(3) NOT NULL DEFAULT 'INR',
        status varchar(20) NOT NULL DEFAULT 'success' CHECK(status IN ('success','failed','refunded')),
        payment_method varchar(40) NOT NULL DEFAULT 'bank_transfer',
        transaction_id varchar(100),
        failure_reason text,
        retry_count integer NOT NULL DEFAULT 0,
        refund_reason text,
        refund_approved_by uuid REFERENCES users(id),
        created_at timestamptz NOT NULL DEFAULT now()
      );

      -- 6. Add columns to organizations
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS code varchar(30);
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS school_type varchar(50) DEFAULT 'Private';
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS board varchar(50) DEFAULT 'CBSE';
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS registration_number varchar(100);
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS affiliation_number varchar(100);
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS established_year integer;
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS address_line1 varchar(255);
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS address_line2 varchar(255);
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS city varchar(100);
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS state varchar(100);
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS country varchar(100) DEFAULT 'India';
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS pincode varchar(20);
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS official_email varchar(255);
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS official_phone varchar(50);
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS website varchar(255);
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS health_score integer NOT NULL DEFAULT 95;

      -- 7. Add columns to plans
      ALTER TABLE plans ADD COLUMN IF NOT EXISTS description text DEFAULT '';
      ALTER TABLE plans ADD COLUMN IF NOT EXISTS trial_duration integer DEFAULT 14;
      ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_parents integer DEFAULT 5000;
      ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_staff integer DEFAULT 100;
      ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_storage_gb integer DEFAULT 100;
      ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_api_requests integer DEFAULT 1000000;
      ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_sms integer DEFAULT 10000;
      ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_email integer DEFAULT 50000;
      ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_whatsapp integer DEFAULT 10000;
      ALTER TABLE plans ADD COLUMN IF NOT EXISTS status varchar(20) DEFAULT 'active';

      -- 8. Add platform_role column to users
      ALTER TABLE users ADD COLUMN IF NOT EXISTS platform_role varchar(30) DEFAULT 'none';

      -- Indexes
      CREATE INDEX IF NOT EXISTS support_tickets_org_idx ON support_tickets(organization_id, status);
      CREATE INDEX IF NOT EXISTS payments_org_idx ON payments(organization_id, status);
      CREATE INDEX IF NOT EXISTS feature_overrides_org_idx ON feature_overrides(organization_id);
      CREATE INDEX IF NOT EXISTS announcements_status_idx ON platform_announcements(status, start_date);
    `);
  }

  async down(r: QueryRunner): Promise<void> {
    await r.query(`
      DROP TABLE IF EXISTS payments;
      DROP TABLE IF EXISTS platform_announcements;
      DROP TABLE IF EXISTS support_tickets;
      DROP TABLE IF EXISTS feature_overrides;
      DROP TABLE IF EXISTS feature_catalog;
    `);
  }
}
