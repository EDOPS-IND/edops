import { Column, CreateDateColumn, Entity, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type OrganizationStatus = 'active' | 'suspended';
export type SchoolRole = 'school_admin' | 'principal' | 'teacher' | 'student' | 'parent';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'varchar', length: 120 }) name!: string;
  @Column({ type: 'varchar', length: 63, unique: true }) slug!: string;
  @Column({ name: 'time_zone', type: 'varchar', length: 100 }) timeZone!: string;
  @Column({ type: 'varchar', length: 16 }) locale!: string;
  @Column({ type: 'varchar', length: 16, default: 'active' }) status!: OrganizationStatus;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
}

@Entity('memberships')
export class Membership {
  @PrimaryColumn({ name: 'organization_id', type: 'uuid' }) organizationId!: string;
  @PrimaryColumn({ name: 'user_id', type: 'uuid' }) userId!: string;
  @Column({ type: 'varchar', length: 20 }) role!: SchoolRole;
  @Column({ type: 'varchar', length: 100, nullable: true }) specialty?: string | null;
  @Column({ type: 'varchar', length: 16, default: 'active' }) status!: 'active' | 'inactive';
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
}

@Entity('invitations')
export class Invitation {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'organization_id', type: 'uuid' }) organizationId!: string;
  @Column({ type: 'varchar', length: 254 }) email!: string;
  @Column({ type: 'varchar', length: 120, nullable: true }) name?: string | null;
  @Column({ type: 'varchar', length: 20, default: 'school_admin' }) role!: 'school_admin' | 'principal' | 'teacher' | 'student';
  @Column({ name: 'batch_id', type: 'uuid', nullable: true }) batchId!: string | null;
  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true }) revokedAt!: Date | null;
  @Column({ name: 'token_hash', type: 'varchar', length: 64, unique: true, select: false }) tokenHash!: string;
  @Column({ name: 'invited_by', type: 'uuid' }) invitedBy!: string;
  @Column({ name: 'expires_at', type: 'timestamptz' }) expiresAt!: Date;
  @Column({ name: 'accepted_at', type: 'timestamptz', nullable: true }) acceptedAt!: Date | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
}
