import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { isEmail } from 'class-validator';
import { loadConfig } from './config';
import { DrizzleService } from './database/drizzle.service';
import { resetUserPassword } from './modules/auth/auth.service';

async function readPassword(): Promise<string> {
  if (!process.stdin.isTTY) return readFileSync(0, 'utf8').replace(/\r?\n$/, '');
  const muted = new Writable({ write(_chunk, _encoding, done) { done(); } });
  const prompt = createInterface({ input: process.stdin, output: muted, terminal: true });
  process.stderr.write('Enter new password (hidden): ');
  try {
    return await prompt.question('');
  } finally {
    prompt.close();
    process.stderr.write('\n');
  }
}

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email || email.length > 254 || !isEmail(email)) {
    throw new Error('Supply a valid user or platform administrator email as the only argument');
  }
  if (process.argv.length !== 3) {
    throw new Error('Pass only the email; passwords are read securely from hidden input or stdin');
  }

  const password = await readPassword();
  if (password.length < 8 || password.length > 128) {
    throw new Error('Password must contain 8-128 characters');
  }

  const config = loadConfig();
  const drizzle = new DrizzleService(config);
  try {
    const id = await resetUserPassword(drizzle, email, password);
    console.log(`Password reset successfully for user: ${email} (User ID: ${id})`);
  } finally {
    await drizzle.onModuleDestroy();
  }
}

main().catch((error: unknown) => {
  const safe = error instanceof Error && !('query' in error) && !('code' in error);
  console.error(safe ? error.message : 'Password reset failed; verify database availability');
  process.exitCode = 1;
});
