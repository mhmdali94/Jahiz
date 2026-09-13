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
  const labelId = `lbl-f-${field.id}`;
  const labelRow = el('div', { class: 'field__label-row' });
  const label = el('label', { class: 'field__label', id: labelId, for: `f-${field.id}` }, [
    labelWithLatinTerm(field.labelAr, field.latinTerm),
    field.required ? el('span', { class: 'field__required', 'aria-hidden': 'true' }, ' *') : null,
  ]);
  labelRow.appendChild(label);
  wrapper.appendChild(labelRow);

  const helpId = `help-${field.id}`;
  if (field.helpAr) wrapper.appendChild(el('p', { class: 'field__help', id: helpId }, field.helpAr));

  const inputSlot = el('div', { class: 'field__input-slot' });
  wrapper.appendChild(inputSlot);

  const errorId = `err-${field.id}`;
  const errorEl = el('p', { class: 'field__error', id: errorId, role: 'alert', 'aria-live': 'polite', hidden: true });
  wrapper.appendChild(errorEl);

  const input = buildInput(field, inputSlot);
  const mainControls = input.matches?.('input,select,textarea') ? [input] : Array.from(input.querySelectorAll?.('input,select,textarea') || []);

  if (field.required) {
    for (const ctrl of mainControls) ctrl.setAttribute('aria-required', 'true');
  }
  if (field.helpAr) {
    for (const ctrl of mainControls) ctrl.setAttribute('aria-describedby', helpId);
  }

  if (input.getAttribute?.('role') === 'radiogroup' || input.classList?.contains('checkbox-group')) {
    input.setAttribute('aria-labelledby', labelId);
  }

  const describedByIds = [field.helpAr ? helpId : null, errorId].filter(Boolean).join(' ');
  wrapper._setError = (msg) => {
    if (msg) {
      errorEl.textContent = msg;
      errorEl.hidden = false;
      wrapper.classList.add('field--invalid');
      for (const ctrl of mainControls) {
        ctrl.setAttribute('aria-invalid', 'true');
        ctrl.setAttribute('aria-describedby', describedByIds);
      }
    } else {
      errorEl.hidden = true;
      wrapper.classList.remove('field--invalid');
      for (const ctrl of mainControls) {
        ctrl.removeAttribute('aria-invalid');
        ctrl.setAttribute('aria-describedby', field.helpAr ? helpId : '');
        if (!field.helpAr) ctrl.removeAttribute('aria-describedby');
      }
    }
  };

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
      dir: 'auto',
      autocomplete: 'off',
      autocorrect: spec.sensitive ? 'off' : undefined,
      spellcheck: spec.sensitive ? 'false' : undefined,
      'data-lpignore': spec.sensitive ? 'true' : undefined,
      'data-form-type': spec.sensitive ? 'other' : undefined,
      placeholder: spec.placeholder || '',
      value: current ?? '',
      'aria-label': opts.label || undefined,
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
      'aria-label': opts.label || undefined,
      oninput: (e) => onChange(e.target.value),
    });
    input.value = current ?? '';
    return input;
  }

  if (spec.type === FIELD_TYPES.SELECT && spec.multiple) {
    const group = el('div', { class: 'checkbox-group', id: domId, role: 'group', 'aria-label': opts.label || undefined });
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
      'aria-label': opts.label || undefined,
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
    let lastGroupKey;
    for (const opt of spec.options) {
      if (spec.optionGroups && opt.group !== lastGroupKey) {
        lastGroupKey = opt.group;
        if (opt.group && spec.optionGroups[opt.group]) {
          group.appendChild(el('p', { class: 'radio-group__heading' }, spec.optionGroups[opt.group]));
        }
      }
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
