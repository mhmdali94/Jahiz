// Derives the two passwords-page tables from answers already given
// elsewhere in the form, per "Table 1 — service credentials" / "Table 2 —
// mailbox passwords" in the OPTIONAL PASSWORD ENTRY spec section. Shared by
// the wizard (steps/table.js seeds the passwords step's tables with these so
// what the client sees matches what gets generated) and the generators
// (xlsx.js/docx.js read the same rows at export time).

const SERVICE_LABEL_SOURCE = {
  registrar: (a) => !!a.domain_primary,
  hosting_panel: (a) => !!a.hosting_provider,
  ssh: (a) => a.ssh_available === 'yes',
  ftp: (a) => a.ftp_available === 'yes',
  database: (a) => !!a.database_access,
  mail_admin: (a) => !!(a.mail_admin_console_url || a.mail_admin_username),
  cms: (a) => a.needs_cms_dashboard === 'yes' || !!a.current_platform,
  cloudflare: (a) => !!(a.cloudflare_owner || a.firewall_cdn),
  payment_gateway: (a) => !!a.preferred_payment_gateway,
  analytics: (a) => !!a.search_console_account,
  social: (a) => Array.isArray(a.social_media) && a.social_media.length > 0,
};

const SERVICE_PREFILL = {
  registrar: (a) => ({ login_url: a.registrar_panel_url, username: a.registrar_username }),
  hosting_panel: (a) => ({ login_url: a.hosting_panel_url, username: a.hosting_username }),
  mail_admin: (a) => ({ login_url: a.mail_admin_console_url, username: a.mail_admin_username }),
  cloudflare: (a) => ({ login_url: '', username: a.cloudflare_owner }),
  analytics: (a) => ({ login_url: '', username: a.search_console_account }),
};

/** One row per credential we can actually identify from earlier answers. */
export function deriveIdentifiedServices(answers) {
  return Object.entries(SERVICE_LABEL_SOURCE)
    .filter(([, test]) => test(answers))
    .map(([service]) => ({ service, ...(SERVICE_PREFILL[service]?.(answers) || { login_url: '', username: '' }) }));
}

/** One row per mailbox marked "migrate" in the mailbox table — email pre-filled, password left for the client. */
export function deriveMigratingMailboxRows(answers) {
  return (answers.a6_mailboxes || [])
    .filter((r) => r.action === 'migrate' && r.email)
    .map((r) => ({
      email: r.email,
      twofa_enabled: answers.staff_mailbox_2fa || '',
      mailbox_active: '',
    }));
}

/**
 * Merges freshly-derived rows into whatever rows already exist (matched by
 * `matchKey`), so a value the client already typed (a password, a note)
 * never gets clobbered when this re-runs after an earlier step changes —
 * only missing rows get added, and derived columns on an existing row are
 * left alone.
 */
export function mergeDerivedRows(existingRows, derivedRows, matchKey) {
  const existingKeys = new Set(existingRows.map((r) => r[matchKey]));
  const toAdd = derivedRows.filter((r) => !existingKeys.has(r[matchKey]));
  return [...existingRows, ...toAdd];
}
