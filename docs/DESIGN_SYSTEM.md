# Design System — Telemed Clinical Console

> Production-grade design system for the 5-screen telemed console.
> Source of truth: [`../css/base.css`](../css/base.css) (tokens) + [`../css/components.css`](../css/components.css) (components).
> Version: **v3 — Production Release** (Apr 27, 2026). Replaces v1 grayscale wireframe.

Audience: Doctors and Nurses, OPD telemedicine. Theme: calm clinical (cyan + health green), accessible & ethical (WCAG AA+).

---

## 1. Tokens

All tokens are CSS custom properties on `:root`. Component CSS references tokens only — no hardcoded hex.

### 1.1 Brand colors (cyan + green)

| Step | Cyan (primary) | Green (accent) |
|-----:|----------------|----------------|
| 50  | `#ECFEFF` | — |
| 100 | `#CFFAFE` | — |
| 200 | `#A5F3FC` | — |
| 400 | `#22D3EE` | — |
| 500 | `#06B6D4` | `#10B981` |
| 600 | **`#0891B2`** primary | **`#059669`** accent |
| 700 | `#0E7490` hover | `#047857` |
| 800 | `#155E75` | — |
| 900 | `#164E63` | — |

### 1.2 Neutral (slate)

`--c-slate-50` `#F8FAFC` → `--c-slate-900` `#0F172A` (10 steps). Used for all text, surfaces, borders.

### 1.3 Semantic

| Role | 50 | 500 | 600 | 700 |
|------|----|-----|-----|-----|
| Danger  | `#FEF2F2` | `#EF4444` | **`#DC2626`** | `#B91C1C` |
| Warn    | `#FFFBEB` | `#F59E0B` | **`#D97706`** | `#B45309` |
| Success | `#ECFDF5` | `#10B981` | **`#059669`** | `#047857` |
| Info    | `#EFF6FF` | — | `#2563EB` | — |

### 1.4 Surface / text / border tokens

| Token | Maps to | Usage |
|-------|---------|-------|
| `--bg-app` | slate-50 | Outer app background |
| `--bg-surface` | `#FFFFFF` | Cards, modals, header, sidebar |
| `--bg-muted` | slate-100 | Hover, ghost button hover, bg of muted UI |
| `--bg-inset` | `#F4F8FB` | Vital cells, transcript, inline rx-static |
| `--text` / `--text-strong` | slate-900 | Body, headings |
| `--text-muted` | slate-600 | Secondary copy |
| `--text-subtle` | slate-500 | Helper, hints, axis labels |
| `--border` | slate-200 | Hairlines, card borders |
| `--border-strong` | slate-300 | Hover state borders |
| `--border-focus` | primary-600 | Focus rings |
| `--ring` | rgba primary-600 / 35% | `box-shadow` focus halo |

### 1.5 Spacing (4pt scale)

`--sp-1` 4 · `--sp-2` 8 · `--sp-3` 12 · `--sp-4` 16 · `--sp-5` 20 · `--sp-6` 24 · `--sp-8` 32 · `--sp-10` 40 · `--sp-12` 48.

### 1.6 Radius

| Token | px | Use |
|-------|----|-----|
| `--r-xs` | 4  | Small inputs |
| `--r-sm` | 6  | Soap-key, retry button |
| `--r-md` | 8  | Buttons, inputs, sync rows |
| `--r-lg` | 12 | Cards, status bar |
| `--r-xl` | 16 | Future hero surfaces |
| `--r-pill` | 999px | Chips, pills, identity chip |

### 1.7 Shadow

`--sh-xs` (cards) · `--sh-sm` (header) · `--sh-md` (toast) · `--sh-lg` (mobile drawer) · `--sh-focus` (3px halo via `--ring`).

### 1.8 Motion

| Token | ms | Use |
|-------|----|-----|
| `--t-fast` | 120 | Button hover, input border |
| `--t-base` | 180 | Generic transitions |
| `--t-slow` | 240 | Screen-in, toast-in |

`--ease-out` `cubic-bezier(0.16, 1, 0.3, 1)` (entering) · `--ease-in` `cubic-bezier(0.7, 0, 0.84, 0)` (exiting).

### 1.9 Layout

| Token | Value |
|-------|-------|
| `--sidebar-w` | 260px (0 on mobile) |
| `--header-h` | 64px |
| `--content-max` | 1200px |

---

## 2. Typography

| Family | Role | Source |
|--------|------|--------|
| **Figtree** wght 400/500/600/700 | Display + body (primary) | Google Fonts |
| **Noto Sans** wght 400/500/600 | Body fallback (Thai/CJK reach) | Google Fonts |
| **JetBrains Mono** wght 400/500 | Lab values, HN/IDs, monospaced numerics | Google Fonts |

`font-display: swap` + `preconnect` to fonts.googleapis.com / fonts.gstatic.com in `index.html`.

### 2.1 Type scale

| Token | px / rem | Use |
|-------|----------|-----|
| `--fs-xs`   | 12 / 0.75 | Chip labels, helper text |
| `--fs-sm`   | 14 / 0.875 | Secondary copy, button label |
| `--fs-base` | 16 / 1   | Body |
| `--fs-md`   | 17 / 1.0625 | Patient name in queue rows |
| `--fs-lg`   | 18 / 1.125 | h3 (card title) |
| `--fs-xl`   | 20 / 1.25 | h2 (page title) |
| `--fs-2xl`  | 24 / 1.5 | h1 |
| `--fs-3xl`  | 30 / 1.875 | Future hero |

Line-heights: `--lh-tight` 1.25 (headings), `--lh-snug` 1.4, `--lh-normal` 1.55 (body).

### 2.2 Hierarchy rules

1. One `<h1>` per screen — set inside `.page-header`.
2. Card titles use `<h3>` at 18px / 600. Always paired with an SVG icon.
3. Body text floor 14px (`--fs-sm` for compact UI), 16px for long-form.
4. Numeric data uses `font-variant-numeric: tabular-nums` globally + `--font-mono` for lab values, dose strings, timestamps.

---

## 3. Iconography

**Inline SVG sprite** declared once in `index.html` (`<svg><defs><symbol id="i-...">…`). Every icon is referenced as:

```html
<svg class="icon" aria-hidden="true"><use href="#i-stethoscope"/></svg>
```

Icon set (28 glyphs, Lucide-stroked, `stroke-width: 2`):

`stethoscope · clipboard · heart-pulse · video · file-edit · refresh · check · check-circle · x · x-circle · alert-triangle · alert-octagon · clock · search · menu · pill · flask · shield · ban · trend-up · trend-down · arrow-right · mic · phone-off · save · edit · plus · zap · database · siren · user`.

Sizes: `.icon` 16px (default) · `.icon-sm` 14px · `.icon-lg` 20px · `.icon-xl` 24px. Color is inherited via `currentColor`.

Zero emoji used as structural icons.

### 3.1 Illustrated portrait assets

Standalone SVG illustrations live in `assets/` and are referenced by `<img src="...">` (not from the sprite, since they're full scenes rather than mono-color glyphs).

| File | Use | Notes |
|------|-----|-------|
| `patient-A.svg` | Video Consult main feed when scenario A active | Somchai K., 58M, navy shirt, living room |
| `patient-B.svg` | Video Consult main feed when scenario B active | Malee P., 67F, mauve blouse, bedroom, drawn expression |
| `patient-C.svg` | Video Consult main feed when scenario C active | Anan R., 45M, glasses, green polo, home office |
| `doctor.svg` | Self-view PIP when `state.role === 'doctor'` | White coat, cyan stethoscope, ID badge |
| `nurse.svg` | Self-view PIP when `state.role === 'nurse'` | Cyan scrubs, V-neck, pen in pocket |
| `video-placeholder.svg` | Fallback for unknown scenario ids (D/E) | Generic dark silhouette |

Style guide for new portraits: 800×450 viewBox for main feed, 320×200 for PIP. Soft gradients, no harsh outlines, slate/cyan-tinted backdrops, anatomically-correct head/shoulder portrait sized to fill ~60% of the canvas.

---

## 4. Components catalog

Single methodology: vanilla CSS + utility-flavored class names. No BEM, no CSS-in-JS, no Tailwind. No `!important`.

### 4.1 Card

```html
<div class="card">
  <div class="card-head">
    <h3><svg class="icon"><use href="#i-heart-pulse"/></svg> Latest Vitals</h3>
    <span class="ts-pair">10:42 · 2m ago</span>
  </div>
  <div id="sum-vitals" class="vitals-grid">…</div>
</div>
```

Variants: `.card.danger`, `.card.warn`, `.card.flush` (zero padding), `details.card` (collapsible with rotating chevron).

### 4.2 Buttons

| Class | Style | Use |
|-------|-------|-----|
| `button` (default) | Slate border on white | Secondary actions |
| `.primary` | Cyan-600 fill on white text | Primary CTA per screen |
| `.success` | Emerald-600 fill | Accept, confirm |
| `.danger` | Red-600 fill | End Call, destructive |
| `.ghost` | Transparent border | Tertiary, header search trigger |
| `.icon-btn` | 40×40 square | Icon-only (e.g. hamburger) |
| `.sm` | 32px height | Inside-card secondary |

All buttons: `min-height: 40px`, `gap: var(--sp-2)` for icon+label, `transform: translateY(1px)` on `:active`, `box-shadow: var(--sh-focus)` on `:focus-visible`.

### 4.3 Chips

| Variant | Class | Look |
|---------|-------|------|
| Default | `.chip` | Muted bg + border |
| Flag    | `.chip.flag` | Danger soft bg, danger-700 text |
| Warn    | `.chip.warn` | Warn soft bg |
| OK      | `.chip.ok` | Success soft bg |
| Info    | `.chip.info` | Primary soft bg |

### 4.4 Status pill (queue state)

`.status-pill.waiting / .ready / .in-consult / .done` — uppercase 12px label with leading dot pseudo-element.

### 4.5 Count pill (sync ratio)

`.count-pill` neutral default; `.pill-ok` (emerald) when N=N; `.pill-partial` (amber) when partial.

### 4.6 Filter chip (interactive tab)

Used on queue header. `.filter-chip.active` flips to primary-soft bg. `(N)` count is muted parenthetical.

### 4.7 Vital cell

```html
<div class="vital alert">
  <span class="vital-label">SpO₂</span>
  <span class="vital-value">89<span class="vital-unit">%</span></span>
</div>
```

`.vital.alert` swaps to danger soft bg + danger-700 numeric. Auto-grid `repeat(auto-fit, minmax(120px, 1fr))`.

### 4.8 Lab row

Layout: name (semi-bold) · mono values (`0.02 → 0.15 → 0.8`) · unit · arrow (colored: up=danger, down=ok, flat=subtle) · sparkline · timestamp pushed to end. Bottom dashed divider.

### 4.9 Allergy item / med list

`.allergy-item` — pill with ban icon, drug, reaction in muted parentheses.
`.med-list li` — pill icon, drug name (semi-bold), mono dose pushed right.

### 4.10 Toasts

| Class | Tone | Icon | ARIA |
|-------|------|------|------|
| `.toast.toast-ok` | Green | check | `role="status"` `aria-live="polite"` |
| `.toast.toast-partial` | Amber | alert-triangle | `role="status"` |
| `.toast.toast-fail` / `[role="alertdialog"]` | Red, 4px left bar | alert-octagon | `role="alertdialog"` |

Header has circular icon avatar (28px), title, dismiss `×` (28×28). Body is muted, indented under icon. Auto-dismiss 5s for sync toasts; red-flag toast requires explicit Acknowledge.

### 4.11 Status bar (sync big)

`.status-bar.syncing/ok/partial/fail` — primary/success/warn/danger soft fill with matching SVG. `.syncing .icon` rotates via `@keyframes spin`.

### 4.12 Sync row

`.sync-row` with circular `.sync-icon` avatar that flips by state class. `.syncing` rotates the refresh icon. Retry button is `.retry` (sm).

### 4.13 SOAP grid

```html
<div class="soap-grid">
  <div class="soap-row"><span class="soap-key">S</span><p>…</p></div>
  …
</div>
```

`.soap-key` is a 24×24 cyan-soft tile with bold letter. A and P rows hold textareas instead of `<p>`.

### 4.14 Rx editor

| State | Layout |
|-------|--------|
| Read-only | `.rx-static` row: pill icon, name, mono detail, safety chips pushed right |
| Edit | `.rx-row` grid: drug · dose · freq · duration · `.rx-del` (X). Mobile collapses to 2-col. |

### 4.15 Identity chip (header)

```html
<span class="identity-chip">
  <span class="identity-avatar">DR</span>
  <span>
    <span class="identity-name">Dr. Somchai N.</span>
    <span class="identity-id">ID D-00123</span>
  </span>
</span>
```

Avatar is a 28px gradient circle (cyan-500→700) with auto-derived 2-letter initials.

### 4.16 Search trigger / role switch (header)

`.search-trigger` is a 220px-min muted-bg button with magnifier icon + `⌘K` `<kbd>`. `.role-switch` is a thin select beside the user icon.

### 4.17 Sidebar nav

`.nav-item` is a 40px-min flex row: numbered `.nav-step` chip + SVG icon + label. `.active` flips to primary-soft bg, `.disabled` greys out for nurse-restricted screens. Footer hosts `.scenario-picker` (boxed).

### 4.18 Page header

`.page-header` is `flex space-between` with `<h1>` + `.meta` on the left, `.actions` group of buttons on the right. Stacks on mobile and stretches actions full-width.

---

## 5. Layout primitives

| Class | Layout |
|-------|--------|
| `.app` | CSS grid: `[header header] / [aside main]` |
| `.screen` | Page wrapper, `max-width: var(--content-max)`, fade-in animation |
| `.split-50` | Two-column video page (1.1fr / 1fr), collapses to 1col below 1024 |
| `.grid2` | Symmetric two-up cards |
| `.row.space` / `.row.wrap` / `.stack` | Flex utilities |

---

## 6. Responsive

Breakpoints (mobile-first sense, but rules use `max-width` for component overrides):

| ≤1024px | Tablet / mobile |
|---|---|
| Sidebar collapses to drawer (`280px`), fixed below 64px header, toggled by hamburger |
| Header hides search-trigger, identity-chip name/id (avatar still visible) |
| Page header stacks vertically; actions stretch full-width |
| Rx editor collapses to 2-column with delete on its own row |

| ≤480px | Phone |
|---|---|
| Identity chip hidden entirely |
| Vitals grid → 2 col |
| Filter chips wrap; "Show done" wraps to its own row with top divider |

No horizontal scroll on the main flow at any width. `min-h-dvh` not `100vh` for mobile address-bar resilience.

---

## 7. Motion

| Animation | Duration | Easing | Notes |
|-----------|---------:|--------|-------|
| Screen mount fade+slide | 240ms | ease-out | `.screen` `@keyframes screen-in` |
| Toast slide+fade | 240ms | ease-out | `@keyframes toast-in` |
| Button hover | 120ms | ease-out | bg, border, shadow |
| Sync stepper paint | 450ms/step | linear | `setTimeout` (JS, not CSS) |
| Note autosave debounce | 500ms | — | JS `setTimeout` |
| Sync toast auto-dismiss | 5000ms | — | JS |
| LIVE badge pulse | 1500ms | ease-out | `@keyframes pulse` |
| Spinner | 1000ms linear infinite | — | `@keyframes spin` for `.syncing .icon` |

`@media (prefers-reduced-motion: reduce)` collapses **all** animations + transitions to 0.01ms globally.

---

## 8. Accessibility commitments

- 3px focus halo via `:focus-visible { box-shadow: var(--sh-focus); }` on all interactive elements (`button`, `input`, `select`, `textarea`, `.nav-item`, `.queue-row`).
- Semantic landmarks: `<header role="banner">`, `<aside aria-label="Primary navigation">`, `<main role="main">`. Page wrapper is `<section class="screen">` with `<h1>` per page.
- Toasts are `aria-live="polite"` (sync) or `role="alertdialog"` (red-flag, requires explicit acknowledge).
- Queue rows are `<article role="button" tabindex="0">` with explicit Enter/Space activation handlers.
- Color contrast ≥ 4.5:1 for body text in both default theme and danger/warn/ok variants.
- Color is never the sole carrier of meaning — every state pairs with an SVG icon and text label.

Full audit: [`ACCESSIBILITY_CHECKLIST.md`](./ACCESSIBILITY_CHECKLIST.md).

---

## 9. Do / Don't

✅ **Do**
- Compose tokens, never hardcode hex.
- Use the SVG sprite + `<use>` — never paste inline SVG paths in components.
- Pair every color cue with icon + text.
- One primary CTA per screen, in `.page-header .actions` rightmost slot.
- Use `mount(el, html)` from `js/dom.js` — never set `innerHTML` directly.

❌ **Don't**
- Use emoji as a structural icon. The sprite has 28 glyphs; add to it instead.
- Mix utility frameworks. Vanilla CSS is the methodology.
- Hide focus rings.
- Animate width/height (use transform/opacity).
- Convey state by color alone.

---

## 10. Versioning

| Schema | Tokens | Date | Notes |
|--------|--------|------|-------|
| `state.v1` | grayscale | Apr 19 | Initial wireframe |
| `state.v2` | grayscale | Apr 21 | Identity, role |
| `state.v3` | grayscale | Apr 22 | Sync outcome, Rx edit, timestamps |
| `state.v3` (current) | **cyan + green production** | Apr 27 | Full visual redesign, SVG sprite, Figtree/Noto, mobile responsive |

State schema unchanged in v3 production redesign — only visuals + a11y + responsive.

---

*End of DESIGN_SYSTEM.md*
