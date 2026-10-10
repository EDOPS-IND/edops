import jwt from "jsonwebtoken";
import crypto from "node:crypto";

export interface JwtPayload {
  sub: string; // userId
  email: string;
  isPlatformAdmin: boolean;
  schoolId?: string;
  role?: string;
}

const JWT_SECRET =
  process.env.JWT_SECRET ||
  process.env.SESSION_SECRET ||
  "edops_dev_secret_key_change_in_production";
const ACCESS_TOKEN_EXPIRY = "15m";

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function generateRefreshToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(40).toString("hex");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, hash };
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
