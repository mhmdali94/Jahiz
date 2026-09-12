// Shared vocabulary for the schema files in ./steps/*.
// Keeping field/option builders here means every step file stays pure data —
// see /README.md "Editing the questionnaire" for how this wires into the UI,
// the .docx and the .xlsx.

export const FIELD_TYPES = {
  TEXT: 'text',
  TEXTAREA: 'textarea',
  SELECT: 'select',
  RADIO: 'radio',
  DATE: 'date',
  EMAIL: 'email',
  TEL: 'tel',
  URL: 'url',
  NUMBER: 'number',
  TOGGLE: 'toggle', // boolean yes/no rendered as a switch
  TABLE: 'table', // repeatable rows, see `columns`
  UPLOAD: 'upload', // drag-and-drop image/file zone
  STATIC: 'static', // read-only note / warning block, not a real field
};

export const PROJECT_TYPES = {
  NEW: 'new',
  MIGRATION: 'migration',
  REDESIGN: 'redesign',
  EMAIL: 'email',
  UNSURE: 'unsure',
};

export const PROJECT_TYPE_LIST = [
  { value: PROJECT_TYPES.NEW, ar: 'موقع جديد', latin: 'New build' },
  { value: PROJECT_TYPES.MIGRATION, ar: 'ترحيل موقع قائم', latin: 'Migration' },
  { value: PROJECT_TYPES.REDESIGN, ar: 'إعادة تصميم (مع الحفاظ على المحتوى)', latin: 'Redesign' },
  { value: PROJECT_TYPES.EMAIL, ar: 'بريد إلكتروني فقط', latin: 'Email only' },
  { value: PROJECT_TYPES.UNSURE, ar: 'لست متأكداً بعد', latin: 'Not sure yet' },
];

export const TRACKS = {
  A: 'A', // Technical handover
  B: 'B', // Website content
};

export const TRACK_LIST = [
  { value: TRACKS.A, ar: 'التسليم التقني', desc: 'الوصول، البريد، الترحيل' },
  { value: TRACKS.B, ar: 'محتوى الموقع', desc: 'الخدمات، المنتجات، المشاريع' },
];

export const OWNER_OPTIONS = [
  { value: 'previous_developer', ar: 'المطوّر السابق' },
  { value: 'hosting_company', ar: 'شركة الاستضافة' },
  { value: 'mail_provider', ar: 'مزوّد البريد' },
  { value: 'it_department', ar: 'قسم تقنية المعلومات' },
  { value: 'management', ar: 'الإدارة' },
  { value: 'accountant', ar: 'المحاسب' },
  { value: 'unknown', ar: 'لا أعرف' },
];

export const DECISION_LEVEL = {
  TECHNICAL: 'technical', // the technical contact can answer
  DECISION_MAKER: 'decision_maker', // needs the person who signs off
};

/**
 * Builds one question field.
 * `allowUnknown` defaults true for real data-collection questions — every
 * credential/access-style field gets the "لا أعرف" toggle per spec. Purely
 * structural fields (radios that drive branching, table columns, etc.) opt
 * out explicitly with `{ allowUnknown: false }`.
 */
export function field(id, labelAr, labelEn, type = FIELD_TYPES.TEXT, extra = {}) {
  return {
    id,
    labelAr,
    labelEn,
    type,
    allowUnknown: true,
    ownerOptions: OWNER_OPTIONS,
    required: false,
    decisionLevel: DECISION_LEVEL.TECHNICAL,
    ...extra,
  };
}

/** A repeatable-rows field (mailbox table, product catalog, reference sites…). */
export function table(id, labelAr, labelEn, columns, extra = {}) {
  return field(id, labelAr, labelEn, FIELD_TYPES.TABLE, {
    allowUnknown: false,
    columns,
    minRows: 0,
    ...extra,
  });
}

/** A column inside a `table()` field — same shape as a field but no owner/unknown toggle. */
export function column(id, labelAr, labelEn, type = FIELD_TYPES.TEXT, extra = {}) {
  return { id, labelAr, labelEn, type, required: false, ...extra };
}

/** A non-input note rendered inline (warnings, security banners, section dividers). */
export function note(id, labelAr, labelEn, extra = {}) {
  return field(id, labelAr, labelEn, FIELD_TYPES.STATIC, { allowUnknown: false, ...extra });
}

export function option(value, ar, extra = {}) {
  return { value, ar, ...extra };
}

// ---- Reused option lists (kept here once so wording changes propagate) ----

export const REGISTRARS = [
  option('godaddy', 'GoDaddy'),
  option('namecheap', 'Namecheap'),
  option('saudinic', 'SaudiNIC'),
  option('other', 'أخرى'),
];

export const HOSTING_PANELS = [
  option('cpanel', 'cPanel'),
  option('plesk', 'Plesk'),
  option('cyberpanel', 'CyberPanel'),
  option('directadmin', 'DirectAdmin'),
  option('other', 'أخرى'),
];

export const MAIL_PROVIDERS = [
  option('google_workspace', 'Google Workspace'),
  option('microsoft_365', 'Microsoft 365'),
  option('zoho', 'Zoho Mail'),
  option('hosting_bundled', 'بريد مرفق مع الاستضافة'),
  option('none', 'لا يوجد'),
];

export const CURRENT_PLATFORMS = [
  option('wordpress', 'ووردبريس (WordPress)'),
  option('shopify', 'Shopify'),
  option('wix', 'Wix'),
  option('custom', 'مخصص (Custom)'),
  option('other', 'أخرى'),
];

export const YES_NO = [
  option('yes', 'نعم'),
  option('no', 'لا'),
];

export const YES_NO_LATER = [
  option('yes', 'نعم'),
  option('no', 'لا'),
  option('later', 'لاحقاً'),
];

export const MIGRATION_ACCESS = [
  option('admin', 'صلاحية مشرف (Admin) على مزوّد البريد'),
  option('per_mailbox', 'كلمة مرور لكل صندوق على حدة'),
  option('unknown', 'غير معروف بعد'),
];

export const MAILBOX_ACTIONS = [
  option('create', 'إنشاء جديد'),
  option('migrate', 'ترحيل'),
  option('delete', 'حذف'),
  option('alias', 'تحويل إلى Alias'),
  option('forward', 'تحويل إلى Forwarder'),
  option('keep', 'إبقاء كما هو'),
];

export const PAGE_DECISIONS = [
  option('keep', 'نُبقيها كما هي'),
  option('keep_update', 'نُبقيها ونحدّث المحتوى'),
  option('merge', 'دمج مع صفحة أخرى'),
  option('redirect_delete', 'حذف مع تحويل 301'),
  option('delete', 'حذف نهائي'),
  option('new', 'صفحة جديدة'),
];

export const PRIORITY = [
  option('high', 'عالية'),
  option('medium', 'متوسطة'),
  option('low', 'منخفضة'),
];

export const REDESIGN_DEGREE = [
  option('as_is', 'نقل مطابق للموقع الحالي (Pixel-faithful)'),
  option('light', 'نقل مع تحسينات بسيطة'),
  option('full', 'إعادة تصميم كاملة'),
];

export const LOGO_FORMATS = [
  option('ai_eps_svg', 'AI / EPS / SVG (فيكتور)'),
  option('psd', 'PSD'),
  option('png_transparent', 'PNG شفاف'),
  option('jpg_only', 'JPG فقط'),
];

export const IMPRESSION_OPTIONS = [
  option('formal', 'رسمي'),
  option('modern', 'عصري'),
  option('premium', 'فخم'),
  option('minimal', 'بسيط'),
  option('technical', 'تقني'),
];

export const REFERENCE_ASPECT = [
  option('overall', 'التصميم العام'),
  option('colors', 'الألوان'),
  option('fonts', 'الخطوط'),
  option('structure', 'ترتيب الصفحات'),
  option('products_display', 'طريقة عرض المنتجات'),
  option('homepage', 'الصفحة الرئيسية'),
  option('speed', 'السرعة'),
  option('mobile', 'نسخة الجوال'),
  option('copy', 'أسلوب الكتابة'),
];

export const COPY_OR_INSPIRE = [
  option('copy_closely', 'نسخ قريب'),
  option('inspire', 'استلهام فقط'),
  option('one_element', 'عنصر واحد فقط'),
];

export const THIRD_PARTY_SERVICES = [
  option('payment_gateway', 'بوابة الدفع'),
  option('google_analytics', 'Google Analytics'),
  option('search_console', 'Google Search Console'),
  option('tag_manager', 'Google Tag Manager'),
  option('business_profile', 'Google Business Profile'),
  option('meta_pixel', 'Meta Pixel / Facebook'),
  option('live_chat', 'دردشة مباشرة (Live chat)'),
  option('crm', 'نظام CRM'),
  option('sms_gateway', 'بوابة رسائل SMS'),
  option('whatsapp_api', 'WhatsApp Business API'),
  option('booking', 'نظام حجوزات'),
  option('invoicing', 'نظام فوترة'),
  option('other', 'أخرى'),
];

export const CREDENTIAL_SERVICES = [
  option('registrar', 'شركة تسجيل النطاق'),
  option('hosting_panel', 'لوحة تحكم الاستضافة'),
  option('ssh', 'وصول SSH'),
  option('ftp', 'وصول FTP / SFTP'),
  option('database', 'قاعدة البيانات'),
  option('mail_admin', 'لوحة تحكم البريد'),
  option('cms', 'لوحة تحكم الموقع (WordPress / CMS)'),
  option('cloudflare', 'Cloudflare'),
  option('payment_gateway', 'بوابة الدفع'),
  option('analytics', 'Google Analytics / Search Console'),
  option('social', 'حسابات التواصل الاجتماعي'),
  option('other', 'أخرى'),
];

export const FORM_TYPES = [
  option('general_contact', 'نموذج تواصل عام'),
  option('quotation', 'طلب عرض سعر'),
  option('service_request', 'طلب خدمة'),
  option('product_enquiry', 'طلب منتج'),
  option('job_application', 'طلب توظيف'),
  option('technical_enquiry', 'استفسار فني'),
  option('appointment', 'حجز موعد'),
  option('maintenance_contract', 'طلب عقد صيانة'),
  option('complaints', 'شكاوى واقتراحات'),
  option('newsletter', 'الاشتراك في النشرة'),
];

export const ALBUM_PRESETS = [
  option('projects_gallery', 'معرض المشاريع'),
  option('office_warehouse', 'صور المقر والمستودعات'),
  option('exhibitions', 'المعارض والفعاليات'),
  option('training', 'ورش العمل والتدريب'),
];

export const CONSENT_OPTIONS = [
  option('yes', 'نعم'),
  option('no', 'لا'),
  option('not_asked', 'لم يُسأل بعد'),
];

export const PAYMENT_METHODS = [
  option('mada', 'مدى'),
  option('apple_pay', 'Apple Pay'),
  option('stc_pay', 'STC Pay'),
  option('visa', 'Visa / Mastercard'),
  option('tabby', 'Tabby'),
  option('tamara', 'Tamara'),
  option('sadad', 'سداد (SADAD)'),
  option('bank_transfer', 'تحويل بنكي'),
];

export const PAYMENT_GATEWAYS = [
  option('moyasar', 'Moyasar'),
  option('paytabs', 'PayTabs'),
  option('hyperpay', 'HyperPay'),
  option('tap', 'Tap'),
  option('checkout', 'Checkout.com'),
];

export const SHIPPING_PARTNERS = [
  option('smsa', 'سمسا (SMSA)'),
  option('aramex', 'أرامكس'),
  option('naqel', 'ناقل'),
  option('spl', 'البريد السعودي (سبل)'),
];

export const CERTIFICATE_TYPES = [
  option('cr', 'السجل التجاري'),
  option('unified_number', 'الرقم الموحد للمنشأة (700)'),
  option('vat_cert', 'شهادة ضريبة القيمة المضافة'),
  option('zakat_cert', 'شهادة الزكاة والضريبة والجمارك'),
  option('gosi', 'شهادة التأمينات الاجتماعية (GOSI)'),
  option('saudization', 'شهادة السعودة (نطاقات)'),
  option('etimad', 'تسجيل منصة اعتماد ورقم المورد'),
  option('lcgpa', 'شهادة المحتوى المحلي (LCGPA)'),
  option('saber_saso', 'شهادة سابر / ساسو للمنتجات'),
  option('saudi_quality_mark', 'علامة الجودة السعودية'),
  option('contractor_classification', 'تصنيف المقاولين'),
  option('sama', 'اعتماد ساما'),
  option('civil_defense', 'رخصة الدفاع المدني'),
  option('public_security', 'ترخيص الأمن العام لأنظمة المراقبة'),
  option('chamber', 'عضوية الغرفة التجارية'),
  option('maroof', 'توثيق معروف'),
  option('misa', 'رخصة وزارة الاستثمار (MISA)'),
  option('iso', 'شهادات ISO'),
  option('other', 'شهادة أخرى'),
];

export const TECHNICAL_LEVEL = [
  option('beginner', 'مبتدئ'),
  option('intermediate', 'متوسط'),
  option('advanced', 'متقدم'),
];

export const TRAINING_MODE = [
  option('in_person', 'حضورياً'),
  option('remote', 'عن بُعد'),
  option('recorded_video', 'فيديو مسجّل'),
];

export const LANGUAGE_SCOPE = [
  option('ar_only', 'عربي فقط'),
  option('ar_en', 'عربي وإنجليزي'),
  option('other', 'لغات أخرى'),
];

export const SOCIAL_PLATFORMS = [
  option('instagram', 'Instagram'),
  option('x_twitter', 'X (Twitter)'),
  option('linkedin', 'LinkedIn'),
  option('snapchat', 'Snapchat'),
  option('tiktok', 'TikTok'),
  option('youtube', 'YouTube'),
  option('facebook', 'Facebook'),
];

export const DEPARTMENT_ROLES = [
  option('sales', 'المبيعات'),
  option('technical', 'الاستشارات الفنية'),
  option('customer_service', 'خدمة العملاء'),
  option('support', 'الدعم الفني'),
  option('management', 'الإدارة'),
];
