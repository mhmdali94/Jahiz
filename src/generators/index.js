// Orchestrates one "Generate files" click. Per the spec's GENERATED FILES
// section: xlsx and zip are real downloads triggered immediately; the pdf
// is a print-dialog action the client triggers themselves from the
// download screen (Word/Excel-style "Save as PDF"), so it doesn't fire
// automatically alongside two file downloads. Each generator is isolated —
// one throwing never blocks the others, per "Failure must be isolated."

import { bumpVersion } from './version.js';
import { slugify } from '../media/compress.js';

function buildFilename(answers, kind, version, ext) {
  const slug = slugify(answers.company_name_ar || answers.company_name_en) || 'client';
  const date = new Date().toISOString().slice(0, 10);
  return `${slug}-${date}-${kind}-v${version}.${ext}`;
}

export function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Runs every required generator, downloading what succeeds and collecting
 * what fails, and returns a summary the review screen renders as the
 * download screen (see steps/review.js).
 */
export async function generateAllFiles(answers) {
  const version = bumpVersion();
  const result = { version, xlsx: null, zip: null, errors: [] };

  try {
    const { generateXlsx } = await import('./xlsx.js');
    const blob = await generateXlsx(answers, version);
    const filename = buildFilename(answers, 'onboarding', version, 'xlsx');
    triggerDownload(blob, filename);
    result.xlsx = { filename, size: blob.size };
  } catch (err) {
    // The client-facing banner deliberately stays generic (no stack trace on
    // a screen a non-technical client is looking at) — but that meant the
    // real cause was going nowhere at all, not even to devtools. Logging it
    // here doesn't change what the client sees, just what's diagnosable.
    console.error('Jahiz: xlsx generation failed —', err);
    result.errors.push({ type: 'xlsx', message: String(err?.message || err) });
  }

  try {
    const { generateAssetsZip } = await import('./zip.js');
    const zipResult = await generateAssetsZip(answers);
    if (zipResult) {
      const filename = buildFilename(answers, 'assets', version, 'zip');
      triggerDownload(zipResult.blob, filename);
      result.zip = { filename, size: zipResult.blob.size, imageCount: zipResult.imageCount };
    }
  } catch (err) {
    console.error('Jahiz: zip generation failed —', err);
    result.errors.push({ type: 'zip', message: String(err?.message || err) });
  }

  return result;
}

export { buildFilename };
