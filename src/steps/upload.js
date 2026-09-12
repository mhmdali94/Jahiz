// Real upload pipeline (replaces the Step 3 placeholder): drag-and-drop,
// <canvas> compression to a 1200px JPEG preview, IndexedDB persistence
// keyed to the row, a thumbnail grid with reorder/delete, and a running
// "N images · X MB" total. Originals are read with FileReader/
// createImageBitmap only — nothing is ever uploaded anywhere.
//
// Filenames shown under each thumbnail are a *live preview*, recomputed
// from the row's current position and name every time this grid redraws
// (on mount, and after any add/delete/reorder here). If the client renames
// the item without touching this upload zone again, the caption can go
// stale until the next redraw — the real filename Step 5 bakes into the
// ZIP/docx is always computed fresh at generation time, so it's never
// actually wrong there, only potentially a beat behind in this preview.

import { el } from './dom.js';
import { strings } from '../strings.js';
import { ACCEPTED_TYPES, isCompressible, compressImage, readImageDimensions, generateFilename, resolveZipFolder } from '../media/compress.js';
import { addImage, getImagesForCell, deleteImage, reorderImages } from '../media/store.js';

const RASTER_LIKE = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']);

export function renderUploadField(column, slot, context) {
  const dropzone = el('label', { class: 'upload-dropzone' }, [
    el('span', {}, strings.upload.dropzoneAr),
    el('input', {
      type: 'file',
      accept: [...ACCEPTED_TYPES].join(','),
      multiple: true,
      hidden: true,
      onchange: async (e) => {
        const files = Array.from(e.target.files);
        e.target.value = '';
        await handleFiles(files);
      },
    }),
  ]);

  const progressEl = el('p', { class: 'upload-progress', hidden: true });
  const rejectedEl = el('p', { class: 'upload-rejected', hidden: true });
  const grid = el('div', { class: 'upload-grid' });
  const totalEl = el('p', { class: 'upload-total' });

  slot.appendChild(dropzone);
  slot.appendChild(progressEl);
  slot.appendChild(rejectedEl);
  slot.appendChild(grid);
  slot.appendChild(totalEl);

  async function handleFiles(files) {
    const accepted = files.filter((f) => ACCEPTED_TYPES.has(f.type));
    const rejected = files.length - accepted.length;
    rejectedEl.hidden = rejected === 0;
    if (rejected) rejectedEl.textContent = strings.upload.rejectedTypeAr;
    if (!accepted.length) return;

    if (!context) return; // defensive — every real UPLOAD column supplies one via table.js

    const showProgress = accepted.length > 1;
    for (let i = 0; i < accepted.length; i++) {
      if (showProgress) {
        progressEl.hidden = false;
        progressEl.textContent = strings.upload.progressAr.replace('{done}', i).replace('{total}', accepted.length);
      }
      await storeOneFile(accepted[i]);
      await renderGrid(); // incremental feedback — the point of showing progress at all
    }
    progressEl.hidden = true;
  }

  async function storeOneFile(file) {
    let previewBlob = file;
    let width, height;
    try {
      if (isCompressible(file.type)) {
        const result = await compressImage(file);
        previewBlob = result.blob;
        width = result.originalWidth;
        height = result.originalHeight;
      } else if (file.type === 'image/svg+xml') {
        const dims = await readImageDimensions(file).catch(() => ({}));
        width = dims.width;
        height = dims.height;
      }
      // application/pdf: no raster dimensions, previewBlob stays the pdf itself.
    } catch {
      // A corrupt/unreadable image shouldn't stop the rest of the batch —
      // fall back to storing the original untouched as its own "preview".
      previewBlob = file;
    }

    await addImage({
      fieldId: context.fieldId,
      rowId: context.rowId,
      columnId: context.columnId,
      originalBlob: file,
      previewBlob,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      width,
      height,
    });
  }

  async function renderGrid() {
    grid.replaceChildren();
    if (!context) return;
    const images = await getImagesForCell(context.fieldId, context.rowId, context.columnId);
    const { rowIndex, itemName } = context.getRowInfo();
    const folder = context.zipPathTemplate ? resolveZipFolder(context.zipPathTemplate, itemName) : '';

    images.forEach((img, index) => {
      const filename = generateFilename({ rowIndex, itemName, imageIndex: index + 1, mimeType: img.mimeType, originalName: img.originalName });
      const thumb = el('div', { class: 'upload-thumb' });

      if (RASTER_LIKE.has(img.mimeType)) {
        thumb.appendChild(el('img', { src: URL.createObjectURL(img.previewBlob), alt: filename, class: 'upload-thumb__img' }));
      } else {
        thumb.appendChild(el('div', { class: 'upload-thumb__file-icon' }, 'PDF'));
      }

      thumb.appendChild(el('span', { class: 'upload-thumb__caption', dir: 'ltr' }, `${folder}${filename}`));

      const actions = el('div', { class: 'upload-thumb__actions' }, [
        el('button', {
          type: 'button',
          class: 'icon-btn',
          disabled: index === 0,
          title: 'تحريك لأعلى',
          onclick: async () => {
            const ids = images.map((i) => i.id);
            [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
            await reorderImages(context.fieldId, context.rowId, context.columnId, ids);
            await renderGrid();
          },
        }, '↑'),
        el('button', {
          type: 'button',
          class: 'icon-btn',
          disabled: index === images.length - 1,
          title: 'تحريك لأسفل',
          onclick: async () => {
            const ids = images.map((i) => i.id);
            [ids[index + 1], ids[index]] = [ids[index], ids[index + 1]];
            await reorderImages(context.fieldId, context.rowId, context.columnId, ids);
            await renderGrid();
          },
        }, '↓'),
        el('button', {
          type: 'button',
          class: 'icon-btn icon-btn--danger',
          title: strings.nav.deleteRow,
          onclick: async () => {
            await deleteImage(img.id);
            await renderGrid();
          },
        }, '×'),
      ]);
      thumb.appendChild(actions);
      grid.appendChild(thumb);
    });

    const totalBytes = images.reduce((sum, i) => sum + (i.size || 0), 0);
    totalEl.textContent = strings.upload.runningTotalAr
      .replace('{count}', images.length)
      .replace('{size}', `${(totalBytes / 1024 / 1024).toFixed(1)}MB`);
    totalEl.hidden = images.length === 0;
  }

  renderGrid();
  return dropzone;
}
