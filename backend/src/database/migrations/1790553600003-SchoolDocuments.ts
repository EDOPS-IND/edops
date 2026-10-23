import { MigrationInterface, QueryRunner } from "typeorm";

export class SchoolDocuments1790553600003 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`
      CREATE TABLE school_documents (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        uploaded_by uuid NOT NULL,
        title varchar(160) NOT NULL CHECK (length(btrim(title)) > 0),
        category varchar(60) NOT NULL,
        file_name varchar(255) NOT NULL,
        content_type varchar(120) NOT NULL,
        size_bytes integer NOT NULL CHECK (size_bytes BETWEEN 1 AND 26214400),
        checksum_sha256 varchar(44) NOT NULL,
        object_key text NOT NULL UNIQUE,
        object_version text,
        status varchar(16) NOT NULL DEFAULT 'uploading' CHECK (status IN ('uploading','ready')),
        created_at timestamptz NOT NULL DEFAULT now(),
        FOREIGN KEY (organization_id, uploaded_by) REFERENCES memberships(organization_id, user_id)
      );
      CREATE INDEX school_documents_org_idx ON school_documents(organization_id, created_at DESC, id);
      ALTER TABLE school_documents ENABLE ROW LEVEL SECURITY;
      ALTER TABLE school_documents FORCE ROW LEVEL SECURITY;
      CREATE POLICY organization_scope ON school_documents
        USING (organization_id = nullif(current_setting('app.current_org_id', true), '')::uuid)
        WITH CHECK (organization_id = nullif(current_setting('app.current_org_id', true), '')::uuid);
    `);
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query("DROP TABLE school_documents");
  }
}
