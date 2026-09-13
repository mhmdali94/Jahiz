// Turns the raw `answers` object into plain, presentation-ready data —
// resolved option labels, "لا أعرف" rows spelled out, table rows as arrays
// of formatted cells — so xlsx.js (and any future generator) never has to
// know about the schema's internal value encoding.

import { FIELD_TYPES } from '../schema/constants.js';
import { isFieldVisible } from '../schema/index.js';

function optionLabel(options, value) {
  return options?.find((o) => o.value === value)?.ar ?? value ?? '';
}

/** Resolves one raw stored value (a field's or a table column's) into display text. */
export function formatValue(spec, rawValue) {
  if (rawValue === undefined || rawValue === null || rawValue === '') return '';
  if (spec.type === FIELD_TYPES.SELECT && spec.multiple) {
    return (Array.isArray(rawValue) ? rawValue : []).map((v) => optionLabel(spec.options, v)).join('، ');
  }
  if (spec.type === FIELD_TYPES.SELECT || spec.type === FIELD_TYPES.RADIO) {
    return optionLabel(spec.options, rawValue);
  }
  if (spec.type === FIELD_TYPES.TOGGLE) return rawValue ? 'نعم' : 'لا';
  if (spec.type === FIELD_TYPES.UPLOAD) return ''; // images are handled by zip.js, not printed as text
  return String(rawValue);
}

/** One row for a simple (non-table, non-static) field — "البند / الإجابة / ملاحظات". */
export function formatFieldRow(field, answers) {
  const isUnknown = !!answers[field.id + '__unknown'];
  if (isUnknown) {
    return {
      itemAr: field.labelAr,
      itemEn: field.labelEn,
      answer: 'لا أعرف / ليس لدي',
      notes: '',
      isUnknown: true,
    };
  }
  return {
    itemAr: field.labelAr,
    itemEn: field.labelEn,
    answer: formatValue(field, answers[field.id]),
    notes: '',
    isUnknown: false,
  };
}

/** A table field's rows, each cell resolved to display text, in column order. */
export function formatTableRows(field, answers) {
  const rows = Array.isArray(answers[field.id]) ? answers[field.id] : [];
  return rows.map((row) => field.columns.map((col) => formatValue(col, row[col.id])));
}

/**
 * Splits one step's fields into printable Q&A rows and separate table
 * blocks — a sheet mixing both (e.g. "الفروع والتواصل" is 3 tables with no
 * plain fields; "معلومات إضافية" is all plain fields) reads each list
 * independently rather than trying to interleave them positionally.
 */
export function prepareStepModel(step, answers) {
  const visibleFields = step.fields.filter((f) => isFieldVisible(f, answers));
  const qnaRows = visibleFields.filter((f) => f.type !== FIELD_TYPES.TABLE && f.type !== FIELD_TYPES.STATIC).map((f) => formatFieldRow(f, answers));
  const tables = visibleFields
    .filter((f) => f.type === FIELD_TYPES.TABLE)
    .map((f) => ({
      titleAr: f.labelAr,
      titleEn: f.labelEn,
      columns: f.columns.map((c) => ({ labelAr: c.labelAr, labelEn: c.labelEn })),
      rows: formatTableRows(f, answers),
    }));
  return { qnaRows, tables };
}
