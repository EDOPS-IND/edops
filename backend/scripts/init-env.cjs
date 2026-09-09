const { existsSync, readFileSync, writeFileSync } = require('node:fs');
const { randomBytes } = require('node:crypto');
const { resolve } = require('node:path');

const target = resolve(__dirname, '../.env');
if (existsSync(target)) {
  console.log('.env already exists; left unchanged.');
} else {
  const template = readFileSync(resolve(__dirname, '../.env.example'), 'utf8');
  writeFileSync(target, template.replace('SESSION_SECRET=\n', `SESSION_SECRET=${randomBytes(48).toString('hex')}\n`), { flag: 'wx', mode: 0o600 });
  console.log('Created .env with a random session secret and local development database settings.');
}
