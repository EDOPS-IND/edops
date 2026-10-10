import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const SCRYPT_OPTIONS = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
const FORMAT = "scrypt-32768-8-3";

function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, SCRYPT_OPTIONS, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  return `${FORMAT}$${salt}$${(await derive(password, salt)).toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  encoded: string | undefined,
): Promise<boolean> {
  const [format, salt, expectedHex] = (encoded ?? "").split("$");
  const valid =
    format === FORMAT &&
    /^[a-f0-9]{32}$/.test(salt ?? "") &&
    /^[a-f0-9]{128}$/.test(expectedHex ?? "");
  // Do the same expensive work for an unknown email or an invalid stored hash.
  const actual = await derive(
    password,
    valid ? salt! : "00000000000000000000000000000000",
  );
  const expected = Buffer.from(valid ? expectedHex! : "00".repeat(64), "hex");
  return timingSafeEqual(actual, expected) && valid;
}

export const tokenHash = (token: string): string =>
  createHash("sha256").update(token).digest("hex");
