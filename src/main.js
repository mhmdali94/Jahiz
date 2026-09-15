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
import { PROJECT_TYPE_LIST } from './schema/constants.js';

async function start() {
  const root = document.getElementById('app');
  const result = await authenticate();
  if (result.valid) {
    applyTokenPrefill(result.data);
    mountApp(root);
  } else if (import.meta.env.DEV && result.reason === 'missing') {
    // `npm run dev` only — skip the login speed bump when nobody bothered
    // pasting a #t= link at all, so local testing doesn't need a serial
    // issued every time. A link that IS present but invalid still shows
    // the real welcome screen + error, so that path stays testable too.
    // Vite strips this whole branch from `npm run build` output.
    mountApp(root);
  } else {
    renderWelcomeScreen(root, result.reason);
  }
}

function applyTokenPrefill(data, preselectedProjectType) {
  const prefill = { ...getAnswers() };
  if (data.clientAr) prefill.company_name_ar = data.clientAr;
  if (data.client) prefill.company_name_en = data.client;
  if (data.type) prefill.project_type = data.type;
  // A choice the client just made on the welcome screen is more current
  // than whatever type the agency guessed when issuing the link — it wins
  // if both are present. Either way it's just a prefill: still an ordinary
  // editable field once inside the wizard (a1_project_type), never a lock.
  if (preselectedProjectType) prefill.project_type = preselectedProjectType;
  if (data.tracks) prefill.tracks = data.tracks;
  // Not a real schema field — never shown as a question, never printed in
  // "all answers" tables — just carried along so generators can print it
  // (see xlsx.js banner), so a returned file says which link produced it.
  prefill.__token_id = data.id;
  replaceAnswers(prefill);
}

// Shown both on a client's very first visit (reason: 'missing', no error —
// this IS the front door) and when a link failed to verify (any other
// reason — same screen, plus a banner explaining the link didn't work,
// since the recovery action — enter the short code — is identical either way.
function renderWelcomeScreen(root, reason) {
  clear(root);
  const errorEl = el('p', { class: 'invalid-link__error', hidden: true });

  // Client-side service pick, made before login — see applyTokenPrefill.
  // Two steps: pick a service (website/mail), then the specific type within
  // it (reusing PROJECT_TYPE_LIST/PROJECT_TYPE_GROUPS, the same data the
  // wizard's own a1_project_type step uses, so there's one source of truth).
  let selectedGroup = null;
  let selectedProjectType = null;

  const servicesEl = el('div', { class: 'welcome-services' });

  function renderServicesPicker() {
    clear(servicesEl);
    servicesEl.appendChild(el('p', { class: 'welcome-services__intro' }, strings.welcome.servicesIntroAr));

    if (selectedProjectType) {
      const type = PROJECT_TYPE_LIST.find((t) => t.value === selectedProjectType);
      servicesEl.appendChild(
        el('div', { class: 'welcome-services__selected' }, [
          el('span', {}, `${strings.welcome.selectedServiceAr}: `),
          el('strong', {}, type?.ar || selectedProjectType),
          el('button', {
            type: 'button',
            class: 'link-btn',
            onclick: () => { selectedGroup = null; selectedProjectType = null; renderServicesPicker(); },
          }, strings.welcome.changeSelectionAr),
        ]),
      );
      return;
    }

    if (selectedGroup) {
      const types = PROJECT_TYPE_LIST.filter((t) => t.group === selectedGroup);
      servicesEl.appendChild(
        el('div', { class: 'welcome-services__cards' }, types.map((t) =>
          el('button', {
            type: 'button',
            class: 'service-card service-card--button',
            onclick: () => { selectedProjectType = t.value; renderServicesPicker(); },
          }, [
            el('h3', {}, [t.ar, t.latin ? el('span', { class: 'latin-term', dir: 'ltr' }, ` (${t.latin})`) : null]),
          ]),
        )),
      );
      servicesEl.appendChild(
        el('div', { class: 'welcome-services__change' }, [
          el('button', { type: 'button', class: 'link-btn', onclick: () => { selectedGroup = null; renderServicesPicker(); } }, strings.welcome.changeSelectionAr),
        ]),
      );
      return;
    }

    servicesEl.appendChild(
      el('div', { class: 'welcome-services__cards' }, strings.welcome.services.map((svc) =>
        el('button', {
          type: 'button',
          class: 'service-card service-card--button',
          onclick: () => { selectedGroup = svc.key; renderServicesPicker(); },
        }, [
          el('h3', {}, [svc.titleAr, ' ', el('span', { class: 'latin-term', dir: 'ltr' }, `(${svc.latin})`)]),
          el('p', {}, svc.descAr),
        ]),
      )),
    );
  }
  renderServicesPicker();

  const submit = async () => {
    const input = document.getElementById('shortcode-input');
    const result = await authenticateWithShortCode(input.value);
    if (result.valid) {
      applyTokenPrefill(result.data, selectedProjectType);
      clear(root);
      mountApp(root);
    } else {
      errorEl.hidden = false;
    }
  };

  const box = el('div', { class: 'welcome-screen' }, [
    el('div', { class: 'welcome-screen__brand' }, [
      el('h1', {}, [strings.app.brandAr, ' ', el('span', { class: 'latin-term', dir: 'ltr' }, strings.app.brandLatin)]),
      el('p', { class: 'welcome-screen__tagline' }, strings.welcome.taglineAr),
    ]),

    servicesEl,

    reason && reason !== 'missing'
      ? el('p', { class: 'banner--warning' }, strings.accessControl.invalidLinkAr)
      : null,

    el('div', { class: 'invalid-link welcome-login' }, [
      el('label', { for: 'shortcode-input' }, strings.welcome.loginPromptAr),
      el('div', { class: 'invalid-link__shortcode' }, [
        el('input', {
          id: 'shortcode-input',
          class: 'input',
          placeholder: strings.accessControl.shortCodePlaceholder,
          dir: 'ltr',
          onkeydown: (e) => { if (e.key === 'Enter') submit(); },
        }),
        el('button', { type: 'button', class: 'btn btn--primary', onclick: submit }, strings.welcome.submitAr),
      ]),
      errorEl,
    ]),
  ]);
  errorEl.textContent = strings.welcome.codeErrorAr;
  root.appendChild(box);
}

start();
