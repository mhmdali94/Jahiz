# Claude Code Prompt — Arabic Client Onboarding Wizard

> Copy everything below the line into Claude Code.
> Before you send it, replace the `<<< >>>` placeholders with your own details.

---

## PROJECT

Build a **static, Arabic (RTL) client onboarding wizard** that I host on my own CyberPanel server. A client opens the link, answers a branching questionnaire, and at the end downloads their generated files.

The whole point is to **kill the discovery meetings**. Today I get on calls to collect hosting logins, mail provider details, mailbox lists and migration scope. This tool collects it all in a structured way, flags what's missing, and hands me back one clean document.

My company: `<<< COMPANY NAME AR / EN >>>`
My contact email: `<<< EMAIL >>>`
Brand color: `<<< HEX >>>`
Logo file: `<<< path, or say "use a text logo for now" >>>`

---

## HARD RULES — DO NOT BREAK THESE

1. **No backend. No database. No network requests of any kind after page load.** Everything runs in the browser. The final build must work when dropped into a CyberPanel `public_html` folder as plain static files.
2. **Passwords are OFF by default.** The form does not ask for a single credential unless the client explicitly turns it on — see the "OPTIONAL PASSWORD ENTRY" section below for exactly how that works. In the default path, every credential becomes a **blank row in the generated .docx** that the client fills in offline on their own machine.
3. Every non-password field gets `autocomplete="off"`. No analytics, no fonts from a CDN, no third-party scripts, no telemetry, no service worker, no `navigator.sendBeacon`.
4. Show a persistent, visible privacy banner: **"بياناتك لا تغادر جهازك — لا يتم رفع أي معلومة إلى أي خادم"** / "Your data never leaves your device — nothing is uploaded to any server."
5. **Never ask about money.** No budget field, no cost estimate, no pricing, no payment terms, no quotation. Commercial matters are handled by management outside this tool, and the form must not touch them. The one exception is the optional *product* price in the content track — that is catalog data for the client's own website, not project cost. Do not add a cost summary to the review screen or to any generated document.

---

## TECH STACK

- Vite + **vanilla JavaScript** (no React, no framework). Output must be a plain static `dist/` I can upload by FTP or CyberPanel File Manager.
- All dependencies bundled at build time. Nothing loaded from a CDN at runtime.
- Self-host the Arabic font (Cairo, IBM Plex Sans Arabic, or Tajawal) as woff2 files in the repo.
- `.docx` generation: the `docx` npm library.
- `.xlsx` generation: **ExcelJS** (not SheetJS — SheetJS cannot embed images, and the form supports image uploads).
- `.zip` packaging of original uploads: `JSZip`.
- Image storage between sessions: **IndexedDB** (`idb` is fine). Form text goes to `localStorage`; image blobs never do.
- `.pdf` generation: **do NOT use jsPDF** — Arabic shaping and RTL break badly. Instead render a dedicated print stylesheet and trigger `window.print()`, so the browser produces a perfect Arabic PDF. Add a one-line instruction telling the user to choose "Save as PDF".

### Arabic gotchas you must handle explicitly
- In `.docx`: set `bidirectional: true` on every paragraph and `rtl: true` on every TextRun in the Arabic sections, otherwise Arabic renders reversed in Word.
- In `.docx`: set the document default font to an Arabic-capable font and set `rightToLeft` on tables.
- In `.xlsx`: set `ws['!views'] = [{ RTL: true }]` for Arabic sheets, and set sensible column widths — the current file I use has unreadable column widths and I don't want to repeat that.
- Test that a mixed line like `البريد: info@example.com` doesn't scramble.

---

## LANGUAGE — ARABIC ONLY, WITH TERMS

**There is no language toggle.** The interface is Arabic, `dir="rtl"`, full stop. Building a second full language doubles the wording, doubles the layout bugs, and nobody here was going to use it.

What we keep instead is the **technical term in Latin script, inline and secondary**, wherever the Arabic word alone would be ambiguous to an IT person:

> الاستضافة (Hosting) · النطاق (Domain) · التحقق بخطوتين (2FA) · صناديق البريد (Mailboxes) · سجلات (DNS) · كلمة مرور التطبيق (App Password)

Rules for these terms:
- Arabic first, the term in parentheses after it, in a lighter weight and a slightly smaller size.
- Only where it earns its place — on labels, section titles and dropdown options that name a technology. Not on ordinary words, and never inside body text or help copy, which stays pure Arabic.
- The Latin term always renders LTR inside the RTL line, so it is never reversed.
- Placeholders, error messages, buttons, warnings and the privacy banner are **Arabic only**.

All wording lives in a single `src/strings.js` object — one flat file, no i18n framework, no locale files. I edit wording there without touching logic.

**The generated documents stay bilingual** (`العربية / English` label pairs), exactly like the Excel I already send clients. That is deliberate: the documents get read by hosting providers, by the client's own IT contractor and sometimes by an expat manager, so English labels earn their keep there in a way they don't in the form.

---

## AUTOSAVE

- Auto-save to `localStorage` on every change, keyed by project name.
- On return, show: "وجدنا مسودة محفوظة بتاريخ X — هل تريد المتابعة؟" with Continue / Start fresh.
- Visible "last saved" timestamp.
- Optional extra: an "Export draft" / "Import draft" button that downloads a small `.json`, so a client can pass the half-finished form to a colleague. *(Optional — build it only if it stays simple.)*

---

## REFERENCE FILE

I will attach an `.xlsx` I already use as the offline version of this same form, for clients who don't want to use the website. **Treat it as the canonical field list.** Every sheet in it maps to a step here, every column to a field, and the Arabic wording is already approved — reuse it verbatim rather than inventing new labels.

It also contains a **project-type routing matrix** (which sections are required, optional, or skipped for each of: new build / migration / redesign / email only). The website must implement exactly that matrix as its branching logic. A client who picks "new build" must never see the migration step; a client who picks "email only" skips hosting, third-party accounts, and every content step.

---

## FLOW

### Step 0 — Start
Client enters: their company name, contact person, email, phone, project deadline. Then picks a track:

- **A. Technical handover** — access, mail, migration
- **B. Website content** — services, products, projects, etc.
- **C. Both**

The wizard then only shows the relevant steps. Progress bar, back/next, step list in a sidebar (collapsible on mobile).

---

## TRACK A — TECHNICAL HANDOVER

### A1. Project type
New build / Migrate existing site / Redesign (keep content) / Email only / Not sure yet.
Subsequent questions branch off this answer — don't ask migration questions for a brand-new build.

### A2. Current website
Current URL · Is it live? · Platform (WordPress / Shopify / Wix / custom / other) · Who built it · Is there a staging site · Do you still have contact with the previous developer · Any content that must be preserved.

### A2b. Brand identity & design direction
Shown for every project type except email-only. **This is the step that prevents revision rounds**, so give it room.

**How much should change** — a radio, and it drives the tone of the whole step: `migrate as-is` (pixel-faithful) / `migrate with light improvements` / `full redesign`. Then: what don't you like about the current site · what must stay exactly as it is · any pages or sections to remove.

**Logo** — Is the current logo approved or does it need updating? · **Which formats do you have: AI / EPS / SVG / PSD / transparent PNG / JPG only?** (flag it if the answer is JPG only — that means the logo has to be redrawn) · horizontal and square versions · a white version for dark backgrounds · favicon.

**Colors & fonts** — Keep the current colors or change them? · approved HEX codes, primary and secondary · Arabic font in use · Latin font in use · **are those fonts licensed for web use?** · is there a brand guidelines document?

**Design direction — reference sites.** Not a free-text box. A **repeatable table**, because "I want it like this site" is the single most useful sentence a client can give me, and a vague version of it is worthless. Per row: URL · like or dislike · **what exactly** about it · which aspect (overall design / colors / fonts / page structure / how products are shown / homepage / speed / mobile version / writing style) · **copy closely, take inspiration, or just one element** · priority.

That copy-vs-inspire column matters more than it looks. Clients say "like this site" and mean anything from "identical" to "that one button". Asking makes them say which, and it heads off both a legal problem and three revision rounds.

Also ask: desired impression (formal / modern / premium / minimal / technical) · dark mode?

**Flags that change the plan** — Is a rebrand planned soon? (if yes, warn: don't build on the current identity) · Is the current identity approved by management? · Keep or replace the existing site images? · Move the current copy as-is or rewrite it? · **Must the current page URLs stay unchanged for SEO?**

Two review-screen warnings come from here: logo available only as JPG, and a rebrand planned within the project window.

### A3. Domain
Registrar name (dropdown of common ones + "other") · Control panel URL · Username · Domain expiry date · Where DNS is currently managed · Is the domain locked / do you have the EPP-Auth code · Any subdomains in use.

### A4. Hosting
Provider · Panel type (cPanel / Plesk / CyberPanel / DirectAdmin / other) · Login URL · Username · SSH or FTP available? · Database access available? · PHP version · Plan expiry date · Is there a recent backup, and where.

### A5. Mail — current setup
Current provider (Google Workspace / Microsoft 365 / Zoho / cPanel mail / hosting-bundled / none) · Admin console URL · Admin username · Number of existing mailboxes · Where MX currently points · Is 2FA enabled on the admin account · Target provider after the project · Do they need a unified signature · Do they need group/alias addresses (info@, sales@) · Storage quota per mailbox · Do staff use Outlook, webmail, or mobile.

### A5b. Mail — server settings & migration access
Only shown when the project involves moving mail. **This is the section that decides how much work the migration is, so make it prominent, not buried.**

- Current IMAP server: host & port
- Current SMTP server: host & port
- Is IMAP enabled on all mailboxes?
- **Migration access method** — a radio choice, and it drives everything downstream:
  - `admin` — we have admin/super-user access to the provider
  - `per-mailbox` — no admin access, each mailbox password is needed individually
  - `unknown`
- Is 2FA enabled on staff mailboxes? (if yes, show an inline note: app passwords will be required per mailbox)
- Current provider contract end date
- **How many days should the old account stay active after migration?** — with a visible warning: do not cancel the old subscription before the migration is verified
- Has this mail been migrated before?

### A6. Mailbox table — repeatable rows
A proper add-row / delete-row / duplicate-row table. This is the single most important screen, make it genuinely pleasant to use, with a paste-from-list helper ("paste emails one per line" → auto-creates rows).

Columns: Email address · Owner name · Department · **Action** (create new / migrate / delete / convert to alias / convert to forwarder / leave as is) · Current mailbox size · Quota needed · Aliases · Forwarding to · Notes.

Show a live counter: "12 mailboxes — 5 new, 6 migrated, 1 deleted."

### A7. Migration scope
Only shown if any mailbox row says "migrate", or project type is migration or email-only.

**Email:** Migrate old emails? · How far back (all / 1 year / 2 years) · Contacts · Calendars · Shared drives and files · Approximate total data size · **Largest single mailbox size** · Auto-replies · Rules and filters · Signatures · Groups and distribution lists · Shared and delegated mailboxes · Will staff keep using email during the migration? · Who reconfigures staff phones and Outlook? · Do staff need training after the switch?

**Website:** Database · Media and uploads · Registered users · Orders · Blog posts · Reviews · Old URLs needing 301 redirects.

### A7b. Page inventory
Shown for migration and redesign only. **This is the step that stops scope creeping silently** — everyone agrees to "move the site" and nobody counts the pages until there turn out to be a hundred and twenty.

A repeatable table: page URL · page title · **decision** (keep as is / keep but update content / merge into another page / delete with a 301 redirect / delete entirely / new page) · if merging or redirecting, to which page · priority · notes.

Offer a shortcut at the top, because typing a hundred rows is how a form gets abandoned: **paste your `sitemap.xml` URL or the sitemap contents, and we'll turn it into rows automatically.** Parse it client-side from pasted text — do not fetch it, since the app makes no network requests. A plain pasted list of URLs, one per line, must work too.

Show a live count and a breakdown: "٤٢ صفحة — ٢٨ نُبقيها، ٩ ندمجها، ٥ نحذفها."

If a page is marked "merge" or "delete with a redirect" but has no target page, warn on the review screen — a redirect to nowhere is how traffic quietly disappears.

### A8. Cutover
Preferred downtime window (date + time) · Blackout dates · Who approves go-live · Acceptable downtime in minutes.

### A9. Third-party accounts
Repeatable rows: Service (payment gateway, Google Analytics, Search Console, Tag Manager, Meta Pixel, live chat, CRM, SMS gateway, WhatsApp Business, booking system, other) · Account owner email · Panel URL · Do we need access? yes/no.

### A10. SSL & security
Current SSL provider · Wildcard needed · Any firewall/WAF (Cloudflare, Sucuri) · Cloudflare account owner.

### A11. Contacts & approvals
Technical contact · Decision maker · Billing contact · Preferred communication channel.

---

## THE "I DON'T KNOW" FEATURE — build this carefully

Every single credential/access field must have a small toggle next to it: **"لا أعرف / ليس لدي"** ("I don't know / I don't have it").

When toggled, the field disables, and that item is recorded as **ACTION REQUIRED** — it appears in a dedicated red section at the top of the generated document titled "بنود ناقصة تحتاج إجراء / Missing Items Requiring Action".

This is the whole reason the tool exists. Clients stall because they don't know one answer; this lets them finish anyway and shows me exactly what to chase.

---

## TRACK B — WEBSITE CONTENT


### A11b. After handover
Shown for every project type. Written agreement here prevents the awkward conversation six weeks after launch.

**Who runs the site** — who updates content after handover, and their department · how technical they are (beginner / intermediate / advanced) · do they need training on the dashboard, and for how many people · training in person, remote, or a recorded video · do they want a written Arabic user guide.

**Responsibilities** — who handles backups · who handles security and plugin updates · **who renews the domain and hosting, and who tracks the expiry dates** · who to contact if the site goes down outside working hours.

**Support** — do they want a monthly maintenance contract · how long they expect support after launch · expected response time when something breaks · do they expect periodic content updates from us, and how often.

Everything in this step goes into the "ما سنقوم به / خارج النطاق" summary, since these are exactly the items that get assumed rather than agreed.

### B0. Search engine visibility
One question first, and it's a real branch, not a formality: **هل تريدون ظهور الموقع في نتائج بحث جوجل؟** A "no" means an internal, private, or members-only site, and it changes the build — the site ships with `noindex` and no sitemap. Getting this backwards in either direction is a genuine incident: a private site indexed by Google, or a public site that never appears in search because a `noindex` was left in from staging.

If yes, ask only these:
- Any pages that must **not** appear in search results
- Key terms or phrases they want to rank for
- A short company description to show under their name in results (two lines)
- Is the business on Google Maps, and is the data current
- Is there a Google Search Console account, and under which email

Keep it to that. Anything deeper is a separate SEO engagement, not an onboarding form.

### B0b. Website languages

**The client only ever writes Arabic.** Translation is our job, done on our side — so there is no English field anywhere in the content track. No `name (EN)`, no `description (EN)`, no bilingual pairs. Every content step is a single Arabic column, and each one carries a short line at the top: اكتب بالعربية فقط — الترجمة الإنجليزية نتولّاها نحن. This roughly halves what the client has to type, and it's the difference between a form they finish and one they abandon.

Ask only what affects the build, not what affects their typing:
- Which languages the finished site needs (Arabic only / Arabic + English / other)
- Full translation, or main pages only
- URL structure (`en.site.com` vs `site.com/en`)
- Which language loads by default for a new visitor
- Do contact forms and automated emails need every language
- Is SEO required in every language

Nothing here asks who will translate, or whether translated content is ready. That is settled: we do it.

Then mirror the sheets from the Excel file I already send clients, as wizard steps with repeatable rows. Two of those steps are new:

### B1. Website forms and where submissions go
A repeatable table, pre-populated with the forms that actually come up, so the client ticks rather than invents: نموذج تواصل عام · طلب عرض سعر · طلب خدمة · طلب منتج · طلب توظيف · استفسار فني · حجز موعد · طلب عقد صيانة · شكاوى واقتراحات · الاشتراك في النشرة.

Per row: required? (yes / no / later) · which fields the form needs · **destination email** · **destination WhatsApp number** · attachments allowed and which types · auto-reply to the sender?

**Destination is the part clients never think about until launch week.** Make it explicit that each form can go to a different address — job applications to `hr@`, quotations to `sales@` — and that email and WhatsApp are not exclusive; a form can do both.

Be precise about what WhatsApp means here, because clients assume something automatic: on a static or ordinary site this is a `wa.me` link that opens WhatsApp with the form contents pre-written as a message, which the sender still has to press send on. Anything genuinely automated needs the WhatsApp Business API and a separate account. Say that in one plain Arabic line in the help text, so nobody is surprised later.

**General form settings**, asked once: receiving WhatsApp number · should copies go to more than one email · the thank-you text shown after submitting · the auto-reply text the sender receives · spam protection (reCAPTCHA / hCaptcha)? · **a consent checkbox before submitting, for PDPL** · store submissions in a dashboard or is email enough · any CRM integration · do they want a careers page they can update themselves.

Two review-screen warnings: a form marked required with no destination at all, and job applications enabled without attachments allowed — a CV form that can't take a PDF is useless.

### B2. Photo albums and leadership (optional)
Mark this step **optional and say so on it** — some clients want it, plenty don't, and it should never feel like something blocking their progress. Let them skip it in one click.

**Photo albums** — a repeatable table, pre-seeded with the usual ones: معرض المشاريع · صور المقر والمستودعات · المعارض والفعاليات · ورش العمل والتدريب. Per album: name · short description · where it appears (its own page, or inside an existing page) · display order · the images themselves through the normal upload zone, going into `albums/{album-slug}/` in the ZIP.

**Leadership and org structure** — a repeatable table: name · position · **display order** (so I build the hierarchy exactly as they want it, rather than guessing from job titles) · short bio · photo · LinkedIn.

One field here is not optional: **"موافق على نشر اسمه وصورته؟"** with yes / no / not asked yet. Publishing a named individual's photo needs that person's consent under PDPL, and the client is usually the one who hasn't thought about it. If any row says "no" or "not asked yet", raise it on the review screen. It costs nothing to ask now and it is a real problem to discover after launch.

1. Branches & contact info (branch name, city, address, Google Maps link, phone, WhatsApp, email, working hours/days)
2. Direct contact numbers by department
3. Social media accounts
4. Services (category, name, description, key features, images) — Arabic only
5. Products (category, sub-category, name, brand, model, specs, description, price in SAR with a VAT-inclusive flag, images, PDF catalog link) — Arabic only
6. Brands & agencies (name, country, product type, official distributor?, website, logo available?)
7. Credentials & certificates (CR, VAT, ISO, contractor classification, SAMA approval, civil defense license, chamber membership)
8. Projects/portfolio (name, work type, sector, client name, city, year, description, photos, is client name publishable?) — Arabic only
9. Additional info (year founded, employee count, project count, years of experience, company profile PDF, testimonials, job openings, warranty period, maintenance terms, founding story)

Track B outputs primarily to the `.xlsx`, with sheet names matching exactly what I already use: `الفروع والتواصل`, `الخدمات`, `المنتجات`, `العلامات التجارية`, `الاعتمادات والشهادات`, `المشاريع والأعمال`, `معلومات إضافية`.

The Files & assets step asks for: company logo (vector preferred: AI / EPS / SVG) · transparent PNG logo · white logo for dark backgrounds · favicon · brand guidelines · licensed font files · product photos · project photos · office and team photos · company profile PDF · product catalogs · client logos · certificates · promotional videos. Anything not uploaded directly gets a Google Drive or WeTransfer link instead.

---

## IMAGE & FILE UPLOADS

The client must be able to **attach images directly in the form** — product photos, project photos, logos, certificates — and have them come out inside the generated files. All of this stays client-side; files are read with `FileReader`, never uploaded anywhere.

### Where uploads appear
Any repeatable row that has an "images?" column gets a drag-and-drop upload zone instead: products, projects, services, brands (logo), certificates (scan/PDF), plus a general "company assets" uploader (logo, office photos, team photos) in the Files & Assets step.

Show a thumbnail grid per row, with reorder and delete, and a running total: "34 images · 82 MB".

### Two sizes, two destinations — this is the important part
For every uploaded image, keep **two versions**:

1. **A compressed preview** — downscale with a `<canvas>` to max 1200px on the long edge, JPEG quality ~0.8. This is what gets embedded in the `.docx` and `.xlsx`, so the document stays openable. Never embed originals in the document.
2. **The original file, untouched** — collected into a **ZIP** (JSZip) that the client downloads alongside the documents. I need full-resolution originals to actually build the site.

ZIP structure, with names that match what's written in the documents:
```
{client}-assets/
  originals/
    products/  01-safe-cs1200-01.jpg …
    projects/  01-riyadh-vault-01.jpg …
    services/
    brands/
    certificates/
    company/
    albums/    {album-slug}/01-…jpg
    team/
  web/          ← same images as WebP, max 1600px, ready to upload to the site
    products/  01-safe-cs1200-01.webp …
    …
  MANIFEST.csv  ← filename, section, row number, item name (AR), item name (EN)
  manifest.json ← the same mapping, machine-readable, so I can script the upload
  README.txt    ← one paragraph in Arabic telling the client to send this ZIP together with the .docx
```

**Filenames are generated, not taken from the client's phone.** Slugify the item name, prefix the row number, suffix the image index — `01-safe-cs1200-01.jpg`. Lowercase, ASCII, hyphens only, no spaces and no Arabic characters, because these become URLs on the live site.

The ZIP is the only real source of images for me. The documents are for reading and approval; the ZIP is what I build from. Make that explicit in the README.txt inside the ZIP and in the download screen.

### In the .docx
Every image must be **identified by name inside the document** — that name is the only bridge between what I read in Word and what I find in the ZIP.

- Each product/project/service row prints its thumbnails directly under that row's table. Use the `docx` library's `ImageRun`, sized to fit the page width, max 2 per line.
- **Directly under each thumbnail, print its generated filename** in a small monospace caption (8pt, grey, LTR direction even on Arabic pages, so the name never renders reversed). Format: `products/01-safe-cs1200-01.jpg` — the path inside the ZIP, not just the bare name.
- The row's own table keeps a field **`أسماء ملفات الصور / Image filenames`** listing every filename for that row, comma-separated, so the names are searchable as text in Word even if the reader ignores the pictures.
- If a row has images but the client typed nothing in the old "image filename" column, fill that column automatically from the generated names. The two must never disagree.

### In the .xlsx
SheetJS cannot insert images. So: **use ExcelJS for the workbook instead**, which can anchor images to cells. Put a small thumbnail in the row's image column, and keep the filename in the adjacent text column so it always matches the ZIP.

### Technical constraints you must handle
- **Do not put images in `localStorage`** — the 5MB quota will blow instantly. Autosave form text to `localStorage` as before, but store image blobs in **IndexedDB**, keyed to the row. On reload, restore both.
- Compress on upload, not at generation time, so the UI stays responsive and memory stays flat.
- Accept jpg, png, webp, svg, pdf. Reject anything else with a clear Arabic message.
- **No size limits and no warnings about size.** Show the running total as information only. If a client uploads 400MB of photos, that is a good outcome, not a problem to discourage.
- Because there is no size cap, generation must stay responsive at large volumes: run it off the main thread or show a real progress bar with counts ("جارٍ تجهيز الصور ٣٢ من ١٢٠"). A frozen tab looks broken, and at 300 images it will freeze if you do this naively.
- If the client uploads nothing, everything still works: documents generate with the filename/Drive-link columns exactly as they are now.

---

## OPTIONAL PASSWORD ENTRY

Some clients would rather type the credentials once, in the form, than fill a Word table by hand. Support that — but as a deliberate, informed opt-in, never the default.

### The toggle
On the passwords step, show a switch, **off by default**:
> ☐ أريد كتابة كلمات المرور الآن داخل النموذج
> ☑ (default) سأكتبها بنفسي في ملف الوورد بعد تحميله — أكثر أماناً

Selecting the first option reveals the credential fields. Selecting the second keeps today's behaviour exactly.

### If the client opts in — non-negotiable implementation rules
- Values live in **one in-memory object only**. Never `localStorage`, never `sessionStorage`, never IndexedDB, never a URL parameter. The autosave layer must explicitly skip them — say so plainly under the toggle: these fields will not be restored if you refresh.
- Wipe the object as soon as the documents are generated, and on `beforeunload`.
- Use `<input type="text">` with `autocomplete="off"`, `autocorrect="off"`, `spellcheck="false"`, `data-lpignore="true"`, `data-form-type="other"` — so browsers and password managers don't offer to save them.
- Add a show/hide eye toggle, masked by default.
- After generation, show: "تم إدراج كلمات المرور في الملف. لم تُحفظ في المتصفح ولم تُرسل إلى أي مكان."

### Make the guarantee verifiable, not a promise
This is the part that matters for bank and government clients. Anyone can claim they don't store passwords; prove it in a way the client can check in thirty seconds.

- Ship a **Content-Security-Policy with `connect-src 'none'`**, plus `form-action 'none'`, `frame-src 'none'`, `object-src 'none'`, `base-uri 'none'`. With `connect-src 'none'` the browser itself blocks every fetch, XHR, WebSocket and beacon — so even a bug or an injected script physically cannot send the data out. Set it as a real response header on CyberPanel (put the exact OpenLiteSpeed config snippet in the README) **and** as a `<meta http-equiv>` fallback.
- Add a small link on the passwords step: **"كيف تتأكد بنفسك؟"** opening a short Arabic explainer: open DevTools → Network tab → fill the form → you will see zero requests; and the page's CSP blocks outbound connections entirely. Include a screenshot-free, plain-language version for non-technical clients.
- Add Subresource Integrity on any script tag, and keep the build reproducible so the deployed JS can be diffed against the repo.

### Warn honestly — one short block, not a wall of text
Under the toggle, in Arabic and English:
- Do not use a shared or public computer.
- Browser extensions can read what you type on any page; this is outside our control.
- Whichever option you choose, **rotate every shared password once the project is complete.**

### Better than passwords — offer this first
Above the toggle, suggest the alternative that removes the problem entirely. For each service, delegated or temporary access is usually available and is what I would prefer:
- WordPress / CMS → create a temporary administrator account
- Google Workspace / Microsoft 365 → delegated admin role
- Cloudflare → invite as a member
- cPanel / hosting → a sub-account
- Registrar → most support adding a second contact

Present this as a short list with a line: if you can do this instead, you never have to share a password at all. Track whether the client picked delegated access per service, and print that in the docx so I know what to expect.

---

## SAUDI MARKET — THIS IS NOT A GENERIC FORM

Every project runs in Saudi Arabia. The tool should read as though it was built for the Saudi market, not translated into it. Bake these in rather than treating them as extras.

### Formats and defaults
- Currency is **SAR** everywhere. Label price fields `السعر بالريال (ر.س)`, format as `12,500 ر.س`, and always pair them with a **"شامل ضريبة القيمة المضافة ١٥٪؟"** toggle — VAT-inclusive vs exclusive is the single most common source of confusion in Saudi pricing.
- Dates: accept and print **Hijri alongside Gregorian**. Certificate expiry in particular is usually issued in Hijri, so the certificates step needs both columns. Use a well-tested Hijri conversion (Umm al-Qura), not a naive offset.
- Phones: validate and format `+966 5X XXX XXXX` for mobile, `+966 11` style for landlines. Reject 05 numbers that are the wrong length.
- Timezone: Asia/Riyadh (+3). Working week defaults to Sunday–Thursday, not Monday–Friday.
- **National Address (العنوان الوطني)** as a structured field for every branch: building number · street · district · city · postal code · additional number. Show the standard example `3241 - العليا - 12211 - 6823` as placeholder text. Government and bank clients expect it on a contact page.

### A dedicated step: `المتطلبات السعودية`
Its own wizard step, covering things a generic onboarding form would never ask:

**Compliance** — Is the CR number shown in the site footer (legally required)? · VAT number displayed on site and invoices? · **Maroof (معروف) verification** number for e-commerce · Is the privacy policy compliant with **PDPL** (نظام حماية البيانات الشخصية)? · Terms compliant with the Saudi E-Commerce Law? · Is data residency inside KSA required? · Any **ZATCA e-invoicing (فاتورة)** integration?

**Saudi domain** — Do they hold a `.sa` / `.com.sa`? · If registered through **SaudiNIC**, the registered email and reference · Is the CR available for renewal (SaudiNIC requires it, and this blocks renewals constantly — surface it as a warning if the domain is `.sa` and they answer no).

**Payments & shipping** — Which methods: **مدى / Apple Pay / STC Pay / Visa / Tabby / Tamara / SADAD / bank transfer** · Preferred gateway: **Moyasar / PayTabs / HyperPay / Tap / Checkout** · Shipping partners: **سمسا / أرامكس / ناقل / البريد السعودي (سبل)**.

**Localization** — Show Hijri dates? · Arabic-Indic numerals (١٢٣) or Latin (123)? · Show working hours accounting for **prayer times**? · Which official holidays affect operations (العيدان / اليوم الوطني / يوم التأسيس)? · Feature **Vision 2030** or Local Content branding? · Highlight Saudi ownership or Saudization rate? · Target cities for local SEO (الرياض / جدة / الدمام).

### Saudi-specific credentials in the certificates step
Pre-populate the certificate rows with the documents that actually exist here, instead of a blank table the client has to invent:
السجل التجاري · الرقم الموحد للمنشأة (700) · شهادة ضريبة القيمة المضافة · شهادة الزكاة والضريبة والجمارك · شهادة التأمينات الاجتماعية (GOSI) · شهادة السعودة (نطاقات) · تسجيل منصة اعتماد ورقم المورد · شهادة المحتوى المحلي (LCGPA) · شهادة سابر / ساسو للمنتجات · علامة الجودة السعودية · تصنيف المقاولين · اعتماد ساما · رخصة الدفاع المدني · ترخيص الأمن العام لأنظمة المراقبة · عضوية الغرفة التجارية · توثيق معروف · رخصة وزارة الاستثمار (MISA) · شهادات ISO.

Each row carries both Gregorian and Hijri expiry, and **any certificate expiring within 90 days raises a warning on the review screen** — an expired CR or Civil Defense license stops a government or bank tender dead.

---

## ACCESS CONTROL — SIGNED CLIENT LINKS

The form must not be open to the public. Each client gets their own link from me, and the site shows an invalid-link screen without one.

**Keep this deliberately simple.** It is a static site with no server, so the gate is a speed bump, not security — someone determined can edit the JS locally and get in. That is fine and expected; the app holds nothing worth stealing. Do not add anything to harden it further. Specifically: **no expiry dates, no usage counters, no key-rotation commands, no analytics.** Those need a server to be meaningful and would only add moving parts. Deletion is the one exception, and it is deliberately weak — see the delete option in the CLI below.

### How it works
**Ed25519-signed tokens** (`@noble/ed25519` — tiny, browser-native).

- The **private key lives on my machine only**, gitignored, never in the build.
- The deployed bundle contains **only the public key**.
- A token is a signed payload: `{ id, client, clientAr, type, tracks }` — base64url payload + signature, in the URL hash: `https://form.mysite.com/#t=<payload>.<sig>`.
- On load the app verifies the signature offline and either opens the form, or shows a clear Arabic message with my contact details.
- Unlimited tokens. No pool to run out, no redeploy to issue one.

### The token configures the form
This is the real payoff beyond access control. The form opens **already set up for that client**:
- Client name pre-filled (Arabic and English), used in every generated filename and on the docx cover
- Project type pre-selected, so steps that don't apply never appear
- Which tracks are enabled (technical / content / both)
- The token `id` printed in the docx footer, so a returned file tells me which link produced it

### A short code as a fallback
Long links get mangled in WhatsApp. Also accept a **short code** typed on the landing screen: 12 characters in groups of 4, like `K7QP-3M2A-XR9T`. The CLI issues both for the same token; the short code maps to a bundled index of SHA-256 hashes. High-entropy codes mean the hashes reveal nothing.

### The CLI — an interactive bash menu
A Node script does the crypto; a **bash script wraps it in an Arabic menu** so I never have to remember flags. `./serial.sh` with no arguments opens:

```
════════════════════════════════
   إدارة سريالات نموذج العملاء
════════════════════════════════
  1) إصدار سريالات جديدة (دفعة)
  2) إصدار سريال مخصص لعميل
  3) عرض السريالات المتاحة
  4) حذف سريال
  5) عرض السريالات المحذوفة
  6) خروج
────────────────────────────────
اختر رقماً:
```

**1 — bulk issue.** Asks how many, generates that many generic serials in one go, prints them as a numbered list ready to copy, and appends them to the ledger. Generic serials carry no client details, so the form simply asks the client for their name and project type on the first step. This is the "keep a stack ready and hand one out" workflow.

**2 — issue for a specific client.** Prompts for client name (Arabic and English), project type, and tracks, then prints the link, the short code, and a ready-to-send Arabic WhatsApp message containing both. This is the pre-configured version, where the form opens already set up for that client.

**3 — list available.** A clean table: serial, client (or `— عام —` for generic), type, issue date. **Deleted serials never appear here.**

**4 — delete.** Pick by number from the list or paste a serial. Confirm before acting. Deleting marks it deleted in the ledger and adds its id to `src/revoked.json`. Print plainly afterwards: the link keeps working until the site is rebuilt and re-uploaded — there is no server to ask, so revocation only takes effect on the next deploy. Never let me believe a link died the moment I deleted it.

**5 — list deleted.** Serial, client, issue date, deletion date. Offer to restore one, since I will delete the wrong row eventually.

Requirements for the script itself:
- Arabic menu text, RTL-safe in a normal terminal, with colour on the headers and on warnings.
- Works fully offline. It must never make a network call.
- Invalid input re-prompts rather than crashing or exiting.
- Both `serials.json` and the private key are gitignored.
- Every destructive action confirms first.
- Also expose the same operations as plain flags (`./serial.sh new 20`, `./serial.sh list`) so I can script it later, but the menu is the default when run bare.

### Behaviour details
- Store the verified token in `sessionStorage` so a refresh doesn't kick the client out mid-form.
- Tokens never expire. A client can come back to the same link weeks later and continue from their autosaved draft.
- After verifying the signature, check the id against the bundled `src/revoked.json` and reject anything listed there.

---

## RETURN, EDIT, RE-EXPORT

Nothing about this is one-shot. The client downloads their files, notices something wrong a week later, comes back to the same link and fixes it — and everything regenerates. Design for that from the start rather than bolting it on.

- Their link never expires and their draft is autosaved, so returning drops them straight back into the form with every answer and every uploaded image intact.
- After the first download, the review screen becomes the landing screen: a summary with **"تعديل"** next to every section, so they jump straight to what they want to change instead of clicking Next twenty times.
- **Regenerating produces a complete new set** — xlsx, pdf, zip, and docx if enabled. Never a partial update; a client should never be holding v1 of one file and v3 of another.
- Bump a **version counter** on every export, and put it in the filename and on the cover of every file, next to the generation date and time. When two files land in my inbox I must be able to tell in one second which is newer.
- The re-exported ZIP contains only the images currently in the form. If they deleted a product, its photos are gone from the new ZIP too, and the manifest matches.
- On return, show a short line: last saved on X, version Y was exported on Z.

### If they lose their browser data
Autosave lives in that browser on that device. Add **"حفظ نسخة من البيانات"** / **"استرجاع نسخة"** — downloading and re-importing a small `.json` draft. It covers the client who switches to a different computer, hands the file to a colleague to finish the product section, or clears their browser. Two buttons, no explanation needed beyond one line of Arabic.

---

## BUILT TO ELIMINATE MEETINGS

This is the actual purpose of the tool. Everything below exists because it removes a call, so treat this section as functional requirements, not polish.

### 1. The client usually isn't the person who knows
Most unanswered items sit with someone else — the previous developer, the hosting company, the IT department. So beside every **"لا أعرف"** toggle, ask **"من يملك هذه المعلومة؟"** with a dropdown: المطور السابق · شركة الاستضافة · مزوّد البريد · قسم تقنية المعلومات · الإدارة · المحاسب · لا أعرف.

Then generate, per owner, a **ready-to-forward message** the client copies and sends:

> السلام عليكم، نعمل حالياً على نقل موقع الشركة ونحتاج منكم التالي:
> ١. رابط لوحة تحكم الاستضافة
> ٢. اسم المستخدم
> ٣. هل صلاحية SSH متاحة؟
> شاكرين تعاونكم.

One message per party, only the items that party owns, with a copy button next to each. This single feature replaces the three-way call where the client conferences in their old developer.

### 2. Inline help on every field that isn't obvious
A small **؟** next to the label, opening one or two lines of plain Arabic — what the item is, and **where to find it**. Written for a business owner, not an engineer.

> **رابط لوحة تحكم الاستضافة**
> عادة يكون على شكل `yoursite.com/cpanel` أو رابط أرسلته لك شركة الاستضافة عند الاشتراك. ابحث في بريدك عن رسالة الترحيب منهم.

Every "ما المقصود بهذا السؤال؟" that reaches me by phone is a failure of this text. Write the help before writing the field.

### 3. An auto-generated call agenda
Most of what the client and I discuss doesn't need a call — it needs an answer. So the output separates the two. Add a section to the documents titled **"نقاط تحتاج مكالمة"**, containing only genuine decisions:
- conflicting answers (mailbox count doesn't match the table; go-live date before the contract ends)
- items marked "لا أعرف" with owner "لا أعرف" — nobody knows where it lives
- choices requiring the decision maker, not the technical contact
- anything flagged by a review-screen warning

Everything else is settled in writing and stays out of the meeting. Print an estimated length: "٤ نقاط — حوالي ١٠ دقائق."

### 4. A scope summary, in writing, before anyone talks
Derive from the answers a short **"ما سنقوم به"** list and a **"خارج النطاق"** list, printed in every document. Not a quote and not a price — just the shape of the work as the answers describe it. Scope arguments three weeks in are meetings too, and this is what prevents them.

### 5. Flag what needs the decision maker
Some answers can't come from the technical contact. Mark those fields, and group them in the documents under **"يحتاج موافقة صاحب القرار"** so the client can collect them in one conversation with the right person instead of three rounds of back-and-forth.

### Surviving the gap between sessions
The client will close the laptop and come back tomorrow, or next week. Three things break that if you don't handle them explicitly:

- **Ask for persistent storage.** Call `navigator.storage.persist()` on first load. Without it, the browser is free to evict IndexedDB under storage pressure, and the client returns to find their uploaded photos gone while the text survived — the worst possible failure, because it's silent.
- **Detect private/incognito mode** and say so plainly before they start: nothing will be saved in this mode, please open the link in a normal window. Do not let someone fill forty fields in a private tab and lose all of it.
- **Set expectations once, in one line:** the draft is saved in this browser on this device. Put it next to the save indicator, not buried in a help page. Then the export/import draft buttons make sense when they need them.

### Coming back
- Open on the review screen with a **"متابعة من حيث توقفت"** button that jumps to the first incomplete step, not to step one.
- The step list shows per-section state — complete, partial, untouched — so they can see at a glance that only products are left.
- Show what changed since last time: last saved on X, version Y exported on Z.
- Nothing is ever locked. A section finished yesterday can be edited today, and the client can re-export whenever they like.

### More than one person filling it
Common in practice: the IT contact does hosting and mail, someone in marketing does products and photos. The draft export covers this — one person fills their part, sends it to the other, who imports and continues.

**Two export options, because images change everything.** A draft with photos embedded as base64 would turn 60MB of images into an ~80MB file that no one can send on WhatsApp. So offer both, and show the actual size on each button before they click:

- **"نسخة خفيفة (بدون صور)"** — a small `.json`, usually well under a megabyte. The default. Sends anywhere, instantly.
- **"نسخة كاملة (مع الصور)"** — a `.zip` containing `draft.json` plus the original image files. Use `.zip`, not `.json`, so it's obvious from the extension that it's the heavy one. No size cap and no warnings — show the number and let the client decide.

**On import of a light draft**, list exactly which rows are now missing their images — "٦ منتجات بحاجة إلى صور" — with links jumping straight to them, so the person who receives it knows what's left rather than discovering it at export time.

**Importing onto existing work is the dangerous case.** Never silently overwrite. Show a summary first — which sections the incoming file has, which the current draft has — then offer two clear choices: replace everything, or fill only the sections that are currently empty. Make the second one the default, since that's the handoff scenario.

Label the buttons so the use case is discoverable (**"حفظ نسخة لإرسالها لزميل"**) rather than something I have to explain on a call.

---

## REVIEW SCREEN

Before generating, show a summary with a **readiness score** and traffic lights per section:

- 🟢 complete · 🟡 partial · 🔴 missing critical items

Plus automatic warnings derived from the answers:
- Domain expires in under 30 days → warn
- No backup available → warn
- MX still points at the provider we're leaving → note it
- Mailboxes marked "migrate" but no data size given → warn
- 2FA enabled on an admin account we need → remind them an app password or temporary access is needed
- **Migration access is `per-mailbox` → warn that a password will be needed for every migrated mailbox, and show the count** ("14 mailboxes to migrate = 14 passwords required")
- **2FA on staff mailboxes + `per-mailbox` access → warn that app passwords must be generated for each one**
- **Old provider contract ends before, or within 7 days of, the requested go-live date → red warning:** do not cancel the old subscription before migration is verified
- IMAP not enabled, or unknown → warn that migration cannot start until it is enabled
- Mailbox count in the mail step doesn't match the number of rows in the mailbox table → flag the mismatch

Each warning links back to the step that produced it.

---

## GENERATED FILES

## GENERATED FILES — PRIORITY ORDER

Build them in this order, and **treat the first two as the product**. The docx is a nice-to-have.

1. **`.xlsx` — required.** This is the one the client can still type into after downloading, so the passwords sheet lives here and does the job the Word table was going to do. Never ship a build where this is broken.
2. **`.pdf` — required.** Produced through the print stylesheet, so Arabic always renders correctly. This is the read-only summary for approval and for the client's own records.
3. **`-assets.zip` — required whenever images were uploaded.**
4. **`.docx` — optional, build it last.** Put it behind a flag (`ENABLE_DOCX`, default on) so I can switch it off in one line if Arabic rendering fights back.

**Failure must be isolated.** Wrap each generator in its own try/catch. If the docx throws, the client still gets the xlsx, the pdf and the zip, plus a calm Arabic message: the Word file couldn't be produced, everything else is ready, and the Excel file contains the same information. One broken generator must never block a download.

Filenames: `{clientName}-{YYYY-MM-DD}-onboarding-v{n}.xlsx` / `.pdf` / `.docx`, and `{clientName}-{YYYY-MM-DD}-assets-v{n}.zip`

**The download screen must make the ZIP impossible to miss.** If the client uploaded any images, the ZIP is listed first, larger than the others, with a line in Arabic: the images live in this file — please send it with the document. Clients forget the attachment; the layout should fight that.

### The .docx — structure

1. **Cover page** — my logo, client name, project type, date, and a bold security notice in AR/EN: this document will contain credentials; fill it on your own device, send it through an encrypted channel, and rotate all passwords after handover is complete.
2. **Missing items requiring action** — the list from the "لا أعرف" toggles, **grouped by who owns each item**, with the ready-to-forward message for each party printed underneath its group.
3. **Project summary** — type, deadline, contacts, cutover window.
4. **All answers**, as clean bilingual two-column tables, section by section.
5. **The mailbox table** as a full-width table.
6. **PASSWORDS PAGE** — the last section, clearly titled `صفحة كلمات المرور / Passwords Page`. Its **primary home is the `.xlsx`**, on its own sheet, because that is the file the client can still type into after downloading. The same content appears in the docx when that generator is enabled, and in the pdf **only if the in-form password toggle was used** — never print an empty password table into a PDF nobody can fill. It has **two tables**:

   **Table 1 — service credentials.** One row per credential identified from the answers (domain registrar, hosting panel, SSH/FTP, database, mail admin console, CMS login, Cloudflare, payment gateway, analytics, social accounts). Columns: Service · Login URL · Username (pre-filled from their answers) · **Password (blank)** · 2FA method · Notes.

   **Table 2 — mailbox passwords.** This table is **conditional on the "migration access method" answer in step A5b**:
   - If they chose `admin` → do not print the table. Print one line instead: admin access is available, so individual mailbox passwords are not needed.
   - If they chose `per-mailbox` or `unknown` → print the table with **one pre-filled row per mailbox marked "migrate"** in the mailbox table, so the client just fills the password column. Columns: Email address (pre-filled) · **Password (blank)** · **App Password (blank, if 2FA)** · 2FA enabled? · Mailbox active? · Notes.
   - Above it, print the explanation in both languages: if admin access exists this table can be skipped; if 2FA is on, create an app password and put it in that column instead of the real password.

   In both tables the password columns must be visibly empty with enough row height to write into, and the security instruction line must sit directly above them.
7. **Image index** — `فهرس الصور / Image Index`, a table listing every uploaded image: filename (as it appears in the ZIP) · section · row number · item name (AR) · item name (EN) · original dimensions and size. Same content as MANIFEST.csv, printed so it can be read without opening the ZIP. Skip this section entirely if nothing was uploaded.
8. **Checklist for the client** — what to send along with the document (the assets ZIP first, then logo files, catalogs, drive link).

### The .xlsx
Track A → one sheet per section, plus a `Mailboxes` sheet, plus a `Passwords` sheet carrying both password tables exactly as described above. Track B → the seven Arabic sheet names listed earlier. RTL views, sensible column widths, frozen header rows, bold headers in my brand color, and the same project-type banner at the top of each sheet.

### The .pdf
Print-stylesheet version of the same document, minus the passwords page (it's a read-only summary for their records).

---

## DESIGN

Clean, calm, professional — this goes to banks and government clients, so it must look trustworthy, not startup-playful. RTL-first layout, generous whitespace, large touch targets, fully usable on a phone. A sticky footer with back/next and the save indicator. Smooth step transitions. No emoji in the UI chrome.

---

## DELIVERABLES

```
/src          — index.html, main.js, strings.js, auth.js, revoked.json, steps/, generators/ (docx.js, xlsx.js, zip.js, print.js), media/ (compress.js, store.js), styles/
/cli          — serial.sh (interactive Arabic menu), serial.js (crypto), serials.json ledger (gitignored, along with the private key)
/public       — fonts, logo
/dist         — built static output
README.md     — how to build, how to upload to CyberPanel, and how to issue a client link
```

Plus, in the README: how I add or rename a question without breaking anything. Keep the questionnaire defined as **data** (a JSON/JS schema of steps and fields), not hardcoded in HTML, so I can edit the schema file and the UI, docx and xlsx all update automatically. This matters more than anything else for maintainability. The project-type routing matrix lives in that same schema as a per-step `appliesTo: ["new","migration","redesign","email"]` property.

---

## ACCEPTANCE CHECKS

Before you tell me it's done, verify:

1. With the password toggle **off**, `grep -r "password" src/steps/` surfaces no active input fields — the default path collects nothing.
2. Build, serve `dist/` from a plain static server, open DevTools Network tab, fill the form, generate all files — **zero outbound requests**.
3. Open the generated `.docx` in Word: Arabic reads right-to-left correctly, tables are not mirrored wrongly, the passwords page is on its own page with empty cells.
4. Open the `.xlsx`: Arabic sheets open in RTL view, no `#####` columns.
5. Refresh mid-form: data is restored.
6. Latin terms like `2FA` and `DNS` render correctly inside Arabic labels — not reversed, not pushed to the wrong end of the line.
7. Test on a 380px-wide viewport.
8. **Pick "new build" → the migration step never appears.** Pick "email only" → hosting, third-party and all content steps are skipped.
9. **Set migration access to `admin` → the mailbox-password table is absent from the docx.** Set it to `per-mailbox` with 3 mailboxes marked "migrate" → the docx contains exactly 3 pre-filled rows with blank password cells.
10. Set the old provider's contract end date to a day before go-live → the red warning fires on the review screen.
11. **Upload 10 product photos totalling ~60MB → the `.docx` opens in Word with visible thumbnails and stays under ~15MB**, and the ZIP contains the 10 originals at full resolution with a MANIFEST matching the filenames printed in the document.
12. Upload images, refresh the page → thumbnails are still there (IndexedDB), and `localStorage` has not overflowed.
13. Fill the form with **no** uploads at all → all three files still generate without errors, and the image index section is absent.
14. **Pick any filename printed under a thumbnail in the .docx, search for it in the ZIP → it exists at exactly that path**, and the same name appears in MANIFEST.csv, in manifest.json, and in the row's "أسماء ملفات الصور" field. No mismatches anywhere.
15. Confirm the filename captions render left-to-right on an Arabic (RTL) page — not reversed.
16. **Turn the password toggle on, type values, refresh the page → the password fields are empty while every other answer is restored.** Then inspect `localStorage` and IndexedDB: no credential appears in either.
17. With the toggle on, run `fetch('https://example.com')` from the console on the deployed page → the CSP blocks it. Paste the resulting console error into the README as proof.
18. Generate the docx with the toggle on → passwords appear filled in the passwords table; with it off → the same table prints with empty cells.
19. **Open the deployed URL with no token → the form does not load**, only the invalid-link message. Open it with a valid link → it loads with the client name already filled and the correct steps shown.
20. The short code issued for a token opens the same configured form as the long link.
21. `grep -r "PRIVATE\|privateKey" dist/` returns nothing — only the public key ships.
21b. Run `./serial.sh`, issue 5 in bulk, delete one → the deleted serial is gone from option 3 and present in option 5. Rebuild and redeploy → that link is rejected while the other four still work.
22. **Set `ENABLE_DOCX = false`, or force the docx generator to throw → the xlsx, pdf and zip still download**, and the client sees a calm message rather than a broken screen.
23. Download, return to the same link, change one product name, re-export → every file is v2, the new ZIP matches the new manifest, and no file is left at v1.
24. Fill half the form with images, **close the browser completely, reopen the link the next day** → text and images both restored, and the resume button lands on the first incomplete step.
25. Open the link in a private/incognito window → the warning appears before any field is filled.
26. Export a **light** draft on one browser, import it in another → every answer comes across and the missing-images list names the right rows. Export a **full** draft, import it → images come across too, at original resolution.
27. Import a draft onto a browser that already has work in it → the merge prompt appears first, and choosing "fill empty sections only" leaves existing answers untouched.


---

## HOW TO WORK

Deliver the whole thing in one go — I'm not splitting this into phases. But build it in this order internally, and **stop at each checkpoint to show me what you have** before continuing. If something is going to fight back, I want to know at the checkpoint, not at the end.

**1. Schema and wording.** Write the field schema (every step, every field, `appliesTo` per step) and `strings.js`. Show me both. Nothing else yet — if the schema is wrong, everything built on it is wrong.

**2. The two hard things, early.** Before any UI, write a throwaway script that generates one `.xlsx` with Arabic RTL and one `.docx` with an Arabic table, and open them. Arabic in Office files is where this project is most likely to hurt, so find out on day one rather than after the wizard is built. Show me the output files.

**3. The wizard.** Steps, branching, autosave, the mailbox table, the review screen with its warnings.

**4. Uploads.** Compression, IndexedDB, thumbnails, the ZIP with its manifest.

**5. Generators.** xlsx first (it's required), then pdf, then zip, then docx last behind its flag.

**6. Access control and CLI.** Last, because nothing depends on it.

**7. README and the acceptance checks.** Run every check in the list yourself and paste the results. Don't tell me it's done until you have.

Two standing rules while you work: when something in this spec turns out to be impractical, say so and propose the alternative instead of quietly building something else. And when you hit a decision I didn't cover, pick the simpler option and tell me what you picked.
