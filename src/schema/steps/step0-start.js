import { field, note, FIELD_TYPES } from '../constants.js';

// Step 0 is shown to everyone before track/project-type branching exists yet,
// so `appliesTo` is intentionally every type — this step is what *sets* the type.
const ALL = ['new', 'migration', 'redesign', 'email', 'unsure'];

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
    // Track selection drives which of TRACK A / TRACK B step groups render.
    // Kept structural (no owner/"لا أعرف") since it's a UI control, not data
    // being collected about the client's business.
    field('tracks', 'ماذا تريد أن تنجز في هذا النموذج؟', 'What do you want to complete?', FIELD_TYPES.RADIO, {
      allowUnknown: false,
      required: true,
      options: [
        { value: 'A', ar: 'التسليم التقني', latin: 'Technical handover', descAr: 'الوصول، البريد، الترحيل' },
        { value: 'B', ar: 'محتوى الموقع', latin: 'Website content', descAr: 'الخدمات، المنتجات، المشاريع' },
        { value: 'AB', ar: 'كلاهما', latin: 'Both', descAr: 'التسليم التقني ومحتوى الموقع معاً' },
      ],
    }),
    note('privacy_banner', 'بياناتك لا تغادر جهازك — لا يتم رفع أي معلومة إلى أي خادم', 'Your data never leaves your device — nothing is uploaded to any server.'),
  ],
};
