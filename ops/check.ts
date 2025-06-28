import { mkdirSync, existsSync } from 'fs';
import Env from '../src/Env';

function ensureDir(path: string) {
  mkdirSync(path, { recursive: true });
  console.info(`✅ Ensured folder exists: ${path}`);
}

function ensureDirs() {
  ensureDir(Env.dbBackupPath);
  ensureDir(Env.googlePath);
  ensureDir(Env.nvimPath);
}

function ensureGoogleCredential() {
  const googleCredential = `${Env.googlePath}/credentials.json`;
  if (!existsSync(googleCredential)) {
    console.info(`❌ Error: Missing file ${googleCredential}`);
    process.exit(1);
  } else {
    console.info(`✅ Found Google credentials file: ${googleCredential}`);
  }
}

function main() {
  ensureDirs();
  if (Env.withGoogle === true) {
    ensureGoogleCredential();
  }
}

main();
