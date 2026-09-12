// Central answer store. Plain object + pub/sub — no framework, no proxies.
// Shape of `answers`:
//   answers[field.id]              -> the value (string / number / array-of-rows for tables)
//   answers[field.id + '__unknown'] -> true when the "لا أعرف" toggle is on
//   answers[field.id + '__owner']   -> owner value chosen for that toggle
// Table rows are plain objects keyed by column id, plus an internal `_rowId`
// used as a DOM/list key (never rendered, never exported to generators).

const UNKNOWN_SUFFIX = '__unknown';
const OWNER_SUFFIX = '__owner';

let answers = {};
const listeners = new Set();

export function getAnswers() {
  return answers;
}

export function replaceAnswers(next) {
  answers = next && typeof next === 'object' ? next : {};
  notify();
}

export function getValue(fieldId) {
  return answers[fieldId];
}

export function setValue(fieldId, value) {
  answers = { ...answers, [fieldId]: value };
  notify();
}

export function isUnknown(fieldId) {
  return !!answers[fieldId + UNKNOWN_SUFFIX];
}

export function setUnknown(fieldId, unknown) {
  answers = { ...answers, [fieldId + UNKNOWN_SUFFIX]: unknown };
  notify();
}

export function getOwner(fieldId) {
  return answers[fieldId + OWNER_SUFFIX];
}

export function setOwner(fieldId, owner) {
  answers = { ...answers, [fieldId + OWNER_SUFFIX]: owner };
  notify();
}

export function getRows(tableId) {
  return Array.isArray(answers[tableId]) ? answers[tableId] : [];
}

export function setRows(tableId, rows) {
  answers = { ...answers, [tableId]: rows };
  notify();
}

let rowSeq = 0;
export function newRowId() {
  return `r${Date.now().toString(36)}${(rowSeq++).toString(36)}`;
}

/** Subscribe to any state change. Returns an unsubscribe function. */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  for (const fn of listeners) fn(answers);
}
