// The "hand this to a colleague" panel — lives in the sidebar so it's
// reachable from any step, not just review. See generators/draft.js for the
// actual export/import/merge logic; this file is only the UI around it.

import { el } from './dom.js';
import { getAnswers, replaceAnswers } from './state.js';
import { saveNow, loadDraft } from './autosave.js';
import { strings } from '../strings.js';
import {
  exportLightDraft,
  exportFullDraft,
  parseDraftFile,
  summarizeAnsweredSteps,
  mergeDraftAnswers,
  importImages,
  findRowsMissingImages,
} from '../generators/draft.js';
import { triggerDownload } from '../generators/index.js';

const MISSING_IMAGES_KEY = 'jahiz:import-missing-images';
export const SKIP_DRAFT_PROMPT_KEY = 'jahiz:skip-draft-prompt-once';

export function renderDraftPanel() {
  const wrap = el('div', { class: 'draft-panel' });
  wrap.appendChild(el('h3', {}, 'مشاركة المسودة'));

  const exportRow = el('div', { class: 'draft-panel__row' });
  const lightBtn = el('button', { type: 'button', class: 'btn btn--secondary btn--small' }, strings.draft.exportLightAr);
  const fullBtn = el('button', { type: 'button', class: 'btn btn--secondary btn--small' }, strings.draft.exportFullAr);
  lightBtn.addEventListener('click', () => {
    const { blob, filename } = exportLightDraft(getAnswers());
    triggerDownload(blob, filename);
  });
  fullBtn.addEventListener('click', async () => {
    fullBtn.disabled = true;
    fullBtn.textContent = 'جارٍ التجهيز…';
    try {
      const { blob, filename } = await exportFullDraft(getAnswers());
      triggerDownload(blob, filename);
    } finally {
      fullBtn.disabled = false;
      fullBtn.textContent = strings.draft.exportFullAr;
    }
  });
  exportRow.appendChild(lightBtn);
  exportRow.appendChild(fullBtn);
  wrap.appendChild(exportRow);

  const importInput = el('input', { type: 'file', accept: '.json,.zip', hidden: true });
  const importBtn = el('button', { type: 'button', class: 'btn btn--ghost btn--small' }, strings.draft.importAr);
  importBtn.addEventListener('click', () => importInput.click());
  const mergePanel = el('div', { class: 'draft-panel__merge', hidden: true });

  importInput.addEventListener('change', async () => {
    const file = importInput.files[0];
    importInput.value = '';
    if (!file) return;

    let parsed;
    try {
      parsed = await parseDraftFile(file);
    } catch (err) {
      mergePanel.hidden = false;
      mergePanel.replaceChildren(el('p', { class: 'draft-panel__error' }, `تعذّرت قراءة الملف: ${err.message}`));
      return;
    }

    const currentFilled = summarizeAnsweredSteps(getAnswers());
    const importedFilled = summarizeAnsweredSteps(parsed.answers);
    // A fresh client's in-memory `answers` already has the token's own
    // pre-fill (company name, tracks, type) before they've typed anything —
    // that's never autosaved (no subscriber exists until the wizard shell
    // mounts), so checking the actual SAVED draft is what distinguishes
    // "genuinely fresh" from "already has real work" here.
    const savedDraft = loadDraft();
    const hasExistingWork = !!(savedDraft && Object.keys(savedDraft.answers).length);

    const applyImport = async (mode) => {
      const merged = mergeDraftAnswers(getAnswers(), parsed.answers, mode);
      replaceAnswers(merged);
      if (parsed.images.length) await importImages(parsed.images);
      saveNow(merged);

      if (parsed.kind === 'light') {
        const missing = await findRowsMissingImages(merged);
        if (missing.length) sessionStorage.setItem(MISSING_IMAGES_KEY, JSON.stringify(missing));
      }
      // The reload that follows would otherwise hit the normal "found a
      // saved draft — continue or start fresh?" prompt, which is redundant
      // right after the client just explicitly chose to import one.
      sessionStorage.setItem(SKIP_DRAFT_PROMPT_KEY, '1');
      location.reload();
    };

    if (!hasExistingWork) {
      // Nothing real to preserve yet — the token's own pre-fill (company
      // name/tracks/type) is a convenience default, not the client's work,
      // so the imported file should simply win outright here.
      await applyImport('replace');
      return;
    }

    mergePanel.hidden = false;
    mergePanel.replaceChildren(
      el('p', { class: 'draft-panel__summary' }, `الملف الوارد يحتوي ${importedFilled.size} خطوة معبأة. مسودتك الحالية تحتوي ${currentFilled.size} خطوة معبأة.`),
      el('button', { type: 'button', class: 'btn btn--primary btn--small', onclick: () => applyImport('fill_empty') }, strings.draft.importMergeFillEmptyAr),
      el('button', { type: 'button', class: 'btn btn--secondary btn--small', onclick: () => applyImport('replace') }, strings.draft.importMergeReplaceAr),
    );
  });

  wrap.appendChild(importBtn);
  wrap.appendChild(importInput);
  wrap.appendChild(mergePanel);

  return wrap;
}

/** Called once on mount — shows the "N products need photos" callout left over from a light-draft import, then clears it. */
export function renderMissingImagesBannerIfAny() {
  const raw = sessionStorage.getItem(MISSING_IMAGES_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(MISSING_IMAGES_KEY);
  let missing;
  try {
    missing = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!missing?.length) return null;

  return el('div', { class: 'banner banner--warning' }, [
    el('strong', {}, strings.draft.missingImagesAr.replace('{count}', missing.length)),
    el(
      'ul',
      {},
      missing.map((m) => el('li', {}, `${m.stepTitleAr} — صف ${m.rowIndex}${m.itemName ? ` (${m.itemName})` : ''}`)),
    ),
  ]);
}
