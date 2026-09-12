// Autosave to localStorage — text/answers only. Image blobs never touch
// localStorage (Step 4 puts those in IndexedDB); the 5MB quota would blow
// instantly otherwise. The in-form password fields (Step 6 territory,
// schema/steps/shared-steps.js `passwords` step) are filtered out here on
// every single save — see EXCLUDED_PREFIXES below — so there is no window
// where a password could land in localStorage even transiently.

const STORAGE_KEY = 'jahiz:draft:v1';
const META_KEY = 'jahiz:draft-meta:v1';
const SAVE_DEBOUNCE_MS = 500;

// Field ids whose values must never be persisted, per the "OPTIONAL PASSWORD
// ENTRY" hard rule: values live in one in-memory object only.
const EXCLUDED_ANSWER_KEYS = new Set(['password_entry_opt_in']);
function isExcluded(key) {
  if (EXCLUDED_ANSWER_KEYS.has(key)) return false; // the toggle itself is fine to persist
  return (
    key === 'service_credentials' ||
    key === 'mailbox_passwords' ||
    key.startsWith('service_credentials.') ||
    key.startsWith('mailbox_passwords.')
  );
}

function sanitize(answers) {
  const out = {};
  for (const [key, value] of Object.entries(answers)) {
    if (isExcluded(key)) continue;
    out[key] = value;
  }
  // service_credentials / mailbox_passwords rows carry non-sensitive columns
  // (service, login URL, username, notes) alongside the sensitive `password`
  // / `app_password` ones — strip only the sensitive columns rather than the
  // whole table, so autosave still restores which services were identified.
  for (const tableId of ['service_credentials', 'mailbox_passwords']) {
    if (Array.isArray(answers[tableId])) {
      out[tableId] = answers[tableId].map(({ password, app_password, ...rest }) => rest);
    }
  }
  return out;
}

let saveTimer = null;

export function scheduleSave(answers) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveNow(answers), SAVE_DEBOUNCE_MS);
}

export function saveNow(answers) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitize(answers)));
    const meta = { lastSaved: new Date().toISOString() };
    localStorage.setItem(META_KEY, JSON.stringify(meta));
    return meta;
  } catch {
    // Quota exceeded or storage disabled (private mode, etc.) — the caller
    // is expected to have already warned the client via detectPrivateMode().
    return null;
  }
}

export function loadDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const metaRaw = localStorage.getItem(META_KEY);
    if (!raw) return null;
    return { answers: JSON.parse(raw), meta: metaRaw ? JSON.parse(metaRaw) : null };
  } catch {
    return null;
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(META_KEY);
  } catch {
    /* ignore */
  }
}

export function getLastSaved() {
  try {
    const metaRaw = localStorage.getItem(META_KEY);
    return metaRaw ? JSON.parse(metaRaw).lastSaved : null;
  } catch {
    return null;
  }
}

/** Best-effort private/incognito detection — never blocks the form, only warns. */
export async function detectPrivateMode() {
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const { quota } = await navigator.storage.estimate();
      // Safari/Firefox private windows report a drastically smaller quota
      // (tens of MB) than a normal window (typically many GB).
      if (typeof quota === 'number' && quota < 120 * 1024 * 1024) return true;
    }
    // Fallback: a write/read/delete round-trip catches browsers that don't
    // support storage.estimate() but still restrict/clear storage in private mode.
    const probeKey = '__jahiz_private_probe__';
    localStorage.setItem(probeKey, '1');
    localStorage.removeItem(probeKey);
    return false;
  } catch {
    return true;
  }
}

/** Ask the browser not to evict our data under storage pressure. Best-effort. */
export async function requestPersistentStorage() {
  try {
    if (navigator.storage && navigator.storage.persist) {
      return await navigator.storage.persist();
    }
  } catch {
    /* ignore — not fatal, just means eviction is possible under pressure */
  }
  return false;
}
