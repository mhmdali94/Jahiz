// Renders one schema field (everything except `table`, which table.js owns)
// into a wrapper <div class="field">. Handles the "لا أعرف" toggle + owner
// dropdown, the "؟" inline help disclosure, inline Latin technical terms,
// and visibleWhen show/hide — all generically, from data on the field.

import { el, labelWithLatinTerm } from './dom.js';
import { FIELD_TYPES, isFieldVisible } from '../schema/index.js';
import { getValue, setValue, isUnknown, setUnknown, getOwner, setOwner, getAnswers } from './state.js';
import { strings } from '../strings.js';
import { renderUploadField } from './upload.js';

const TEXT_LIKE = new Set([
  FIELD_TYPES.TEXT,
  FIELD_TYPES.EMAIL,
  FIELD_TYPES.TEL,
  FIELD_TYPES.URL,
  FIELD_TYPES.NUMBER,
  FIELD_TYPES.DATE,
]);

const HTML_INPUT_TYPE = {
  [FIELD_TYPES.TEXT]: 'text',
  [FIELD_TYPES.EMAIL]: 'email',
  [FIELD_TYPES.TEL]: 'tel',
  [FIELD_TYPES.URL]: 'url',
  [FIELD_TYPES.NUMBER]: 'number',
  [FIELD_TYPES.DATE]: 'date',
};

/**
 * @param {object} field - a schema field (see src/schema/constants.js)
 * @returns {{ el: HTMLElement, refreshVisibility: () => void }}
 */
export function renderField(field) {
  if (field.type === FIELD_TYPES.STATIC) return renderNote(field);

  const wrapper = el('div', { class: `field field--${field.type}`, dataset: { fieldId: field.id } });
  const labelRow = el('div', { class: 'field__label-row' });
  const label = el('label', { class: 'field__label', for: `f-${field.id}` }, [
    labelWithLatinTerm(field.labelAr, field.latinTerm),
    field.required ? el('span', { class: 'field__required', 'aria-hidden': 'true' }, ' *') : null,
  ]);
  labelRow.appendChild(label);
  if (field.helpAr) labelRow.appendChild(renderHelp(field.helpAr));
  wrapper.appendChild(labelRow);

  const inputSlot = el('div', { class: 'field__input-slot' });
  wrapper.appendChild(inputSlot);

  const errorEl = el('p', { class: 'field__error', hidden: true });
  wrapper.appendChild(errorEl);
  wrapper._setError = (msg) => {
    if (msg) {
      errorEl.textContent = msg;
      errorEl.hidden = false;
      wrapper.classList.add('field--invalid');
    } else {
      errorEl.hidden = true;
      wrapper.classList.remove('field--invalid');
    }
  };

  const input = buildInput(field, inputSlot);

  if (field.allowUnknown) {
    inputSlot.appendChild(buildUnknownToggle(field, input));
  }

  wrapper.refreshVisibility = () => {
    const visible = isFieldVisible(field, getAnswers());
    wrapper.hidden = !visible;
    return visible;
  };
  wrapper.refreshVisibility();

  return wrapper;
}

function renderNote(field) {
  const isWarning = /warning|flag/.test(field.id);
  const wrapper = el('div', {
    class: `note ${isWarning ? 'note--warning' : ''}`,
    dataset: { fieldId: field.id },
  });
  wrapper.appendChild(el('p', { class: 'note__title' }, field.labelAr));
  if (field.helpAr) wrapper.appendChild(el('p', { class: 'note__body' }, field.helpAr));
  wrapper.refreshVisibility = () => {
    const visible = isFieldVisible(field, getAnswers());
    wrapper.hidden = !visible;
    return visible;
  };
  wrapper.refreshVisibility();
  return wrapper;
}

function renderHelp(helpAr) {
  const details = el('details', { class: 'help' });
  details.appendChild(el('summary', { class: 'help__trigger', 'aria-label': strings.help.modalTitleAr }, strings.help.triggerLabel));
  details.appendChild(el('p', { class: 'help__body' }, helpAr));
  return details;
}

function buildInput(field, slot) {
  const control = createControl(field, getValue(field.id), (v) => setValue(field.id, v), { domId: `f-${field.id}`, name: field.id });
  slot.appendChild(control);
  return control;
}

/**
 * Pure control factory shared by fields.js (a full schema field) and
 * table.js (one cell of a repeatable row) — takes a field-shaped spec plus
 * an explicit current value / onChange, with no knowledge of where the
 * value is actually stored. `opts.domId`/`opts.name` let callers avoid id
 * collisions when the same column repeats across many rows.
 */
export function createControl(spec, current, onChange, opts = {}) {
  const domId = opts.domId || `c-${spec.id}-${Math.random().toString(36).slice(2, 8)}`;

  if (TEXT_LIKE.has(spec.type)) {
    return el('input', {
      id: domId,
      type: HTML_INPUT_TYPE[spec.type],
      class: spec.sensitive ? 'input input--sensitive' : 'input',
      // Emails/URLs/phone numbers are inherently LTR strings; letting the
      // browser pick direction per actual content (rather than inheriting
      // the page's rtl) keeps them from getting right-aligned and having
      // their start clipped in a narrow box — see table.js mailbox columns.
      dir: 'auto',
      autocomplete: 'off',
      autocorrect: spec.sensitive ? 'off' : undefined,
      spellcheck: spec.sensitive ? 'false' : undefined,
      'data-lpignore': spec.sensitive ? 'true' : undefined,
      'data-form-type': spec.sensitive ? 'other' : undefined,
      placeholder: spec.placeholder || '',
      value: current ?? '',
      oninput: (e) => onChange(e.target.value),
    });
  }

  if (spec.type === FIELD_TYPES.TEXTAREA) {
    const input = el('textarea', {
      id: domId,
      class: 'input input--textarea',
      rows: 3,
      dir: 'auto',
      autocomplete: 'off',
      placeholder: spec.placeholder || '',
      oninput: (e) => onChange(e.target.value),
    });
    input.value = current ?? '';
    return input;
  }

  if (spec.type === FIELD_TYPES.SELECT && spec.multiple) {
    const group = el('div', { class: 'checkbox-group', id: domId });
    const values = new Set(Array.isArray(current) ? current : []);
    for (const opt of spec.options) {
      const cb = el('input', {
        type: 'checkbox',
        name: opts.name,
        checked: values.has(opt.value),
        onchange: (e) => {
          const next = new Set(Array.isArray(current) ? current : []);
          if (e.target.checked) next.add(opt.value);
          else next.delete(opt.value);
          current = [...next];
          onChange(current);
        },
      });
      group.appendChild(el('label', { class: 'checkbox-group__option' }, [cb, ` ${opt.ar}`]));
    }
    return group;
  }

  if (spec.type === FIELD_TYPES.SELECT) {
    const select = el('select', {
      id: domId,
      class: 'input',
      onchange: (e) => onChange(e.target.value),
    });
    select.appendChild(el('option', { value: '' }, '— اختر —'));
    for (const opt of spec.options) {
      select.appendChild(el('option', { value: opt.value, selected: current === opt.value }, opt.ar));
    }
    return select;
  }

  if (spec.type === FIELD_TYPES.RADIO) {
    const group = el('div', { class: 'radio-group', id: domId, role: 'radiogroup' });
    for (const opt of spec.options) {
      const radio = el('input', {
        type: 'radio',
        name: opts.name || spec.id,
        value: opt.value,
        checked: current === opt.value,
        onchange: () => onChange(opt.value),
      });
      group.appendChild(
        el('label', { class: 'radio-group__option' }, [
          radio,
          el('span', { class: 'radio-group__text' }, [
            labelWithLatinTerm(opt.ar, opt.latin),
            opt.descAr ? el('small', { class: 'radio-group__desc' }, opt.descAr) : null,
          ]),
        ]),
      );
    }
    return group;
  }

  if (spec.type === FIELD_TYPES.TOGGLE) {
    const input = el('input', {
      id: domId,
      type: 'checkbox',
      checked: !!current,
      onchange: (e) => onChange(e.target.checked),
    });
    return el('label', { class: 'switch' }, [input, el('span', { class: 'switch__track' })]);
  }

  if (spec.type === FIELD_TYPES.UPLOAD) {
    const slot = el('div', { class: 'field__input-slot' });
    renderUploadField(spec, slot, opts.uploadContext);
    return slot;
  }

  // Fallback — should not happen if every field.type is one of FIELD_TYPES.
  return el('input', { id: domId, class: 'input', value: current ?? '' });
}

function buildUnknownToggle(field, mainInput) {
  const wrap = el('div', { class: 'unknown-toggle' });
  const checkbox = el('input', {
    type: 'checkbox',
    id: `f-${field.id}-unknown`,
    checked: isUnknown(field.id),
    onchange: (e) => {
      setUnknown(field.id, e.target.checked);
      setDisabled(mainInput, e.target.checked);
      ownerSelect.hidden = !e.target.checked;
    },
  });
  const label = el('label', { class: 'unknown-toggle__label', for: `f-${field.id}-unknown` }, [
    checkbox,
    ` ${strings.unknownToggle.labelAr}`,
  ]);

  const ownerSelect = el('select', {
    class: 'input input--owner',
    hidden: !isUnknown(field.id),
    'aria-label': strings.unknownToggle.ownerPromptAr,
    onchange: (e) => setOwner(field.id, e.target.value),
  });
  ownerSelect.appendChild(el('option', { value: '' }, strings.unknownToggle.ownerPromptAr));
  for (const owner of field.ownerOptions || []) {
    ownerSelect.appendChild(el('option', { value: owner.value, selected: getOwner(field.id) === owner.value }, owner.ar));
  }

  setDisabled(mainInput, isUnknown(field.id));
  wrap.appendChild(label);
  wrap.appendChild(ownerSelect);
  return wrap;
}

// `input` may be a plain <input>/<select>/<textarea>, a <label> wrapping one
// (switch), or a container <div> with several inside (radio-group,
// checkbox-group) — disable whichever actual form controls are inside.
function setDisabled(input, disabled) {
  if (!input) return;
  const controls = input.matches?.('input,select,textarea') ? [input] : input.querySelectorAll?.('input,select,textarea') || [];
  for (const control of controls) control.disabled = disabled;
  input.classList?.toggle('input--disabled', disabled);
}
