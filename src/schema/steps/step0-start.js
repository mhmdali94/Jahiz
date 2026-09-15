import { field, note, FIELD_TYPES } from '../constants.js';

// Step 0 is shown to everyone before track/project-type branching exists yet,
// so `appliesTo` is intentionally every type — this step is what *sets* the type.
const ALL = ['new', 'migration', 'redesign', 'email_new', 'email_migration', 'unsure'];

export const step0Start = {
  id: 'step0_start',
  track: null,
  titleAr: 'البداية',
  titleEn: 'Start',
  appliesTo: ALL,
  requiredFor: ALL,
  fields: [
    field('company_name_ar', 'اسم الشركة (عربي)', 'Company name (AR)', FIELD_TYPES.TEXT, {
      required: true,
      allowUnknown: false,
    }),
    field('company_name_en', 'اسم الشركة (إنجليزي)', 'Company name (EN)', FIELD_TYPES.TEXT, {
      allowUnknown: false,
    }),
    field('contact_person', 'الشخص المسؤول عن التواصل', 'Contact person', FIELD_TYPES.TEXT, {
      required: true,
      allowUnknown: false,
    }),
    field('contact_email', 'البريد الإلكتروني', 'Email', FIELD_TYPES.EMAIL, {
      required: true,
      allowUnknown: false,
    }),
    field('contact_phone', 'رقم الجوال', 'Phone', FIELD_TYPES.TEL, {
      required: true,
      allowUnknown: false,
      helpAr: 'يُكتب بصيغة +966 5X XXX XXXX.',
    }),
    field('project_deadline', 'الموعد النهائي المطلوب للمشروع', 'Project deadline', FIELD_TYPES.DATE, {
      allowUnknown: false,
    }),
    // A "technical handover vs website content vs both" scoping question
    // used to live here — removed on user feedback: it read as one more
    // redundant question after the welcome-screen service picker, and in
    // practice everyone just needs both halves shown anyway. Both tracks
    // always show now regardless of project type (see isStepVisible in
    // schema/index.js) — a mail project already only ever surfaces its own
    // relevant steps since Track B's appliesTo excludes mail types outright.
    note('privacy_banner', 'بياناتك لا تغادر جهازك — لا يتم رفع أي معلومة إلى أي خادم', 'Your data never leaves your device — nothing is uploaded to any server.'),
  ],
};
