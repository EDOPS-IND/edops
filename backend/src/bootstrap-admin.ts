import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { isEmail } from 'class-validator';
import { loadConfig } from './config';
import { createDataSource } from './database/data-source';
import { bootstrapAdmin } from './modules/auth/auth.service';

async function readPassword(): Promise<string> {
  if (!process.stdin.isTTY) return readFileSync(0, 'utf8').replace(/\r?\n$/, '');
  const muted = new Writable({ write(_chunk, _encoding, done) { done(); } });
  const prompt = createInterface({ input: process.stdin, output: muted, terminal: true });
  process.stderr.write('New platform administrator password (hidden): ');
  try {
    return await prompt.question('');
  } finally {
    prompt.close();
    process.stderr.write('\n');
  }
}

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email || email.length > 254 || !isEmail(email)) throw new Error('Supply a valid administrator email as the only argument');
  if (process.argv.length !== 3) throw new Error('Pass only the email; passwords are read from hidden input or stdin');
  const password = await readPassword();
  if (password.length < 12 || password.length > 128) throw new Error('Password must contain 12-128 characters');
  const source = createDataSource(loadConfig());
  await source.initialize();
  try {
    const id = await bootstrapAdmin(source, email, password);
    console.log(`Platform administrator created: ${id}`);
  } finally {
    await source.destroy();
  }
}

main().catch((error: unknown) => {
  // Do not print database errors, connection URLs or passwords from failed bootstrap operations.
  const safe = error instanceof Error && !('query' in error) && !('code' in error);
  console.error(safe ? error.message : 'Bootstrap failed; verify database availability and migrations');
  process.exitCode = 1;
});
