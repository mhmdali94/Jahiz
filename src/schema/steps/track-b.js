// TRACK B — محتوى الموقع (Website content)
// Per B0b in the spec: the client only ever types Arabic here — we translate
// on our side — so content-answer fields have no "_en" counterpart. Field
// `labelEn` still exists (it's what prints as the English half of the
// bilingual column header in the generated .docx/.xlsx), it's just never a
// second input box.

import {
  field,
  table,
  column,
  note,
  FIELD_TYPES,
  YES_NO,
  YES_NO_LATER,
  FORM_TYPES,
  ALBUM_PRESETS,
  CONSENT_OPTIONS,
  SOCIAL_PLATFORMS,
  DEPARTMENT_ROLES,
  LANGUAGE_SCOPE,
  uploadSlot,
} from '../constants.js';

const ARABIC_ONLY_NOTE = note(
  'arabic_only_note',
  'اكتب بالعربية فقط — الترجمة الإنجليزية نتولّاها نحن.',
  'Enter Arabic only — we handle the translation.',
);

// ---------------------------------------------------------------------------
// B0 — الظهور في محركات البحث (Search engine visibility)
// A real branch, not a formality: a "no" ships noindex + no sitemap.
// ---------------------------------------------------------------------------
export const stepB0Seo = {
  id: 'b0_seo',
  track: 'B',
  titleAr: 'الظهور في محركات البحث',
  titleEn: 'Search engine visibility',
  appliesTo: ['new', 'migration', 'redesign'],
  requiredFor: ['new', 'redesign'],
  fields: [
    field('wants_google_indexing', 'هل تريدون ظهور الموقع في نتائج بحث جوجل؟', 'Should the site appear in Google search results?', FIELD_TYPES.RADIO, {
      required: true,
      allowUnknown: false,
      options: YES_NO,
      decisionLevel: 'decision_maker',
      helpAr: '«لا» تعني موقعاً داخلياً أو خاصاً أو لأعضاء فقط — والبناء يختلف: الموقع يصدر بوسم noindex وبدون sitemap.',
    }),
    field('pages_excluded_from_search', 'أي صفحات يجب ألا تظهر في نتائج البحث؟', 'Any pages that must not appear in search results?', FIELD_TYPES.TEXTAREA, {
      visibleWhen: (a) => a.wants_google_indexing === 'yes',
    }),
    field('target_keywords', 'أهم الكلمات أو العبارات التي تريدون الظهور بها', 'Key terms or phrases you want to rank for', FIELD_TYPES.TEXTAREA, {
      visibleWhen: (a) => a.wants_google_indexing === 'yes',
    }),
    field('search_result_description', 'وصف مختصر للشركة يظهر أسفل اسمكم في نتائج البحث (سطران)', 'Short company description shown in search results', FIELD_TYPES.TEXTAREA, {
      visibleWhen: (a) => a.wants_google_indexing === 'yes',
    }),
    field('on_google_maps', 'هل نشاطكم مسجّل في خرائط جوجل؟ وهل البيانات محدثة؟', 'Is the business on Google Maps, and is the data current?', FIELD_TYPES.TEXT, {
      visibleWhen: (a) => a.wants_google_indexing === 'yes',
    }),
    field('search_console_account', 'هل يوجد حساب Google Search Console؟ وبأي بريد؟', 'Is there a Google Search Console account? Under which email?', FIELD_TYPES.TEXT, {
      latinTerm: 'Search Console',
      visibleWhen: (a) => a.wants_google_indexing === 'yes',
    }),
  ],
};

// ---------------------------------------------------------------------------
// B0b — لغات الموقع (Website languages)
// ---------------------------------------------------------------------------
export const stepB0bLanguages = {
  id: 'b0b_languages',
  track: 'B',
  titleAr: 'لغات الموقع',
  titleEn: 'Website languages',
  appliesTo: ['new', 'migration', 'redesign'],
  requiredFor: ['new', 'redesign'],
  fields: [
    ARABIC_ONLY_NOTE,
    field('languages_required', 'اللغات المطلوبة', 'Languages required', FIELD_TYPES.RADIO, {
      required: true,
      allowUnknown: false,
      options: LANGUAGE_SCOPE,
    }),
    field('translation_scope', 'الترجمة: كاملة أم للصفحات الرئيسية فقط؟', 'Full translation, or main pages only?', FIELD_TYPES.RADIO, {
      options: [{ value: 'full', ar: 'ترجمة كاملة' }, { value: 'main_pages', ar: 'الصفحات الرئيسية فقط' }],
      visibleWhen: (a) => a.languages_required && a.languages_required !== 'ar_only',
    }),
    field('url_structure', 'بنية الروابط', 'URL structure', FIELD_TYPES.RADIO, {
      options: [
        { value: 'subdomain', ar: 'نطاق فرعي', latin: 'en.site.com' },
        { value: 'path', ar: 'مسار', latin: 'site.com/en' },
      ],
      visibleWhen: (a) => a.languages_required && a.languages_required !== 'ar_only',
    }),
    field('default_language', 'أي لغة تظهر افتراضياً للزائر الجديد؟', 'Which language loads by default?', FIELD_TYPES.TEXT, {
      visibleWhen: (a) => a.languages_required && a.languages_required !== 'ar_only',
    }),
    field('forms_every_language', 'هل نماذج التواصل ورسائل البريد التلقائية مطلوبة بكل اللغات؟', 'Contact forms and automated emails in every language?', FIELD_TYPES.RADIO, {
      options: YES_NO,
      visibleWhen: (a) => a.languages_required && a.languages_required !== 'ar_only',
    }),
    field('seo_every_language', 'هل تحسين محركات البحث (SEO) مطلوب بكل اللغات؟', 'SEO required in every language?', FIELD_TYPES.RADIO, {
      options: YES_NO,
      latinTerm: 'SEO',
      visibleWhen: (a) => a.languages_required && a.languages_required !== 'ar_only',
    }),
    // No online store / CMS dashboard question here — this build delivers
    // static pages only, no backend or admin panel, so neither is ever on
    // offer regardless of what the client answers.
  ],
};

// ---------------------------------------------------------------------------
// B1 — نماذج الموقع ووجهة الرسائل (Website forms & destinations)
// ---------------------------------------------------------------------------
export const stepB1Forms = {
  id: 'b1_forms',
  track: 'B',
  titleAr: 'نماذج الموقع ووجهة الرسائل',
  titleEn: 'Website forms & destinations',
  appliesTo: ['new', 'migration', 'redesign'],
  requiredFor: ['new', 'redesign'],
  fields: [
    table(
      'website_forms',
      'جدول نماذج الموقع',
      'Website forms table',
      [
        column('form_type', 'اسم النموذج', 'Form', FIELD_TYPES.SELECT, { options: FORM_TYPES, required: true }),
        column('required', 'مطلوب؟', 'Required?', FIELD_TYPES.SELECT, { options: YES_NO_LATER, default: 'no' }),
        column('fields_needed', 'الحقول المطلوبة', 'Fields required', FIELD_TYPES.TEXTAREA),
        column('destination_email', 'يُرسل إلى بريد', 'Destination email', FIELD_TYPES.EMAIL, {
          flagsReview: 'form_required_no_destination',
        }),
        column('destination_whatsapp', 'يُرسل إلى واتساب', 'Destination WhatsApp number', FIELD_TYPES.TEL),
        column('attachments_allowed', 'مرفقات؟', 'Attachments allowed and which types', FIELD_TYPES.TEXT, {
          flagsReview: 'job_form_no_attachments',
        }),
        column('auto_reply', 'رد تلقائي للعميل؟', 'Auto-reply to the sender?', FIELD_TYPES.RADIO, { options: YES_NO }),
      ],
      {
        prefilledOptions: FORM_TYPES,
        helpAr: 'كل نموذج يمكن أن تصل رسائله لعنوان مختلف — طلبات التوظيف إلى hr@ وعروض الأسعار إلى sales@ مثلاً. البريد والواتساب ليسا حصريين، يمكن أن يصل النموذج للاثنين معاً.',
      },
    ),
    note('whatsapp_explainer', 'ملاحظة عن الواتساب', 'A note about WhatsApp', {
      helpAr: 'على موقع عادي، "الإرسال إلى واتساب" هو رابط wa.me يفتح واتساب برسالة جاهزة، ويبقى على المرسل الضغط على إرسال. أي شيء آلي بالكامل يحتاج WhatsApp Business API وحساباً منفصلاً.',
    }),

    note('general_form_settings_group', 'إعدادات عامة للنماذج', 'General form settings'),
    field('forms_receiving_whatsapp', 'رقم الواتساب المستقبِل للرسائل', 'Receiving WhatsApp number', FIELD_TYPES.TEL),
    field('forms_copy_to_emails', 'هل تريد وصول نسخة لأكثر من بريد؟', 'Should copies go to more than one email?', FIELD_TYPES.TEXTAREA),
    field('thank_you_text', 'نص رسالة الشكر بعد الإرسال', 'Thank-you text shown after submitting', FIELD_TYPES.TEXTAREA),
    field('auto_reply_text', 'نص الرد التلقائي الذي يصل العميل', 'Auto-reply text the sender receives', FIELD_TYPES.TEXTAREA),
    field('spam_protection', 'هل تريد حماية من الرسائل المزعجة؟', 'Spam protection (reCAPTCHA / hCaptcha)?', FIELD_TYPES.RADIO, {
      options: YES_NO,
      latinTerm: 'reCAPTCHA / hCaptcha',
    }),
    field('pdpl_consent_checkbox', 'موافقة على سياسة الخصوصية قبل الإرسال؟', 'A consent checkbox before submitting, for PDPL', FIELD_TYPES.RADIO, {
      options: YES_NO,
      latinTerm: 'PDPL',
    }),
    // No "store in a dashboard" option — static pages only, no backend to
    // hold a submissions dashboard. Email/WhatsApp are the only delivery
    // paths, already covered above.
    field('crm_integration', 'هل يوجد ربط مطلوب مع نظام CRM؟', 'Any CRM integration?', FIELD_TYPES.TEXT, { latinTerm: 'CRM' }),
    field('wants_careers_page', 'هل تريد صفحة وظائف شاغرة تُحدَّث باستمرار؟', 'Do they want a careers page they can update themselves?', FIELD_TYPES.RADIO, { options: YES_NO }),
  ],
};

// ---------------------------------------------------------------------------
// B2 — الألبومات والفريق (Photo albums and leadership) — optional, say so.
// ---------------------------------------------------------------------------
export const stepB2AlbumsLeadership = {
  id: 'b2_albums_leadership',
  track: 'B',
  titleAr: 'ألبومات الصور وفريق الإدارة',
  titleEn: 'Photo albums & leadership',
  appliesTo: ['new', 'migration', 'redesign'],
  requiredFor: [], // never required — optional for everyone, skip email-only
  optional: true,
  skippable: true,
  fields: [
    note('albums_group', 'ألبومات الصور', 'Photo albums'),
    table(
      'photo_albums',
      'جدول الألبومات',
      'Photo albums table',
      [
        column('name', 'اسم الألبوم', 'Album name', FIELD_TYPES.TEXT, { required: true }),
        column('description', 'وصف مختصر', 'Short description', FIELD_TYPES.TEXTAREA),
        column('where_it_appears', 'أين يظهر؟', 'Where it appears', FIELD_TYPES.TEXT),
        column('display_order', 'الترتيب', 'Display order', FIELD_TYPES.NUMBER),
        column('images', 'الصور', 'Images', FIELD_TYPES.UPLOAD, { zipPath: 'albums/{album-slug}/' }),
      ],
      { prefilledOptions: ALBUM_PRESETS, itemNameColumn: 'name' },
    ),

    note('leadership_group', 'الإدارة والهيكل التنظيمي', 'Leadership & org structure'),
    note('leadership_consent_warning', 'نشر صورة أو اسم أي شخص يتطلب موافقته الشخصية (نظام حماية البيانات الشخصية).', 'Publishing a named individual’s photo needs that person’s consent under PDPL.'),
    table(
      'leadership',
      'جدول الإدارة',
      'Leadership table',
      [
        column('name', 'الاسم', 'Name', FIELD_TYPES.TEXT, { required: true }),
        column('position', 'المنصب', 'Position'),
        column('display_order', 'ترتيب الظهور', 'Display order', FIELD_TYPES.NUMBER, {
          helpAr: 'يبني الهيكل التنظيمي بالترتيب الذي تحدده تماماً، بدل تخمينه من المسمى الوظيفي.',
        }),
        column('short_bio', 'نبذة مختصرة', 'Short bio', FIELD_TYPES.TEXTAREA),
        column('photo', 'صورة', 'Photo', FIELD_TYPES.UPLOAD, { zipPath: 'team/' }),
        column('linkedin', 'لينكدإن', 'LinkedIn', FIELD_TYPES.URL),
        column('consent_to_publish', 'موافق على نشر اسمه وصورته؟', 'Consent to publish name & photo?', FIELD_TYPES.RADIO, {
          options: CONSENT_OPTIONS,
          required: true,
          flagsReview: 'leadership_consent_missing',
        }),
      ],
      { itemNameColumn: 'name' },
    ),
  ],
};

// ---------------------------------------------------------------------------
// B3 — الفروع والتواصل (Branches & contact info)
// Bundles the three related tables from the same xlsx sheet.
// ---------------------------------------------------------------------------
export const stepB3Branches = {
  id: 'b3_branches',
  track: 'B',
  titleAr: 'الفروع والتواصل',
  titleEn: 'Branches & contact info',
  appliesTo: ['new', 'migration', 'redesign'],
  requiredFor: ['new', 'redesign'],
  fields: [
    table(
      'branches',
      'الفروع',
      'Branches',
      [
        column('branch_name', 'اسم الفرع / المقر', 'Branch name', FIELD_TYPES.TEXT, { required: true }),
        column('city', 'المدينة', 'City'),
        column('full_address', 'العنوان التفصيلي', 'Full address', FIELD_TYPES.TEXTAREA),
        column('national_address', 'العنوان الوطني', 'National Address', FIELD_TYPES.TEXT, {
          helpAr: 'الصيغة: رقم المبنى - الحي - الرمز البريدي - الرقم الإضافي. مثال: 3241 - العليا - 12211 - 6823',
          placeholder: '3241 - العليا - 12211 - 6823',
        }),
        column('maps_link', 'رابط Google Maps', 'Maps link', FIELD_TYPES.URL),
        column('phone', 'هاتف الفرع', 'Phone', FIELD_TYPES.TEL),
        column('whatsapp', 'واتساب', 'WhatsApp', FIELD_TYPES.TEL),
        column('email', 'البريد الإلكتروني', 'Email', FIELD_TYPES.EMAIL),
        column('working_hours', 'ساعات العمل', 'Working hours', FIELD_TYPES.TEXT),
        column('working_days', 'أيام العمل', 'Working days', FIELD_TYPES.TEXT, { placeholder: 'الأحد - الخميس' }),
        column('notes', 'ملاحظات', 'Notes', FIELD_TYPES.TEXTAREA),
      ],
    ),
    table(
      'direct_contacts',
      'أرقام التواصل المباشر',
      'Direct contact numbers',
      [
        column('department', 'القسم / الوظيفة', 'Department / role', FIELD_TYPES.SELECT, { options: DEPARTMENT_ROLES, allowOther: true }),
        column('contact_person', 'اسم المسؤول', 'Contact person'),
        column('phone', 'رقم الهاتف', 'Phone', FIELD_TYPES.TEL),
        column('whatsapp', 'واتساب', 'WhatsApp', FIELD_TYPES.TEL),
        column('email', 'البريد الإلكتروني', 'Email', FIELD_TYPES.EMAIL),
        column('notes', 'ملاحظات', 'Notes', FIELD_TYPES.TEXTAREA),
      ],
      { prefilledOptions: DEPARTMENT_ROLES },
    ),
    table(
      'social_media',
      'حسابات التواصل الاجتماعي',
      'Social media accounts',
      [
        column('platform', 'المنصة', 'Platform', FIELD_TYPES.SELECT, { options: SOCIAL_PLATFORMS, required: true }),
        column('url_or_handle', 'الرابط / اسم الحساب', 'URL / handle', FIELD_TYPES.TEXT),
        column('notes', 'ملاحظات', 'Notes', FIELD_TYPES.TEXTAREA),
      ],
      { prefilledOptions: SOCIAL_PLATFORMS },
    ),
  ],
};

// ---------------------------------------------------------------------------
// B4 — الخدمات (Services) — Arabic only
// ---------------------------------------------------------------------------
export const stepB4Services = {
  id: 'b4_services',
  track: 'B',
  titleAr: 'الخدمات المقدمة',
  titleEn: 'Services offered',
  appliesTo: ['new', 'migration', 'redesign'],
  requiredFor: ['new', 'redesign'],
  fields: [
    ARABIC_ONLY_NOTE,
    table(
      'services',
      'جدول الخدمات',
      'Services table',
      [
        column('category', 'القسم الرئيسي', 'Main category', FIELD_TYPES.TEXT),
        column('name', 'اسم الخدمة', 'Service name', FIELD_TYPES.TEXT, { required: true }),
        column('description', 'وصف الخدمة (3-5 أسطر)', 'Description', FIELD_TYPES.TEXTAREA),
        column('key_features', 'المميزات', 'Key features', FIELD_TYPES.TEXTAREA),
        column('images', 'صور', 'Images', FIELD_TYPES.UPLOAD, { zipPath: 'services/' }),
      ],
      { itemNameColumn: 'name' },
    ),
  ],
};

// ---------------------------------------------------------------------------
// B5 — المنتجات (Products) — Arabic only
// ---------------------------------------------------------------------------
export const stepB5Products = {
  id: 'b5_products',
  track: 'B',
  titleAr: 'كتالوج المنتجات',
  titleEn: 'Product catalog',
  appliesTo: ['new', 'migration', 'redesign'],
  requiredFor: ['new', 'redesign'],
  fields: [
    ARABIC_ONLY_NOTE,
    table(
      'products',
      'جدول المنتجات',
      'Products table',
      [
        column('category', 'تصنيف المنتج', 'Category', FIELD_TYPES.TEXT),
        column('sub_category', 'التصنيف الفرعي', 'Sub-category', FIELD_TYPES.TEXT),
        column('name', 'اسم المنتج', 'Product name', FIELD_TYPES.TEXT, { required: true }),
        column('brand', 'العلامة التجارية', 'Brand', FIELD_TYPES.TEXT),
        column('model', 'رقم الموديل', 'Model', FIELD_TYPES.TEXT),
        column('specs', 'المواصفات الفنية', 'Specifications', FIELD_TYPES.TEXTAREA),
        column('short_description', 'وصف مختصر', 'Short description', FIELD_TYPES.TEXTAREA),
        column('price_sar', 'السعر بالريال (ر.س)', 'Price (SAR)', FIELD_TYPES.NUMBER, {
          helpAr: 'هذا سعر عرض للمنتج على الموقع — بيانات كتالوج، وليس تكلفة المشروع.',
        }),
        column('vat_inclusive', 'شامل ضريبة القيمة المضافة ١٥٪؟', 'VAT-inclusive?', FIELD_TYPES.RADIO, { options: YES_NO }),
        column('images', 'صور', 'Images', FIELD_TYPES.UPLOAD, { zipPath: 'products/' }),
        column('pdf_catalog_link', 'رابط كتالوج PDF', 'PDF catalog link', FIELD_TYPES.URL),
        column('notes', 'ملاحظات', 'Notes', FIELD_TYPES.TEXTAREA),
      ],
      { itemNameColumn: 'name' },
    ),
  ],
};

// ---------------------------------------------------------------------------
// B6 — العلامات التجارية (Brands & agencies)
// ---------------------------------------------------------------------------
export const stepB6Brands = {
  id: 'b6_brands',
  track: 'B',
  titleAr: 'العلامات التجارية والوكالات',
  titleEn: 'Brands & agencies',
  appliesTo: ['new', 'migration', 'redesign'],
  requiredFor: ['new', 'redesign'],
  fields: [
    table(
      'brands',
      'جدول العلامات التجارية',
      'Brands table',
      [
        column('name', 'اسم العلامة التجارية', 'Brand name', FIELD_TYPES.TEXT, { required: true }),
        column('country', 'بلد المنشأ', 'Country'),
        column('product_type', 'نوع المنتجات', 'Product type'),
        column('official_distributor', 'وكيل رسمي؟', 'Official distributor?', FIELD_TYPES.RADIO, { options: YES_NO }),
        column('website', 'رابط الموقع', 'Brand website', FIELD_TYPES.URL),
        column('logo', 'شعار', 'Logo', FIELD_TYPES.UPLOAD, { zipPath: 'brands/' }),
        column('notes', 'ملاحظات', 'Notes', FIELD_TYPES.TEXTAREA),
      ],
      { itemNameColumn: 'name' },
    ),
  ],
};

// ---------------------------------------------------------------------------
// B7 — الاعتمادات والشهادات (Credentials & certificates)
// Pre-populated with real Saudi document types — see saudi-requirements.js
// for the same CERTIFICATE_TYPES list used to seed rows here.
// ---------------------------------------------------------------------------
export const stepB7Credentials = {
  id: 'b7_credentials',
  track: 'B',
  titleAr: 'الاعتمادات والشهادات والتراخيص',
  titleEn: 'Credentials, certifications & licenses',
  appliesTo: ['new', 'migration', 'redesign'],
  requiredFor: ['new', 'redesign'],
  fields: [
    note('cr_vat_required_note', 'أرقام السجل التجاري والرقم الضريبي مطلوبة نظاماً على الموقع.', 'CR and VAT numbers are legally required on the site.'),
    table(
      'credentials',
      'جدول الاعتمادات والشهادات',
      'Credentials table',
      [
        column('document_type', 'نوع الوثيقة', 'Document type', FIELD_TYPES.TEXT, { required: true }),
        column('number', 'الرقم / المرجع', 'Number'),
        column('issue_date_gregorian', 'تاريخ الإصدار', 'Issue date', FIELD_TYPES.DATE),
        column('expiry_date_gregorian', 'تاريخ الانتهاء (ميلادي)', 'Expiry (Gregorian)', FIELD_TYPES.DATE, {
          flagsReview: 'certificate_expiring_soon',
        }),
        column('expiry_date_hijri', 'تاريخ الانتهاء (هجري)', 'Expiry (Hijri)', FIELD_TYPES.TEXT),
        column('issuing_authority', 'الجهة المصدرة', 'Issuing authority'),
        column('has_pdf', 'نسخة PDF؟', 'PDF?', FIELD_TYPES.RADIO, { options: YES_NO }),
        column('file', 'الملف', 'File', FIELD_TYPES.UPLOAD, { zipPath: 'certificates/' }),
        column('notes', 'ملاحظات', 'Notes', FIELD_TYPES.TEXTAREA),
      ],
      { prefilledFrom: 'CERTIFICATE_TYPES', itemNameColumn: 'document_type' },
    ),
  ],
};

// ---------------------------------------------------------------------------
// B8 — المشاريع والأعمال (Projects / portfolio) — Arabic only
// ---------------------------------------------------------------------------
export const stepB8Projects = {
  id: 'b8_projects',
  track: 'B',
  titleAr: 'المشاريع المنفذة (أعمالنا)',
  titleEn: 'Completed projects (portfolio)',
  appliesTo: ['new', 'migration', 'redesign'],
  requiredFor: ['new', 'redesign'],
  fields: [
    ARABIC_ONLY_NOTE,
    table(
      'projects',
      'جدول المشاريع',
      'Projects table',
      [
        column('name', 'اسم المشروع', 'Project name', FIELD_TYPES.TEXT, { required: true }),
        column('work_type', 'نوع العمل', 'Work type', FIELD_TYPES.TEXT),
        column('sector', 'القطاع', 'Sector', FIELD_TYPES.TEXT),
        column('client_name', 'اسم العميل', 'Client name', FIELD_TYPES.TEXT),
        column('city', 'المدينة', 'City', FIELD_TYPES.TEXT),
        column('year', 'السنة', 'Year', FIELD_TYPES.NUMBER),
        column('description', 'وصف مختصر', 'Brief description', FIELD_TYPES.TEXTAREA),
        column('photos', 'صور', 'Photos', FIELD_TYPES.UPLOAD, { zipPath: 'projects/' }),
        column('client_name_publishable', 'نشر اسم العميل؟', 'Is client name publishable?', FIELD_TYPES.RADIO, { options: YES_NO }),
        column('notes', 'ملاحظات', 'Notes', FIELD_TYPES.TEXTAREA),
      ],
      { itemNameColumn: 'name' },
    ),
  ],
};

// ---------------------------------------------------------------------------
// B9 — معلومات إضافية (Additional info)
// ---------------------------------------------------------------------------
export const stepB9AdditionalInfo = {
  id: 'b9_additional_info',
  track: 'B',
  titleAr: 'معلومات إضافية',
  titleEn: 'Additional info',
  appliesTo: ['new', 'migration', 'redesign'],
  requiredFor: ['new', 'redesign'],
  fields: [
    field('year_founded', 'سنة تأسيس الشركة', 'Year founded', FIELD_TYPES.NUMBER),
    field('employee_count', 'عدد الموظفين التقريبي', 'Employee count', FIELD_TYPES.TEXT),
    field('project_count', 'عدد المشاريع المنفذة', 'Project count', FIELD_TYPES.TEXT),
    field('years_experience', 'عدد سنوات الخبرة', 'Years of experience', FIELD_TYPES.NUMBER),
    field('founding_story', 'قصة تأسيس الشركة ومن المؤسس', 'Founding story and founder', FIELD_TYPES.TEXTAREA),
    field('company_profile_pdf', 'هل يوجد ملف تعريفي للشركة (PDF)؟', 'Is there a company profile PDF?', FIELD_TYPES.RADIO, { options: YES_NO }),
    uploadSlot('company_profile_pdf_file', 'ارفع الملف التعريفي', 'Upload the company profile', 'company/', {
      visibleWhen: (a) => a.company_profile_pdf === 'yes',
    }),
    field('testimonials', 'هل يوجد شهادات أو تقييمات عملاء للنشر؟', 'Publishable client testimonials?', FIELD_TYPES.TEXTAREA),
    field('job_openings', 'هل توجد وظائف شاغرة حالياً؟', 'Any current job openings?', FIELD_TYPES.TEXTAREA),
    field('warranty_period', 'مدة الضمان على المنتجات', 'Product warranty period', FIELD_TYPES.TEXT),
    field('maintenance_terms', 'شروط عقود الصيانة الدورية', 'Maintenance contract terms', FIELD_TYPES.TEXTAREA),
  ],
};

export const trackBSteps = [
  stepB0Seo,
  stepB0bLanguages,
  stepB1Forms,
  stepB2AlbumsLeadership,
  stepB3Branches,
  stepB4Services,
  stepB5Products,
  stepB6Brands,
  stepB7Credentials,
  stepB8Projects,
  stepB9AdditionalInfo,
];
