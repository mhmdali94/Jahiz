---
name: Jahiz
description: Static, Arabic (RTL) client-onboarding wizard with zero-backend privacy
colors:
  primary: "#1f4e78"
  primary-dark: "#163a59"
  ink: "#1a2330"
  ink-muted: "#5b6572"
  canvas: "#f7f9fb"
  surface: "#ffffff"
  border: "#dde3ea"
  danger: "#b3261e"
  danger-bg: "#fdecea"
  warn: "#8a5a00"
  warn-bg: "#fff6e5"
  note-bg: "#eef3f8"
  success: "#2e8b57"
typography:
  display:
    fontFamily: "'Cairo', 'Tahoma', system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.4
  headline:
    fontFamily: "'Cairo', 'Tahoma', system-ui, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 700
    lineHeight: 1.5
  title:
    fontFamily: "'Cairo', 'Tahoma', system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.5
  body:
    fontFamily: "'Cairo', 'Tahoma', system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "'Cairo', 'Tahoma', system-ui, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 600
    lineHeight: 1.4
  mono:
    fontFamily: "'Courier New', monospace"
    fontSize: "0.85rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "8px"
  md: "12px"
  full: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.sm}"
    padding: "0.65rem 1.25rem"
    height: "2.75rem"
  button-primary-hover:
    backgroundColor: "{colors.primary}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0.65rem 1.25rem"
    height: "2.75rem"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.sm}"
    padding: "0.65rem 1.25rem"
    height: "2.75rem"
  input-text:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0.65rem 0.85rem"
    height: "2.75rem"
  card-step:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "1.5rem"
---

# Design System: Jahiz (جاهز)

## Overview

**Creative North Star: "The Sovereign Handoff" (العهد الموثوق)**

Jahiz embodies institutional trust, executive calm, and bank-grade confidentiality. Designed specifically for Arabic enterprise clients, corporate entities, and government contractors, the visual system prioritizes clarity and solemn security over whimsical decoration. Every screen communicates stability: zero decorative illustrations, zero playful animations, and zero ambiguity.

The density is deliberate and spacious: generous touch targets (44px minimum height), high-contrast Arabic typography using Cairo, and clear Right-to-Left (RTL) reading geometry. Surfaces remain quiet and grounded, establishing confidence that sensitive infrastructure credentials and corporate data are handled with rigorous professionalism and mathematical privacy.

**Key Characteristics:**
- **Strict RTL Alignment:** Every layout, transition origin, table, and indicator flows naturally from right to left.
- **Institutional Palette:** Deep Diplomatic Navy (#1f4e78) paired with pristine slate backgrounds (#f7f9fb) and clean white card sheets (#ffffff).
- **Executive Restraint:** Visual hierarchy is communicated through type weight and clean border boundaries (#dde3ea), not heavy drop shadows or bright gradients.
- **Reassuring Privacy Anchors:** Sticky top banner in Abyssal Slate (#163a59) perpetually reinforcing offline data residency.

## Colors

The palette is composed of disciplined institutional tones engineered for high contrast and executive credibility.

### Primary
- **Diplomatic Navy** (#1f4e78): The primary brand anchor. Used for primary call-to-action buttons, active sidebar milestones, progress bar fills, and active input focus rings.
- **Abyssal Slate** (#163a59): Dark institutional slate reserved exclusively for the permanent, sticky privacy banner at the top of the viewport.

### Neutral
- **Deep Ink** (#1a2330): The primary text color for headings, titles, and filled input fields. High contrast, warm dark slate.
- **Muted Ink** (#5b6572): Secondary text color for explanatory notes, field hints, Latin technical labels, and unselected states.
- **Canvas** (#f7f9fb): The full-page background tone. Subtle cool off-white that prevents screen glare and sets off white cards.
- **Surface** (#ffffff): Pure white background for wizard step containers, inputs, modal dialogs, and table cells.
- **Boundary Border** (#dde3ea): Crisp neutral gray for input strokes, card boundaries, table grid lines, and structural dividers.

### Status & Utility
- **Crimson Alert** (#b3261e): Critical validation errors, missing mandatory handoff items, and invalid access token warnings.
- **Crimson Tint** (#fdecea): Soft background fill for error summaries and missing-field banners.
- **Ochre Warning** (#8a5a00): Amber accent for partial completions, private/incognito browsing notices, and pending items.
- **Ochre Tint** (#fff6e5): Soft background fill for warning alerts and incognito notifications.
- **Ice Note** (#eef3f8): Soft cool blue tint for inline help callouts, informative tooltips, and neutral system banners.

### Named Rules
**The Sovereign Shield Rule.** Deep Diplomatic Navy is strictly reserved for cryptographic trust (sticky privacy banner) and the active path; it is never used as decorative filler or secondary ornament.
**The Status Purity Rule.** Red and amber are strictly reserved for genuine user blockers, missing mandatory steps, and data loss risks. Never use status colors for aesthetic variety.

## Typography

**Display & Headline Font:** Cairo (`@fontsource/cairo`, 'Tahoma', system-ui, sans-serif)  
**Body Font:** Cairo (`@fontsource/cairo`, 'Tahoma', system-ui, sans-serif)  
**Sensitive / Code Font:** Courier New (`monospace`) for passwords, Ed25519 tokens, and DNS records.

**Character:** Cairo delivers authoritative, contemporary Arabic letterforms with open counters and balanced vertical proportions. It maintains exceptional legibility across dense data tables and complex technical terms in RTL.

### Hierarchy
- **Display** (700 weight, 1.5rem / 24px, line-height 1.4): Primary wizard step titles and major dialog headings.
- **Headline** (700 weight, 1.15rem / 18.4px, line-height 1.5): Section headers within a step and card titles.
- **Title** (700 weight, 1rem / 16px, line-height 1.5): Field labels, table headers, and modal titles.
- **Body** (400 weight, 1rem / 16px, line-height 1.6): Default paragraph text, explanatory prose, and form inputs. Maximum measure 75ch for comfortable reading.
- **Label** (600 weight, 0.85rem / 13.6px, line-height 1.4): Button text, badges, Latin technical terms (latin-term), and status indicators.

### Named Rules
**The Native Script Rule.** Always render Latin technical terms (such as DNS, MX, TTL, SSL) in an explicit muted secondary style (`.latin-term`, 0.85em, 400 weight) inline with Arabic labels to preserve natural RTL rhythm without disrupting Arabic baseline harmony.

## Layout

Layout is organized around a centered, bounded container with a maximum width of 72rem (1152px) on desktop, transitioning smoothly to a single-column stacked layout below 768px.

- **Desktop (>= 768px):** Two-column split layout. A fixed-width sticky navigation sidebar (16rem / 256px) on the right (RTL start) provides an omnipresent step index and draft controls, while the primary step form occupies the flexible left pane (`min-width: 0`).
- **Mobile (< 768px):** Full-width single column. The sidebar collapses into an accessible accordion trigger (`.sidebar-toggle`) at the top of the form.
- **RTL Compositor Progress:** The progress bar at the top of the main container fills from the right (transform-origin: right) using compositor-only `transform: scaleX(...)`, avoiding layout thrashing.
- **Sticky Viewport Frame:** A 40px sticky header at the top (`.privacy-banner`) and a sticky footer at the bottom (`.wizard-footer`) frame the experience, ensuring save status and forward navigation are always immediately reachable.

## Elevation & Depth

Jahiz follows a **Strict Flat & Tonal Layering** philosophy. Surfaces are entirely flat at rest. Depth is established through tonal contrast between the Canvas (#f7f9fb) and Surface (#ffffff), bounded by crisp 1px borders (#dde3ea).

### Shadow Vocabulary
- **Focus Halo** (`box-shadow: 0 0 0 3px rgba(31, 78, 120, 0.12)`): The sole interactive elevation cue in the entire application, applied exclusively to focused inputs and buttons.

### Named Rules
**The Flat-By-Default Rule.** Surfaces never float or cast drop shadows at rest. Elevation is structural and flat, expressed purely through 1px crisp borders (#dde3ea) and background tone shifts. Shadows appear only as active state focus halos.

## Shapes

The form language is disciplined, structured, and gently rounded to soften bureaucratic severity while maintaining corporate rigor:

- **Step Cards & Modals:** 12px border radius (`--radius: 0.75rem`), conveying contained structural integrity.
- **Buttons, Inputs, & Options:** 8px border radius (`--radius-sm: 0.5rem`), providing clear, clickable affordances.
- **Pills, Progress Bars, & Toggles:** Fully rounded 999px pill shapes (`border-radius: 999px`) for continuous status indicators.
- **Stroke Width:** Uniform 1px solid borders on cards, inputs, and tables; 2px dashed on upload dropzones.

## Components

### Buttons
- **Shape:** Gently rounded (8px radius / `--radius-sm`).
- **Primary Action (`.btn--primary`):** Solid Diplomatic Navy (#1f4e78) background with white text. 44px minimum height (`min-height: 2.75rem`), padding `0.65rem 1.25rem`.
- **Hover / Focus:** Filter brightness 1.1 with 200ms cubic-bezier transition; focus halo `0 0 0 3px rgba(31, 78, 120, 0.12)`.
- **Secondary Action (`.btn--secondary`):** Crisp white surface (#ffffff) with 1px border (#dde3ea) and Ink text (#1a2330).
- **Ghost Action (`.btn--ghost`):** Transparent background with Muted Ink text (#5b6572).

### Inputs & Text Areas
- **Style:** Pure white surface (#ffffff) with 1px border (#dde3ea), 8px radius, minimum height 44px (2.75rem).
- **Focus State:** Border shifts to Diplomatic Navy (#1f4e78) accompanied by the 3px Navy focus halo.
- **Invalid State:** Border shifts to Crimson (#b3261e), showing a dedicated `.field__error` message below.
- **Monospace Fields:** Specialized sensitive inputs (`.input--sensitive`) switch to Courier New for exact credential entry.

### Radio & Checkbox Tiles
- **Style:** Structured selectable cards with 1px border (#dde3ea), 8px radius, minimum height 44px.
- **Selected State:** Border shifts to Diplomatic Navy (#1f4e78) with an ultra-subtle tint (`rgba(31, 78, 120, 0.05)`).

### Toggle Switches
- **Style:** 40px × 24px (2.5rem × 1.5rem) rounded pill track with an inset 20px white circular thumb.
- **Active State:** Track transitions smoothly from Border gray (#dde3ea) to Diplomatic Navy (#1f4e78).

### Tables
- **Style:** Clean corporate data grid with sticky header row in Canvas tint (#f7f9fb), 1px borders, and right-aligned text. Includes inline actions (duplicate row, delete row) with 32px touch targets.

## Do's and Don'ts

### Do:
- **Do** preserve 100% Right-to-Left (RTL) symmetry in all layout margins, paddings, and directional icons.
- **Do** maintain 44px (2.75rem) minimum heights on all interactive buttons, inputs, and selectable tiles.
- **Do** set progress bar animation origin explicitly to `transform-origin: right` to grow correctly in RTL without triggering browser relayouts.
- **Do** format technical and English terminology in `.latin-term` styling alongside Arabic labels.

### Don't:
- **Don't** add decorative box-shadows, floating card glows, or 3D skeuomorphic gradients.
- **Don't** use casual or conversational emojis in UI chrome (traffic light status 🟢🟡🔴 in the final review score is the sole approved exception).
- **Don't** introduce external web fonts or CDN links that violate the strict offline Content Security Policy (`connect-src 'none'`).
- **Don't** use saturated red or green accents for decorative purposes; reserve them strictly for actionable data verification states.
