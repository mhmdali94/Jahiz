// Top-level orchestrator: sidebar + progress bar + current step + sticky
// footer. No virtual DOM — step navigation does a full re-render of the step
// body (focus loss across steps is fine, nobody is mid-sentence when they
// click Next), but a field's own visibility toggling (visibleWhen reacting
// to a sibling field on the same step) never rebuilds the DOM, so typing
// never loses focus.

import { el, clear } from './dom.js';
import { getVisibleSteps } from '../schema/index.js';
import { groupStepsByChapter } from '../schema/chapters.js';
import { getAnswers, subscribe, replaceAnswers } from './state.js';
import { renderField } from './fields.js';
import { renderTableField } from './table.js';
import { renderReviewScreen } from './review.js';
import { scheduleSave, saveNow, loadDraft, clearDraft, getLastSaved, detectPrivateMode, requestPersistentStorage } from './autosave.js';
import { renderDraftPanel, renderMissingImagesBannerIfAny, SKIP_DRAFT_PROMPT_KEY } from './draftPanel.js';
import { logout } from '../auth.js';
import { strings } from '../strings.js';

const FIELD_TYPES_TABLE = 'table';

let root;
let currentStepIndex = 0; // index into getVisibleSteps(answers), recomputed each render
let showingReview = false;
// project_type can already be decided before the wizard ever starts — a link
// issued with --type, or the client's own pick on the welcome screen — in
// which case landing on a1_project_type to ask it again reads as a bug, not
// a confirmation. Auto-skip past it the first time forward navigation would
// land there with an answer already in place; it stays reachable afterward
// (sidebar, Back) for anyone who wants to change their mind — this only
// affects the one automatic first pass, never removes the step itself.
let skippedProjectTypeStep = false;
let fieldNodes = []; // rendered field wrappers for the current step, for refreshVisibility()
let expandedChapters = new Set(); // chapter ids the client opened by hand — the active chapter is always shown regardless

export async function mountApp(appRoot) {
  root = appRoot;

  const draft = loadDraft();
  const isPrivate = await detectPrivateMode();

  root.appendChild(el('a', { href: '#main-content', class: 'skip-link' }, 'تخطي إلى المحتوى الرئيسي'));
  root.appendChild(el('div', { class: 'privacy-banner' }, strings.privacyBanner.ar));

  if (isPrivate) {
    root.appendChild(el('div', { class: 'banner banner--warning' }, strings.privateMode.warningAr));
  } else {
    requestPersistentStorage();
  }

  const skipPrompt = sessionStorage.getItem(SKIP_DRAFT_PROMPT_KEY);
  if (skipPrompt) sessionStorage.removeItem(SKIP_DRAFT_PROMPT_KEY);

  if (draft && Object.keys(draft.answers).length) {
    if (skipPrompt) {
      // The client just explicitly imported this draft (see draftPanel.js)
      // — asking "continue where you left off?" right after would be a
      // redundant, confusing second prompt for the same action.
      continueWithDraft(draft);
    } else {
      renderDraftPrompt(draft);
    }
  } else {
    startWizardShell();
    render();
  }
}

function continueWithDraft(draft) {
  replaceAnswers(draft.answers);
  startWizardShell();
  const visibleSteps = getVisibleSteps(getAnswers());
  const firstIncomplete = visibleSteps.findIndex((step) => stepStatus(step, getAnswers()) !== 'complete');
  currentStepIndex = firstIncomplete === -1 ? 0 : firstIncomplete;
  render();
}

function renderDraftPrompt(draft) {
  const dateStr = draft.meta?.lastSaved ? new Date(draft.meta.lastSaved).toLocaleString('ar-SA') : '';
  const box = el('div', { class: 'draft-prompt' }, [
    el('p', {}, strings.autosave.draftFoundAr.replace('{date}', dateStr)),
    el('div', { class: 'draft-prompt__actions' }, [
      el('button', {
        class: 'btn btn--primary',
        onclick: () => {
          box.remove();
          continueWithDraft(draft);
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
  sidebarEl = el('nav', { class: 'wizard-sidebar', 'aria-label': 'مراحل النموذج' });
  const main = el('main', { class: 'wizard-main', id: 'main-content', tabindex: '-1' });
  progressEl = el('div', { class: 'wizard-progress' });
  stepBodyEl = el('div', { class: 'wizard-step' });
  footerEl = el('footer', { class: 'wizard-footer' });
  saveIndicatorEl = el('span', { class: 'save-indicator', role: 'status', 'aria-live': 'polite' });

  const missingImagesBanner = renderMissingImagesBannerIfAny();
  if (missingImagesBanner) root.appendChild(missingImagesBanner);

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
  progressEl.appendChild(el('div', {
    class: 'progress-bar',
    role: 'progressbar',
    'aria-valuenow': pct,
    'aria-valuemin': '0',
    'aria-valuemax': '100',
    'aria-label': 'نسبة إنجاز النموذج',
  }, [el('div', { class: 'progress-bar__fill', style: `transform:scaleX(${pct / 100})` })]));
}

const STATUS_LABELS = {
  untouched: 'غير مبدوء',
  partial: 'مكتمل جزئياً',
  complete: 'مكتمل',
};

// A flat 20+ step list read as "this is huge" before a non-technical client
// had even started — grouping into a handful of named, collapsible
// chapters means they only ever see ~8 lines at once. Only the chapter
// holding the current step is forced open; anything the client opened by
// hand stays open across re-renders too.
function renderSidebar(visibleSteps, answers) {
  clear(sidebarEl);
  const chapterGroups = groupStepsByChapter(visibleSteps);
  const activeStepId = !showingReview ? visibleSteps[currentStepIndex]?.id : null;

  const chaptersEl = el('div', { class: 'sidebar-chapters' });
  for (const { chapter, steps } of chapterGroups) {
    const isActiveChapter = steps.some(({ step }) => step.id === activeStepId);
    const isExpanded = isActiveChapter || expandedChapters.has(chapter.id);
    const completeCount = steps.filter(({ step }) => stepStatus(step, answers) === 'complete').length;
    const panelId = `chapter-panel-${chapter.id}`;

    const list = el('ol', { class: 'sidebar-list', id: panelId, hidden: !isExpanded });
    steps.forEach(({ step, index }) => {
      const status = stepStatus(step, answers);
      const isActive = step.id === activeStepId;
      const btn = el('button', {
        type: 'button',
        class: `sidebar-list__button ${isActive ? 'is-active' : ''}`,
        'aria-current': isActive ? 'step' : undefined,
        'aria-label': `${step.titleAr} (${STATUS_LABELS[status] || status})`,
        onclick: () => {
          showingReview = false;
          currentStepIndex = index;
          sidebarEl.classList.remove('is-open');
          render();
          focusStepHeader();
        },
      }, [
        el('span', { class: 'sidebar-list__dot', 'aria-hidden': 'true' }),
        el('span', { class: 'sidebar-list__label' }, step.titleAr),
      ]);
      list.appendChild(el('li', { class: `sidebar-list__item sidebar-list__item--${status} ${isActive ? 'is-active' : ''}` }, [btn]));
    });

    const headerBtn = el('button', {
      type: 'button',
      class: `sidebar-chapter__header ${isActiveChapter ? 'is-active' : ''}`,
      'aria-expanded': String(isExpanded),
      'aria-controls': panelId,
      onclick: () => {
        if (expandedChapters.has(chapter.id)) expandedChapters.delete(chapter.id);
        else expandedChapters.add(chapter.id);
        render();
      },
    }, [
      el('span', { class: 'sidebar-chapter__chevron', 'aria-hidden': 'true' }, isExpanded ? '▾' : '◂'),
      el('span', { class: 'sidebar-chapter__title' }, chapter.titleAr),
      el('span', { class: 'sidebar-chapter__meta' }, `${completeCount}/${steps.length}`),
    ]);

    chaptersEl.appendChild(el('section', { class: 'sidebar-chapter' }, [headerBtn, list]));
  }

  // Toggle + chapters are wrapped separately from the draft panel so mobile
  // can stick just the nav (small, always needs to be reachable) without
  // pinning the draft-export panel to the screen too (see .sidebar-sticky).
  const stickyNav = el('div', { class: 'sidebar-sticky' }, [
    el('button', { class: 'sidebar-toggle', 'aria-label': 'القائمة' }, '☰'),
    chaptersEl,
  ]);
  sidebarEl.appendChild(stickyNav);
  sidebarEl.appendChild(renderDraftPanel());
  sidebarEl.appendChild(renderLogoutPanel());
  sidebarEl.querySelector('.sidebar-toggle').addEventListener('click', () => sidebarEl.classList.toggle('is-open'));
}

// Ends the session (clears the saved token + the URL's #t=, see auth.js) and
// reloads to the welcome screen. Doesn't touch the saved draft — that's a
// separate, session-independent thing (see autosave.js) — logging back in
// with the same link/code picks the draft right back up, same as reopening
// the tab normally would.
function renderLogoutPanel() {
  return el('div', { class: 'logout-panel' }, [
    el('button', { type: 'button', class: 'btn btn--secondary btn--small', onclick: () => { logout(); location.reload(); } }, strings.accessControl.logoutAr),
    el('p', { class: 'logout-panel__help' }, strings.accessControl.logoutHelpAr),
  ]);
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

  stepBodyEl.appendChild(el('div', { class: 'wizard-step__header' }, [
    el('h1', { tabindex: '-1', class: 'wizard-step__title' }, step.titleAr),
  ]));

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

function focusStepHeader() {
  requestAnimationFrame(() => {
    const heading = stepBodyEl.querySelector('h1');
    if (!heading) return;
    // Moving between steps used to leave the page at whatever scroll
    // position the previous (possibly long) step ended on, so Next/Back
    // could land you mid-page on a step you hadn't scrolled to yet.
    // Drive the scroll ourselves (element.focus() alone won't always do
    // this consistently across browsers) then focus without re-triggering it.
    heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
    heading.focus({ preventScroll: true });
  });
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
          focusStepHeader();
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
  actions.appendChild(el('button', { class: 'btn btn--secondary', onclick: () => { showingReview = false; render(); focusStepHeader(); } }, strings.nav.back));
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
    const inputToFocus = firstInvalid.querySelector('input,select,textarea');
    if (inputToFocus) inputToFocus.focus();
    return false;
  }
  return true;
}

function go(direction) {
  saveNow(getAnswers());
  currentStepIndex += direction;
  if (direction === 1) maybeAutoSkipProjectTypeStep();
  render();
  focusStepHeader();
}

function maybeAutoSkipProjectTypeStep() {
  if (skippedProjectTypeStep) return;
  const answers = getAnswers();
  const visibleSteps = getVisibleSteps(answers);
  const step = visibleSteps[currentStepIndex];
  if (!step || step.id !== 'a1_project_type') return;
  if (answers.project_type && answers.project_type !== 'unsure') {
    currentStepIndex += 1;
    skippedProjectTypeStep = true;
  }
}

function jumpToStep(stepId) {
  const answers = getAnswers();
  const visibleSteps = getVisibleSteps(answers);
  const index = visibleSteps.findIndex((s) => s.id === stepId);
  if (index === -1) return;
  showingReview = false;
  currentStepIndex = index;
  render();
  focusStepHeader();
}
