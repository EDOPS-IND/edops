export type OrganizationStatus = 'active' | 'suspended';
export type SchoolRole = 'school_admin' | 'principal' | 'teacher' | 'student' | 'parent';

export class Organization {
  id!: string;
  name!: string;
  slug!: string;
  timeZone!: string;
  locale!: string;
  status!: OrganizationStatus;
  createdAt!: Date;
  updatedAt!: Date;
}

export class Membership {
  organizationId!: string;
  userId!: string;
  role!: SchoolRole;
  specialty?: string | null;
  status!: 'active' | 'inactive';
  createdAt!: Date;
}

export class Invitation {
  id!: string;
  organizationId!: string;
  email!: string;
  name?: string | null;
  role!: 'school_admin' | 'principal' | 'teacher' | 'student';
  batchId!: string | null;
  revokedAt!: Date | null;
  tokenHash!: string;
  invitedBy!: string;
  expiresAt!: Date;
  acceptedAt!: Date | null;
  createdAt!: Date;
}
