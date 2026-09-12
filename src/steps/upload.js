// PLACEHOLDER — Step 4 ("Uploads") replaces this with the real pipeline:
// <canvas> compression to a 1200px preview, originals kept full-res,
// IndexedDB persistence keyed by row, thumbnail grid with reorder/delete,
// and the running "34 images · 82 MB" counter. For now this only lets the
// wizard be navigated end-to-end without crashing on an upload field —
// selected files live in memory for this page load only and are lost on
// refresh, which is expected and temporary.

import { el } from './dom.js';
import { strings } from '../strings.js';

const memoryStore = new Map(); // fieldId -> File[]

export function renderUploadField(field, slot) {
  if (!memoryStore.has(field.id)) memoryStore.set(field.id, []);

  const dropzone = el('label', { class: 'upload-dropzone' }, [
    el('span', {}, strings.upload.dropzoneAr),
    el('input', {
      type: 'file',
      accept: 'image/jpeg,image/png,image/webp,image/svg+xml,application/pdf',
      multiple: true,
      hidden: true,
      onchange: (e) => {
        memoryStore.get(field.id).push(...Array.from(e.target.files));
        renderList();
        e.target.value = '';
      },
    }),
  ]);

  const list = el('ul', { class: 'upload-list' });

  function renderList() {
    list.replaceChildren();
    const files = memoryStore.get(field.id);
    for (const [index, file] of files.entries()) {
      list.appendChild(
        el('li', { class: 'upload-list__item' }, [
          el('span', {}, `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)}MB`),
          el('button', {
            type: 'button',
            class: 'upload-list__remove',
            'aria-label': 'حذف',
            onclick: () => {
              files.splice(index, 1);
              renderList();
            },
          }, '×'),
        ]),
      );
    }
  }

  renderList();
  slot.appendChild(dropzone);
  slot.appendChild(list);
  return dropzone;
}

export function getStagedFiles(fieldId) {
  return memoryStore.get(fieldId) || [];
}
