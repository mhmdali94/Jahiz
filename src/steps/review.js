// The review screen: readiness score + traffic lights, automatic warnings,
// the call agenda, the in-scope/out-of-scope summary, a flat list of
// "لا أعرف" items still missing, and the decision-maker group. This is
// where "kill the discovery meeting" actually cashes out — see the
// BUILT TO ELIMINATE MEETINGS section of the spec.
//
// Warning checks are heuristics over the answers shape, not a rules engine —
// each one is deliberately simple and named after the `flagsReview` id it
// answers for (see strings.js `review.warnings` for the matching text), so
// schema, wording and logic all point at the same id.

import { el } from './dom.js';
import { STEPS, getVisibleSteps, isStepRequired, isFieldVisible } from '../schema/index.js';
import { getAnswers } from './state.js';
import { strings } from '../strings.js';
import { generateAllFiles } from '../generators/index.js';
import { openPrintView } from '../generators/print.js';
import { getCurrentVersion } from '../generators/version.js';

const DAY_MS = 24 * 60 * 60 * 1000;

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return Math.round((d.getTime() - Date.now()) / DAY_MS);
}

function fmt(templateAr, vars) {
  let out = templateAr;
  for (const [key, value] of Object.entries(vars)) out = out.split(`{${key}}`).join(value);
  return out;
}

function warning(id, vars = {}, stepId) {
  const def = strings.review.warnings[id];
  if (!def) return null;
  return { id, severity: def.severity, textAr: fmt(def.ar, vars), stepId };
}

// ---------------------------------------------------------------------------
// Warnings
// ---------------------------------------------------------------------------
export function computeWarnings(answers) {
  const out = [];
  const push = (w) => w && out.push(w);

  if (answers.domain_expiry) {
    const d = daysUntil(answers.domain_expiry);
    if (d !== null && d < 30) push(warning('domain_expiring_soon', {}, 'a3_domain'));
  }

  if (answers.recent_backup !== undefined) {
    const empty = !answers.recent_backup || !answers.recent_backup.trim();
    if (empty || answers.recent_backup__unknown) push(warning('no_backup', {}, 'a4_hosting'));
  }

  if (answers.mx_current_target && answers.mail_provider_current && answers.mail_provider_target) {
    if (answers.mail_provider_current !== answers.mail_provider_target) {
      push(warning('mx_points_at_old_provider', {}, 'a5_mail_current'));
    }
  }

  const mailboxRows = Array.isArray(answers.a6_mailboxes) ? answers.a6_mailboxes : [];
  if (answers.mailbox_count_reported !== undefined && answers.mailbox_count_reported !== '' && mailboxRows.length) {
    if (Number(answers.mailbox_count_reported) !== mailboxRows.length) {
      push(warning('mailbox_count_mismatch', {}, 'a6_mailboxes'));
    }
  }

  if (answers.mail_admin_2fa === 'yes') push(warning('admin_2fa_needs_app_password', {}, 'a5_mail_current'));

  const migratingCount = mailboxRows.filter((r) => r.action === 'migrate').length;
  if (answers.migration_access_method === 'per_mailbox' && migratingCount > 0) {
    push(warning('per_mailbox_password_count', { count: migratingCount }, 'a5b_mail_migration_access'));
  }
  if (answers.staff_mailbox_2fa === 'yes' && ['per_mailbox', 'unknown'].includes(answers.migration_access_method)) {
    push(warning('staff_2fa_needs_app_passwords', {}, 'a5b_mail_migration_access'));
  }
  if (answers.migration_access_method && answers.migration_access_method !== 'admin') {
    if (answers.imap_enabled_all !== 'yes') push(warning('imap_not_enabled', {}, 'a5b_mail_migration_access'));
  }

  if (answers.old_provider_contract_end && answers.golive_date) {
    const contractEnd = new Date(answers.old_provider_contract_end).getTime();
    const golive = new Date(answers.golive_date).getTime();
    if (!Number.isNaN(contractEnd) && !Number.isNaN(golive)) {
      const daysBefore = Math.round((golive - contractEnd) / DAY_MS);
      if (daysBefore < 7) push(warning('contract_ends_before_golive', {}, 'a5b_mail_migration_access'));
    }
  }

  if (migratingCount > 0 && (!answers.total_data_size || !answers.total_data_size.trim?.())) {
    push(warning('migrate_no_size_given', {}, 'a7c_mail_migration_scope'));
  }

  const pageRows = Array.isArray(answers.page_inventory) ? answers.page_inventory : [];
  const redirectsMissingTarget = pageRows.filter((r) => ['merge', 'redirect_delete'].includes(r.decision) && !r.redirect_target?.trim?.()).length;
  if (redirectsMissingTarget > 0) push(warning('redirect_missing_target', { count: redirectsMissingTarget }, 'a7b_page_inventory'));

  if (Array.isArray(answers.logo_formats) && answers.logo_formats.includes('jpg_only')) {
    push(warning('logo_jpg_only', {}, 'a2c_brand_identity'));
  }
  if (answers.rebrand_planned === 'yes') push(warning('rebrand_planned', {}, 'a2c_brand_identity'));

  const leadershipRows = Array.isArray(answers.leadership) ? answers.leadership : [];
  const consentMissing = leadershipRows.filter((r) => r.consent_to_publish === 'no' || r.consent_to_publish === 'not_asked').length;
  if (consentMissing > 0) push(warning('leadership_consent_missing', { count: consentMissing }, 'b2_albums_leadership'));

  if (answers.has_sa_domain === 'yes' && answers.cr_available_for_sa_renewal === 'no') {
    push(warning('sa_domain_no_cr_for_renewal', {}, 'saudi_requirements'));
  }

  const credentialRows = Array.isArray(answers.credentials) ? answers.credentials : [];
  const expiringSoon = credentialRows.filter((r) => {
    const d = daysUntil(r.expiry_date_gregorian);
    return d !== null && d <= 90;
  }).length;
  if (expiringSoon > 0) push(warning('certificate_expiring_soon', { count: expiringSoon }, 'b7_credentials'));

  const formRows = Array.isArray(answers.website_forms) ? answers.website_forms : [];
  const noDestination = formRows.filter((r) => r.required === 'yes' && !r.destination_email?.trim?.() && !r.destination_whatsapp?.trim?.()).length;
  if (noDestination > 0) push(warning('form_required_no_destination', { count: noDestination }, 'b1_forms'));
  const jobFormNoAttachments = formRows.some((r) => r.form_type === 'job_application' && r.required === 'yes' && !r.attachments_allowed?.trim?.());
  if (jobFormNoAttachments) push(warning('job_form_no_attachments', {}, 'b1_forms'));

  return out;
}

// ---------------------------------------------------------------------------
// Readiness score + per-step traffic lights
// ---------------------------------------------------------------------------
function isAnswered(field, answers) {
  if (field.type === 'table') return Array.isArray(answers[field.id]) && answers[field.id].length > 0;
  if (answers[field.id + '__unknown']) return true;
  const v = answers[field.id];
  return v !== undefined && v !== '' && v !== null && !(Array.isArray(v) && v.length === 0);
}

export function computeReadiness(answers) {
  const visibleSteps = getVisibleSteps(answers);
  let totalScore = 0;
  let answeredScore = 0;
  const perStep = visibleSteps.map((step) => {
    const fields = step.fields.filter((f) => f.type !== 'static' && isFieldVisible(f, answers));
    const requiredFields = fields.filter((f) => f.required);
    // A step with no individually-required field still has an implicit bar:
    // if a required *step* has nothing filled in at all, that's the signal
    // worth surfacing, so it scores against all its fields instead of none.
    const scoringFields = requiredFields.length ? requiredFields : fields;
    const answeredCount = scoringFields.filter((f) => isAnswered(f, answers)).length;

    totalScore += scoringFields.length;
    answeredScore += answeredCount;

    const required = isStepRequired(step, answers);
    let status;
    if (!scoringFields.length) status = 'complete';
    else if (answeredCount === 0) status = required ? 'missingCritical' : 'partial';
    else if (answeredCount === scoringFields.length) status = 'complete';
    else status = 'partial';

    return { step, status };
  });

  // Same scoringFields tally drives both the percentage and the lights
  // above, so a 100% score and an all-green list always agree.
  const percent = totalScore ? Math.round((answeredScore / totalScore) * 100) : 100;
  return { percent, perStep };
}

// ---------------------------------------------------------------------------
// Scope summary — in scope vs out of scope, at the step level
// ---------------------------------------------------------------------------
export function computeScopeSummary(answers) {
  const visible = new Set(getVisibleSteps(answers).map((s) => s.id));
  const inScope = STEPS.filter((s) => visible.has(s.id)).map((s) => s.titleAr);
  const outOfScope = STEPS.filter((s) => !visible.has(s.id)).map((s) => s.titleAr);
  return { inScope, outOfScope };
}

// ---------------------------------------------------------------------------
// Missing items, decision-maker items, call agenda
// ---------------------------------------------------------------------------
function collectUnknownItems(answers) {
  const visibleSteps = getVisibleSteps(answers);
  const items = [];
  for (const step of visibleSteps) {
    for (const field of step.fields) {
      if (field.type === 'static' || !field.allowUnknown) continue;
      if (!isFieldVisible(field, answers)) continue;
      if (answers[field.id + '__unknown']) items.push({ field, step });
    }
  }
  return items;
}

export function computeMissingItems(answers) {
  return collectUnknownItems(answers);
}

export function computeDecisionMakerItems(answers) {
  const visibleSteps = getVisibleSteps(answers);
  const items = [];
  for (const step of visibleSteps) {
    for (const field of step.fields) {
      if (field.type === 'static' || field.decisionLevel !== 'decision_maker') continue;
      if (!isFieldVisible(field, answers)) continue;
      items.push({ field, step, answered: isAnswered(field, answers) });
    }
  }
  return items;
}

export function computeCallAgenda(answers, warnings) {
  const items = [];
  for (const w of warnings) {
    if (w.severity === 'note') continue;
    items.push({ textAr: w.textAr, reason: strings.callAgenda.reasons.reviewWarning });
  }
  const unansweredDecisions = computeDecisionMakerItems(answers).filter((i) => !i.answered);
  for (const item of unansweredDecisions) {
    items.push({ textAr: item.field.labelAr, reason: strings.callAgenda.reasons.needsDecisionMaker });
  }
  return { items, estimateMinutes: Math.max(5, items.length * 2) };
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
export function renderReviewScreen({ onEditStep }) {
  const answers = getAnswers();
  const warnings = computeWarnings(answers);
  const readiness = computeReadiness(answers);
  const scope = computeScopeSummary(answers);
  const missingItems = computeMissingItems(answers);
  const decisionItems = computeDecisionMakerItems(answers);
  const agenda = computeCallAgenda(answers, warnings);

  const root = el('div', { class: 'review-screen' });
  root.appendChild(el('h1', {}, strings.review.titleAr));

  root.appendChild(
    el('div', { class: 'review-score' }, [
      el('div', { class: 'review-score__ring', style: `--pct:${readiness.percent}` }, `${readiness.percent}%`),
      el('span', {}, strings.review.readinessScoreAr),
    ]),
  );

  root.appendChild(renderStepLights(readiness.perStep, onEditStep));

  if (missingItems.length) root.appendChild(renderMissingItems(missingItems));
  if (warnings.length) root.appendChild(renderWarnings(warnings, onEditStep));
  if (agenda.items.length) root.appendChild(renderCallAgenda(agenda));
  root.appendChild(renderScopeSummary(scope));
  if (decisionItems.length) root.appendChild(renderDecisionMakerGroup(decisionItems));

  const downloadArea = el('div', { class: 'download-screen', hidden: true });
  const generateBtn = el('button', { class: 'btn btn--primary btn--large' }, strings.nav.finish);
  generateBtn.addEventListener('click', async () => {
    generateBtn.disabled = true;
    generateBtn.textContent = 'جارٍ الإنشاء…';
    try {
      const result = await generateAllFiles(getAnswers());
      downloadArea.replaceChildren(renderDownloadScreen(result, getAnswers()));
      downloadArea.hidden = false;
      generateBtn.hidden = true;
    } finally {
      generateBtn.disabled = false;
      generateBtn.textContent = strings.nav.finish;
    }
  });
  root.appendChild(generateBtn);
  root.appendChild(downloadArea);

  return root;
}

function renderDownloadScreen(result, answers) {
  const wrap = el('div', { class: 'download-screen__inner' });
  wrap.appendChild(el('h2', {}, strings.generatedFiles.titleAr));
  wrap.appendChild(
    el('p', { class: 'download-screen__version' }, strings.generatedFiles.versionLabelAr.replace('{version}', result.version).replace('{date}', new Date().toLocaleString('ar-SA'))),
  );

  const files = el('div', { class: 'download-files' });

  // The ZIP goes first and bigger — clients forget the attachment, so the
  // layout has to fight that, per the spec's GENERATED FILES section.
  if (result.zip) {
    files.appendChild(
      el('div', { class: 'download-file download-file--zip' }, [
        el('strong', {}, `📦 ${result.zip.filename}`),
        el('p', {}, strings.generatedFiles.zipCalloutAr),
        el('small', {}, `${result.zip.imageCount} صورة · ${(result.zip.size / 1024 / 1024).toFixed(1)}MB`),
      ]),
    );
  }

  if (result.xlsx) {
    files.appendChild(
      el('div', { class: 'download-file' }, [
        el('strong', {}, `📊 ${result.xlsx.filename}`),
        el('p', {}, 'يحتوي كل إجاباتك، بما فيها صفحة كلمات المرور القابلة للتعبئة.'),
      ]),
    );
  } else {
    files.appendChild(el('div', { class: 'download-file download-file--error' }, strings.generatedFiles.docxFailedAr));
  }

  const pdfBtn = el('button', {
    type: 'button',
    class: 'btn btn--secondary',
    onclick: () => openPrintView(answers, getCurrentVersion()),
  }, 'فتح نافذة الطباعة (اختر "حفظ كـ PDF")');
  files.appendChild(el('div', { class: 'download-file' }, [el('strong', {}, '📄 ملخّص PDF للمراجعة'), pdfBtn]));

  wrap.appendChild(files);

  if (result.errors.length) {
    wrap.appendChild(
      el(
        'div',
        { class: 'banner banner--warning' },
        result.errors.map((e) => el('p', {}, `تعذّر إنشاء ${e.type}: باقي الملفات جاهزة ويمكنك المتابعة.`)),
      ),
    );
  }

  return wrap;
}

function renderStepLights(perStep, onEditStep) {
  const wrap = el('div', { class: 'review-lights' });
  for (const { step, status } of perStep) {
    const def = strings.review.status[status];
    wrap.appendChild(
      el('button', { class: 'review-lights__item', onclick: () => onEditStep(step.id) }, [
        el('span', { class: 'review-lights__icon' }, def.icon),
        el('span', {}, step.titleAr),
        el('span', { class: 'review-lights__edit' }, strings.nav.edit),
      ]),
    );
  }
  return wrap;
}

function renderMissingItems(items) {
  const section = el('section', { class: 'review-section review-section--missing' });
  section.appendChild(el('h2', {}, strings.missingItems.titleAr));
  section.appendChild(el('ul', {}, items.map((i) => el('li', {}, i.field.labelAr))));
  return section;
}

function renderWarnings(warnings, onEditStep) {
  const section = el('section', { class: 'review-section' });
  section.appendChild(el('h2', {}, 'تنبيهات'));
  const list = el('ul', { class: 'warnings-list' });
  for (const w of warnings) {
    list.appendChild(
      el('li', { class: `warnings-list__item warnings-list__item--${w.severity}` }, [
        el('span', {}, w.textAr),
        w.stepId ? el('button', { class: 'link-btn', onclick: () => onEditStep(w.stepId) }, strings.nav.edit) : null,
      ]),
    );
  }
  section.appendChild(list);
  return section;
}

function renderCallAgenda(agenda) {
  const section = el('section', { class: 'review-section' });
  section.appendChild(el('h2', {}, strings.callAgenda.titleAr));
  section.appendChild(el('p', { class: 'call-agenda__estimate' }, strings.callAgenda.estimateAr.replace('{count}', agenda.items.length).replace('{minutes}', agenda.estimateMinutes)));
  section.appendChild(el('ul', {}, agenda.items.map((i) => el('li', {}, [i.textAr, el('small', {}, ` — ${i.reason}`)]))));
  return section;
}

function renderScopeSummary(scope) {
  const section = el('section', { class: 'review-section review-section--scope' });
  const cols = el('div', { class: 'scope-summary' }, [
    el('div', {}, [el('h3', {}, strings.scopeSummary.inScopeTitleAr), el('ul', {}, scope.inScope.map((t) => el('li', {}, t)))]),
    el('div', {}, [el('h3', {}, strings.scopeSummary.outOfScopeTitleAr), el('ul', {}, scope.outOfScope.map((t) => el('li', {}, t)))]),
  ]);
  section.appendChild(cols);
  return section;
}

function renderDecisionMakerGroup(items) {
  const section = el('section', { class: 'review-section' });
  section.appendChild(el('h2', {}, strings.decisionMakerGroup.titleAr));
  section.appendChild(
    el('ul', {}, items.map((i) => el('li', { class: i.answered ? 'is-answered' : 'is-pending' }, i.field.labelAr))),
  );
  return section;
}
