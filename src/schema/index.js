// Single entry point for the questionnaire. Nothing about the wizard UI, the
// .docx generator or the .xlsx generator should hardcode a step or field —
// they all walk STEPS from here. To add or rename a question: edit the right
// file under ./steps/, nothing else. See README.md → "Editing the
// questionnaire".

import { step0Start } from './steps/step0-start.js';
import { trackASteps } from './steps/track-a.js';
import { trackBSteps } from './steps/track-b.js';
import { sharedSteps } from './steps/shared-steps.js';
import { PROJECT_TYPES } from './constants.js';

export * from './constants.js';

// Every step still carries a Track A/B label (see track-a.js / track-b.js)
// from when clients picked "technical handover vs website content vs both"
// at step0 — that question is gone now (removed on user feedback, both
// halves always matter anyway), so both tracks are simply always on, except
// for a mail project, which has no "content" track at all: every Track B
// step's appliesTo already excludes email_new/email_migration, so nothing
// there would ever show for a mail client regardless — this just also keeps
// a mail client's own Track A steps (mailboxes, migration access, …)
// unaffected by any of that.
const MAIL_PROJECT_TYPES = [PROJECT_TYPES.EMAIL_NEW, PROJECT_TYPES.EMAIL_MIGRATION];

// Order matters: this is the order steps appear in the sidebar/progress bar.
// Track A goes first because it's usually the more time-sensitive half
// (access expires, migrations have deadlines); the shared steps land at the
// end since they only make sense once the client has already described
// what's being built.
export const STEPS = [step0Start, ...trackASteps, ...trackBSteps, ...sharedSteps];

export function getStepById(id) {
  const step = STEPS.find((s) => s.id === id);
  if (!step) throw new Error(`Unknown step id: ${id}`);
  return step;
}

/**
 * Whether `step` should appear at all for this client.
 * - Step 0 (`track: null` with no appliesTo restriction) is always visible.
 * - "unsure" project type shows everything — branching needs a known type,
 *   so until one is picked (or if the client genuinely doesn't know) we
 *   show the full form rather than guessing wrong in either direction.
 * - A mail project only ever gets Track A (see MAIL_PROJECT_TYPES above);
 *   everyone else gets both tracks — there's no longer a client-facing
 *   choice to narrow that down.
 * - `visibleWhen`, when present, is an additional runtime condition (e.g.
 *   A5b also opens if a mailbox row gets marked "migrate" even for a
 *   project type that doesn't require it by default).
 */
export function isStepVisible(step, answers) {
  const { project_type } = answers;

  const effectiveTracks = MAIL_PROJECT_TYPES.includes(project_type) ? 'A' : 'AB';
  if (step.track && !effectiveTracks.includes(step.track)) return false;

  const typeOk = !project_type || project_type === 'unsure' || step.appliesTo.includes(project_type);
  if (!typeOk) return false;

  if (typeof step.visibleWhen === 'function') return step.visibleWhen(answers);

  return true;
}

/** Whether `step` is mandatory (vs optional-but-shown) for this project type. */
export function isStepRequired(step, answers) {
  const { project_type } = answers;
  if (!project_type || project_type === 'unsure') return false;
  return step.requiredFor.includes(project_type);
}

export function isFieldVisible(f, answers) {
  if (typeof f.visibleWhen === 'function') return f.visibleWhen(answers);
  return true;
}

export function getVisibleSteps(answers) {
  return STEPS.filter((step) => isStepVisible(step, answers));
}
