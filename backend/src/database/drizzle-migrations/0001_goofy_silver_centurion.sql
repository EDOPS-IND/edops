CREATE SCHEMA "learning";
--> statement-breakpoint
CREATE SCHEMA "operations";
--> statement-breakpoint
CREATE TABLE "operations"."books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"isbn" varchar(64),
	"title" varchar(255) NOT NULL,
	"author" varchar(255) NOT NULL,
	"status" varchar(32) DEFAULT 'available' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academic"."class_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"academic_year_id" uuid NOT NULL,
	"teacher_assignment_id" uuid,
	"teacher_id" uuid NOT NULL,
	"class_id" uuid NOT NULL,
	"section_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	"session_date" date NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"status" varchar(32) DEFAULT 'scheduled' NOT NULL,
	"lesson_plan_id" uuid,
	"topic" varchar(255),
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "learning"."competencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"code" varchar(64) NOT NULL,
	"description" text,
	"status" varchar(32) DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "communication"."conversation_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"participant_role" varchar(32) DEFAULT 'member' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "communication"."conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"context_student_id" uuid,
	"conversation_type" varchar(64) DEFAULT 'direct' NOT NULL,
	"created_by" uuid NOT NULL,
	"status" varchar(32) DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning"."curricula" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"academic_year_id" uuid NOT NULL,
	"class_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"version" varchar(32) DEFAULT '1.0' NOT NULL,
	"status" varchar(32) DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning"."curriculum_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"curriculum_id" uuid NOT NULL,
	"parent_id" uuid,
	"unit_type" varchar(32) NOT NULL,
	"title" varchar(255) NOT NULL,
	"sequence_no" integer DEFAULT 1 NOT NULL,
	"description" text,
	"status" varchar(32) DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning"."learning_outcomes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"curriculum_id" uuid NOT NULL,
	"code" varchar(64) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"sequence_no" integer DEFAULT 1,
	"status" varchar(32) DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning"."lecture_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lecture_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"last_position_seconds" integer DEFAULT 0,
	"watched_percentage" numeric(5, 2) DEFAULT '0.00',
	"completed" boolean DEFAULT false NOT NULL,
	"last_watched_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "learning"."lesson_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"teacher_id" uuid NOT NULL,
	"class_id" uuid NOT NULL,
	"section_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	"curriculum_unit_id" uuid,
	"title" varchar(255) NOT NULL,
	"learning_objectives" text,
	"teaching_strategy" text,
	"status" varchar(32) DEFAULT 'draft' NOT NULL,
	"scheduled_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "communication"."messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_user_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "communication"."ptm_bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ptm_event_id" uuid NOT NULL,
	"parent_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"status" varchar(32) DEFAULT 'confirmed' NOT NULL,
	"booked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "communication"."ptm_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" varchar(32) DEFAULT 'scheduled' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning"."recorded_lectures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"teacher_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	"class_id" uuid NOT NULL,
	"section_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text,
	"duration_seconds" integer DEFAULT 0,
	"publication_status" varchar(32) DEFAULT 'published' NOT NULL,
	"published_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "learning"."remedial_program_students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"status" varchar(32) DEFAULT 'enrolled' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning"."remedial_programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"subject_id" uuid NOT NULL,
	"teacher_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"goal" text,
	"status" varchar(32) DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operations"."routes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"status" varchar(32) DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning"."student_interventions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"subject_id" uuid,
	"teacher_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"problem_area" text NOT NULL,
	"evidence" text,
	"goal" text NOT NULL,
	"intervention_type" varchar(64) NOT NULL,
	"recommended_action" text,
	"start_date" date NOT NULL,
	"review_date" date,
	"expected_outcome" text,
	"status" varchar(32) DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operations"."vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"registration_number" varchar(64) NOT NULL,
	"capacity" integer DEFAULT 40 NOT NULL,
	"status" varchar(32) DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "operations"."books" ADD CONSTRAINT "books_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "school"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic"."class_sessions" ADD CONSTRAINT "class_sessions_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "school"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic"."class_sessions" ADD CONSTRAINT "class_sessions_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "school"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic"."class_sessions" ADD CONSTRAINT "class_sessions_teacher_assignment_id_teacher_assignments_id_fk" FOREIGN KEY ("teacher_assignment_id") REFERENCES "academic"."teacher_assignments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic"."class_sessions" ADD CONSTRAINT "class_sessions_teacher_id_employees_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "school"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic"."class_sessions" ADD CONSTRAINT "class_sessions_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "academic"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic"."class_sessions" ADD CONSTRAINT "class_sessions_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "academic"."sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic"."class_sessions" ADD CONSTRAINT "class_sessions_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "academic"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic"."class_sessions" ADD CONSTRAINT "class_sessions_lesson_plan_id_lesson_plans_id_fk" FOREIGN KEY ("lesson_plan_id") REFERENCES "learning"."lesson_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."competencies" ADD CONSTRAINT "competencies_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "school"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication"."conversation_participants" ADD CONSTRAINT "conversation_participants_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "communication"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication"."conversation_participants" ADD CONSTRAINT "conversation_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication"."conversations" ADD CONSTRAINT "conversations_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "school"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication"."conversations" ADD CONSTRAINT "conversations_context_student_id_students_id_fk" FOREIGN KEY ("context_student_id") REFERENCES "school"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication"."conversations" ADD CONSTRAINT "conversations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."curricula" ADD CONSTRAINT "curricula_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "school"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."curricula" ADD CONSTRAINT "curricula_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "school"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."curricula" ADD CONSTRAINT "curricula_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "academic"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."curricula" ADD CONSTRAINT "curricula_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "academic"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."curriculum_units" ADD CONSTRAINT "curriculum_units_curriculum_id_curricula_id_fk" FOREIGN KEY ("curriculum_id") REFERENCES "learning"."curricula"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."learning_outcomes" ADD CONSTRAINT "learning_outcomes_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "school"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."learning_outcomes" ADD CONSTRAINT "learning_outcomes_curriculum_id_curricula_id_fk" FOREIGN KEY ("curriculum_id") REFERENCES "learning"."curricula"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."lecture_progress" ADD CONSTRAINT "lecture_progress_lecture_id_recorded_lectures_id_fk" FOREIGN KEY ("lecture_id") REFERENCES "learning"."recorded_lectures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."lecture_progress" ADD CONSTRAINT "lecture_progress_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "school"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."lesson_plans" ADD CONSTRAINT "lesson_plans_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "school"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."lesson_plans" ADD CONSTRAINT "lesson_plans_teacher_id_employees_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "school"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."lesson_plans" ADD CONSTRAINT "lesson_plans_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "academic"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."lesson_plans" ADD CONSTRAINT "lesson_plans_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "academic"."sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."lesson_plans" ADD CONSTRAINT "lesson_plans_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "academic"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."lesson_plans" ADD CONSTRAINT "lesson_plans_curriculum_unit_id_curriculum_units_id_fk" FOREIGN KEY ("curriculum_unit_id") REFERENCES "learning"."curriculum_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication"."messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "communication"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication"."messages" ADD CONSTRAINT "messages_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication"."ptm_bookings" ADD CONSTRAINT "ptm_bookings_ptm_event_id_ptm_events_id_fk" FOREIGN KEY ("ptm_event_id") REFERENCES "communication"."ptm_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication"."ptm_bookings" ADD CONSTRAINT "ptm_bookings_parent_id_parents_id_fk" FOREIGN KEY ("parent_id") REFERENCES "school"."parents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication"."ptm_bookings" ADD CONSTRAINT "ptm_bookings_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "school"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication"."ptm_events" ADD CONSTRAINT "ptm_events_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "school"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."recorded_lectures" ADD CONSTRAINT "recorded_lectures_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "school"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."recorded_lectures" ADD CONSTRAINT "recorded_lectures_teacher_id_employees_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "school"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."recorded_lectures" ADD CONSTRAINT "recorded_lectures_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "academic"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."recorded_lectures" ADD CONSTRAINT "recorded_lectures_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "academic"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."recorded_lectures" ADD CONSTRAINT "recorded_lectures_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "academic"."sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."remedial_program_students" ADD CONSTRAINT "remedial_program_students_program_id_remedial_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "learning"."remedial_programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."remedial_program_students" ADD CONSTRAINT "remedial_program_students_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "school"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."remedial_programs" ADD CONSTRAINT "remedial_programs_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "school"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."remedial_programs" ADD CONSTRAINT "remedial_programs_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "academic"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."remedial_programs" ADD CONSTRAINT "remedial_programs_teacher_id_employees_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "school"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."routes" ADD CONSTRAINT "routes_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "school"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."student_interventions" ADD CONSTRAINT "student_interventions_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "school"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."student_interventions" ADD CONSTRAINT "student_interventions_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "school"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."student_interventions" ADD CONSTRAINT "student_interventions_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "academic"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."student_interventions" ADD CONSTRAINT "student_interventions_teacher_id_employees_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "school"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."student_interventions" ADD CONSTRAINT "student_interventions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."vehicles" ADD CONSTRAINT "vehicles_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "school"."schools"("id") ON DELETE no action ON UPDATE no action;