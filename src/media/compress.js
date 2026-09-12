// Image compression + filename generation. Pure functions — no DOM, no
// IndexedDB — so both the upload UI (Step 4) and the generators (Step 5)
// can share this without pulling in unrelated code.
//
// Filenames are deliberately NOT computed once and frozen at upload time.
// A row's position (and its name) can change after the fact — reordering,
// deleting an earlier row, renaming a product — so generateFilename() is
// meant to be called fresh whenever a filename is actually needed (the
// upload thumbnail caption, or the real ZIP/docx build in Step 5), always
// fed the CURRENT row index and item name. That keeps "the row's filename
// field must never disagree with the image's real name" true by
// construction instead of needing a resync pass after every table edit.

const RASTER_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
export const ACCEPTED_TYPES = new Set([...RASTER_TYPES, 'image/svg+xml', 'application/pdf']);

export function isCompressible(mimeType) {
  return RASTER_TYPES.has(mimeType);
}

/**
 * Downscales to `maxDimension` on the long edge and re-encodes as JPEG at
 * `quality` — this is the ONE preview embedded in the .docx/.xlsx later.
 * Originals are never touched; this only ever produces a new, smaller blob.
 */
export async function compressImage(file, { maxDimension = 1200, quality = 0.8 } = {}) {
  const bitmap = await createImageBitmap(file);
  const originalWidth = bitmap.width;
  const originalHeight = bitmap.height;
  const scale = Math.min(1, maxDimension / Math.max(originalWidth, originalHeight));
  const width = Math.max(1, Math.round(originalWidth * scale));
  const height = Math.max(1, Math.round(originalHeight * scale));

  const canvas = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(width, height) : document.createElement('canvas');
  if (!(canvas instanceof OffscreenCanvas)) {
    canvas.width = width;
    canvas.height = height;
  }
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob =
    'convertToBlob' in canvas
      ? await canvas.convertToBlob({ type: 'image/jpeg', quality })
      : await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));

  return { blob, originalWidth, originalHeight };
}

/** Reads just the pixel dimensions, for files we don't compress (svg/pdf don't reach here). */
export async function readImageDimensions(file) {
  const bitmap = await createImageBitmap(file);
  const dims = { width: bitmap.width, height: bitmap.height };
  bitmap.close?.();
  return dims;
}

// A deliberately simple, deterministic Arabic → Latin transliteration.
// It won't produce a "correct" romanization (Arabic phonology doesn't map
// 1:1 to Latin letters), but it's stable and readable enough for a URL
// segment, which is the only job this has: most content in this form
// (product/service/project names) is Arabic per the Arabic-only content
// rule, and a slug has to come from *something*.
const ARABIC_TRANSLITERATION = {
  ا: 'a', أ: 'a', إ: 'i', آ: 'a', ب: 'b', ت: 't', ث: 'th', ج: 'j', ح: 'h',
  خ: 'kh', د: 'd', ذ: 'dh', ر: 'r', ز: 'z', س: 's', ش: 'sh', ص: 's', ض: 'd',
  ط: 't', ظ: 'z', ع: 'a', غ: 'gh', ف: 'f', ق: 'q', ك: 'k', ل: 'l', م: 'm',
  ن: 'n', ه: 'h', و: 'w', ي: 'y', ى: 'a', ة: 'a', ء: '', ئ: 'e', ؤ: 'o',
  ' ': '-',
};

export function transliterateArabic(text) {
  return [...text].map((ch) => ARABIC_TRANSLITERATION[ch] ?? ch).join('');
}

/** Lowercase, ASCII, hyphens only — because these become URLs on the live site. */
export function slugify(text) {
  if (!text) return '';
  return transliterateArabic(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

function extensionFor(mimeType, originalName) {
  const map = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/svg+xml': 'svg', 'application/pdf': 'pdf' };
  return map[mimeType] || (originalName.split('.').pop() || 'bin').toLowerCase();
}

/** `01-safe-cs1200-01.jpg` — row number, slugified item name, image number. */
export function generateFilename({ rowIndex, itemName, imageIndex, mimeType, originalName }) {
  const base = slugify(itemName) || 'item';
  const rowPart = String(rowIndex).padStart(2, '0');
  const imgPart = String(imageIndex).padStart(2, '0');
  return `${rowPart}-${base}-${imgPart}.${extensionFor(mimeType, originalName)}`;
}

/** Resolves a schema column's `zipPath` (e.g. "albums/{album-slug}/") against a real row. */
export function resolveZipFolder(zipPathTemplate, itemName) {
  return zipPathTemplate.replace('{album-slug}', slugify(itemName) || 'album');
}
