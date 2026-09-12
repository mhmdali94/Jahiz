// Generic repeatable-rows engine for `table()` fields — the mailbox table,
// page inventory, products/services/branches, and every other list-of-rows
// screen go through this one renderer. Special-cased helpers (paste-emails,
// paste-sitemap, live counters, static pre-seeded rows) are opt-in via flags
// already present on the field in the schema, not hardcoded per table id.

import { el, labelWithLatinTerm } from './dom.js';
import { createControl } from './fields.js';
import { getRows, setRows, newRowId, getAnswers } from './state.js';
import { isFieldVisible } from '../schema/index.js';
import { strings } from '../strings.js';
import { FILE_ASSET_TYPES } from '../schema/steps/shared-steps.js';
import { CERTIFICATE_TYPES, CREDENTIAL_SERVICES } from '../schema/constants.js';

const PREFILLED_FROM = {
  CERTIFICATE_TYPES: { list: CERTIFICATE_TYPES, seedColumn: 'document_type' },
  FILE_ASSET_TYPES: { list: FILE_ASSET_TYPES, seedColumn: 'file_type' },
  CREDENTIAL_SERVICES: { list: CREDENTIAL_SERVICES, seedColumn: 'service' },
};

function emptyRow(field) {
  const row = { _rowId: newRowId() };
  for (const col of field.columns) row[col.id] = col.type === 'select' && col.multiple ? [] : '';
  return row;
}

// Seeds preset rows two ways: `prefilledOptions` points at the same option
// array a SELECT column already uses (website_forms, direct_contacts,
// social_media) — the row's value is that option's `value`. `prefilledFrom`
// names a list in PREFILLED_FROM whose seed column is plain text
// (credentials, files_assets, delegated_access_choices) — the row's value is
// the option's Arabic label. photo_albums uses `prefilledOptions` but seeds
// a text column ("name"), so falls through to the same text-label path.
function seedPrefilledRows(field) {
  const list = field.prefilledOptions || (field.prefilledFrom && PREFILLED_FROM[field.prefilledFrom]?.list);
  if (!list || !list.length) return [];

  const selectCol = field.prefilledOptions && field.columns.find((c) => c.type === 'select' && c.options === field.prefilledOptions);
  const namedCol = field.prefilledFrom && field.columns.find((c) => c.id === PREFILLED_FROM[field.prefilledFrom]?.seedColumn);
  const fallbackCol = field.columns.find((c) => c.required && (c.type === 'text' || c.type === 'textarea'));
  const targetCol = selectCol || namedCol || fallbackCol;
  if (!targetCol) return [];

  const useOptionValue = targetCol.type === 'select';
  return list.map((entry) => ({ ...emptyRow(field), [targetCol.id]: useOptionValue ? entry.value : entry.ar ?? entry.id }));
}

export function renderTableField(field) {
  const wrapper = el('div', { class: 'table-field', dataset: { fieldId: field.id } });
  wrapper.appendChild(el('h3', { class: 'table-field__title' }, labelWithLatinTerm(field.labelAr, field.latinTerm)));
  if (field.helpAr) wrapper.appendChild(el('p', { class: 'table-field__help' }, field.helpAr));

  if (getRows(field.id).length === 0) {
    const seeded = seedPrefilledRows(field);
    if (seeded.length) setRows(field.id, seeded);
  }

  if (field.pasteHelper) wrapper.appendChild(renderPasteEmailsHelper(field, () => renderRows()));
  if (field.sitemapImportHelper) wrapper.appendChild(renderSitemapHelper(field, () => renderRows()));

  const counter = field.liveCounter ? el('p', { class: 'table-field__counter' }) : null;
  if (counter) wrapper.appendChild(counter);

  const tableWrap = el('div', { class: 'table-field__scroll' });
  const table = el('table', { class: 'table-field__table' });
  table.appendChild(renderHeaderRow(field));
  const tbody = el('tbody');
  table.appendChild(tbody);
  tableWrap.appendChild(table);
  wrapper.appendChild(tableWrap);

  const addBtn = el('button', { type: 'button', class: 'btn btn--secondary' }, `+ ${strings.nav.addRow}`);
  addBtn.addEventListener('click', () => {
    setRows(field.id, [...getRows(field.id), emptyRow(field)]);
    renderRows();
  });
  wrapper.appendChild(addBtn);

  function updateCounter() {
    if (!counter) return;
    counter.textContent = summarize(field, getRows(field.id));
  }

  function renderRows() {
    tbody.replaceChildren();
    const rows = getRows(field.id);
    rows.forEach((row, index) => tbody.appendChild(renderRow(field, row, index, renderRows)));
    updateCounter();
  }

  renderRows();

  wrapper.refreshVisibility = () => {
    const visible = isFieldVisible(field, getAnswers());
    wrapper.hidden = !visible;
    return visible;
  };
  wrapper.refreshVisibility();
  wrapper._renderRows = renderRows; // exposed for autoRows sync (see passwords step wiring in wizard.js)

  return wrapper;
}

function renderHeaderRow(field) {
  const thead = el('thead');
  const tr = el('tr');
  for (const col of field.columns) tr.appendChild(el('th', {}, labelWithLatinTerm(col.labelAr, col.latinTerm)));
  tr.appendChild(el('th', { class: 'table-field__actions-col' }, ''));
  thead.appendChild(tr);
  return thead;
}

function renderRow(field, row, index, rerender) {
  const tr = el('tr', { dataset: { rowId: row._rowId } });
  for (const col of field.columns) {
    const td = el('td', {});
    if (!isFieldVisible(col, { ...getAnswers(), ...row })) {
      td.appendChild(el('span', { class: 'table-field__cell-hidden' }, '—'));
      tr.appendChild(td);
      continue;
    }
    const control = createControl(col, row[col.id], (value) => {
      const rows = getRows(field.id);
      rows[index] = { ...rows[index], [col.id]: value };
      setRows(field.id, rows);
    });
    td.appendChild(control);
    tr.appendChild(td);
  }

  const actions = el('td', { class: 'table-field__actions' }, [
    el('button', {
      type: 'button',
      class: 'icon-btn',
      title: strings.nav.duplicateRow,
      onclick: () => {
        const rows = getRows(field.id);
        rows.splice(index + 1, 0, { ...row, _rowId: newRowId() });
        setRows(field.id, rows);
        rerender();
      },
    }, '⧉'),
    el('button', {
      type: 'button',
      class: 'icon-btn icon-btn--danger',
      title: strings.nav.deleteRow,
      onclick: () => {
        const rows = getRows(field.id);
        rows.splice(index, 1);
        setRows(field.id, rows);
        rerender();
      },
    }, '×'),
  ]);
  tr.appendChild(actions);
  return tr;
}

function renderPasteEmailsHelper(field, rerender) {
  const textarea = el('textarea', { class: 'input input--textarea', rows: 2, placeholder: strings.mailboxTable.pasteLabelAr });
  const btn = el('button', { type: 'button', class: 'btn btn--secondary' }, strings.mailboxTable.pasteLabelAr);
  btn.addEventListener('click', () => {
    const emails = textarea.value.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!emails.length) return;
    const rows = [...getRows(field.id), ...emails.map((email) => ({ ...emptyRow(field), email }))];
    setRows(field.id, rows);
    textarea.value = '';
    rerender();
  });
  return el('div', { class: 'paste-helper' }, [textarea, btn]);
}

function renderSitemapHelper(field, rerender) {
  const textarea = el('textarea', { class: 'input input--textarea', rows: 3, placeholder: strings.pageInventory.sitemapPasteLabelAr });
  const btn = el('button', { type: 'button', class: 'btn btn--secondary' }, strings.pageInventory.sitemapPasteLabelAr);
  btn.addEventListener('click', () => {
    const urls = parsePastedUrls(textarea.value);
    if (!urls.length) return;
    const rows = [...getRows(field.id), ...urls.map((page_url) => ({ ...emptyRow(field), page_url }))];
    setRows(field.id, rows);
    textarea.value = '';
    rerender();
  });
  return el('div', { class: 'paste-helper' }, [textarea, btn]);
}

/** Parses either raw sitemap.xml content or a plain one-URL-per-line list. Never fetches anything — pasted text only. */
export function parsePastedUrls(text) {
  if (!text || !text.trim()) return [];
  const locMatches = [...text.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1]);
  if (locMatches.length) return locMatches;
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && /^https?:\/\//i.test(l));
}

function summarize(field, rows) {
  if (field.id === 'a6_mailboxes') {
    const created = rows.filter((r) => r.action === 'create').length;
    const migrated = rows.filter((r) => r.action === 'migrate').length;
    const deleted = rows.filter((r) => r.action === 'delete').length;
    return strings.mailboxTable.counterAr
      .replace('{total}', rows.length)
      .replace('{created}', created)
      .replace('{migrated}', migrated)
      .replace('{deleted}', deleted);
  }
  if (field.id === 'page_inventory') {
    const keep = rows.filter((r) => r.decision === 'keep' || r.decision === 'keep_update').length;
    const merge = rows.filter((r) => r.decision === 'merge' || r.decision === 'redirect_delete').length;
    const del = rows.filter((r) => r.decision === 'delete').length;
    return strings.pageInventory.counterAr
      .replace('{total}', rows.length)
      .replace('{keep}', keep)
      .replace('{merge}', merge)
      .replace('{del}', del);
  }
  return `${rows.length} صف`;
}
