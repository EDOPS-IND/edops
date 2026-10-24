export type School = {
  id: string;
  name: string;
  slug: string;
  status: "active" | "suspended" | "trial" | "archived" | "onboarding";
  createdAt: string;
  code?: string;
  board?: string;
  academicYear?: string;
  studentsCount?: string;
  teachersCount?: string;
  parentsCount?: string;
  plan?: string;
  city?: string;
  state?: string;
  officialEmail?: string;
  officialPhone?: string;
  schoolType?: string;
  registrationNumber?: string;
  affiliationNumber?: string;
  establishedYear?: number;
  addressLine1?: string;
  addressLine2?: string;
  country?: string;
  pincode?: string;
  website?: string;
  timeZone?: string;
  locale?: string;
  healthScore?: number;
  storageUsageGb?: number;
  apiRequests?: number;
  pendingInviteToken?: string;
  pendingInviteExpiresAt?: string;
  adminInviteStatus?: "pending" | "accepted" | "expired" | "revoked";
};

export type Plan = {
  id: string;
  name: string;
  amountMinor: number;
  currency: string;
  billingCycle: string;
  maxStudents: number;
  maxTeachers: number;
  maxParents?: number;
  maxStorageGb?: number;
  maxApiRequests?: number;
  features: Record<string, boolean>;
  active: boolean;
  createdAt: string;
};

export type FeatureCatalogItem = {
  key: string;
  category: "academic" | "administration" | "finance" | "communication" | "operations" | "advanced";
  name: string;
  description: string;
  hasQuota: boolean;
  defaultQuota: number | null;
};

export type FeatureOverride = {
  id: string;
  featureKey: string;
  role?: string | null;
  featureName?: string;
  category?: string;
  enabled: boolean;
  customLimit?: number;
  customQuota?: number;
  startDate?: string;
  expiryDate?: string;
  reason: string;
};

export type SupportTicket = {
  id: string;
  ticketCode: string;
  schoolName: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "assigned" | "in_progress" | "waiting" | "resolved" | "closed";
  subject: string;
  description: string;
  creatorEmail?: string;
  assigneeEmail?: string;
  createdAt: string;
};

export type Announcement = {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  audience: string;
  channels: string[];
  status: string;
  createdAt: string;
};

export type PaymentRecord = {
  id: string;
  invoiceId: string;
  schoolName: string;
  amountMinor: number;
  currency: string;
  status: "success" | "failed" | "refunded";
  paymentMethod: string;
  transactionId?: string;
  failureReason?: string;
  refundReason?: string;
  createdAt: string;
};

export type AuditLog = {
  id: string;
  action: string;
  organizationId: string | null;
  actorId: string;
  actorEmail: string;
  schoolName: string;
  details: any;
  createdAt: string;
};

