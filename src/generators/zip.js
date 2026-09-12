// The assets ZIP — "the only real source of images for me... the documents
// are for reading and approval; the ZIP is what I build from." Walks every
// UPLOAD column on every visible table (generically — nothing here
// hardcodes "products" or "services", it just asks the schema which
// columns are uploads), pulls the stored blobs from IndexedDB, and lays
// them out exactly per the ZIP structure in the spec.

import JSZip from 'jszip';
import { getVisibleSteps } from '../schema/index.js';
import { getImagesForCell } from '../media/store.js';
import { generateFilename, resolveZipFolder, convertToWebP } from '../media/compress.js';

/** Every {step, table field, upload column} triple currently on screen. */
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

function csvEscape(value) {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * @param {object} answers
 * @returns {Promise<{ blob: Blob, imageCount: number } | null>} null when there are no images to zip at all
 */
export async function generateAssetsZip(answers) {
  const zip = new JSZip();
  const manifestRows = [];
  let imageCount = 0;

  for (const { tableField, column } of findUploadColumns(answers)) {
    const rows = Array.isArray(answers[tableField.id]) ? answers[tableField.id] : [];
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      const itemName = tableField.itemNameColumn ? row[tableField.itemNameColumn] : '';
      const images = await getImagesForCell(tableField.id, row._rowId, column.id);
      if (!images.length) continue;

      const folder = resolveZipFolder(column.zipPath || `${tableField.id}/`, itemName);
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const filename = generateFilename({
          rowIndex: rowIndex + 1,
          itemName,
          imageIndex: i + 1,
          mimeType: img.mimeType,
          originalName: img.originalName,
        });

        zip.file(`originals/${folder}${filename}`, img.originalBlob);

        // A WebP web/ copy makes sense for real photos; skip it for a PDF
        // certificate scan (nothing to usefully rasterize at 1600px there).
        if (img.mimeType !== 'application/pdf') {
          const webName = filename.replace(/\.[a-z0-9]+$/i, '.webp');
          try {
            // From the original, not the 1200px doc-preview — the web/
            // folder should be the best available quality up to 1600px,
            // not an upscale of an already-downscaled preview.
            const webBlob = await convertToWebP(img.originalBlob);
            zip.file(`web/${folder}${webName}`, webBlob);
          } catch {
            // A single unreadable image shouldn't break the whole ZIP — the
            // original is still there under originals/, which is what matters most.
          }
        }

        manifestRows.push({
          filename: `originals/${folder}${filename}`,
          section: tableField.id,
          rowNumber: rowIndex + 1,
          itemNameAr: itemName || '',
          itemNameEn: '', // content-track item names are Arabic-only by design — see B0b in the spec
          originalName: img.originalName,
          width: img.width || '',
          height: img.height || '',
          sizeBytes: img.size || 0,
        });
        imageCount++;
      }
    }
  }

  if (!imageCount) return null;

  const manifestCsv = [
    'filename,section,row_number,item_name_ar,item_name_en,original_name,width,height,size_bytes',
    ...manifestRows.map((r) =>
      [r.filename, r.section, r.rowNumber, r.itemNameAr, r.itemNameEn, r.originalName, r.width, r.height, r.sizeBytes].map(csvEscape).join(','),
    ),
  ].join('\n');
  zip.file('MANIFEST.csv', manifestCsv);
  zip.file('manifest.json', JSON.stringify(manifestRows, null, 2));

  zip.file(
    'README.txt',
    'هذا الملف يحتوي جميع الصور والملفات التي رفعتها في النموذج، بدقتها الكاملة داخل مجلد originals، ونسخة بصيغة WebP جاهزة للرفع على الموقع داخل مجلد web. أرسل هذا الملف مع مستند الإكسل عند التسليم — هو المصدر الوحيد للصور، والمستندات للقراءة والمراجعة فقط.',
  );

  const blob = await zip.generateAsync({ type: 'blob' });
  return { blob, imageCount };
}
