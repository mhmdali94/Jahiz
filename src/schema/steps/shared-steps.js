// Cross-cutting steps — not owned by Track A or Track B, so `track` is null
// and the wizard engine places them once regardless of which track(s) the
// client picked in Step 0. All four (after-handover, Saudi requirements,
// files & assets, passwords) come from their own xlsx sheets and their
// appliesTo/requiredFor follow that sheet's row in the routing matrix
// exactly, since none of the FLOW section's prose overrides them the way it
// does for A5b/A7/A7b.

import {
  field,
  table,
  column,
  note,
  FIELD_TYPES,
  YES_NO,
  TECHNICAL_LEVEL,
  TRAINING_MODE,
  PAYMENT_METHODS,
  PAYMENT_GATEWAYS,
  SHIPPING_PARTNERS,
  CERTIFICATE_TYPES,
  CREDENTIAL_SERVICES,
  MIGRATION_ACCESS,
} from '../constants.js';

// ---------------------------------------------------------------------------
// A11b — ما بعد التسليم والتشغيل (After handover & operations)
// "Written agreement here prevents the awkward conversation six weeks after
// launch." Shown for every project type; only optional for email-only.
// ---------------------------------------------------------------------------
export const stepAfterHandover = {
  id: 'after_handover',
  track: null,
  titleAr: 'ما بعد التسليم والتشغيل',
  titleEn: 'After handover & operations',
  appliesTo: ['new', 'migration', 'redesign', 'email'],
  requiredFor: ['new', 'migration', 'redesign'],
  fields: [
    note('who_runs_group', 'من يدير الموقع؟', 'Who runs the site?'),
    field('content_owner', 'من سيحدّث محتوى الموقع بعد التسليم؟ الاسم والقسم', 'Who will update the site content after handover?', FIELD_TYPES.TEXT),
    field('content_owner_level', 'ما مستوى خبرته التقنية؟', 'How technical is that person?', FIELD_TYPES.RADIO, { options: TECHNICAL_LEVEL }),
    field('needs_dashboard_training', 'هل يحتاج تدريباً على لوحة التحكم؟ وكم شخصاً؟', 'Does he need training on the dashboard? How many people?', FIELD_TYPES.TEXT),
    field('training_mode', 'هل تفضّلون التدريب حضورياً أم عن بُعد أم فيديو مسجّل؟', 'Training in person, remote, or a recorded video?', FIELD_TYPES.RADIO, { options: TRAINING_MODE }),
    field('wants_written_guide', 'هل تريدون دليل استخدام مكتوب بالعربية؟', 'Do you want a written Arabic user guide?', FIELD_TYPES.RADIO, { options: YES_NO }),

    note('responsibilities_group', 'المسؤوليات', 'Responsibilities'),
    field('backup_responsible', 'من المسؤول عن النسخ الاحتياطي بعد التسليم؟', 'Who is responsible for backups after handover?', FIELD_TYPES.TEXT),
    field('security_updates_responsible', 'من المسؤول عن تحديثات الأمان والإضافات؟', 'Who handles security and plugin updates?', FIELD_TYPES.TEXT),
    field('renewal_responsible', 'من يجدّد النطاق والاستضافة؟ ومن يتابع تواريخ الانتهاء؟', 'Who renews the domain and hosting, and tracks expiry dates?', FIELD_TYPES.TEXT, {
      decisionLevel: 'decision_maker',
    }),
    field('downtime_contact', 'بمن نتصل إذا توقّف الموقع خارج أوقات الدوام؟', 'Who do we contact if the site goes down outside working hours?', FIELD_TYPES.TEXT),

    note('support_group', 'الدعم والصيانة', 'Support & maintenance'),
    field('wants_maintenance_contract', 'هل ترغبون في عقد صيانة ودعم شهري؟', 'Do you want a monthly maintenance & support contract?', FIELD_TYPES.RADIO, {
      options: YES_NO,
      decisionLevel: 'decision_maker',
    }),
    field('expected_support_duration', 'ما مدة الدعم المتوقعة بعد الإطلاق؟', 'How long do you expect support after launch?', FIELD_TYPES.TEXT),
    field('expected_response_time', 'ما سرعة الاستجابة المتوقعة عند وجود مشكلة؟', 'Expected response time when something breaks?', FIELD_TYPES.TEXT),
    field('expects_periodic_updates', 'هل تتوقعون تحديثات دورية للمحتوى منّا؟ وبأي وتيرة؟', 'Do you expect periodic content updates from us? How often?', FIELD_TYPES.TEXT),
  ],
};

// ---------------------------------------------------------------------------
// المتطلبات السعودية (Saudi market requirements) — "This is not a generic
// form": bakes in what every Saudi project needs, instead of treating it as
// an add-on. Required for a real public website; optional where the project
// doesn't touch the storefront/footer (migration, email-only).
// ---------------------------------------------------------------------------
export const stepSaudiRequirements = {
  id: 'saudi_requirements',
  track: null,
  titleAr: 'المتطلبات السعودية',
  titleEn: 'Saudi market requirements',
  appliesTo: ['new', 'migration', 'redesign', 'email'],
  requiredFor: ['new', 'redesign'],
  fields: [
    note('compliance_group', 'الامتثال النظامي', 'Regulatory compliance'),
    field('cr_in_footer', 'هل يظهر رقم السجل التجاري في تذييل الموقع؟ (إلزامي نظاماً)', 'Is the CR number shown in the site footer? (legally required)', FIELD_TYPES.RADIO, { options: YES_NO }),
    field('vat_displayed', 'هل يظهر الرقم الضريبي في الموقع والفواتير؟', 'Is the VAT number shown on the site and invoices?', FIELD_TYPES.RADIO, { options: YES_NO }),
    field('maroof_verified', 'هل المتجر موثّق في «معروف»؟ ورقم التوثيق', 'Is the store verified on Maroof? Verification number', FIELD_TYPES.TEXT, { latinTerm: 'Maroof' }),
    field('pdpl_compliant', 'هل سياسة الخصوصية متوافقة مع نظام حماية البيانات الشخصية (PDPL)؟', 'Is the privacy policy compliant with Saudi PDPL?', FIELD_TYPES.RADIO, {
      options: YES_NO,
      latinTerm: 'PDPL',
    }),
    field('ecommerce_law_compliant', 'هل الشروط والأحكام متوافقة مع نظام التجارة الإلكترونية السعودي؟', 'Are the terms compliant with the Saudi E-Commerce Law?', FIELD_TYPES.RADIO, { options: YES_NO }),
    field('data_residency_ksa', 'هل يشترط العميل استضافة البيانات داخل السعودية؟', 'Is data residency inside KSA required?', FIELD_TYPES.RADIO, {
      options: YES_NO,
      decisionLevel: 'decision_maker',
    }),
    field('zatca_einvoicing', 'هل يوجد ربط مع الفوترة الإلكترونية (فاتورة - ZATCA)؟', 'Any integration with ZATCA e-invoicing (Fatoora)?', FIELD_TYPES.RADIO, {
      options: YES_NO,
      latinTerm: 'ZATCA',
    }),

    note('saudi_domain_group', 'النطاق السعودي', 'Saudi domain'),
    field('has_sa_domain', 'هل يوجد نطاق .sa أو .com.sa؟', 'Do you have a .sa or .com.sa domain?', FIELD_TYPES.RADIO, { options: YES_NO }),
    field('saudinic_reference', 'إن كان مسجلاً عبر SaudiNIC: البريد والرقم المرجعي', 'If registered via SaudiNIC: email & reference', FIELD_TYPES.TEXT, {
      latinTerm: 'SaudiNIC',
      visibleWhen: (a) => a.has_sa_domain === 'yes',
    }),
    field('cr_available_for_sa_renewal', 'هل السجل التجاري متاح لتجديد نطاق .sa؟', 'Is the CR available for .sa renewal?', FIELD_TYPES.RADIO, {
      options: YES_NO,
      visibleWhen: (a) => a.has_sa_domain === 'yes',
      flagsReview: 'sa_domain_no_cr_for_renewal',
      helpAr: 'SaudiNIC يطلب السجل التجاري عند كل تجديد، وهذا يعطّل التجديد كثيراً إن لم يكن جاهزاً.',
    }),

    note('payments_shipping_group', 'الدفع والشحن', 'Payments & shipping'),
    field('payment_methods', 'طرق الدفع المطلوبة', 'Payment methods required', FIELD_TYPES.SELECT, {
      options: PAYMENT_METHODS,
      multiple: true,
    }),
    field('preferred_payment_gateway', 'بوابة الدفع المفضلة', 'Preferred payment gateway', FIELD_TYPES.SELECT, { options: PAYMENT_GATEWAYS }),
    field('shipping_partners', 'شركات الشحن المعتمدة', 'Shipping partners', FIELD_TYPES.SELECT, {
      options: SHIPPING_PARTNERS,
      multiple: true,
    }),
    field('prices_vat_inclusive', 'هل الأسعار المعروضة شاملة ضريبة القيمة المضافة ١٥٪؟', 'Are displayed prices VAT-inclusive (15%)?', FIELD_TYPES.RADIO, { options: YES_NO }),
    field('display_currency', 'عملة العرض', 'Display currency', FIELD_TYPES.RADIO, {
      options: [{ value: 'sar_only', ar: 'الريال السعودي فقط' }, { value: 'other', ar: 'عملات أخرى أيضاً' }],
    }),

    note('localization_group', 'التوطين والمحتوى', 'Localization'),
    field('show_hijri_dates', 'هل تريد عرض التاريخ الهجري إلى جانب الميلادي؟', 'Show Hijri dates alongside Gregorian?', FIELD_TYPES.RADIO, { options: YES_NO }),
    field('numeral_style', 'شكل الأرقام', 'Numerals: Arabic-Indic or Latin?', FIELD_TYPES.RADIO, {
      options: [{ value: 'arabic_indic', ar: 'عربية (١٢٣)' }, { value: 'latin', ar: 'إنجليزية (123)' }],
    }),
    field('show_prayer_time_hours', 'هل تريد إظهار أوقات العمل مع مراعاة أوقات الصلاة؟', 'Show working hours accounting for prayer times?', FIELD_TYPES.RADIO, { options: YES_NO }),
    field('official_holidays', 'الإجازات الرسمية المؤثرة على التشغيل', 'Official holidays affecting operations', FIELD_TYPES.TEXTAREA, {
      helpAr: 'مثل العيدين، اليوم الوطني، يوم التأسيس.',
    }),
    field('feature_vision_2030', 'هل تريد إبراز شعار رؤية 2030 أو المحتوى المحلي؟', 'Feature Vision 2030 or Local Content branding?', FIELD_TYPES.RADIO, { options: YES_NO }),
    field('highlight_saudi_ownership', 'هل تريد إبراز «منشأة سعودية» أو نسبة السعودة؟', 'Highlight Saudi ownership or Saudization rate?', FIELD_TYPES.RADIO, { options: YES_NO }),
    field('local_seo_cities', 'المدن المستهدفة للسيو المحلي', 'Target cities for local SEO', FIELD_TYPES.TEXT, {
      placeholder: 'الرياض / جدة / الدمام',
    }),
  ],
};

// ---------------------------------------------------------------------------
// الملفات والصور (Files & assets)
// A checklist of what to send, not a form to type answers into — every row
// is either "uploaded here" or "here's a Drive/WeTransfer link".
// ---------------------------------------------------------------------------
const FILE_ASSET_TYPES = [
  { id: 'logo_vector', ar: 'شعار الشركة (فيكتور: AI / EPS / SVG)' },
  { id: 'logo_png_transparent', ar: 'الشعار بصيغة PNG بخلفية شفافة' },
  { id: 'logo_white', ar: 'نسخة بيضاء من الشعار للخلفيات الداكنة' },
  { id: 'favicon', ar: 'أيقونة الموقع (Favicon)' },
  { id: 'brand_guidelines', ar: 'دليل الهوية البصرية والألوان' },
  { id: 'licensed_fonts', ar: 'ملفات الخطوط المرخّصة' },
  { id: 'product_photos', ar: 'صور المنتجات عالية الدقة' },
  { id: 'project_photos', ar: 'صور المشاريع المنفذة' },
  { id: 'office_photos', ar: 'صور المقر والمستودعات' },
  { id: 'team_photos', ar: 'صور فريق العمل' },
  { id: 'company_profile_pdf', ar: 'الملف التعريفي للشركة (PDF)' },
  { id: 'product_catalogs_pdf', ar: 'كتالوجات المنتجات (PDF)' },
  { id: 'client_logos', ar: 'شعارات العملاء' },
  { id: 'certificates', ar: 'الشهادات والتراخيص' },
  { id: 'promo_videos', ar: 'فيديوهات ترويجية' },
];

export const stepFilesAssets = {
  id: 'files_assets',
  track: null,
  titleAr: 'الملفات والصور المطلوبة',
  titleEn: 'Files & assets required',
  appliesTo: ['new', 'migration', 'redesign'],
  requiredFor: ['new', 'redesign'],
  fields: [
    note('files_assets_intro', 'ارفع الملف مباشرة، أو ضع رابط Google Drive أو WeTransfer إن لم يكن مناسباً للرفع هنا.', 'Upload the file directly, or paste a Google Drive / WeTransfer link.'),
    table(
      'files_assets',
      'جدول الملفات والصور',
      'Files & assets table',
      [
        column('file_type', 'نوع الملف', 'File type', FIELD_TYPES.TEXT, { required: true }),
        column('available', 'متوفر؟', 'Available?', FIELD_TYPES.RADIO, { options: YES_NO }),
        column('upload', 'رفع الملف', 'Upload', FIELD_TYPES.UPLOAD, { zipPath: 'company/' }),
        column('link', 'أو رابط خارجي', 'Or an external link', FIELD_TYPES.URL),
        column('notes', 'ملاحظات', 'Notes', FIELD_TYPES.TEXTAREA),
      ],
      { prefilledFrom: 'FILE_ASSET_TYPES' },
    ),
  ],
};

// ---------------------------------------------------------------------------
// صفحة كلمات المرور (Passwords)
// Always required, regardless of project type. Off-by-default per the
// "OPTIONAL PASSWORD ENTRY" hard rule — see strings.js for the toggle copy
// and README.md for the CSP/verification requirements around it.
// ---------------------------------------------------------------------------
export const stepPasswords = {
  id: 'passwords',
  track: null,
  titleAr: 'صفحة كلمات المرور',
  titleEn: 'Passwords page',
  appliesTo: ['new', 'migration', 'redesign', 'email'],
  requiredFor: ['new', 'migration', 'redesign', 'email'],
  fields: [
    note('delegated_access_suggestion', 'بدل كلمة المرور — أعطِ صلاحية بدلاً منها', 'Better than passwords — delegated access', {
      helpAr: 'لكل خدمة أدناه، الوصول المفوَّض أو المؤقت متاح غالباً وهو المفضّل: ووردبريس/CMS → حساب مشرف مؤقت، Google Workspace/Microsoft 365 → دور مشرف مفوَّض، Cloudflare → دعوة كعضو، cPanel/الاستضافة → حساب فرعي، مزوّد النطاق → إضافة جهة اتصال ثانية.',
    }),
    table(
      'delegated_access_choices',
      'هل يمكن استخدام وصول مفوَّض بدلاً من كلمة المرور؟',
      'Delegated access per service',
      [
        column('service', 'الخدمة', 'Service', FIELD_TYPES.TEXT, { required: true }),
        column('delegated_access_used', 'تم استخدام وصول مفوَّض؟', 'Delegated access used?', FIELD_TYPES.RADIO, { options: YES_NO }),
      ],
      { prefilledFrom: 'CREDENTIAL_SERVICES' },
    ),

    field('password_entry_opt_in', 'طريقة تسليم كلمات المرور', 'How will passwords be handed over?', FIELD_TYPES.RADIO, {
      required: true,
      allowUnknown: false,
      default: 'in_docx_myself',
      options: [
        { value: 'in_docx_myself', ar: 'سأكتبها بنفسي في ملف الوورد بعد تحميله — أكثر أماناً', isDefault: true },
        { value: 'in_form', ar: 'أريد كتابة كلمات المرور الآن داخل النموذج' },
      ],
      helpAr: 'الخيار الأول هو الافتراضي دائماً. اختيار الثاني يكشف حقول كلمات المرور ويوقف حفظها التلقائي بالكامل.',
    }),
    note('password_security_warning', 'تحذيرات أمنية', 'Security warnings', {
      helpAr: 'لا تستخدم جهازاً مشتركاً أو عاماً. إضافات المتصفح قد تقرأ ما تكتبه في أي صفحة — هذا خارج سيطرتنا. مهما كان اختيارك، غيّر كل كلمة مرور شاركتها فور انتهاء المشروع.',
      visibleWhen: (a) => a.password_entry_opt_in === 'in_form',
    }),
    note('password_verify_link', 'كيف تتأكد بنفسك؟', 'How to verify it yourself', {
      helpAr: 'افتح أدوات المطوّر (DevTools) ← تبويب الشبكة (Network) ← املأ النموذج ← لن ترى أي طلب شبكة. سياسة الأمان (CSP) في الصفحة تمنع أي اتصال خارجي أساساً.',
      visibleWhen: (a) => a.password_entry_opt_in === 'in_form',
    }),

    table(
      'service_credentials',
      'كلمات مرور الخدمات',
      'Service credentials',
      [
        column('service', 'الخدمة', 'Service', FIELD_TYPES.SELECT, { options: CREDENTIAL_SERVICES, required: true }),
        column('login_url', 'رابط الدخول', 'Login URL', FIELD_TYPES.URL),
        column('username', 'اسم المستخدم', 'Username'),
        column('password', 'كلمة المرور', 'Password', FIELD_TYPES.TEXT, {
          sensitive: true,
          visibleWhen: (a) => a.password_entry_opt_in === 'in_form',
        }),
        column('twofa_method', 'التحقق بخطوتين', '2FA method', FIELD_TYPES.TEXT),
        column('notes', 'ملاحظات', 'Notes', FIELD_TYPES.TEXTAREA),
      ],
      {
        autoRows: 'identified_services',
        helpAr: 'الصفوف تُبنى تلقائياً من إجاباتك في الخطوات السابقة (النطاق، الاستضافة، البريد…)؛ أنت تملأ عمود كلمة المرور فقط.',
      },
    ),

    table(
      'mailbox_passwords',
      'كلمات مرور صناديق البريد',
      'Mailbox passwords',
      [
        column('email', 'البريد الإلكتروني', 'Email address', FIELD_TYPES.EMAIL),
        column('password', 'كلمة المرور', 'Password', FIELD_TYPES.TEXT, {
          sensitive: true,
          visibleWhen: (a) => a.password_entry_opt_in === 'in_form',
        }),
        column('app_password', 'كلمة مرور التطبيق (إن وُجد 2FA)', 'App Password (if 2FA)', FIELD_TYPES.TEXT, {
          sensitive: true,
          latinTerm: 'App Password',
          visibleWhen: (a) => a.password_entry_opt_in === 'in_form',
        }),
        column('twofa_enabled', 'هل 2FA مفعّل؟', '2FA enabled?', FIELD_TYPES.RADIO, { options: YES_NO }),
        column('mailbox_active', 'الصندوق نشط؟', 'Mailbox active?', FIELD_TYPES.RADIO, { options: YES_NO }),
        column('notes', 'ملاحظات', 'Notes', FIELD_TYPES.TEXTAREA),
      ],
      {
        autoRows: 'mailboxes_marked_migrate',
        // Table 1 alone is enough when access is admin-level — see docx.js.
        visibleWhen: (a) => a.migration_access_method && a.migration_access_method !== 'admin',
        helpAr: 'إذا توفّرت صلاحية مشرف (Admin) على مزوّد البريد فلا حاجة لهذا الجدول إطلاقاً.',
      },
    ),
    note('mailbox_passwords_admin_note', 'صلاحية مشرف متاحة، فلا حاجة لكلمات مرور صناديق فردية.', 'Admin access is available, so individual mailbox passwords are not needed.', {
      visibleWhen: (a) => a.migration_access_method === 'admin',
    }),
  ],
};

export const sharedSteps = [stepAfterHandover, stepSaudiRequirements, stepFilesAssets, stepPasswords];

// Re-exported so generators/docx.js etc. can seed table rows without a second
// hand-typed copy of the same list.
export { FILE_ASSET_TYPES };
export { CERTIFICATE_TYPES, CREDENTIAL_SERVICES, MIGRATION_ACCESS };
