// "More than one person filling it" — the IT contact does hosting and mail,
// marketing does products and photos. Two export sizes because images
// change everything: a light .json (answers only, sends anywhere instantly)
// and a full .zip (answers + original image blobs, for when the colleague
// needs the photos too). Import always shows what's incoming before
// touching anything already there — never a silent overwrite.

import { getVisibleSteps } from '../schema/index.js';
import { getAnswers } from '../steps/state.js';
import { getImagesForCell, addImage } from '../media/store.js';

const DRAFT_VERSION = 1;

// Same rule as autosave.js: credential values never leave this browser in
// any form, including a draft handed to a colleague.
function sanitizeAnswers(answers) {
  const out = {};
  for (const [key, value] of Object.entries(answers)) {
    if (key === 'service_credentials' || key === 'mailbox_passwords') {
      out[key] = (Array.isArray(value) ? value : []).map(({ password, app_password, ...rest }) => rest);
    } else {
      out[key] = value;
    }
  }
  return out;
}

function findUploadColumns(answers) {
  const found = [];
  for (const step of getVisibleSteps(answers)) {
    for (const field of step.fields) {
      if (field.type !== 'table') continue;
      for (const col of field.columns) {
        if (col.type === 'upload') found.push({ tableField: field, column: col });
      }
    }
  }
  return found;
}

function slugForFilename(text) {
  return (text || 'client').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'client';
}

export function exportLightDraft(answers = getAnswers()) {
  const payload = { draftVersion: DRAFT_VERSION, kind: 'light', exportedAt: new Date().toISOString(), answers: sanitizeAnswers(answers) };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  return { blob, filename: `${slugForFilename(answers.company_name_ar)}-draft.json` };
}

export async function exportFullDraft(answers = getAnswers()) {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const imagesManifest = [];

  for (const { tableField, column } of findUploadColumns(answers)) {
    const rows = Array.isArray(answers[tableField.id]) ? answers[tableField.id] : [];
    for (const row of rows) {
      const images = await getImagesForCell(tableField.id, row._rowId, column.id);
      for (const img of images) {
        const zipName = `${img.id}-${img.originalName}`;
        zip.file(`images/${zipName}`, img.originalBlob);
        imagesManifest.push({
          fieldId: tableField.id,
          rowId: row._rowId,
          columnId: column.id,
          order: img.order,
          zipName,
          originalName: img.originalName,
          mimeType: img.mimeType,
          size: img.size,
          width: img.width,
          height: img.height,
        });
      }
    }
  }

  const payload = { draftVersion: DRAFT_VERSION, kind: 'full', exportedAt: new Date().toISOString(), answers: sanitizeAnswers(answers), images: imagesManifest };
  zip.file('draft.json', JSON.stringify(payload, null, 2));

  const blob = await zip.generateAsync({ type: 'blob' });
  return { blob, filename: `${slugForFilename(answers.company_name_ar)}-draft-full.zip`, imageCount: imagesManifest.length };
}

/** @returns {Promise<{ kind: 'light'|'full', answers: object, images: Array }>} */
export async function parseDraftFile(file) {
  if (file.name.endsWith('.zip')) {
    const { default: JSZip } = await import('jszip');
    const zip = await JSZip.loadAsync(file);
    const draftEntry = zip.file('draft.json');
    if (!draftEntry) throw new Error('لم يتم العثور على draft.json داخل الملف المضغوط.');
    const payload = JSON.parse(await draftEntry.async('string'));
    const images = [];
    for (const meta of payload.images || []) {
      const entry = zip.file(`images/${meta.zipName}`);
      if (!entry) continue;
      const blob = await entry.async('blob');
      images.push({ ...meta, blob });
    }
    return { kind: 'full', answers: payload.answers, images };
  }
  const text = await file.text();
  const payload = JSON.parse(text);
  return { kind: 'light', answers: payload.answers, images: [] };
}

function isFieldAnswered(field, answers) {
  if (field.type === 'table') return Array.isArray(answers[field.id]) && answers[field.id].length > 0;
  if (answers[field.id + '__unknown']) return true;
  const v = answers[field.id];
  return v !== undefined && v !== '' && v !== null && !(Array.isArray(v) && v.length === 0);
}

/** Which visible steps have at least one answered field, for the import-summary screen. */
export function summarizeAnsweredSteps(answers) {
  const filled = new Set();
  for (const step of getVisibleSteps(answers)) {
    const hasAny = step.fields.some((f) => f.type !== 'static' && isFieldAnswered(f, answers));
    if (hasAny) filled.add(step.id);
  }
  return filled;
}

/**
 * @param {'replace'|'fill_empty'} mode
 * "fill_empty" only adopts a whole STEP's worth of fields from the import
 * when the current draft has nothing at all for that step — never merges
 * field-by-field within a step that's already partially filled, matching
 * "fill only the sections that are currently empty."
 */
export function mergeDraftAnswers(currentAnswers, importedAnswers, mode) {
  if (mode === 'replace') return { ...importedAnswers };

  const currentFilledSteps = summarizeAnsweredSteps(currentAnswers);
  const merged = { ...currentAnswers };
  for (const step of getVisibleSteps(importedAnswers)) {
    if (currentFilledSteps.has(step.id)) continue;
    for (const field of step.fields) {
      if (field.type === 'static') continue;
      if (field.id in importedAnswers) merged[field.id] = importedAnswers[field.id];
      if (`${field.id}__unknown` in importedAnswers) merged[`${field.id}__unknown`] = importedAnswers[`${field.id}__unknown`];
      if (`${field.id}__owner` in importedAnswers) merged[`${field.id}__owner`] = importedAnswers[`${field.id}__owner`];
    }
  }
  return merged;
}

/** Re-inserts a full draft's image blobs into this browser's IndexedDB. */
export async function importImages(images) {
  for (const img of images) {
    await addImage({
      fieldId: img.fieldId,
      rowId: img.rowId,
      columnId: img.columnId,
      originalBlob: img.blob,
      previewBlob: img.blob, // re-derived from original; good enough until the next edit touches this row
      originalName: img.originalName,
      mimeType: img.mimeType,
      size: img.size,
      width: img.width,
      height: img.height,
    });
  }
}

/** After a LIGHT import, which rows now have zero images — for the "6 products need photos" callout. */
export async function findRowsMissingImages(answers) {
  const missing = [];
  for (const { tableField, column } of findUploadColumns(answers)) {
    const rows = Array.isArray(answers[tableField.id]) ? answers[tableField.id] : [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const images = await getImagesForCell(tableField.id, row._rowId, column.id);
      if (!images.length) {
        const itemName = tableField.itemNameColumn ? row[tableField.itemNameColumn] : '';
        missing.push({ stepTitleAr: tableField.labelAr, fieldId: tableField.id, rowIndex: i + 1, itemName });
      }
    }
  }
  return missing;
}
