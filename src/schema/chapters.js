// Groups steps into named chapters for the sidebar — a flat list of 20+
// steps read as "this is huge" to a non-technical client before they'd even
// started. Collapsed chapters show ~8 lines instead; only the chapter
// holding the current step auto-expands. Purely a presentation grouping —
// nothing here affects branching, validation, or the schema/index.js step
// order that everything else (generators included) still walks.

export const CHAPTERS = [
  { id: 'basics', titleAr: 'البداية', stepIds: ['step0_start', 'a1_project_type'] },
  { id: 'identity', titleAr: 'الموقع الحالي والهوية', stepIds: ['a2_current_site', 'a2b_design_direction', 'a2c_brand_identity'] },
  {
    id: 'hosting',
    titleAr: 'الاستضافة والنطاق والترحيل',
    // a7/a7b (website migration scope + page inventory) live here, not in
    // "mail", now that a website-only migration never touches mail steps —
    // see stepA7cMailMigrationScope for the mail-only counterpart. a8
    // (cutover) sits here too since it pairs naturally with a3 (domain) even
    // for a mail-only client (domain + go-live, nothing website-specific in it).
    stepIds: ['a3_domain', 'a4_hosting', 'a10_ssl_security', 'a7_migration_scope', 'a7b_page_inventory', 'a8_cutover'],
  },
  {
    id: 'mail',
    titleAr: 'البريد الإلكتروني',
    stepIds: ['a5_mail_current', 'a5b_mail_migration_access', 'a6_mailboxes', 'a7c_mail_migration_scope'],
  },
  { id: 'contacts', titleAr: 'حسابات وجهات اتصال', stepIds: ['a9_third_party', 'a11_contacts'] },
  {
    id: 'content_basics',
    titleAr: 'محتوى الموقع — الأساسيات',
    stepIds: ['b0_seo', 'b0b_languages', 'b1_forms', 'b2_albums_leadership', 'b3_branches'],
  },
  {
    id: 'catalog',
    titleAr: 'الكتالوج والأعمال',
    stepIds: ['b4_services', 'b5_products', 'b6_brands', 'b7_credentials', 'b8_projects', 'b9_additional_info'],
  },
  { id: 'wrap_up', titleAr: 'الإنهاء والأمان', stepIds: ['after_handover', 'saudi_requirements', 'files_assets', 'passwords'] },
];

/**
 * Buckets an already-visible-steps list into { chapter, steps } groups,
 * preserving CHAPTERS order and each chapter's internal step order, and
 * dropping any chapter that has nothing visible in it right now (e.g. the
 * whole "الكتالوج والأعمال" chapter for an email-only project).
 */
export function groupStepsByChapter(visibleSteps) {
  const byId = new Map(visibleSteps.map((step, index) => [step.id, { step, index }]));
  const groups = [];
  for (const chapter of CHAPTERS) {
    const steps = chapter.stepIds.map((id) => byId.get(id)).filter(Boolean);
    if (steps.length) groups.push({ chapter, steps });
  }
  return groups;
}
