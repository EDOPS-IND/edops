import { MigrationInterface, QueryRunner } from 'typeorm';

export class Communication1789084800000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`
      CREATE TABLE recorded_sessions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
        section_id uuid NOT NULL, subject_id uuid NOT NULL, uploaded_by uuid NOT NULL,
        title varchar(200) NOT NULL CHECK (length(btrim(title)) > 0), recorded_at timestamptz NOT NULL,
        duration_seconds integer NOT NULL CHECK (duration_seconds BETWEEN 1 AND 28800),
        content_type varchar(32) NOT NULL CHECK (content_type IN ('video/mp4','video/webm')),
        size_bytes integer NOT NULL CHECK (size_bytes BETWEEN 1 AND 536870912),
        checksum_sha256 varchar(44) NOT NULL, object_key text NOT NULL UNIQUE, object_version text,
        status varchar(16) NOT NULL DEFAULT 'uploading' CHECK (status IN ('uploading','ready','published','archived')),
        created_at timestamptz NOT NULL DEFAULT now(), published_at timestamptz,
        UNIQUE (organization_id,id),
        CHECK (status NOT IN ('ready','published') OR object_version IS NOT NULL),
        FOREIGN KEY (organization_id,section_id) REFERENCES sections(organization_id,id),
        FOREIGN KEY (organization_id,subject_id) REFERENCES subjects(organization_id,id),
        FOREIGN KEY (organization_id,uploaded_by) REFERENCES memberships(organization_id,user_id)
      );
      CREATE INDEX recordings_class_idx ON recorded_sessions(organization_id,section_id,subject_id,created_at,id);
      CREATE TABLE domain_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
        section_id uuid NOT NULL, subject_id uuid, actor_id uuid NOT NULL,
        event_type varchar(40) NOT NULL CHECK (event_type IN ('assignment.published','submission.graded','attendance.finalized','recording.published')),
        resource_id uuid NOT NULL, occurred_at timestamptz NOT NULL DEFAULT clock_timestamp(),
        attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 5), available_at timestamptz NOT NULL DEFAULT now(),
        processed_at timestamptz, failed_at timestamptz, last_error varchar(80), UNIQUE (organization_id,id),
        FOREIGN KEY (organization_id,section_id) REFERENCES sections(organization_id,id),
        FOREIGN KEY (organization_id,subject_id) REFERENCES subjects(organization_id,id),
        FOREIGN KEY (organization_id,actor_id) REFERENCES memberships(organization_id,user_id)
      );
      CREATE INDEX outbox_pending_idx ON domain_events(organization_id,available_at,occurred_at,id) WHERE processed_at IS NULL AND failed_at IS NULL;
      CREATE TABLE event_recipients (
        organization_id uuid NOT NULL, event_id uuid NOT NULL, user_id uuid NOT NULL,
        PRIMARY KEY (organization_id,event_id,user_id),
        FOREIGN KEY (organization_id,event_id) REFERENCES domain_events(organization_id,id),
        FOREIGN KEY (organization_id,user_id) REFERENCES memberships(organization_id,user_id)
      );
      CREATE TABLE timeline_events (
        organization_id uuid NOT NULL, event_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (organization_id,event_id), FOREIGN KEY (organization_id,event_id) REFERENCES domain_events(organization_id,id)
      );
      CREATE TABLE notifications (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL, event_id uuid NOT NULL, user_id uuid NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(), read_at timestamptz,
        UNIQUE (organization_id,event_id,user_id),
        FOREIGN KEY (organization_id,event_id,user_id) REFERENCES event_recipients(organization_id,event_id,user_id)
      );
      CREATE INDEX notifications_inbox_idx ON notifications(organization_id,user_id,created_at DESC,id);
    `);
    for (const table of ['recorded_sessions', 'domain_events', 'event_recipients', 'timeline_events', 'notifications']) {
      await runner.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY; ALTER TABLE ${table} FORCE ROW LEVEL SECURITY;
        CREATE POLICY organization_scope ON ${table}
        USING (organization_id = nullif(current_setting('app.current_org_id',true),'')::uuid)
        WITH CHECK (organization_id = nullif(current_setting('app.current_org_id',true),'')::uuid)`);
    }
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query('DROP TABLE notifications, timeline_events, event_recipients, domain_events, recorded_sessions');
  }
}
