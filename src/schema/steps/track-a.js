// TRACK A — التسليم التقني (Technical handover)
// Field wording is reused verbatim from نموذج-تسليم-بيانات-المشروع.xlsx (the
// canonical offline version of this form) wherever a sheet maps directly to
// a step. Where one FLOW step only covers *part* of a sheet (e.g. حقول
// "الاستضافة" split across A4 Hosting and A10 SSL & security here, so each
// stays a manageable screen instead of one long wall of fields), appliesTo /
// requiredFor still follow that sheet's row in the routing matrix
// (تعليمات التعبئة). See README.md → "Editing the questionnaire" for how a
// step's `appliesTo` vs `requiredFor` feed the branching and the readiness
// score.

import {
  field,
  table,
  column,
  note,
  FIELD_TYPES,
  REGISTRARS,
  HOSTING_PANELS,
  MAIL_PROVIDERS,
  CURRENT_PLATFORMS,
  YES_NO,
  MIGRATION_ACCESS,
  MAILBOX_ACTIONS,
  PAGE_DECISIONS,
  PRIORITY,
  REDESIGN_DEGREE,
  LOGO_FORMATS,
  IMPRESSION_OPTIONS,
  REFERENCE_ASPECT,
  COPY_OR_INSPIRE,
  THIRD_PARTY_SERVICES,
  PROJECT_TYPE_LIST,
} from '../constants.js';

// ---------------------------------------------------------------------------
// A1 — نوع المشروع (Project type)
// ---------------------------------------------------------------------------
export const stepA1ProjectType = {
  id: 'a1_project_type',
  track: 'A',
  titleAr: 'نوع المشروع',
  titleEn: 'Project type',
  appliesTo: ['new', 'migration', 'redesign', 'email'],
  requiredFor: ['new', 'migration', 'redesign', 'email'],
  fields: [
    field('project_type', 'نوع المشروع', 'Project type', FIELD_TYPES.RADIO, {
      required: true,
      allowUnknown: false,
      options: PROJECT_TYPE_LIST,
      helpAr: 'اختيارك هنا يحدّد الأسئلة التالية — لن نسألك عن الترحيل إذا كان مشروعك موقعاً جديداً بالكامل.',
    }),
  ],
};

// ---------------------------------------------------------------------------
// A2 — الموقع الحالي (Current website)
// A brand-new build has nothing to describe here, so it's excluded outright
// rather than shown-but-optional.
// ---------------------------------------------------------------------------
export const stepA2CurrentSite = {
  id: 'a2_current_site',
  track: 'A',
  titleAr: 'الموقع الحالي',
  titleEn: 'Current website',
  appliesTo: ['migration', 'redesign', 'email'],
  requiredFor: ['migration', 'redesign'],
  fields: [
    field('current_url', 'رابط الموقع الحالي', 'Current website URL', FIELD_TYPES.URL, { required: true }),
    field('current_site_live', 'هل الموقع الحالي يعمل الآن؟', 'Is the current site live?', FIELD_TYPES.RADIO, {
      options: YES_NO,
    }),
    field('current_platform', 'منصة الموقع الحالي', 'Current platform', FIELD_TYPES.SELECT, {
      options: CURRENT_PLATFORMS,
      latinTerm: 'CMS',
    }),
    field('current_builder', 'من قام ببناء الموقع الحالي؟', 'Who built the current site?', FIELD_TYPES.TEXT),
    field('previous_dev_contact', 'هل ما زال التواصل متاحاً مع المطوّر السابق؟', 'Still in contact with the previous developer?', FIELD_TYPES.RADIO, {
      options: YES_NO,
    }),
    field('has_staging', 'هل يوجد موقع تجريبي (Staging)؟', 'Is there a staging site?', FIELD_TYPES.RADIO, {
      options: YES_NO,
      latinTerm: 'Staging',
    }),
    field('content_to_preserve', 'محتوى يجب الحفاظ عليه بالتأكيد', 'Content that must be preserved', FIELD_TYPES.TEXTAREA),
  ],
};

// ---------------------------------------------------------------------------
// A2b — الهوية البصرية وتوجّه التصميم (Brand identity & design direction)
// "This is the step that prevents revision rounds" — give it room.
// ---------------------------------------------------------------------------
export const stepA2bBrandDesign = {
  id: 'a2b_brand_design',
  track: 'A',
  titleAr: 'الهوية البصرية وتوجّه التصميم',
  titleEn: 'Brand identity & design direction',
  appliesTo: ['new', 'migration', 'redesign'],
  requiredFor: ['new', 'migration', 'redesign'],
  fields: [
    field('redesign_degree', 'المطلوب: درجة التغيير', 'How much should change', FIELD_TYPES.RADIO, {
      required: true,
      allowUnknown: false,
      options: REDESIGN_DEGREE,
      helpAr: 'هذا الاختيار يحدّد لهجة بقية هذه الخطوة بالكامل.',
    }),
    field('current_dislikes', 'ما الذي لا يعجبكم في الموقع الحالي؟', "What don't you like about the current site?", FIELD_TYPES.TEXTAREA),
    field('must_keep', 'ما الذي يجب الحفاظ عليه كما هو بالضبط؟', 'What must stay exactly as it is?', FIELD_TYPES.TEXTAREA),
    field('sections_to_remove', 'هل يوجد صفحات أو أقسام يجب حذفها؟', 'Any pages or sections to remove?', FIELD_TYPES.TEXTAREA),

    note('logo_group', 'الشعار (Logo)', 'Logo'),
    field('logo_approved', 'هل الشعار الحالي معتمد أم يحتاج تحديثاً؟', 'Is the current logo approved, or does it need updating?', FIELD_TYPES.RADIO, {
      options: [{ value: 'approved', ar: 'معتمد' }, { value: 'needs_update', ar: 'يحتاج تحديثاً' }],
    }),
    field('logo_formats', 'الصيغ المتوفرة للشعار', 'Available logo formats', FIELD_TYPES.SELECT, {
      options: LOGO_FORMATS,
      multiple: true,
      flagsReview: 'logo_jpg_only',
      helpAr: 'إن كانت لديك JPG فقط، سيحتاج الشعار لإعادة رسم بصيغة فيكتور — هذا يستحق معرفته الآن.',
    }),
    field('logo_horizontal_square', 'هل يوجد نسخة أفقية ونسخة مربعة من الشعار؟', 'Horizontal and square versions available?', FIELD_TYPES.RADIO, { options: YES_NO }),
    field('logo_white_version', 'هل يوجد نسخة بيضاء للخلفيات الداكنة؟', 'A white version for dark backgrounds?', FIELD_TYPES.RADIO, { options: YES_NO }),
    field('favicon_available', 'أيقونة الموقع (Favicon) — متوفرة؟', 'Favicon available?', FIELD_TYPES.RADIO, { options: YES_NO, latinTerm: 'Favicon' }),

    note('colors_fonts_group', 'الألوان والخطوط', 'Colors & fonts'),
    field('keep_current_colors', 'هل نحافظ على ألوان الموقع الحالي أم نغيّرها؟', 'Keep the current colors, or change them?', FIELD_TYPES.RADIO, {
      options: [{ value: 'keep', ar: 'نحافظ عليها' }, { value: 'change', ar: 'نغيّرها' }],
    }),
    field('brand_colors_hex', 'أكواد الألوان المعتمدة (HEX) — الأساسي والثانوي', 'Approved brand colors (HEX) — primary & secondary', FIELD_TYPES.TEXT),
    field('arabic_font', 'الخط العربي المستخدم', 'Arabic font in use', FIELD_TYPES.TEXT),
    field('latin_font', 'الخط الإنجليزي المستخدم', 'Latin font in use', FIELD_TYPES.TEXT),
    field('fonts_licensed', 'هل الخطوط مرخّصة للاستخدام على الويب؟', 'Are the fonts licensed for web use?', FIELD_TYPES.RADIO, { options: YES_NO }),
    field('has_brand_guidelines', 'هل يوجد دليل هوية بصرية (Brand Guidelines)؟', 'Is there a brand guidelines document?', FIELD_TYPES.RADIO, { options: YES_NO }),

    note('direction_group', 'توجّه التصميم', 'Design direction'),
    field('desired_impression', 'الانطباع المطلوب', 'Desired impression', FIELD_TYPES.SELECT, {
      options: IMPRESSION_OPTIONS,
      multiple: true,
    }),
    field('wants_dark_mode', 'هل تريدون وضعاً داكناً (Dark Mode)؟', 'Do you want a dark mode?', FIELD_TYPES.RADIO, {
      options: YES_NO,
      latinTerm: 'Dark Mode',
    }),

    note('flags_group', 'تحذيرات مهمة', 'Important flags'),
    field('rebrand_planned', 'هل هناك تغيير قادم للهوية البصرية (Rebranding)؟', 'Is a rebrand planned soon?', FIELD_TYPES.RADIO, {
      options: YES_NO,
      flagsReview: 'rebrand_planned',
      helpAr: 'إن كانت الإجابة نعم: لا يُنصح ببناء الموقع على الهوية الحالية — سنوضح ذلك في ملاحظات المراجعة.',
    }),
    field('identity_approved_by_management', 'هل الهوية الحالية معتمدة من الإدارة العليا؟', 'Is the current identity approved by management?', FIELD_TYPES.RADIO, {
      options: YES_NO,
      decisionLevel: 'decision_maker',
    }),
    field('keep_or_replace_images', 'الصور الحالية على الموقع: نُبقيها أم نستبدلها؟', 'Keep or replace the current site images?', FIELD_TYPES.RADIO, {
      options: [{ value: 'keep', ar: 'نُبقيها' }, { value: 'replace', ar: 'نستبدلها' }],
      decisionLevel: 'decision_maker',
    }),
    field('copy_as_is_or_rewrite', 'النصوص الحالية: ننقلها كما هي أم نعيد صياغتها؟', 'Move the current copy as-is, or rewrite it?', FIELD_TYPES.RADIO, {
      options: [{ value: 'as_is', ar: 'كما هي' }, { value: 'rewrite', ar: 'إعادة صياغة' }],
    }),
    field('urls_must_stay_same', 'هل يجب الحفاظ على روابط الصفحات الحالية كما هي (للسيو)؟', 'Must the current page URLs stay unchanged (for SEO)?', FIELD_TYPES.RADIO, {
      options: YES_NO,
      latinTerm: 'SEO',
      decisionLevel: 'decision_maker',
    }),

    table(
      'reference_sites',
      'مواقع مرجعية — «أريد موقعي شبه هذا»',
      'Reference sites',
      [
        column('url', 'رابط الموقع', 'Website URL', FIELD_TYPES.URL, { required: true }),
        column('like_dislike', 'التقييم', 'Like / Dislike', FIELD_TYPES.RADIO, {
          options: [{ value: 'like', ar: 'يعجبنا' }, { value: 'dislike', ar: 'لا يعجبنا' }],
        }),
        column('what_exactly', 'ما الذي يعجبكم أو لا يعجبكم فيه تحديداً؟', 'What exactly', FIELD_TYPES.TEXTAREA),
        column('aspect', 'الجانب المقصود', 'Which aspect', FIELD_TYPES.SELECT, { options: REFERENCE_ASPECT }),
        column('copy_or_inspire', 'نسخ قريب أم استلهام؟', 'Copy closely or take inspiration?', FIELD_TYPES.RADIO, { options: COPY_OR_INSPIRE }),
        column('priority', 'الأولوية', 'Priority', FIELD_TYPES.RADIO, { options: PRIORITY }),
      ],
      { helpAr: '"أريد موقعي شبه هذا" أصدق جملة يقولها عميل — لكنها غامضة وحدها. هذا الجدول يحوّلها إلى تعليمات قابلة للتنفيذ.' },
    ),
  ],
};

// ---------------------------------------------------------------------------
// A3 — النطاق (Domain)
// ---------------------------------------------------------------------------
export const stepA3Domain = {
  id: 'a3_domain',
  track: 'A',
  titleAr: 'النطاق (Domain)',
  titleEn: 'Domain',
  appliesTo: ['new', 'migration', 'redesign', 'email'],
  requiredFor: ['new', 'migration', 'redesign', 'email'],
  fields: [
    field('domain_primary', 'اسم النطاق الأساسي', 'Primary domain name', FIELD_TYPES.TEXT, { required: true, allowUnknown: false }),
    field('domain_registrar', 'شركة تسجيل النطاق', 'Domain registrar', FIELD_TYPES.SELECT, { options: REGISTRARS }),
    field('registrar_panel_url', 'رابط لوحة التحكم', 'Registrar control panel URL', FIELD_TYPES.URL, {
      helpAr: 'عادة رابط مثل my.registrar.com. ابحث في بريدك عن رسالة تسجيل النطاق.',
    }),
    field('registrar_username', 'اسم المستخدم', 'Username'),
    field('domain_registered_email', 'البريد المسجّل باسمه النطاق', 'Email the domain is registered under', FIELD_TYPES.EMAIL),
    field('domain_expiry', 'تاريخ انتهاء النطاق', 'Domain expiry date', FIELD_TYPES.DATE, {
      flagsReview: 'domain_expiring_soon',
    }),
    field('auto_renew_enabled', 'هل التجديد التلقائي مفعّل؟', 'Is auto-renew enabled?', FIELD_TYPES.RADIO, { options: YES_NO }),
    field('dns_managed_where', 'أين تُدار سجلات DNS حالياً؟', 'Where is DNS currently managed?', FIELD_TYPES.TEXT, {
      latinTerm: 'DNS',
    }),
    field('domain_locked', 'هل النطاق مقفل (Registrar Lock)؟', 'Is the domain locked?', FIELD_TYPES.RADIO, { options: YES_NO }),
    field('epp_code_available', 'هل يتوفر كود النقل EPP / Auth Code؟', 'Is the EPP / Auth code available?', FIELD_TYPES.RADIO, {
      options: YES_NO,
      latinTerm: 'EPP / Auth Code',
      helpAr: 'يُطلب من شركة تسجيل النطاق الحالية، وهو مطلوب لنقل النطاق بين الشركات.',
    }),
    field('subdomains_in_use', 'النطاقات الفرعية المستخدمة حالياً', 'Subdomains currently in use', FIELD_TYPES.TEXTAREA),
    field('other_domains_owned', 'نطاقات أخرى مملوكة للشركة', 'Other domains owned by the company', FIELD_TYPES.TEXTAREA),
    field('domain_2fa_enabled', 'هل يوجد تفعيل للتحقق بخطوتين على الحساب؟', 'Is 2FA enabled on the account?', FIELD_TYPES.RADIO, {
      options: YES_NO,
      latinTerm: '2FA',
    }),
  ],
};

// ---------------------------------------------------------------------------
// A4 — الاستضافة (Hosting)
// ---------------------------------------------------------------------------
export const stepA4Hosting = {
  id: 'a4_hosting',
  track: 'A',
  titleAr: 'الاستضافة (Hosting)',
  titleEn: 'Hosting',
  appliesTo: ['new', 'migration', 'redesign'],
  requiredFor: ['new', 'migration', 'redesign'],
  fields: [
    field('hosting_provider', 'شركة الاستضافة', 'Hosting provider', FIELD_TYPES.TEXT, { required: true }),
    field('hosting_panel_type', 'نوع لوحة التحكم', 'Control panel type', FIELD_TYPES.SELECT, {
      options: HOSTING_PANELS,
      latinTerm: 'cPanel / Plesk / CyberPanel',
    }),
    field('hosting_panel_url', 'رابط لوحة التحكم', 'Control panel URL', FIELD_TYPES.URL, {
      helpAr: 'عادة يكون على شكل yoursite.com/cpanel أو رابط أرسلته لك شركة الاستضافة عند الاشتراك. ابحث في بريدك عن رسالة الترحيب منهم.',
    }),
    field('hosting_username', 'اسم المستخدم', 'Username'),
    field('hosting_plan_type', 'نوع الخطة', 'Plan type', FIELD_TYPES.SELECT, {
      options: [
        { value: 'shared', ar: 'مشتركة' },
        { value: 'vps', ar: 'VPS' },
        { value: 'dedicated', ar: 'خادم مخصص' },
      ],
    }),
    field('hosting_expiry', 'تاريخ انتهاء الاستضافة', 'Hosting expiry date', FIELD_TYPES.DATE),
    field('ssh_available', 'هل يتوفر وصول SSH؟', 'Is SSH access available?', FIELD_TYPES.RADIO, {
      options: YES_NO,
      latinTerm: 'SSH',
    }),
    field('ftp_available', 'هل يتوفر وصول FTP / SFTP؟', 'Is FTP / SFTP access available?', FIELD_TYPES.RADIO, {
      options: YES_NO,
      latinTerm: 'FTP / SFTP',
    }),
    field('database_access', 'بيانات قاعدة البيانات (الاسم والمستخدم)', 'Database name & user', FIELD_TYPES.TEXT),
    field('php_version', 'إصدار PHP الحالي', 'Current PHP version', FIELD_TYPES.TEXT, { latinTerm: 'PHP' }),
    field('site_size_gb', 'حجم الموقع التقريبي (جيجابايت)', 'Approximate site size (GB)', FIELD_TYPES.NUMBER),
    field('recent_backup', 'هل توجد نسخة احتياطية حديثة؟ وأين؟', 'Is there a recent backup? Where?', FIELD_TYPES.TEXTAREA, {
      flagsReview: 'no_backup',
    }),
  ],
};

// ---------------------------------------------------------------------------
// A10 — SSL والأمان (SSL & security) — tail of the "الاستضافة" sheet, split
// into its own screen so A4 doesn't turn into a wall of fields.
// ---------------------------------------------------------------------------
export const stepA10SslSecurity = {
  id: 'a10_ssl_security',
  track: 'A',
  titleAr: 'SSL والأمان',
  titleEn: 'SSL & security',
  appliesTo: ['new', 'migration', 'redesign'],
  requiredFor: ['new', 'migration', 'redesign'],
  fields: [
    field('ssl_provider', 'شهادة SSL: المزوّد ونوعها', 'SSL certificate: provider and type', FIELD_TYPES.TEXT, { latinTerm: 'SSL' }),
    field('wildcard_needed', 'هل تحتاج شهادة Wildcard؟', 'Is a wildcard certificate needed?', FIELD_TYPES.RADIO, { options: YES_NO }),
    field('firewall_cdn', 'هل يوجد جدار حماية أو CDN (Cloudflare / Sucuri)؟', 'Any firewall or CDN?', FIELD_TYPES.TEXT, {
      latinTerm: 'WAF / CDN',
    }),
    field('cloudflare_owner', 'اسم صاحب حساب Cloudflare إن وُجد', 'Cloudflare account owner if any', FIELD_TYPES.TEXT),
    field('hosting_2fa_enabled', 'هل يوجد تفعيل للتحقق بخطوتين على الحساب؟', 'Is 2FA enabled on the account?', FIELD_TYPES.RADIO, {
      options: YES_NO,
      latinTerm: '2FA',
    }),
  ],
};

// ---------------------------------------------------------------------------
// A5 — البريد الإلكتروني: الوضع الحالي (Mail — current setup)
// ---------------------------------------------------------------------------
export const stepA5MailCurrent = {
  id: 'a5_mail_current',
  track: 'A',
  titleAr: 'البريد الإلكتروني — الوضع الحالي',
  titleEn: 'Mail — current setup',
  appliesTo: ['new', 'migration', 'redesign', 'email'],
  requiredFor: ['new', 'migration', 'email'],
  fields: [
    field('mail_provider_current', 'مزوّد البريد الحالي', 'Current mail provider', FIELD_TYPES.SELECT, {
      options: MAIL_PROVIDERS,
      required: true,
    }),
    field('mail_admin_console_url', 'رابط لوحة تحكم البريد', 'Mail admin console URL', FIELD_TYPES.URL),
    field('mail_admin_username', 'اسم مستخدم المشرف', 'Admin username'),
    field('mailbox_count_reported', 'عدد صناديق البريد الحالية', 'Number of existing mailboxes', FIELD_TYPES.NUMBER, {
      flagsReview: 'mailbox_count_mismatch',
    }),
    field('mx_current_target', 'إلى أين تشير سجلات MX حالياً؟', 'Where do the MX records currently point?', FIELD_TYPES.TEXT, {
      latinTerm: 'MX',
      flagsReview: 'mx_points_at_old_provider',
    }),
    field('mail_admin_2fa', 'هل التحقق بخطوتين مفعّل على حساب المشرف؟', 'Is 2FA enabled on the admin account?', FIELD_TYPES.RADIO, {
      options: YES_NO,
      latinTerm: '2FA',
      flagsReview: 'admin_2fa_needs_app_password',
    }),
    field('mail_provider_target', 'المزوّد المطلوب بعد المشروع', 'Target provider after the project', FIELD_TYPES.SELECT, {
      options: MAIL_PROVIDERS,
    }),
    field('unified_signature_needed', 'هل تحتاج توقيعاً موحداً لجميع الموظفين؟', 'Do you need a unified email signature?', FIELD_TYPES.RADIO, { options: YES_NO }),
    field('group_aliases_needed', 'هل تحتاج قوائم بريدية (info@ / sales@ …)؟', 'Do you need group / alias addresses?', FIELD_TYPES.RADIO, { options: YES_NO }),
    field('mailbox_quota', 'الحجم التخزيني المطلوب لكل صندوق', 'Storage quota required per mailbox', FIELD_TYPES.TEXT),
    field('mail_client_usage', 'هل يستخدم الموظفون Outlook أم المتصفح أم الجوال؟', 'Do staff use Outlook, webmail, or mobile?', FIELD_TYPES.TEXT, {
      latinTerm: 'Outlook / Webmail',
    }),
  ],
};

// ---------------------------------------------------------------------------
// A5b — البريد: بيانات الخادم وطريقة الترحيل (Mail — server settings & access)
// "This is the section that decides how much work the migration is" — kept
// prominent as its own step rather than folded into A5.
// visibleWhen lets the wizard engine also surface it if any mailbox row later
// gets marked "migrate", even for a project type that doesn't require it by
// default (e.g. a redesign that turns out to touch mail after all).
// ---------------------------------------------------------------------------
export const stepA5bMailMigrationAccess = {
  id: 'a5b_mail_migration_access',
  track: 'A',
  titleAr: 'البريد — بيانات الخادم وطريقة الترحيل',
  titleEn: 'Mail — server settings & migration access',
  appliesTo: ['migration', 'email'],
  requiredFor: ['migration', 'email'],
  visibleWhen: (answers) =>
    ['migration', 'email'].includes(answers.project_type) ||
    (answers.a6_mailboxes || []).some((row) => row.action === 'migrate'),
  fields: [
    field('imap_host_port', 'خادم IMAP الحالي: العنوان والمنفذ', 'Current IMAP server: host & port', FIELD_TYPES.TEXT, {
      latinTerm: 'IMAP',
      required: true,
    }),
    field('smtp_host_port', 'خادم SMTP الحالي: العنوان والمنفذ', 'Current SMTP server: host & port', FIELD_TYPES.TEXT, {
      latinTerm: 'SMTP',
    }),
    field('imap_enabled_all', 'هل بروتوكول IMAP مفعّل لجميع الصناديق؟', 'Is IMAP enabled for all mailboxes?', FIELD_TYPES.RADIO, {
      options: YES_NO,
      latinTerm: 'IMAP',
      flagsReview: 'imap_not_enabled',
    }),
    field('migration_access_method', 'طريقة الوصول للترحيل', 'Migration access method', FIELD_TYPES.RADIO, {
      required: true,
      allowUnknown: false,
      options: MIGRATION_ACCESS,
      helpAr: 'هذا الاختيار يحدّد كل ما بعده: صلاحية مشرف تختصر كل شيء في حساب واحد، وإلا سنحتاج كلمة مرور كل صندوق على حدة.',
    }),
    field('staff_mailbox_2fa', 'هل التحقق بخطوتين مفعّل على صناديق الموظفين؟', 'Is 2FA enabled on staff mailboxes?', FIELD_TYPES.RADIO, {
      options: YES_NO,
      latinTerm: '2FA',
      flagsReview: 'staff_2fa_needs_app_passwords',
      helpAr: 'إن كانت الإجابة نعم: سيلزم إنشاء App Password لكل صندوق بدلاً من كلمة المرور الأصلية.',
    }),
    field('old_provider_contract_end', 'تاريخ انتهاء عقد المزوّد الحالي', 'Current provider contract end date', FIELD_TYPES.DATE, {
      flagsReview: 'contract_ends_before_golive',
    }),
    field('old_account_grace_days', 'كم يوماً يبقى الحساب القديم فعالاً بعد الترحيل؟', 'How many days should the old account stay active after migration?', FIELD_TYPES.NUMBER, {
      helpAr: 'لا تُلغِ الاشتراك القديم قبل التأكد من نجاح الترحيل بالكامل.',
    }),
    field('mail_migrated_before', 'هل سبق أن تم ترحيل هذا البريد من قبل؟', 'Has this email been migrated before?', FIELD_TYPES.RADIO, { options: YES_NO }),
  ],
};

// ---------------------------------------------------------------------------
// A6 — جدول صناديق البريد (Mailbox table) — the single most important screen.
// ---------------------------------------------------------------------------
export const stepA6Mailboxes = {
  id: 'a6_mailboxes',
  track: 'A',
  titleAr: 'صناديق البريد',
  titleEn: 'Mailboxes',
  appliesTo: ['new', 'migration', 'redesign', 'email'],
  requiredFor: ['new', 'migration', 'email'],
  fields: [
    table(
      'a6_mailboxes',
      'جدول صناديق البريد',
      'Mailbox table',
      [
        column('email', 'البريد الإلكتروني', 'Email address', FIELD_TYPES.EMAIL, { required: true }),
        column('owner_name', 'اسم المالك', 'Owner name'),
        column('department', 'القسم', 'Department'),
        column('action', 'الإجراء المطلوب', 'Action', FIELD_TYPES.SELECT, { options: MAILBOX_ACTIONS, required: true }),
        column('current_size', 'الحجم الحالي', 'Current mailbox size'),
        column('quota_needed', 'الحجم المطلوب', 'Quota needed'),
        column('aliases', 'أسماء بديلة (Alias)', 'Aliases'),
        column('forward_to', 'تحويل إلى', 'Forwarding to'),
        column('notes', 'ملاحظات', 'Notes', FIELD_TYPES.TEXTAREA),
      ],
      {
        pasteHelper: true,
        helpAr: 'الصق قائمة بريد إلكتروني، سطراً في كل مرة، وسنحوّلها تلقائياً إلى صفوف.',
        liveCounter: true,
      },
    ),
  ],
};

// ---------------------------------------------------------------------------
// A7 — نطاق الترحيل (Migration scope)
// ---------------------------------------------------------------------------
export const stepA7MigrationScope = {
  id: 'a7_migration_scope',
  track: 'A',
  titleAr: 'نطاق الترحيل',
  titleEn: 'Migration scope',
  appliesTo: ['migration', 'redesign', 'email'],
  requiredFor: ['migration', 'email'],
  visibleWhen: (answers) =>
    ['migration', 'email'].includes(answers.project_type) ||
    (answers.a6_mailboxes || []).some((row) => row.action === 'migrate'),
  fields: [
    note('email_migration_group', 'ترحيل البريد', 'Email migration'),
    field('migrate_old_emails', 'هل تريد ترحيل الرسائل القديمة؟', 'Migrate old emails?', FIELD_TYPES.RADIO, { options: YES_NO }),
    field('migrate_how_far_back', 'إلى أي مدى زمني؟', 'How far back?', FIELD_TYPES.SELECT, {
      options: [
        { value: 'all', ar: 'الكل' },
        { value: '1y', ar: 'سنة واحدة' },
        { value: '2y', ar: 'سنتان' },
      ],
    }),
    field('migrate_contacts', 'ترحيل جهات الاتصال؟', 'Migrate contacts?', FIELD_TYPES.RADIO, { options: YES_NO }),
    field('migrate_calendars', 'ترحيل التقويمات؟', 'Migrate calendars?', FIELD_TYPES.RADIO, { options: YES_NO }),
    field('migrate_shared_drives', 'ترحيل الملفات والمجلدات المشتركة؟', 'Migrate shared drives / files?', FIELD_TYPES.RADIO, { options: YES_NO }),
    field('total_data_size', 'الحجم التقريبي الإجمالي للبيانات', 'Approximate total data size', FIELD_TYPES.TEXT, {
      flagsReview: 'migrate_no_size_given',
    }),
    field('largest_mailbox_size', 'أكبر حجم لصندوق بريد واحد', 'Largest single mailbox size', FIELD_TYPES.TEXT),
    field('migrate_auto_replies', 'ترحيل الردود التلقائية (Auto-reply)؟', 'Migrate auto-replies?', FIELD_TYPES.RADIO, { options: YES_NO }),
    field('migrate_rules_filters', 'ترحيل قواعد وفلاتر البريد؟', 'Migrate rules & filters?', FIELD_TYPES.RADIO, { options: YES_NO }),
    field('migrate_signatures', 'ترحيل التوقيعات؟', 'Migrate signatures?', FIELD_TYPES.RADIO, { options: YES_NO }),
    field('migrate_groups_lists', 'ترحيل القوائم البريدية ومجموعات التوزيع؟', 'Migrate groups & distribution lists?', FIELD_TYPES.RADIO, { options: YES_NO }),
    field('migrate_shared_delegated', 'ترحيل الصناديق المشتركة والمفوَّضة؟', 'Migrate shared & delegated mailboxes?', FIELD_TYPES.RADIO, { options: YES_NO }),
    field('staff_keep_using_email', 'هل سيستمر الموظفون في استخدام البريد أثناء الترحيل؟', 'Will staff keep using email during the migration?', FIELD_TYPES.RADIO, { options: YES_NO }),
    field('who_reconfigures_devices', 'من سيعيد ضبط أجهزة الجوال وبرنامج Outlook للموظفين؟', 'Who will reconfigure staff phones and Outlook?', FIELD_TYPES.TEXT),
    field('staff_need_training', 'هل يحتاج الموظفون إلى شرح أو تدريب بعد الترحيل؟', 'Do staff need training after migration?', FIELD_TYPES.RADIO, { options: YES_NO }),

    note('website_migration_group', 'ترحيل الموقع', 'Website migration'),
    field('migrate_database', 'ترحيل قاعدة البيانات؟', 'Migrate the database?', FIELD_TYPES.RADIO, { options: YES_NO }),
    field('migrate_media', 'ترحيل الصور والملفات المرفوعة؟', 'Migrate media / uploads?', FIELD_TYPES.RADIO, { options: YES_NO }),
    field('migrate_users', 'ترحيل حسابات المستخدمين؟', 'Migrate registered users?', FIELD_TYPES.RADIO, { options: YES_NO }),
    field('migrate_orders', 'ترحيل الطلبات والمبيعات؟', 'Migrate orders?', FIELD_TYPES.RADIO, { options: YES_NO }),
    field('migrate_blog', 'ترحيل المدونة والمقالات؟', 'Migrate blog posts?', FIELD_TYPES.RADIO, { options: YES_NO }),
    field('migrate_reviews', 'ترحيل تقييمات العملاء؟', 'Migrate reviews?', FIELD_TYPES.RADIO, { options: YES_NO }),
    field('needs_301_redirects', 'هل هناك روابط قديمة يجب إعادة توجيهها (301)؟', 'Old URLs needing 301 redirects?', FIELD_TYPES.RADIO, {
      options: YES_NO,
      latinTerm: '301',
    }),
  ],
};

// ---------------------------------------------------------------------------
// A7b — جرد الصفحات (Page inventory)
// "Stops scope creeping silently."
// ---------------------------------------------------------------------------
export const stepA7bPageInventory = {
  id: 'a7b_page_inventory',
  track: 'A',
  titleAr: 'جرد صفحات الموقع الحالي',
  titleEn: 'Page inventory',
  appliesTo: ['migration', 'redesign'],
  requiredFor: ['migration', 'redesign'],
  fields: [
    table(
      'page_inventory',
      'جدول جرد الصفحات',
      'Page inventory table',
      [
        column('page_url', 'رابط الصفحة', 'Page URL', FIELD_TYPES.URL, { required: true }),
        column('page_title', 'عنوان الصفحة', 'Page title'),
        column('decision', 'القرار', 'Decision', FIELD_TYPES.SELECT, { options: PAGE_DECISIONS, required: true }),
        column('redirect_target', 'إذا (دمج/تحويل): إلى أي صفحة؟', 'If merge/redirect: to where?', FIELD_TYPES.TEXT, {
          flagsReview: 'redirect_missing_target',
        }),
        column('priority', 'الأولوية', 'Priority', FIELD_TYPES.RADIO, { options: PRIORITY }),
        column('notes', 'ملاحظات', 'Notes', FIELD_TYPES.TEXTAREA),
      ],
      {
        sitemapImportHelper: true,
        helpAr: 'الصق رابط sitemap.xml أو محتواه، أو ألصق قائمة روابط سطراً بسطر — ستتحول تلقائياً إلى صفوف. لا يتم إرسال أي طلب شبكة؛ اللصق يُقرأ محلياً فقط.',
        liveCounter: true,
      },
    ),
  ],
};

// ---------------------------------------------------------------------------
// A8 — التحويل والإطلاق (Cutover)
// ---------------------------------------------------------------------------
export const stepA8Cutover = {
  id: 'a8_cutover',
  track: 'A',
  titleAr: 'التحويل والإطلاق',
  titleEn: 'Cutover',
  appliesTo: ['migration', 'redesign', 'email'],
  requiredFor: ['migration', 'email'],
  fields: [
    field('cutover_window', 'الوقت المفضّل لنافذة التوقف', 'Preferred downtime window (date & time)', FIELD_TYPES.TEXT),
    field('blackout_dates', 'أيام أو أوقات ممنوع فيها العمل', 'Blackout dates or times', FIELD_TYPES.TEXTAREA),
    field('acceptable_downtime_minutes', 'المدة المقبولة للتوقف بالدقائق', 'Acceptable downtime in minutes', FIELD_TYPES.NUMBER),
    field('golive_approver', 'من يعتمد الإطلاق النهائي؟', 'Who gives final go-live approval?', FIELD_TYPES.TEXT, {
      decisionLevel: 'decision_maker',
    }),
  ],
};

// ---------------------------------------------------------------------------
// A9 — الحسابات الخارجية (Third-party accounts)
// ---------------------------------------------------------------------------
export const stepA9ThirdParty = {
  id: 'a9_third_party',
  track: 'A',
  titleAr: 'الحسابات والخدمات الخارجية',
  titleEn: 'Third-party accounts',
  appliesTo: ['new', 'migration', 'redesign'],
  requiredFor: ['new', 'migration', 'redesign'],
  fields: [
    table(
      'third_party_accounts',
      'جدول الحسابات الخارجية',
      'Third-party accounts table',
      [
        column('service', 'الخدمة', 'Service', FIELD_TYPES.SELECT, { options: THIRD_PARTY_SERVICES, required: true }),
        column('account_owner_email', 'البريد/الحساب المالك', 'Account owner email', FIELD_TYPES.EMAIL),
        column('panel_url', 'رابط لوحة التحكم', 'Panel URL', FIELD_TYPES.URL),
        column('username', 'اسم المستخدم', 'Username'),
        column('access_needed', 'هل نحتاج الوصول؟', 'Access needed?', FIELD_TYPES.RADIO, { options: YES_NO }),
        column('notes', 'ملاحظات', 'Notes', FIELD_TYPES.TEXTAREA),
      ],
    ),
  ],
};

// ---------------------------------------------------------------------------
// A11 — جهات الاتصال والاعتمادات (Contacts & approvals)
// ---------------------------------------------------------------------------
export const stepA11Contacts = {
  id: 'a11_contacts',
  track: 'A',
  titleAr: 'جهات الاتصال والاعتمادات',
  titleEn: 'Contacts & approvals',
  appliesTo: ['new', 'migration', 'redesign', 'email'],
  requiredFor: ['new', 'migration', 'redesign', 'email'],
  fields: [
    field('technical_contact', 'المسؤول التقني: الاسم والجوال والبريد', 'Technical contact', FIELD_TYPES.TEXT, {
      required: true,
      allowUnknown: false,
    }),
    field('decision_maker_contact', 'صاحب القرار: الاسم والجوال والبريد', 'Decision maker', FIELD_TYPES.TEXT, {
      required: true,
      allowUnknown: false,
      decisionLevel: 'decision_maker',
    }),
    field('billing_contact', 'مسؤول الحسابات والفواتير', 'Billing contact', FIELD_TYPES.TEXT),
    field('preferred_channel', 'قناة التواصل المفضلة', 'Preferred communication channel', FIELD_TYPES.SELECT, {
      options: [
        { value: 'whatsapp', ar: 'واتساب' },
        { value: 'email', ar: 'بريد إلكتروني' },
        { value: 'calls', ar: 'اجتماعات/مكالمات' },
      ],
      allowUnknown: false,
    }),
  ],
};

export const trackASteps = [
  stepA1ProjectType,
  stepA2CurrentSite,
  stepA2bBrandDesign,
  stepA3Domain,
  stepA4Hosting,
  stepA10SslSecurity,
  stepA5MailCurrent,
  stepA5bMailMigrationAccess,
  stepA6Mailboxes,
  stepA7MigrationScope,
  stepA7bPageInventory,
  stepA8Cutover,
  stepA9ThirdParty,
  stepA11Contacts,
];
