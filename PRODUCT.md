# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary Users:** Arabic-speaking business clients, project managers, and organizational stakeholders (specifically in Saudi Arabia and the broader MENA region) who are commissioning a web or digital project.
- **Situation & Job:** The client has contracted a digital agency or engineering team. They need to supply all project requirements, domain/DNS access, technical infrastructure details, branding assets, page inventories, mailbox lists, and regulatory/tax compliance information (e.g., ZATCA, commercial registration) without technical friction, confusion, or security anxiety.
- **Secondary Users:** Agency developers, project managers, and technical leads who receive the generated `.xlsx` workbook, PDF summary, and compressed asset archives to execute the handover seamlessly.

## Product Purpose

Jahiz (جاهز) is an Arabic, RTL-first client onboarding and technical data collection wizard. It exists to eliminate chaotic handovers across fragmented channels (email threads, WhatsApp voice notes, unformatted spreadsheets) by providing a structured, guided questionnaire that generates a clean Excel deliverable, PDF overview, and bundled asset package entirely within the client's browser.

Success means the client completes the questionnaire with clarity and confidence, accurately marks unknowns with responsible contacts, and provides the agency with a complete, structured data handover without any sensitive client data ever hitting a third-party server or database.

## Positioning

Unlike typical cloud form builders (Typeform, Google Forms, Airtable, JotForm) that store client credentials and data on external servers and mandate ongoing subscription backends, Jahiz is a **100% zero-backend, client-side cryptographic wizard**:
- Enforced zero data exfiltration via strict Content Security Policy (`connect-src 'none'`).
- Cryptographic offline link authorization using Ed25519 signatures embedded in the URL fragment (`#t=...`), requiring zero server session state or database lookup.
- Complete data ownership: All state is autosaved locally via IndexedDB/localStorage and exported directly into client-downloaded `.xlsx` spreadsheets, print/PDF summaries, and ZIP archives.

## Operating Context

- **Access & Distribution:** Clients receive a signed unique link or short code via WhatsApp or email sent by the agency CLI (`cli/serial.sh`).
- **Device & Environment:** Modern desktop and mobile browsers (Chrome, Safari on iOS/macOS, Edge) running in an Arabic RTL layout.
- **Workflow Interruption & Resumption:** Form completion often spans multiple sessions as clients gather domain logins or mailbox rosters; progress autosaves locally with draft recovery, private-window detection, and draft export/import.
- **Delegation Rituals:** Clients often don't possess all answers directly (e.g. IT credentials, DNS settings); the interface allows toggling "I don't know / who has this" to auto-generate pre-composed forwarding messages (ready-to-send WhatsApp/email copy) for their third-party vendors or internal staff.

## Capabilities and Constraints

- **Single-Page Vanilla Web App:** Built with Vite and native ES modules with zero runtime frontend frameworks.
- **Branching Track Routing:** Supports Track A (Technical Handover: hosting, DNS, registrars, databases), Track B (Content Handover: pages, copy, assets), or Full Handover based on token parameters or user selection.
- **Strict Network Isolation:** No network requests after page load. Absolutely zero remote API endpoints, third-party analytics, or telemetry.
- **Client-side File & Media Processing:** On-device image compression via HTML5 Canvas (1200px JPEG) stored in IndexedDB and packaged into `.zip` archives via JSZip.
- **Document Generation:** Native browser generation of formatted multi-sheet Excel files (`.xlsx` via ExcelJS) and print/PDF views. (`.docx` generation is explicitly descoped).
- **Offline Link Verification:** Ed25519 public key bundled into client bundle verifies URL tokens entirely offline. Revocation lists and shortcodes are statically bundled.

## Brand Commitments

- **Name:** جاهز (Jahiz) — نموذج تسليم بيانات المشروع.
- **Voice & Tone:** Professional, reassuring, clear Arabic (Fusha), respectful of non-technical stakeholders while offering precise technical guidance.
- **Typography:** Cairo font family (`@fontsource/cairo`), optimized for clear Arabic legibility at all weights and sizes.
- **Direction & Layout:** Strictly Right-to-Left (RTL) first, natural Arabic reading flow and alignment.
- **Privacy First:** Prominent reassurance that data never leaves the client's device.

## Evidence on Hand

- Reference questionnaire and Excel template: `نموذج-تسليم-بيانات-المشروع.xlsx`.
- Detailed specification prompt: `claude-code-prompt-onboarding-wizard.md`.
- Working codebase in `src/` containing full schema definitions, steps, validators, generators, and RTL styles.
- Offline Ed25519 token generation CLI scripts in `cli/serial.sh` and `cli/serial.js`.

## Product Principles

1. **Absolute Privacy by Design:** The client's sensitive information (including passwords, tax details, and infrastructure keys) must never leave their browser. What cannot be transmitted cannot be breached.
2. **Empowerment Over Friction:** When a user lacks technical details, offer proactive assistance—such as pre-written WhatsApp requests for IT vendors—rather than blocking them with validation barriers.
3. **Structured Deliverables Over Ad-Hoc Data:** The output must be directly actionable for the technical team (standardized Excel workbooks, categorized media ZIPs, clear readiness scoring).
4. **Resilient Local Persistence:** Progress is never lost accidentally; seamless autosaving, graceful offline recovery, and draft export/import are fundamental guarantees.

## Accessibility & Inclusion

- Native RTL semantic layout with accessible focus states, high-contrast typography, and intuitive button hierarchies.
- Clear error notifications, inline field explanations, and accessible modal dialogs for technical term definitions.
- Private mode detection warning users about ephemeral storage limitations to protect them from accidental data loss.
