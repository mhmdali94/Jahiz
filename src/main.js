// Entry point. Gates the wizard behind a signed client link (see auth.js) —
// deliberately a speed bump, not real security, per the ACCESS CONTROL
// section of the spec: a static site with no server can't do better, and
// there's nothing here worth a determined bypass anyway.

import '@fontsource/cairo/400.css';
import '@fontsource/cairo/600.css';
import '@fontsource/cairo/700.css';
import './styles/main.css';
import { mountApp } from './steps/wizard.js';
import { authenticate, authenticateWithShortCode } from './auth.js';
import { replaceAnswers, getAnswers } from './steps/state.js';
import { el, clear } from './steps/dom.js';
import { strings } from './strings.js';

async function start() {
  const root = document.getElementById('app');
  const result = await authenticate();
  if (result.valid) {
    applyTokenPrefill(result.data);
    mountApp(root);
  } else {
    renderInvalidLinkScreen(root);
  }
}

function applyTokenPrefill(data) {
  const prefill = { ...getAnswers() };
  if (data.clientAr) prefill.company_name_ar = data.clientAr;
  if (data.client) prefill.company_name_en = data.client;
  if (data.type) prefill.project_type = data.type;
  if (data.tracks) prefill.tracks = data.tracks;
  // Not a real schema field — never shown as a question, never printed in
  // "all answers" tables — just carried along so generators can print it
  // (see xlsx.js banner), so a returned file says which link produced it.
  prefill.__token_id = data.id;
  replaceAnswers(prefill);
}

function renderInvalidLinkScreen(root) {
  clear(root);
  const errorEl = el('p', { class: 'invalid-link__error', hidden: true });

  const box = el('div', { class: 'invalid-link' }, [
    el('h1', {}, 'رابط غير صالح'),
    el('p', {}, strings.accessControl.invalidLinkAr),
    el('div', { class: 'invalid-link__shortcode' }, [
      el('label', { for: 'shortcode-input' }, strings.accessControl.shortCodeLabelAr),
      el('input', { id: 'shortcode-input', class: 'input', placeholder: strings.accessControl.shortCodePlaceholder, dir: 'ltr' }),
      el('button', {
        type: 'button',
        class: 'btn btn--primary',
        onclick: async () => {
          const input = document.getElementById('shortcode-input');
          const result = await authenticateWithShortCode(input.value);
          if (result.valid) {
            applyTokenPrefill(result.data);
            mountApp(root);
          } else {
            errorEl.hidden = false;
          }
        },
      }, 'دخول'),
    ]),
    errorEl,
  ]);
  errorEl.textContent = 'الرمز غير صحيح. تأكد من كتابته كما وصلك تماماً.';
  root.appendChild(box);
}

start();
