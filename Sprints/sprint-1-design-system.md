# Sprint 1 — Design System: Global CSS + Color Tokens

## Status: TODO

## Goal
Replace all scattered, per-element Tailwind color classes with a single source of truth in `globals.css`.
Every semantic color and repeated layout pattern becomes a CSS variable or utility class.
All component files reference those classes — no more inline `bg-blue-600` scattered everywhere.

## Why First
This sprint is the foundation for every other sprint. The new emerald color tokens established here
will be used by all subsequent sprints. It must land before anything else is styled or changed.

---

## New Color Palette

| Token | Value | Tailwind Equivalent | Role |
|-------|-------|---------------------|------|
| `--color-primary` | `#059669` | `emerald-600` | Primary buttons, links, focus rings |
| `--color-primary-hover` | `#047857` | `emerald-700` | Button hover state |
| `--color-primary-light` | `#d1fae5` | `emerald-100` | Badges, soft backgrounds |
| `--color-accent` | `#0d9488` | `teal-600` | Secondary highlights, icons |
| `--color-success` | `#16a34a` | `green-600` | Success states, fund transactions |
| `--color-success-light` | `#dcfce7` | `green-100` | Success badge backgrounds |
| `--color-danger` | `#dc2626` | `red-600` | Errors, delete actions |
| `--color-danger-light` | `#fee2e2` | `red-100` | Error badge backgrounds |
| `--color-warning` | `#ea580c` | `orange-600` | Warnings, expense transactions |
| `--color-warning-light` | `#ffedd5` | `orange-100` | Warning badge backgrounds |
| `--color-bg` | `#f8fafc` | `slate-50` | Page background |
| `--color-surface` | `#ffffff` | `white` | Card / panel backgrounds |
| `--color-border` | `#e2e8f0` | `slate-200` | Borders, dividers |
| `--color-text` | `#0f172a` | `slate-900` | Primary text |
| `--color-text-muted` | `#64748b` | `slate-500` | Secondary / placeholder text |

---

## New Global Utility Classes to Create in `globals.css`

These go in `globals.css` alongside the CSS variable block.

### Buttons
```css
.btn-primary     /* emerald bg, white text, hover darkens */
.btn-secondary   /* white bg, slate border, slate text */
.btn-danger      /* red bg, white text */
.btn-ghost       /* transparent, text only, hover adds bg */
```

### Cards
```css
.card            /* white bg, slate-200 border, rounded-xl, shadow-sm */
.card-interactive /* card + hover:shadow-md + cursor-pointer transition */
```

### Form
```css
.input-field     /* white bg, slate-200 border, rounded-lg, focus:emerald ring */
```

### Badges
```css
.badge-success   /* green-100 bg, green-700 text, rounded-full, text-xs */
.badge-danger    /* red-100 bg, red-700 text */
.badge-warning   /* orange-100 bg, orange-700 text */
.badge-neutral   /* slate-100 bg, slate-600 text */
```

### Layout helpers
```css
.page-bg         /* min-h-screen bg slate-50 */
.section-heading /* text-lg font-semibold text-slate-900 */
.text-muted      /* text-slate-500 text-sm */
```

---

## Files to Edit

### 1. `src/app/globals.css`
- **Lines 5–93**: Replace existing CSS variable block with the new emerald token set above.
- **Lines 141–375**: Rewrite `.card-base`, `.card-interactive`, `.btn-primary`, `.btn-secondary`, `.input-base` to use the new tokens. Add the new badge and layout classes.
- Keep the `@keyframes` and `prefers-reduced-motion` sections unchanged.

### 2. `src/components/Dashboard.tsx`
- Replace every `bg-blue-*`, `text-blue-*`, `border-blue-*` with matching emerald semantic class.
- Replace `bg-green-*` / `text-green-*` with `badge-success` or `text-[--color-success]`.
- Replace `bg-orange-*` / `text-orange-*` with `badge-warning`.
- Replace `bg-red-*` / `text-red-*` with `badge-danger` or `btn-danger`.
- Replace `bg-white rounded-xl shadow` patterns with `.card`.

### 3. `src/components/AuthForm.tsx`
- Replace all `bg-blue-*`, `border-blue-*`, `ring-blue-*` with emerald equivalents or `.btn-primary` / `.input-field`.

### 4. `src/components/PocketSetup.tsx`
- Replace `bg-blue-*` with emerald. Replace `bg-gradient-to-br from-blue-600 to-purple-600` with `from-emerald-600 to-teal-600`.

### 5. `src/components/PocketSelection.tsx`
- Replace color classes with semantic tokens.

### 6. `src/components/ui/Button.tsx`
- Remove hardcoded Tailwind color classes from variants.
- Use `.btn-primary`, `.btn-secondary`, `.btn-danger` from globals.

### 7. `src/components/ui/Input.tsx`
- Remove `focus:ring-blue-500 focus:border-blue-500`.
- Use `.input-field` class from globals.

### 8. `src/components/ui/StatCard.tsx`
- Replace color strings passed as props or hardcoded with CSS variable references.

### 9. `src/components/ui/TransactionCard.tsx`
- Replace `text-green-*`, `text-orange-*`, `bg-green-*`, `bg-orange-*` with `.badge-success`, `.badge-warning`.

### 10. `src/app/[locale]/page.tsx`
- Replace `from-blue-600 to-purple-600` gradients → `from-emerald-600 to-teal-600`.
- Replace `bg-blue-600` CTA button → `btn-primary`.
- Replace `text-blue-400` with `text-emerald-400`.

### 11. `src/app/[locale]/join/page.tsx`
- Same color replacements as page.tsx.

### 12. `src/app/[locale]/all-transactions/page.tsx`
- Replace filter button and badge colors with semantic classes.

---

## Deliverables
- [ ] `globals.css` contains the complete emerald token set
- [ ] `globals.css` contains all utility classes (btn-*, card, badge-*, input-field, etc.)
- [ ] Zero `bg-blue-` occurrences remain in `src/` component files
- [ ] Zero `text-blue-` occurrences remain in `src/` component files
- [ ] App renders with emerald as the primary color throughout
- [ ] All existing functionality still works (no visual regressions on non-color elements)

---

## Success Criteria
```bash
grep -r "bg-blue-" src/    # must return 0 results
grep -r "text-blue-" src/  # must return 0 results
npm run build              # must pass
npm run typecheck          # must pass
```

---

## Estimated Effort
Medium — 12 files to edit, mostly find-and-replace work. The globals.css rewrite is the most careful part.

## Dependencies
None — this is the first sprint.

## Unlocks
All other sprints (they will use the new classes).
