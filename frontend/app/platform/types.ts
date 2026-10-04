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
  principalName?: string;
  healthScore?: number;
  storageUsageGb?: number;
  apiRequests?: number;
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

export const DEFAULT_SCHOOLS: School[] = [
  {
    id: "delhi-public-xyz",
    name: "Delhi Public XYZ",
    slug: "delhi-public-xyz",
    status: "active",
    createdAt: "2026-01-15T00:00:00Z",
    code: "DPX001",
    board: "CBSE",
    academicYear: "2026-27",
    studentsCount: "2,450",
    teachersCount: "150",
    parentsCount: "2,100",
    plan: "Enterprise",
    city: "New Delhi",
    state: "Delhi",
    officialEmail: "admin@dpx.edu.in",
    healthScore: 98,
    storageUsageGb: 72,
    apiRequests: 124000,
  },
  {
    id: "abc-international",
    name: "ABC International School",
    slug: "abc-international",
    status: "active",
    createdAt: "2026-02-01T00:00:00Z",
    code: "ABC001",
    board: "CBSE",
    academicYear: "2026-27",
    studentsCount: "1,200",
    teachersCount: "80",
    parentsCount: "1,100",
    plan: "Professional",
    city: "Bengaluru",
    state: "Karnataka",
    officialEmail: "admin@abcschool.org",
    healthScore: 94,
    storageUsageGb: 45,
    apiRequests: 68000,
  },
  {
    id: "xyz-academy",
    name: "XYZ Academy",
    slug: "xyz-academy",
    status: "trial",
    createdAt: "2026-03-10T00:00:00Z",
    code: "XYZ001",
    board: "ICSE",
    academicYear: "2026-27",
    studentsCount: "480",
    teachersCount: "32",
    parentsCount: "420",
    plan: "Trial",
    city: "Mumbai",
    state: "Maharashtra",
    officialEmail: "principal@xyzacademy.in",
    healthScore: 88,
    storageUsageGb: 12,
    apiRequests: 18000,
  },
  {
    id: "heritage-valley",
    name: "Heritage Valley High",
    slug: "heritage-valley",
    status: "suspended",
    createdAt: "2025-11-20T00:00:00Z",
    code: "HVH001",
    board: "State Board",
    academicYear: "2026-27",
    studentsCount: "650",
    teachersCount: "42",
    parentsCount: "580",
    plan: "Basic",
    city: "Hyderabad",
    state: "Telangana",
    officialEmail: "office@heritagevalley.edu",
    healthScore: 62,
    storageUsageGb: 28,
    apiRequests: 4200,
  }
];
