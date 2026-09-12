// One version counter per browser/draft, bumped exactly once per "Generate
// files" click and shared across every file produced in that batch — so a
// client can never end up holding v1 of one file and v3 of another. Callers
// resolve the version ONCE (bumpVersion) and pass it into every generator;
// nothing in here reads localStorage more than once per export.

const KEY = 'jahiz:export-version';

export function getCurrentVersion() {
  try {
    return Number(localStorage.getItem(KEY) || '0');
  } catch {
    return 0;
  }
}

export function bumpVersion() {
  const next = getCurrentVersion() + 1;
  try {
    localStorage.setItem(KEY, String(next));
  } catch {
    /* private mode / storage disabled — the export still works, it just won't remember the count next time */
  }
  return next;
}
