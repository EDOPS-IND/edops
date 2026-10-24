ALTER TABLE teacher_messages
  ADD COLUMN IF NOT EXISTS conversation_id uuid;
--> statement-breakpoint
ALTER TABLE teacher_messages
  ADD COLUMN IF NOT EXISTS status varchar(16) NOT NULL DEFAULT 'open';
--> statement-breakpoint
ALTER TABLE teacher_messages DROP CONSTRAINT IF EXISTS teacher_messages_recipient_role_check;
--> statement-breakpoint
ALTER TABLE teacher_messages ADD CONSTRAINT teacher_messages_recipient_role_check
  CHECK (recipient_role IN ('student','parent','principal','school_admin','teacher','staff'));
--> statement-breakpoint
UPDATE teacher_messages SET conversation_id = id WHERE conversation_id IS NULL;
--> statement-breakpoint
ALTER TABLE teacher_messages ALTER COLUMN conversation_id SET DEFAULT gen_random_uuid();
--> statement-breakpoint
ALTER TABLE teacher_messages ALTER COLUMN conversation_id SET NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_teacher_messages_conversation
  ON teacher_messages(organization_id, conversation_id, created_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_teacher_messages_recipient_unread
  ON teacher_messages(organization_id, recipient_id, is_read, created_at DESC);
