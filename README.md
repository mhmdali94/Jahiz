# جاهز (Jahiz) — نموذج تسليم بيانات المشروع

Static, Arabic (RTL) client-onboarding wizard. No backend, no database, no
network requests after the page loads. A client opens a signed link,
answers a branching questionnaire, and downloads an Excel file, a PDF
summary, and (when they uploaded photos) a ZIP of their images. Everything
runs and is stored in the client's own browser.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173 — needs a #t=<token> in the URL, see below
npm run build       # -> dist/, ready to upload as static files
npm run preview      # serve dist/ locally to sanity-check a production build
```

The wizard is gated behind a signed link (see **Issuing a client link**
below) — opening it with no token, or an invalid one, shows an "invalid
link" screen instead of the form. For local development, issue yourself a
token once and bookmark the URL it prints.

## Uploading to CyberPanel

1. `npm run build`.
2. Upload the entire contents of `dist/` (not the folder itself) into the
   site's `public_html/`. This includes `.htaccess` — it's a normal file,
   just hidden; make sure your FTP client/File Manager is set to show
   hidden files, or it won't get uploaded and the security header below
   silently won't apply.
3. That's it — no server config, no database, no build step on the server.

`dist/.htaccess` sets the real `Content-Security-Policy` response header
(the `<meta>` tag in `index.html` is only a fallback for the rare case a
host strips custom headers). It requires `mod_headers`, which CyberPanel's
OpenLiteSpeed has enabled by default per-vhost. If your header somehow
doesn't apply, check with your host that `.htaccess` overrides are allowed
for the vhost.

## Deploying with Docker (auto-updating, behind Nginx Proxy Manager)

An alternative to the CyberPanel/FTP flow above, live at
**jahiz.aathrconsult.com**. Three pieces:

1. **`Dockerfile`** — multi-stage build: compiles the site with Node, then
   serves the plain static output with nginx. `.htaccess` is Apache-only and
   does nothing under nginx, so `nginx.conf` sets the same
   `Content-Security-Policy` header a different way — keep the two in sync
   if that policy ever changes.
2. **`.github/workflows/docker-publish.yml`** — on every push to `main`,
   builds that image and pushes it to `ghcr.io/mhmdali94/jahiz:latest`.
   This is the "auto" part: a `git push` is the entire deploy step, no SSH
   access from GitHub to the server needed.
3. **`docker-compose.yml`** — pulls that image and runs **Watchtower**
   alongside it, which polls GHCR every 5 minutes and restarts the
   container when a newer image shows up. This is what turns "a new image
   exists on GHCR" into "the running site is actually updated."

### One-time setup on the deploy host

```bash
git clone https://github.com/mhmdali94/Jahiz.git
cd Jahiz
docker compose up -d
```

That starts the site on **port 18432** (deliberately not 80/443/8080/3000 —
see the comment in `docker-compose.yml` if it collides with something else
on this host) and Watchtower alongside it. From here on, `git push` to
`main` is all it takes to update the live site — nothing else to run on
the server again.

If `ghcr.io/mhmdali94/jahiz` ends up private (GitHub's default for a
private repo), Watchtower needs credentials to pull it:
`docker login ghcr.io -u mhmdali94` with a
[PAT](https://github.com/settings/tokens) scoped to `read:packages`. Easier
alternative: make the package public once — GitHub repo → **Packages** →
`jahiz` → Package settings → Change visibility.

### Pointing the domain at it (Nginx Proxy Manager)

In NPM's UI, add a Proxy Host:

- Domain: `jahiz.aathrconsult.com`
- Forward to: this host's address, port `18432`
- SSL tab: request a Let's Encrypt certificate, force SSL

Confirm the security header survives the proxy hop:

```bash
curl -sI https://jahiz.aathrconsult.com | grep -i content-security-policy
```

### Local testing without any of the above

`docker-compose.build.yml` builds straight from source instead of pulling
from GHCR, so changes are testable before they're ever pushed:

```bash
docker compose -f docker-compose.build.yml up -d --build
```

### Issuing links

Works the same as ever — run `node cli/serial.js` locally, not inside the
container; it only edits `src/shortcodes.json`/`cli/serials.json` on disk.
Once deployed, issue real client links against the real domain:

```bash
node cli/serial.js issue --client "..." --base-url "https://jahiz.aathrconsult.com"
```

One thing changes with this pipeline: a **long link** (`#t=...`) works the
instant it's issued, no redeploy needed, but a **short code** is baked into
`src/shortcodes.json` at *build* time — after issuing one, commit and push
that file so the next GitHub Actions build (and the Watchtower pull that
follows it) actually includes it.

`cli/private.key` and `cli/serials.json` never get copied into the image
(see `.dockerignore`) or committed (see `.gitignore`), but they still live
unencrypted on whatever machine runs the CLI — secure and back up that
machine the same as before.

## Issuing a client link

```bash
./cli/serial.sh          # interactive Arabic menu
./cli/serial.sh new 20   # bulk-issue 20 generic links, no menu
./cli/serial.sh list     # same, non-interactively
```

The first time it runs, it generates an Ed25519 keypair: the private half
goes to `cli/private.key` (gitignored — **never commit or share this
file**), and the public half gets written into `src/auth-public-key.js`
(committed — the deployed site needs it to verify links offline).

Two ways to issue a link:

- **Bulk (menu option 1)** — generic links with no client info baked in;
  the client types their own company name and picks a project type on the
  form's first step. Good for keeping a few links ready to hand out.
- **Specific (menu option 2)** — asks for the client's name, project type,
  and tracks, and bakes them into the token: the form opens pre-filled and
  skips steps that don't apply (picking "email only" never shows a
  Track-B content step, for instance). Prints a ready-to-send Arabic
  WhatsApp message with both the long link and the short code.

**Important — two different "how fast does this take effect" answers:**

- The **long link** (`https://yoursite.com/#t=...`) is self-contained —
  the whole signed payload is in the URL, so it works the instant you
  issue it. No rebuild, no redeploy.
- The **short code** (`K7QP-3M2A-XR9T`, for when WhatsApp mangles long
  links) and **deleting/revoking** a serial both work through files
  bundled into the build (`src/shortcodes.json`, `src/revoked.json`) — so
  after issuing a new short code or deleting a serial, you must
  `npm run build` and re-upload `dist/` before that change is live. Until
  then, a freshly issued short code won't resolve yet, and a just-deleted
  link keeps working. The CLI's delete option prints this reminder every
  time.

**Rotating the signing key:** if you ever suspect `cli/private.key` was
exposed, delete it and run `./cli/serial.sh` once — it generates a new
keypair and overwrites `src/auth-public-key.js`. Every link issued under
the old key stops verifying the moment you rebuild and redeploy (same as
a mass revocation).

## Editing the questionnaire

The whole form — every step, every field, every table column, which
project types see which steps — is data, not markup. To add, remove, or
reword a question:

1. Open the right file under `src/schema/steps/` (`track-a.js` for
   technical-handover steps, `track-b.js` for content steps,
   `shared-steps.js` for steps that apply regardless of track — passwords,
   Saudi requirements, files & assets, after-handover).
2. Add/edit a `field(...)` (a single question) or `table(...)` (a
   repeatable-rows screen) call — see `src/schema/constants.js` for the
   builder functions and every reusable option list (registrars, mail
   providers, payment methods, etc.).
3. Every field/step has an `appliesTo` (which project types show it at
   all) and, for steps, `requiredFor` (which of those make it mandatory
   for the review screen's readiness score). This is the routing matrix
   from the reference spreadsheet, encoded once, in one place.

Nothing else needs to change — the wizard UI, the review screen's
warnings, and the `.xlsx`/ZIP generators all walk this same schema. The
one exception: the `.xlsx` generator (`src/generators/xlsx.js`) has its
own `SHEET_MAP` naming which sheet each step's answers land on (several
sheets bundle more than one wizard step, matching the original reference
file) — if you add a whole new *step*, add one line there too so it has a
home in the spreadsheet. A new *field* on an existing step needs nothing
extra; it just shows up as a new row.

## Architecture

```text
/src
  index.html, main.js       — entry point + the access-control gate
  strings.js                 — UI chrome wording (not field labels — those live in the schema)
  auth.js, auth-token.js     — signed-link verification (auth-token.js is imported by cli/serial.js too)
  auth-public-key.js         — committed; the public half of the signing key
  revoked.json, shortcodes.json — committed; bundled lookup tables the CLI writes to
  schema/                    — the questionnaire as data (see above)
  steps/                     — the wizard engine: field/table rendering, autosave, the review screen
  media/                     — image compression (canvas, 1200px JPEG) + IndexedDB storage
  generators/                — .xlsx, the print/PDF view, the assets ZIP, draft export/import
  styles/                    — one stylesheet, RTL-first
/cli
  serial.js                  — the actual crypto + ledger logic
  serial.sh                  — the interactive Arabic menu around it
  serials.json, private.key  — gitignored; created on first use
/public
  .htaccess                  — the real CSP header (see above), fonts land here too
/dist                        — build output, upload this to CyberPanel
```

## What's not built

**`.docx` generation was explicitly descoped** — the spec's own framing
("treat the first two as the product... the docx is a nice-to-have") and
an explicit decision during the build both point the same way. The
`.xlsx` carries everything the `.docx` would have, including the
fillable passwords page — nothing is missing from what the client
receives. If a Word document is wanted later, `src/generators/xlsx.js`
and `src/generators/prepareModel.js` already do the section-by-section
data prep it would reuse.

## Verifying the security claims yourself

With the password toggle on ("in-form" credential entry), open DevTools →
Console on the deployed page and run:

```js
fetch('https://example.com')
```

It should throw immediately with `TypeError: Failed to fetch`, and the
Console will separately log:

```text
Connecting to 'https://example.com/' violates the following Content Security Policy directive: "connect-src 'none'". The action has been blocked.
Fetch API cannot load https://example.com/. Refused to connect because it violates the document's Content Security Policy.
```

That's the browser itself refusing the connection at the network layer —
not application code that could have a bug in it.
