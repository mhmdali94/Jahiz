// IndexedDB for image blobs — text answers autosave to localStorage
// (steps/autosave.js), but the 5MB quota there would blow instantly on
// photos, so blobs live here instead, keyed to the row they belong to.
// Filenames are NOT stored here — see compress.js's generateFilename() for
// why they're computed fresh from current row order instead of frozen at
// upload time.

import { openDB } from 'idb';

const DB_NAME = 'jahiz-media';
const DB_VERSION = 1;
const STORE = 'images';

let dbPromise;
function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('byRow', ['fieldId', 'rowId', 'columnId']);
        store.createIndex('byField', 'fieldId');
      },
    });
  }
  return dbPromise;
}

function newId() {
  return crypto.randomUUID ? crypto.randomUUID() : `img-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * @param {object} record - { fieldId, rowId, columnId, originalBlob, previewBlob, originalName, mimeType, size, width, height }
 * @returns {Promise<string>} the new image's id
 */
export async function addImage(record) {
  const db = await getDB();
  const existing = await getImagesForCell(record.fieldId, record.rowId, record.columnId);
  const id = newId();
  await db.put(STORE, {
    id,
    order: existing.length,
    createdAt: Date.now(),
    ...record,
  });
  return id;
}

export async function getImagesForCell(fieldId, rowId, columnId) {
  const db = await getDB();
  const all = await db.getAllFromIndex(STORE, 'byRow', IDBKeyRange.only([fieldId, rowId, columnId]));
  return all.sort((a, b) => a.order - b.order);
}

export async function getImagesForField(fieldId) {
  const db = await getDB();
  return db.getAllFromIndex(STORE, 'byField', fieldId);
}

export async function deleteImage(id) {
  const db = await getDB();
  await db.delete(STORE, id);
}

export async function deleteImagesForCell(fieldId, rowId, columnId) {
  const db = await getDB();
  const rows = await getImagesForCell(fieldId, rowId, columnId);
  const tx = db.transaction(STORE, 'readwrite');
  await Promise.all(rows.map((r) => tx.store.delete(r.id)));
  await tx.done;
}

export async function deleteImagesForRow(fieldId, rowId) {
  const db = await getDB();
  const all = await db.getAllFromIndex(STORE, 'byField', fieldId);
  const toDelete = all.filter((img) => img.rowId === rowId);
  const tx = db.transaction(STORE, 'readwrite');
  await Promise.all(toDelete.map((img) => tx.store.delete(img.id)));
  await tx.done;
}

/** Persists a new left-to-right order after a drag/up-down reorder. */
export async function reorderImages(fieldId, rowId, columnId, orderedIds) {
  const db = await getDB();
  const tx = db.transaction(STORE, 'readwrite');
  await Promise.all(
    orderedIds.map(async (id, index) => {
      const record = await tx.store.get(id);
      if (record) await tx.store.put({ ...record, order: index });
    }),
  );
  await tx.done;
}

export async function getGlobalStats() {
  const db = await getDB();
  const all = await db.getAll(STORE);
  return { count: all.length, totalBytes: all.reduce((sum, img) => sum + (img.size || 0), 0) };
}

/** Wipes every stored image — used by "start fresh" on the draft prompt. */
export async function clearAllImages() {
  const db = await getDB();
  await db.clear(STORE);
}
