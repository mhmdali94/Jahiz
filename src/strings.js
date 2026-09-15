// All UI chrome wording lives here — one flat file, no i18n framework.
// Field labels/help text are NOT here; they live as data next to each field
// in src/schema/steps/*.js so the schema stays the single source of truth
// for the questionnaire (see schema/index.js). This file only holds text
// that isn't tied to one specific field: buttons, banners, the review
// screen, generated-file messaging, password-step chrome, access control,
// and draft import/export.
//
// Placeholders use {curlyBraces} — the code that renders a string does the
// substitution; nothing here does string interpolation itself, so this file
// stays pure data.

export const strings = {
  app: {
    brandAr: 'جاهز',
    brandLatin: 'Jahiz',
    titleAr: 'نموذج تسليم بيانات المشروع',
    titleEn: 'Project Handover & Data Collection Form',
  },

  welcome: {
    taglineAr: 'أجيبوا عن بعض الأسئلة حول مشروعكم لنبدأ العمل مباشرة — يستغرق بضع دقائق فقط',
    servicesIntroAr: 'اختر الخدمة المطلوبة',
    services: [
      { key: 'website', titleAr: 'الموقع الإلكتروني', latin: 'Website', descAr: 'موقع جديد، إعادة تصميم، أو ترحيل من مزوّد آخر' },
      { key: 'mail', titleAr: 'البريد الإلكتروني', latin: 'Mail', descAr: 'إنشاء بريد جديد أو ترحيل بريد قائم' },
    ],
    changeSelectionAr: 'تغيير',
    selectedServiceAr: 'الخدمة المختارة',
    loginPromptAr: 'أدخل الرمز الذي أرسلناه لكم للبدء',
    submitAr: 'دخول',
    codeErrorAr: 'الرمز غير صحيح. تأكد من كتابته كما وصلك تماماً.',
  },

  privacyBanner: {
    ar: 'بياناتك لا تغادر جهازك — لا يتم رفع أي معلومة إلى أي خادم',
    en: 'Your data never leaves your device — nothing is uploaded to any server.',
  },

  nav: {
    next: 'التالي',
    back: 'السابق',
    skip: 'تخطّي',
    skipThisStep: 'تخطّي هذه الخطوة',
    finish: 'مراجعة وإنشاء الملفات',
    edit: 'تعديل',
    addRow: 'إضافة صف',
    duplicateRow: 'تكرار الصف',
    deleteRow: 'حذف الصف',
    continueWhereLeftOff: 'متابعة من حيث توقفت',
  },

  start: {
    trackHelpAr: 'اختر ما تريد إنجازه. الخطوات المتعلقة بالخيار الآخر لن تظهر لك.',
  },

  autosave: {
    draftFoundAr: 'وجدنا مسودة محفوظة بتاريخ {date} — هل تريد المتابعة؟',
    draftFoundEn: 'We found a draft saved on {date} — would you like to continue?',
    continueDraft: 'المتابعة',
    startFresh: 'البدء من جديد',
    lastSavedAr: 'آخر حفظ: {date}',
    savingAr: 'جارٍ الحفظ…',
    savedAr: 'تم الحفظ',
  },

  privateMode: {
    warningAr: 'أنت في وضع تصفح خاص (Incognito) — لن يتم حفظ أي شيء تكتبه في هذا الوضع، وستفقد كل إجاباتك عند إغلاق النافذة. الرجاء فتح هذا الرابط في نافذة عادية قبل المتابعة.',
    warningEn: "You're in a private/incognito window — nothing you type will be saved here. Please open this link in a normal window before continuing.",
  },

  unknownToggle: {
    labelAr: 'لا أعرف / ليس لدي',
    labelEn: "I don't know / I don't have it",
  },

  upload: {
    dropzoneAr: 'اسحب الصور هنا أو اضغط للاختيار',
    dropzoneEn: 'Drag images here or click to choose',
    runningTotalAr: '{count} صورة · {size}',
    progressAr: 'جارٍ تجهيز الصور {done} من {total}',
    rejectedTypeAr: 'هذا النوع من الملفات غير مدعوم. المسموح: JPG, PNG, WEBP, SVG, PDF.',
    persistentStorageDeniedAr: 'المتصفح لم يمنح مساحة تخزين دائمة — قد تُحذف الصور تلقائياً إذا امتلأت ذاكرة الجهاز. يُفضّل عدم إغلاق المتصفح لفترات طويلة قبل تحميل ملفاتك.',
  },

  pageInventory: {
    sitemapPasteLabelAr: 'الصق رابط sitemap.xml أو محتواه، أو قائمة روابط سطراً بسطر',
    counterAr: '{total} صفحة — {keep} نُبقيها، {merge} ندمجها، {del} نحذفها.',
  },

  mailboxTable: {
    pasteLabelAr: 'الصق عناوين بريد، سطراً في كل مرة',
    counterAr: '{total} صندوق بريد — {created} جديد، {migrated} مُرحّل، {deleted} محذوف.',
  },

  callAgenda: {
    titleAr: 'نقاط تحتاج مكالمة',
    titleEn: 'Points that need a call',
    estimateAr: '{count} نقاط — حوالي {minutes} دقيقة.',
    reasons: {
      conflictingAnswers: 'تعارض في الإجابات',
      needsDecisionMaker: 'يحتاج قرار صاحب القرار مباشرة',
      reviewWarning: 'مرتبطة بتنبيه في شاشة المراجعة',
    },
  },

  scopeSummary: {
    inScopeTitleAr: 'ما سنقوم به',
    inScopeTitleEn: 'In scope',
    outOfScopeTitleAr: 'خارج النطاق',
    outOfScopeTitleEn: 'Out of scope',
  },

  decisionMakerGroup: {
    titleAr: 'يحتاج موافقة صاحب القرار',
    titleEn: 'Needs the decision maker',
  },

  missingItems: {
    titleAr: 'بنود ناقصة تحتاج إجراء',
    titleEn: 'Missing Items Requiring Action',
  },

  review: {
    titleAr: 'مراجعة قبل الإنشاء',
    readinessScoreAr: 'نسبة الجاهزية',
    status: {
      complete: { icon: '🟢', ar: 'مكتمل' },
      partial: { icon: '🟡', ar: 'جزئي' },
      missingCritical: { icon: '🔴', ar: 'ناقص — بند حرج' },
    },
    // Keyed by the `flagsReview` id used on the matching field/table in
    // src/schema/steps/*.js — the review engine looks a warning up by that
    // id, so schema and wording stay in sync without duplicating logic here.
    warnings: {
      domain_expiring_soon: { severity: 'warn', ar: 'النطاق ينتهي خلال أقل من 30 يوماً.' },
      no_backup: { severity: 'warn', ar: 'لا توجد نسخة احتياطية حديثة متاحة.' },
      mx_points_at_old_provider: { severity: 'note', ar: 'سجلات MX ما زالت تشير إلى المزوّد الذي سنغادره.' },
      mailbox_count_mismatch: { severity: 'warn', ar: 'عدد الصناديق المذكور لا يطابق عدد صفوف جدول صناديق البريد.' },
      admin_2fa_needs_app_password: { severity: 'note', ar: 'التحقق بخطوتين مفعّل على حساب المشرف — قد تحتاج App Password أو وصولاً مؤقتاً.' },
      staff_2fa_needs_app_passwords: { severity: 'note', ar: 'التحقق بخطوتين مفعّل على صناديق الموظفين — سيلزم إنشاء App Password لكل صندوق.' },
      per_mailbox_password_count: { severity: 'warn', ar: '{count} صندوق بريد للترحيل = {count} كلمة مرور مطلوبة.' },
      contract_ends_before_golive: { severity: 'critical', ar: 'عقد المزوّد الحالي ينتهي قبل — أو خلال 7 أيام من — تاريخ الإطلاق المطلوب. لا تُلغِ الاشتراك القديم قبل التأكد من نجاح الترحيل.' },
      imap_not_enabled: { severity: 'warn', ar: 'بروتوكول IMAP غير مفعّل (أو غير معروف) — لا يمكن بدء الترحيل قبل تفعيله.' },
      redirect_missing_target: { severity: 'warn', ar: 'صفحة معلَّمة للدمج أو التحويل بدون صفحة هدف — تحويل بلا وجهة يعني ضياع الزوّار بصمت.' },
      logo_jpg_only: { severity: 'warn', ar: 'الشعار متوفر بصيغة JPG فقط — سيحتاج إعادة رسم بصيغة فيكتور.' },
      rebrand_planned: { severity: 'note', ar: 'هناك تغيير هوية بصرية قادم — لا يُنصح بالبناء الكامل على الهوية الحالية.' },
      leadership_consent_missing: { severity: 'warn', ar: 'صف في جدول الإدارة بدون موافقة موثّقة على نشر الاسم والصورة.' },
      sa_domain_no_cr_for_renewal: { severity: 'warn', ar: 'نطاق .sa بدون سجل تجاري متاح — SaudiNIC يطلبه لكل تجديد.' },
      certificate_expiring_soon: { severity: 'warn', ar: 'شهادة تنتهي خلال 90 يوماً أو أقل.' },
      form_required_no_destination: { severity: 'warn', ar: 'نموذج مطلوب بدون أي وجهة (بريد أو واتساب) لاستقبال رسائله.' },
      job_form_no_attachments: { severity: 'warn', ar: 'نموذج طلب التوظيف مفعّل لكنه لا يقبل مرفقات — لا يمكن إرفاق سيرة ذاتية.' },
      migrate_no_size_given: { severity: 'warn', ar: 'صناديق معلَّمة للترحيل بدون تقدير لحجم البيانات.' },
    },
  },

  generatedFiles: {
    titleAr: 'ملفاتك جاهزة',
    zipCalloutAr: 'الصور موجودة في هذا الملف — أرسله مع المستند.',
    zipCalloutEn: 'The images live in this file — please send it with the document.',
    xlsxFailedAr: 'تعذّر إنشاء ملف الإكسل. باقي الملفات جاهزة — حاول الضغط على "مراجعة وإنشاء الملفات" مرة أخرى.',
    versionLabelAr: 'نسخة {version} — تم الإنشاء في {date}',
    downloadAllAr: 'تحميل الكل',
  },

  passwordsStep: {
    optInHelpAr: 'الخيار الأول هو الافتراضي دائماً. اختيار الثاني يكشف حقول كلمات المرور ويوقف حفظها التلقائي بالكامل.',
    autosaveSkippedAr: 'هذه الحقول لن تُستعاد إذا أعدت تحميل الصفحة — لا يتم حفظها تلقائياً إطلاقاً.',
    confirmationAr: 'تم إدراج كلمات المرور في الملف. لم تُحفظ في المتصفح ولم تُرسل إلى أي مكان.',
    showHideToggleLabelAr: 'إظهار / إخفاء',
    verifyLinkLabelAr: 'كيف تتأكد بنفسك؟',
  },

  accessControl: {
    invalidLinkAr: 'هذا الرابط غير صالح أو تم إلغاؤه. الرجاء التواصل معنا للحصول على رابط جديد.',
    invalidLinkEn: 'This link is invalid or has been revoked. Please contact us for a new one.',
    shortCodeLabelAr: 'أو أدخل الرمز القصير',
    shortCodePlaceholder: 'K7QP-3M2A-XR9T',
    logoutAr: 'تسجيل الخروج',
    logoutHelpAr: 'إجاباتك المحفوظة تبقى في هذا المتصفح — ستحتاج الرابط أو الرمز مرة أخرى للعودة إليها.',
  },

  draft: {
    exportLightAr: 'نسخة خفيفة (بدون صور)',
    exportFullAr: 'نسخة كاملة (مع الصور)',
    exportForColleagueAr: 'حفظ نسخة لإرسالها لزميل',
    importAr: 'استرجاع نسخة',
    missingImagesAr: '{count} منتجات بحاجة إلى صور',
    importMergeTitleAr: 'يوجد بيانات في هذا المتصفح بالفعل',
    importMergeReplaceAr: 'استبدال كل شيء بالملف المستورد',
    importMergeFillEmptyAr: 'تعبئة الأقسام الفارغة فقط (موصى به)',
  },

  errors: {
    genericAr: 'حدث خطأ غير متوقع. حاول مرة أخرى.',
    requiredFieldAr: 'هذا الحقل مطلوب.',
    invalidEmailAr: 'صيغة البريد الإلكتروني غير صحيحة.',
    invalidPhoneAr: 'صيغة رقم الجوال غير صحيحة. مثال: 966 5X XXX XXXX+',
  },
};
