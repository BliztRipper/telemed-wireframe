# Design System Snapshot — Telemed Wireframe

> Mini design system for the 5-screen telemed prototype.
> Source of truth: [`../css/base.css`](../css/base.css) (tokens) + [`../css/components.css`](../css/components.css) (widgets).
> All visual output is force-grayscaled via `body { filter: grayscale(100%) }`. Semantic colors are preserved in tokens for the production handoff.

---

## 1. Tokens

All tokens live as CSS custom properties on `:root` and are referenced everywhere. No hardcoded hex values inside component styles.

### 1.1 Color tokens

| Token | Value | Role | Semantic |
|-------|-------|------|----------|
| `--bg` | `#FFFFFF` | Surface 0 | Cards, modals, elevated panels |
| `--surface` | `#F5F5F5` | Surface 1 | App background |
| `--border` | `#E0E0E0` | Hairline | Card border, dividers, chip outline |
| `--text` | `#333333` | Body text | Primary copy, headings |
| `--text-2` | `#666666` | Secondary text | Subtitles, timestamps, helper text |
| `--flag` | `#D32F2F` | Danger | Red-flag toast, ERR rows, ER banner |
| `--ok` | `#2E7D32` | Success | Sync-OK row, ready chip, all-clear pill |
| `--warn` | `#F9A825` | Warning | Partial-sync, interaction caution |

### 1.2 Layout tokens

| Token | Value | Where used |
|-------|-------|-----------|
| `--radius` | `4px` | Cards, chips, buttons (consistent corner) |
| `--sidebar-w` | `220px` | App grid first column |
| `--header-h` | `56px` | App grid first row |
| `--font` | `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` | App-wide font stack |

### 1.3 Spacing scale (de-facto, applied via raw px)

| Step | px | Used for |
|------|----|----|
| xs | `4` | Chip padding, tight gaps |
| sm | `8` | Card padding inner, button padding-x |
| md | `12` | Card padding, default gap |
| lg | `16` | Section spacing |
| xl | `24` | Big-status bar padding |

> Future: extract these into `--space-*` tokens. Listed as design debt #6.

---

## 2. Typography

Single family: `system-ui` stack — selected for zero-network-cost rendering and platform-native legibility on Thai-region clinical desktops/tablets.

| Style | Selector | Size | Weight | Line-height | Use |
|-------|----------|------|--------|-------------|-----|
| **Display / page title** | `.q-title`, screen `<h1>` equivalents | 18–20px | 600 | 1.3 | Screen header |
| **Card title** | `.card > h3`, `.card-head h3` | 13px | 600 | 1.2, **uppercase** + letter-spacing 0.5px | Card heading |
| **Body** | `body` default | 14px | 400 | 1.5 | Long-form copy, list rows |
| **Secondary / meta** | `.text-2`, timestamps, helper | 12px | 400 | 1.4, `color: var(--text-2)` | Subtitles, ISO chips |
| **Chip / pill label** | `.chip`, `.status-pill`, `.count-pill` | 12px | 500 | 1 | Compact tags |
| **Sparkline** | `.sparkline` | 12px | 400 | 1, `font-family: monospace`, `letter-spacing: -0.5px` | Inline lab trend |
| **Tabular timestamp** | `.ts-pair` | 12px | 400 | 1, `font-variant-numeric: tabular-nums` | "HH:MM · Nm ago" |
| **Button** | `button` | 14px | 500 | 1.2 | All actions |

### Hierarchy rules

1. **One screen title per screen.** No competing H1s.
2. Card titles are 13px **uppercase** to make them scannable as labels, not headings.
3. Body copy never goes below 14px. Meta text never below 12px. Chip text is the only 12px element with weight ≥ 500.
4. No italic, no underline (links are nav items styled as buttons; underline reserved for true hyperlinks if added later).

---

## 3. Color usage rules

| Color token | Allowed surfaces | Forbidden surfaces |
|-------------|------------------|---------------------|
| `--flag` (red) | Border-left of toast/banner, status-pill dot, chip `.flag`, `.toast-fail` accent | Backgrounds (would dominate the grayscale lock) |
| `--ok` (green) | Border, chip `.ok`, `.pill-ok`, sync-OK row left-border, `Ready` pill outline | Body text |
| `--warn` (yellow/amber) | `.toast-partial` accent, `.pill-partial`, `.status-bar.warn` | Body text |
| `--text` (#333) | Body, headings | Backgrounds (use `--bg` / `--surface`) |
| `--text-2` (#666) | Meta, timestamps, hints | Headings |
| `--border` (#E0E0E0) | All hairlines | Text |

**Color is never the only carrier of meaning.** Every red surface pairs with `🔴` / `❌` / icon, every yellow with `⚠️`, every green with `✅`. This survives the grayscale filter and meets WCAG 1.4.1 (use of color).

---

## 4. Components catalog

Every component is a single CSS class composing tokens above. No nested specificity wars, no `!important`. Single methodology: vanilla CSS with utility-flavored class names — no BEM, no CSS-in-JS, no Tailwind.

### 4.1 Card

```html
<div class="card">
  <div class="card-head">
    <h3>Latest Vitals</h3>
    <span class="ts-pair">10:42 · 2m ago</span>
  </div>
  …card body…
</div>
```

`background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius); padding: 12px; margin-bottom: 12px;`

### 4.2 Chip

| Variant | Class | Look | Use |
|---------|-------|------|-----|
| Default | `.chip` | Border + transparent bg | Vital chip, lab chip, meta tag |
| Flag | `.chip.flag` | Red text + red border | Abnormal vital, red-flag label |
| Warn | `.chip.warn` | Amber text + amber border | Lab-pending, interaction caution |
| OK | `.chip.ok` | Green text + green border | Allergy-clear, sync-ok inline |

Min-height tap target: 24px (chip is non-interactive); for *interactive* filter chips see §4.4.

### 4.3 Status pill

| State | Class | Look |
|-------|-------|------|
| Waiting | `.status-pill` | Default grey |
| Ready | `.status-pill.ready` | Green outline |
| In-consult | `.status-pill.in-consult` | Solid dark, red dot prefix |
| Done | `.status-pill.done` | Faded |

### 4.4 Filter chip (interactive)

```html
<button class="filter-chip active">All <span class="count">5</span></button>
```

Tap target ≥ 32px tall. `.active` flips background; `.count` is muted parenthetical. Used only on the queue filter row.

### 4.5 Buttons

Single button style hierarchy, applied via class:

| Class | Use | Example |
|-------|-----|---------|
| `button` (default) | Primary action | "Start Video", "Save & Sync →" |
| `.btn-secondary` *(ghost)* | Secondary | "Save Draft", "Cancel", "Acknowledge" |
| `.btn-danger` | Destructive | "End Call 📞❌" |
| `.btn-link` | Inline action | Row "Retry", note "Save draft" |

All buttons:
- Min height 32px (compact rows) or 40px (primary CTAs).
- Padding-x ≥ 12px.
- Visible focus ring via browser default + token-driven outline (no `outline: none`).
- Disabled: `opacity: 0.5; pointer-events: none;` + `aria-disabled` where applicable.

### 4.6 Form elements

| Element | Style |
|---------|-------|
| `<input>` / `<textarea>` | `border: 1px solid var(--border); border-radius: var(--radius); padding: 8px; font: inherit;` |
| Focus | Browser default ring (not removed) |
| `<select>` | Same border + radius, native chevron retained |
| `<label>` | Always paired with input; visible or `aria-label` for icon-only fields |
| Error | `.input-error` adds red border + helper text |
| Disabled | `opacity: 0.5; pointer-events: none;` |

The Rx editor (`.rx-row`) is a horizontally-laid grouping of `drug / dose / freq / duration / ✕` inputs sharing the same form-element styles.

### 4.7 Toasts & banners

| Class | Role | Color accent | ARIA |
|-------|------|--------------|------|
| `.toast` (red-flag) | Mandatory acknowledgement | `--flag` left border | `role="alertdialog"` |
| `.toast-ok` | Sync success (one-shot) | `--ok` left border | `role="status"` `aria-live="polite"` |
| `.toast-partial` | Sync partial | `--warn` left border | `role="status"` |
| `.toast-fail` | Sync all-fail | `--flag` left border | `role="status"` |
| `.status-bar.syncing` | Big "Syncing…" banner | `--warn` | `aria-live="polite"` |
| `.status-bar.ok / .partial / .fail` | Big result banner | `--ok` / `--warn` / `--flag` | `aria-live="polite"` |

### 4.8 List rows

| Class | Use |
|-------|-----|
| `.queue-row` | Queue list item |
| `.queue-row.red` | Red-flag accent (left border `--flag`) |
| `.queue-row.done` | Faded, non-interactive |
| `.sync-row` | Sync destination row |
| `.sync-row.ok / .fail` | Result accent |
| `.note-card` / `.note-ref-card` | Consult note containers |

### 4.9 Layout primitives

| Class | Layout |
|-------|--------|
| `.app` | CSS grid: header / sidebar+main |
| `.split-50` | Two equal columns (video + data rail) |
| `.crit-chips` | Wrapping chip row |
| `.identity-chip` | Header user badge (read-only) |

---

## 5. Iconography

Inline emoji used as glyphs: 🔴 ⚠️ ✅ ❌ ⏳ 👤 📞 🔁 ★. Reasons:

1. Zero asset weight, zero network requests.
2. Renders consistently across modern desktop OSes for Thai clinical environments.
3. Each glyph reinforces a paired text label so it's never the only meaning carrier.

Future production handoff: swap to a proper icon set (e.g., Phosphor) keeping the same paired-with-text pattern.

---

## 6. Responsive rules

Single breakpoint at `max-width: 1024px`:

- Two-column app grid collapses to single column.
- Sidebar hidden, summoned via `#hamburger` (top-left, ≥ 44×44px tap target).
- Sidebar becomes a 260px-wide fixed drawer below header.
- Cards remain full-width-fluid via `width: 100%` + intrinsic `padding`.

No fixed pixel widths inside cards. No horizontal scroll on the main flow.

---

## 7. Motion

Three motion behaviors, all under 500ms:

1. **Sync row stepper** — `setTimeout(450ms)` per row paint. Linear, no easing.
2. **Note autosave debounce** — 500ms after last keystroke, then status flips.
3. **Toast auto-dismiss** — sync outcome toast removes after 5000ms; user can dismiss manually any time.

Future: gate all of the above behind `@media (prefers-reduced-motion: reduce)` — listed as design debt.

---

## 8. Do / Don't

✅ Do:
- Reach for tokens, not hex values.
- Compose existing classes before adding a new one.
- Pair every color cue with a text label or icon.
- Keep card titles uppercase 13px to preserve scan rhythm.

❌ Don't:
- Inline styles in HTML fragments.
- Add a new button variant without registering it here.
- Use color as the only signal (grayscale lock will eat it).
- Mix utility frameworks — single CSS methodology.

---

## 9. Versioning

Tokens were stable across v1–v3. Component additions tracked alongside `state.v*` schema bumps in [`../TECHNICAL.md`](../TECHNICAL.md) §20.

---

*End of DESIGN_SYSTEM.md*
