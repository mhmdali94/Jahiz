// The .xlsx generator — "treat the first two as the product" (this one and
// the pdf); the passwords sheet is the file's real job since it's the one a
// client can still type into after downloading.
//
// Sheet layout mirrors نموذج-تسليم-بيانات-المشروع.xlsx exactly — several
// sheets bundle more than one wizard step (e.g. "الاستضافة" covers both
// Hosting and SSL & security, since those got split into two screens for a
// better wizard flow but are one sheet's worth of content) — see
// SHEET_MAP below for the authoritative mapping.

import ExcelJS from 'exceljs';
import { getVisibleSteps, isStepVisible, getStepById } from '../schema/index.js';
import { prepareStepModel } from './prepareModel.js';
import { deriveIdentifiedServices, deriveMigratingMailboxRows, mergeDerivedRows } from './deriveCredentials.js';
import { CREDENTIAL_SERVICES, PROJECT_TYPE_LIST } from '../schema/constants.js';

const BRAND_ARGB = 'FF1F4E78'; // placeholder navy — swap for the real client HEX once known

const SHEET_MAP = [
  { ar: 'بيانات المشروع', en: 'Project Details', steps: ['step0_start', 'a1_project_type', 'a2_current_site', 'a11_contacts'] },
  { ar: 'النطاق', en: 'Domain', steps: ['a3_domain'] },
  { ar: 'الاستضافة', en: 'Hosting', steps: ['a4_hosting', 'a10_ssl_security'] },
  { ar: 'البريد الإلكتروني', en: 'Email', steps: ['a5_mail_current', 'a5b_mail_migration_access'] },
  // a6_mailboxes deliberately absent here — it gets its own dedicated sheet
  // built separately below (with its live counter line), not the generic
  // section-sheet treatment.
  { ar: 'نطاق الترحيل', en: 'Migration Scope', steps: ['a7_migration_scope', 'a8_cutover'] },
  { ar: 'جرد الصفحات', en: 'Page Inventory', steps: ['a7b_page_inventory'] },
  { ar: 'الحسابات الخارجية', en: 'Third-Party Accounts', steps: ['a9_third_party'] },
  { ar: 'الهوية والتصميم', en: 'Brand Identity', steps: ['a2b_brand_design'] },
  { ar: 'نماذج الموقع', en: 'Website Forms', steps: ['b1_forms'] },
  { ar: 'الفروع والتواصل', en: 'Branches & Contact', steps: ['b3_branches'] },
  { ar: 'الخدمات', en: 'Services', steps: ['b4_services'] },
  { ar: 'المنتجات', en: 'Products', steps: ['b5_products'] },
  { ar: 'العلامات التجارية', en: 'Brands', steps: ['b6_brands'] },
  { ar: 'الاعتمادات والشهادات', en: 'Credentials & Certificates', steps: ['b7_credentials'] },
  { ar: 'المشاريع والأعمال', en: 'Projects & Portfolio', steps: ['b8_projects'] },
  { ar: 'الألبومات والفريق', en: 'Albums & Team', steps: ['b2_albums_leadership'] },
  { ar: 'معلومات إضافية', en: 'Additional Info', steps: ['b9_additional_info', 'b0_seo', 'b0b_languages'] },
  { ar: 'بعد التسليم', en: 'After Handover', steps: ['after_handover'] },
  { ar: 'المتطلبات السعودية', en: 'Saudi Requirements', steps: ['saudi_requirements'] },
  { ar: 'الملفات والصور', en: 'Files & Assets', steps: ['files_assets'] },
];

function styleHeaderRow(row) {
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_ARGB } };
  row.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
}

function addTitleAndBanner(ws, titleAr, titleEn, answers, version) {
  const projectTypeAr = PROJECT_TYPE_LIST.find((t) => t.value === answers.project_type)?.ar || 'غير محدد';
  ws.addRow([`${titleAr} / ${titleEn}`]);
  ws.getRow(1).font = { bold: true, size: 14 };
  ws.addRow([`نوع المشروع: ${projectTypeAr}    |    ${answers.company_name_ar || ''}    |    نسخة ${version} — ${new Date().toLocaleDateString('en-CA')}`]);
  ws.getRow(2).font = { italic: true, color: { argb: 'FF5B6572' } };
  ws.addRow([]);
}

function addQnaBlock(ws, rows) {
  if (!rows.length) return;
  const header = ws.addRow(['البند / Item', 'الإجابة / Answer', 'ملاحظات / Notes']);
  styleHeaderRow(header);
  for (const r of rows) {
    const row = ws.addRow([`${r.itemAr}\n${r.itemEn}`, r.answer, r.notes]);
    row.alignment = { horizontal: 'right', vertical: 'top', wrapText: true };
    if (r.isUnknown) row.font = { color: { argb: 'FFB3261E' } };
  }
  ws.addRow([]);
}

function addTableBlock(ws, table) {
  const titleRow = ws.addRow([`${table.titleAr} / ${table.titleEn}`]);
  titleRow.font = { bold: true };
  const header = ws.addRow(table.columns.map((c) => `${c.labelAr}\n${c.labelEn}`));
  styleHeaderRow(header);
  for (const cells of table.rows) {
    const row = ws.addRow(cells);
    row.alignment = { horizontal: 'right', vertical: 'top', wrapText: true };
  }
  if (!table.rows.length) {
    ws.addRow(['— لا يوجد صفوف —']).font = { italic: true, color: { argb: 'FF5B6572' } };
  }
  ws.addRow([]);
}

function autosizeColumns(ws, { min = 14, max = 48 } = {}) {
  const widths = [];
  ws.eachRow((row) => {
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const text = String(cell.value ?? '');
      const longestLine = Math.max(...text.split('\n').map((l) => l.length));
      widths[colNumber] = Math.max(widths[colNumber] || 0, longestLine);
    });
  });
  widths.forEach((w, i) => {
    if (i === 0) return;
    ws.getColumn(i).width = Math.min(max, Math.max(min, w + 2));
  });
}

function addSectionSheet(workbook, sheetDef, answers, version) {
  const applicable = sheetDef.steps.some((id) => {
    try {
      return isStepVisible(getStepById(id), answers);
    } catch {
      return false;
    }
  });
  if (!applicable) return;

  const ws = workbook.addWorksheet(sheetDef.ar.slice(0, 31), {
    views: [{ rightToLeft: true, state: 'frozen', ySplit: 2 }],
  });
  addTitleAndBanner(ws, sheetDef.ar, sheetDef.en, answers, version);

  for (const stepId of sheetDef.steps) {
    let step;
    try {
      step = getStepById(stepId);
    } catch {
      continue;
    }
    if (!isStepVisible(step, answers)) continue;
    const { qnaRows, tables } = prepareStepModel(step, answers);
    addQnaBlock(ws, qnaRows);
    for (const table of tables) addTableBlock(ws, table);
  }

  autosizeColumns(ws);
}

function addMailboxCounterNote(ws, answers) {
  const rows = Array.isArray(answers.a6_mailboxes) ? answers.a6_mailboxes : [];
  const created = rows.filter((r) => r.action === 'create').length;
  const migrated = rows.filter((r) => r.action === 'migrate').length;
  const deleted = rows.filter((r) => r.action === 'delete').length;
  ws.addRow([`${rows.length} صندوق بريد — ${created} جديد، ${migrated} مُرحّل، ${deleted} محذوف.`]).font = { bold: true };
  ws.addRow([]);
}

function addPasswordsSheet(workbook, answers, version) {
  const ws = workbook.addWorksheet('كلمات المرور', { views: [{ rightToLeft: true, state: 'frozen', ySplit: 2 }] });
  addTitleAndBanner(ws, 'صفحة كلمات المرور', 'Passwords Page', answers, version);

  const inForm = answers.password_entry_opt_in === 'in_form';
  const securityNote = ws.addRow([
    inForm
      ? 'تنبيه أمني: هذا الملف يحتوي كلمات مرور. احتفظ به على جهازك، أرسله عبر قناة مشفّرة، وغيّر كل كلمة مرور بعد انتهاء المشروع.'
      : 'الحقول أدناه فارغة عمداً — املأها على جهازك أنت فقط، ثم أرسل الملف عبر قناة مشفّرة، وغيّر كل كلمة مرور بعد انتهاء المشروع.',
  ]);
  securityNote.font = { bold: true, color: { argb: 'FFB3261E' } };
  securityNote.alignment = { wrapText: true, horizontal: 'right' };
  ws.addRow([]);

  // Table 1 — service credentials (always printed).
  const CREDENTIAL_LABELS = Object.fromEntries(CREDENTIAL_SERVICES.map((s) => [s.value, s.ar]));
  const identified = mergeDerivedRows(
    Array.isArray(answers.service_credentials) ? answers.service_credentials : [],
    deriveIdentifiedServices(answers),
    'service',
  );
  const t1Header = ws.addRow(['الخدمة\nService', 'رابط الدخول\nLogin URL', 'اسم المستخدم\nUsername', 'كلمة المرور\nPassword', 'التحقق بخطوتين\n2FA method', 'ملاحظات\nNotes']);
  styleHeaderRow(t1Header);
  for (const r of identified) {
    const row = ws.addRow([
      CREDENTIAL_LABELS[r.service] || r.service,
      r.login_url || '',
      r.username || '',
      inForm ? r.password || '' : '',
      r.twofa_method || '',
      r.notes || '',
    ]);
    row.alignment = { horizontal: 'right', vertical: 'top' };
    row.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF6E5' } };
    row.height = 22;
  }
  ws.addRow([]);

  // Table 2 — mailbox passwords, conditional on migration access method.
  if (answers.migration_access_method === 'admin') {
    ws.addRow(['صلاحية مشرف متاحة على مزوّد البريد — لا حاجة لكلمات مرور صناديق فردية.']).font = { italic: true };
  } else {
    const migrating = mergeDerivedRows(
      Array.isArray(answers.mailbox_passwords) ? answers.mailbox_passwords : [],
      deriveMigratingMailboxRows(answers),
      'email',
    );
    const t2Title = ws.addRow(['كلمات مرور صناديق البريد / Mailbox Passwords']);
    t2Title.font = { bold: true };
    const t2Header = ws.addRow(['البريد الإلكتروني\nEmail', 'كلمة المرور\nPassword', 'كلمة مرور التطبيق (2FA)\nApp Password', '2FA مفعّل؟', 'الصندوق نشط؟', 'ملاحظات']);
    styleHeaderRow(t2Header);
    for (const r of migrating) {
      const row = ws.addRow([r.email, inForm ? r.password || '' : '', inForm ? r.app_password || '' : '', r.twofa_enabled || '', r.mailbox_active || '', r.notes || '']);
      row.alignment = { horizontal: 'right', vertical: 'top' };
      row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF6E5' } };
      row.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF6E5' } };
      row.height = 22;
    }
    if (!migrating.length) ws.addRow(['— لا توجد صناديق معلَّمة للترحيل —']).font = { italic: true, color: { argb: 'FF5B6572' } };
  }

  autosizeColumns(ws);
}

/**
 * @param {object} answers
 * @param {number} version - shared across every file in this export batch, see generators/version.js
 * @returns {Promise<Blob>}
 */
export async function generateXlsx(answers, version = 1) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Jahiz';
  workbook.created = new Date();

  for (const sheetDef of SHEET_MAP) addSectionSheet(workbook, sheetDef, answers, version);

  if (isStepVisible(getStepById('a6_mailboxes'), answers)) {
    // Mailboxes gets its own dedicated sheet (per spec, "plus a Mailboxes
    // sheet") even though it's also listed once inside its normal section
    // walk — SHEET_MAP intentionally omits a6_mailboxes from any other
    // sheet's step list, so this is the only place it's rendered.
    const ws = workbook.addWorksheet('صناديق البريد', { views: [{ rightToLeft: true, state: 'frozen', ySplit: 2 }] });
    addTitleAndBanner(ws, 'صناديق البريد', 'Mailboxes', answers, version);
    addMailboxCounterNote(ws, answers);
    const { tables } = prepareStepModel(getStepById('a6_mailboxes'), answers);
    for (const table of tables) addTableBlock(ws, table);
    autosizeColumns(ws);
  }

  addPasswordsSheet(workbook, answers, version);

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
