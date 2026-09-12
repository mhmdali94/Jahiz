// Top-level orchestrator: sidebar + progress bar + current step + sticky
// footer. No virtual DOM — step navigation does a full re-render of the step
// body (focus loss across steps is fine, nobody is mid-sentence when they
// click Next), but a field's own visibility toggling (visibleWhen reacting
// to a sibling field on the same step) never rebuilds the DOM, so typing
// never loses focus.

import { el, clear } from './dom.js';
import { getVisibleSteps } from '../schema/index.js';
import { getAnswers, subscribe, replaceAnswers } from './state.js';
import { renderField } from './fields.js';
import { renderTableField } from './table.js';
import { renderReviewScreen } from './review.js';
import { scheduleSave, saveNow, loadDraft, clearDraft, getLastSaved, detectPrivateMode, requestPersistentStorage } from './autosave.js';
import { strings } from '../strings.js';

const FIELD_TYPES_TABLE = 'table';

let root;
let currentStepIndex = 0; // index into getVisibleSteps(answers), recomputed each render
let showingReview = false;
let fieldNodes = []; // rendered field wrappers for the current step, for refreshVisibility()

export async function mountApp(appRoot) {
  root = appRoot;

  const draft = loadDraft();
  const isPrivate = await detectPrivateMode();

  root.appendChild(el('div', { class: 'privacy-banner' }, strings.privacyBanner.ar));

  if (isPrivate) {
    root.appendChild(el('div', { class: 'banner banner--warning' }, strings.privateMode.warningAr));
  } else {
    requestPersistentStorage();
  }

  if (draft && Object.keys(draft.answers).length) {
    renderDraftPrompt(draft);
  } else {
    startWizardShell();
    render();
  }
}

function renderDraftPrompt(draft) {
  const dateStr = draft.meta?.lastSaved ? new Date(draft.meta.lastSaved).toLocaleString('ar-SA') : '';
  const box = el('div', { class: 'draft-prompt' }, [
    el('p', {}, strings.autosave.draftFoundAr.replace('{date}', dateStr)),
    el('div', { class: 'draft-prompt__actions' }, [
      el('button', {
        class: 'btn btn--primary',
        onclick: () => {
          replaceAnswers(draft.answers);
          box.remove();
          startWizardShell();
          const visibleSteps = getVisibleSteps(getAnswers());
          const firstIncomplete = visibleSteps.findIndex((step) => stepStatus(step, getAnswers()) !== 'complete');
          currentStepIndex = firstIncomplete === -1 ? 0 : firstIncomplete;
          render();
        },
      }, strings.autosave.continueDraft),
      el('button', {
        class: 'btn btn--secondary',
        onclick: () => {
          clearDraft();
          box.remove();
          startWizardShell();
          render();
        },
      }, strings.autosave.startFresh),
    ]),
  ]);
  root.appendChild(box);
}

let sidebarEl, progressEl, stepBodyEl, footerEl, saveIndicatorEl;

function startWizardShell() {
  const layout = el('div', { class: 'wizard-layout' });
  sidebarEl = el('nav', { class: 'wizard-sidebar' });
  const main = el('div', { class: 'wizard-main' });
  progressEl = el('div', { class: 'wizard-progress' });
  stepBodyEl = el('div', { class: 'wizard-step' });
  footerEl = el('footer', { class: 'wizard-footer' });
  saveIndicatorEl = el('span', { class: 'save-indicator' });

  main.appendChild(progressEl);
  main.appendChild(stepBodyEl);
  layout.appendChild(sidebarEl);
  layout.appendChild(main);
  root.appendChild(layout);
  root.appendChild(footerEl);

  subscribe((answers) => {
    scheduleSave(answers);
    updateSaveIndicator();
    refreshFieldVisibility();
  });
}

function updateSaveIndicator() {
  saveIndicatorEl.textContent = strings.autosave.savingAr;
  clearTimeout(updateSaveIndicator._t);
  updateSaveIndicator._t = setTimeout(() => {
    const last = getLastSaved();
    saveIndicatorEl.textContent = last ? strings.autosave.lastSavedAr.replace('{date}', new Date(last).toLocaleTimeString('ar-SA')) : '';
  }, 650);
}

function refreshFieldVisibility() {
  for (const node of fieldNodes) node.refreshVisibility?.();
}

function render() {
  const answers = getAnswers();
  const visibleSteps = getVisibleSteps(answers);
  if (currentStepIndex >= visibleSteps.length) currentStepIndex = visibleSteps.length - 1;

  renderSidebar(visibleSteps, answers);

  if (showingReview) {
    clear(stepBodyEl);
    stepBodyEl.appendChild(renderReviewScreen({ onEditStep: (stepId) => jumpToStep(stepId) }));
    renderFooterForReview();
    progressEl.hidden = true;
    return;
  }
  progressEl.hidden = false;

  const step = visibleSteps[currentStepIndex];
  renderProgress(visibleSteps, currentStepIndex);
  renderStep(step, answers);
  renderFooter(visibleSteps, step, answers);
}

function renderProgress(visibleSteps, index) {
  clear(progressEl);
  const pct = visibleSteps.length ? Math.round((index / Math.max(visibleSteps.length - 1, 1)) * 100) : 0;
  progressEl.appendChild(el('div', { class: 'progress-bar' }, [el('div', { class: 'progress-bar__fill', style: `transform:scaleX(${pct / 100})` })]));
}

function renderSidebar(visibleSteps, answers) {
  clear(sidebarEl);
  const list = el('ol', { class: 'sidebar-list' });
  visibleSteps.forEach((step, index) => {
    const status = stepStatus(step, answers);
    const item = el('li', {
      class: `sidebar-list__item sidebar-list__item--${status} ${!showingReview && index === currentStepIndex ? 'is-active' : ''}`,
      onclick: () => {
        showingReview = false;
        currentStepIndex = index;
        render();
      },
    }, [
      el('span', { class: 'sidebar-list__dot' }),
      el('span', { class: 'sidebar-list__label' }, step.titleAr),
    ]);
    list.appendChild(item);
  });
  sidebarEl.appendChild(el('button', { class: 'sidebar-toggle', 'aria-label': 'القائمة' }, '☰'));
  sidebarEl.appendChild(list);
  sidebarEl.querySelector('.sidebar-toggle').addEventListener('click', () => sidebarEl.classList.toggle('is-open'));
}

function stepStatus(step, answers) {
  const dataFields = step.fields.filter((f) => f.type !== 'static');
  if (!dataFields.length) return 'complete';
  const answeredCount = dataFields.filter((f) => isFieldAnswered(f, answers)).length;
  if (answeredCount === 0) return 'untouched';
  if (answeredCount === dataFields.length) return 'complete';
  return 'partial';
}

function isFieldAnswered(field, answers) {
  if (field.type === FIELD_TYPES_TABLE) return Array.isArray(answers[field.id]) && answers[field.id].length > 0;
  const v = answers[field.id];
  if (answers[field.id + '__unknown']) return true;
  return v !== undefined && v !== '' && v !== null && !(Array.isArray(v) && v.length === 0);
}

function renderStep(step, answers) {
  clear(stepBodyEl);
  fieldNodes = [];

  stepBodyEl.appendChild(el('div', { class: 'wizard-step__header' }, [el('h1', {}, step.titleAr)]));

  if (step.optional) {
    stepBodyEl.appendChild(el('p', { class: 'wizard-step__optional-note' }, 'هذه الخطوة اختيارية بالكامل — يمكنك تخطّيها بضغطة واحدة.'));
  }

  const body = el('div', { class: 'wizard-step__body' });
  for (const field of step.fields) {
    const node = field.type === FIELD_TYPES_TABLE ? renderTableField(field) : renderField(field);
    fieldNodes.push(node);
    body.appendChild(node);
  }
  stepBodyEl.appendChild(body);
}

function renderFooter(visibleSteps, step, answers) {
  clear(footerEl);
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === visibleSteps.length - 1;

  footerEl.appendChild(saveIndicatorEl);
  const actions = el('div', { class: 'wizard-footer__actions' });
  if (!isFirst) {
    actions.appendChild(el('button', { class: 'btn btn--secondary', onclick: () => go(-1) }, strings.nav.back));
  }
  if (step.skippable) {
    actions.appendChild(el('button', { class: 'btn btn--ghost', onclick: () => go(1) }, strings.nav.skipThisStep));
  }
  actions.appendChild(
    el('button', {
      class: 'btn btn--primary',
      onclick: () => {
        if (!validateStep(step)) return;
        if (isLast) {
          showingReview = true;
          render();
        } else {
          go(1);
        }
      },
    }, isLast ? strings.nav.finish : strings.nav.next),
  );
  footerEl.appendChild(actions);
}

function renderFooterForReview() {
  clear(footerEl);
  footerEl.appendChild(saveIndicatorEl);
  const actions = el('div', { class: 'wizard-footer__actions' });
  actions.appendChild(el('button', { class: 'btn btn--secondary', onclick: () => { showingReview = false; render(); } }, strings.nav.back));
  footerEl.appendChild(actions);
}

function validateStep(step) {
  const answers = getAnswers();
  let firstInvalid = null;
  for (const node of fieldNodes) {
    const fieldId = node.dataset?.fieldId;
    const field = step.fields.find((f) => f.id === fieldId);
    if (!field || field.type === 'static' || node.hidden) continue;
    const required = field.required && !answers[field.id + '__unknown'];
    const empty = !isFieldAnswered(field, answers);
    if (required && empty) {
      node._setError?.(strings.errors.requiredFieldAr);
      if (!firstInvalid) firstInvalid = node;
    } else {
      node._setError?.(null);
    }
  }
  if (firstInvalid) {
    firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return false;
  }
  return true;
}

function go(direction) {
  saveNow(getAnswers());
  currentStepIndex += direction;
  render();
}

function jumpToStep(stepId) {
  const answers = getAnswers();
  const visibleSteps = getVisibleSteps(answers);
  const index = visibleSteps.findIndex((s) => s.id === stepId);
  if (index === -1) return;
  showingReview = false;
  currentStepIndex = index;
  render();
}
