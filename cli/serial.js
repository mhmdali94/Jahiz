#!/usr/bin/env node
// Does the crypto and ledger bookkeeping; serial.sh wraps this in the
// interactive Arabic menu (confirmations for destructive actions live
// there — this file requires an explicit --yes for delete, so scripted
// use per "expose the same operations as plain flags" stays safe by
// default). Never makes a network call — everything here is local files.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createToken, generateKeyPairHex, generateShortCode, sha256Hex, normalizeShortCode, randomId } from '../src/auth-token.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PRIVATE_KEY_PATH = join(__dirname, 'private.key');
const SERIALS_PATH = join(__dirname, 'serials.json');
const PUBLIC_KEY_MODULE_PATH = join(ROOT, 'src', 'auth-public-key.js');
const REVOKED_PATH = join(ROOT, 'src', 'revoked.json');
const SHORTCODES_PATH = join(ROOT, 'src', 'shortcodes.json');
const BASE_URL_FILE = join(__dirname, 'base-url.txt');

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, 'utf8'));
}
function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
}

function loadSerials() {
  return readJson(SERIALS_PATH, []);
}
function saveSerials(serials) {
  writeJson(SERIALS_PATH, serials);
}

function getBaseUrl() {
  if (existsSync(BASE_URL_FILE)) return readFileSync(BASE_URL_FILE, 'utf8').trim();
  return 'https://form.example.com/';
}

async function ensureKeys() {
  if (existsSync(PRIVATE_KEY_PATH)) {
    return readFileSync(PRIVATE_KEY_PATH, 'utf8').trim();
  }
  const { privateKeyHex, publicKeyHex } = await generateKeyPairHex();
  mkdirSync(dirname(PRIVATE_KEY_PATH), { recursive: true });
  writeFileSync(PRIVATE_KEY_PATH, privateKeyHex + '\n', { mode: 0o600 });
  const publicKeyModule = [
    '// Generated (and overwritten) by cli/serial.sh — only the PUBLIC key',
    "// ever lives here. The matching PRIVATE key stays on the issuer's",
    '// machine at cli/private.key (gitignored) and never enters this build.',
    '// Committed to the repo since the deployed static bundle needs it to',
    '// verify client links offline.',
    `export const PUBLIC_KEY_HEX = '${publicKeyHex}';`,
    '',
  ].join('\n');
  writeFileSync(PUBLIC_KEY_MODULE_PATH, publicKeyModule);
  console.log('تم إنشاء مفتاح تشفير جديد. المفتاح الخاص محفوظ في cli/private.key — لا تشاركه ولا ترفعه أبداً.');
  return privateKeyHex;
}

async function issueOne({ client = '', clientAr = '', type = null, tracks = null }) {
  const privateKeyHex = await ensureKeys();
  const id = randomId();
  const token = await createToken({ id, client, clientAr, type, tracks }, privateKeyHex);
  const shortCode = generateShortCode();
  const shortCodeHash = await sha256Hex(normalizeShortCode(shortCode));

  const serials = loadSerials();
  serials.push({ id, shortCode, client, clientAr, type, tracks, token, issuedAt: new Date().toISOString(), deleted: false, deletedAt: null });
  saveSerials(serials);

  const shortcodeIndex = readJson(SHORTCODES_PATH, {});
  shortcodeIndex[shortCodeHash] = token;
  writeJson(SHORTCODES_PATH, shortcodeIndex);

  return { id, token, shortCode, link: `${getBaseUrl()}#t=${token}` };
}

async function cmdInit() {
  await ensureKeys();
  console.log('جاهز. المفتاح العام محفوظ في src/auth-public-key.js — أعد بناء الموقع (npm run build) ليدخل حيّز التنفيذ.');
}

async function cmdBulk(count) {
  const n = Math.max(1, Number(count) || 1);
  console.log(`\nإصدار ${n} سريال عام (بدون بيانات عميل):\n`);
  for (let i = 1; i <= n; i++) {
    const { link, shortCode } = await issueOne({});
    console.log(`${i}) ${link}`);
    console.log(`   الرمز القصير: ${shortCode}\n`);
  }
}

async function cmdIssue({ client, clientAr, type, tracks }) {
  const { link, shortCode, id } = await issueOne({ client, clientAr, type, tracks });
  console.log('\nتم الإصدار:\n');
  console.log(`الرابط: ${link}`);
  console.log(`الرمز القصير: ${shortCode}`);
  console.log(`المعرّف الداخلي: ${id}`);
  console.log('\n--- رسالة واتساب جاهزة للإرسال ---\n');
  console.log(
    `مرحباً${clientAr ? ' ' + clientAr : ''}،\nهذا رابط نموذج تسليم بيانات مشروعكم:\n${link}\n\nإن لم يعمل الرابط، افتح النموذج والصق هذا الرمز: ${shortCode}\n\nبياناتكم لا تغادر جهازكم — لا شيء يُرفع لأي خادم.`,
  );
}

function displaySerial(s) {
  return `${s.id}  |  ${s.clientAr || '— عام —'}  |  ${s.type || '—'}  |  ${s.issuedAt.slice(0, 10)}`;
}

function cmdList() {
  const serials = loadSerials().filter((s) => !s.deleted);
  if (!serials.length) {
    console.log('لا توجد سريالات بعد.');
    return;
  }
  console.log('\nرقم | المعرّف | العميل | النوع | تاريخ الإصدار\n' + '-'.repeat(60));
  serials.forEach((s, i) => console.log(`${i + 1}) ${displaySerial(s)}`));
}

function findSerial(serials, idOrIndex) {
  const byIndex = serials[Number(idOrIndex) - 1];
  if (byIndex) return byIndex;
  return serials.find((s) => s.id === idOrIndex || s.shortCode === idOrIndex);
}

async function cmdDelete(idOrIndex, { yes }) {
  const serials = loadSerials();
  const active = serials.filter((s) => !s.deleted);
  const target = findSerial(active, idOrIndex);
  if (!target) {
    console.log('لم يتم العثور على هذا السريال.');
    process.exitCode = 1;
    return;
  }
  if (!yes) {
    console.log(`سيتم حذف: ${displaySerial(target)}`);
    console.log('أعد المحاولة مع --yes للتأكيد (القائمة التفاعلية تسأل قبل ذلك تلقائياً).');
    process.exitCode = 1;
    return;
  }
  target.deleted = true;
  target.deletedAt = new Date().toISOString();
  saveSerials(serials);

  const revoked = readJson(REVOKED_PATH, []);
  if (!revoked.includes(target.id)) revoked.push(target.id);
  writeJson(REVOKED_PATH, revoked);

  console.log(`تم حذف السريال: ${displaySerial(target)}`);
  console.log('تنبيه: الرابط يبقى يعمل حتى تُعاد بناء الموقع (npm run build) وإعادة رفعه — لا يوجد خادم يُلغيه فوراً.');
}

function cmdListDeleted() {
  const serials = loadSerials().filter((s) => s.deleted);
  if (!serials.length) {
    console.log('لا توجد سريالات محذوفة.');
    return;
  }
  console.log('\nرقم | المعرّف | العميل | تاريخ الإصدار | تاريخ الحذف\n' + '-'.repeat(70));
  serials.forEach((s, i) => console.log(`${i + 1}) ${s.id}  |  ${s.clientAr || '— عام —'}  |  ${s.issuedAt.slice(0, 10)}  |  ${s.deletedAt.slice(0, 10)}`));
}

async function cmdRestore(idOrIndex) {
  const serials = loadSerials();
  const deleted = serials.filter((s) => s.deleted);
  const target = findSerial(deleted, idOrIndex);
  if (!target) {
    console.log('لم يتم العثور على هذا السريال ضمن المحذوفات.');
    process.exitCode = 1;
    return;
  }
  target.deleted = false;
  target.deletedAt = null;
  saveSerials(serials);

  const revoked = readJson(REVOKED_PATH, []).filter((id) => id !== target.id);
  writeJson(REVOKED_PATH, revoked);

  console.log(`تمت الاستعادة: ${displaySerial(target)}`);
  console.log('يحتاج إعادة بناء الموقع (npm run build) وإعادة رفعه ليعمل الرابط مجدداً.');
}

// --- argv parsing -----------------------------------------------------
function parseFlags(args) {
  const out = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const next = args[i + 1];
      if (next === undefined || next.startsWith('--')) out[key] = true;
      else {
        out[key] = next;
        i++;
      }
    }
  }
  return out;
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const flags = parseFlags(rest);

  switch (command) {
    case 'init':
      return cmdInit();
    case 'bulk':
    case 'new':
      return cmdBulk(rest[0]);
    case 'issue':
      return cmdIssue({ client: flags.client || '', clientAr: flags['client-ar'] || '', type: flags.type || null, tracks: flags.tracks || null });
    case 'list':
      return cmdList();
    case 'delete':
      return cmdDelete(rest[0], { yes: !!flags.yes });
    case 'list-deleted':
      return cmdListDeleted();
    case 'restore':
      return cmdRestore(rest[0]);
    default:
      console.error(`أمر غير معروف: ${command}\nالأوامر المتاحة: init, bulk <n>, issue --client-ar <..> [--client <..>] [--type <..>] [--tracks <..>], list, delete <id> [--yes], list-deleted, restore <id>`);
      process.exitCode = 1;
  }
}

main();
