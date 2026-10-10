import { users } from '../../database/schema';

// Pure TypeScript inference from Drizzle table
export type DrizzleUser = typeof users.$inferSelect;
export type NewDrizzleUser = typeof users.$inferInsert;

export class User {
  id!: string;
  email!: string;
  name!: string;
  phone?: string | null;
  passwordHash!: string;
  isPlatformAdmin!: boolean;
  isActive!: boolean;
  createdAt!: Date;
}
