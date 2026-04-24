# Sprint 2 — Animation Reduction

## Status: TODO

## Goal
Cut Framer Motion usage from ~75 motion elements down to ≤ 15.
Remove every CPU-wasting infinite background animation and all staggered delay chains.
The app should feel instant — not sluggish or theatrical.

## What to Keep
| Type | Rule |
|------|------|
| Modal enter/exit | Opacity + subtle scale (0.15s max) — essential for spatial context |
| Error/success messages | Opacity fade-in only (0.2s) — needed for accessibility/attention |
| `whileTap` on buttons | Scale 0.97, instant — required touch feedback on mobile |
| Dropdown open/close | PocketSelector already minimal (0.15s), keep as-is |

## What to Remove
| Type | Reason |
|------|--------|
| Floating gradient circles (`repeat: Infinity`) | Runs forever, constant GPU/CPU usage, purely decorative |
| Staggered entrance delays > 0.1s | Delays up to 2.3s — user is waiting, not impressed |
| `rotateY`, `x: ±50` hero slide-ins | Disorienting on mobile, not needed |
| Per-form-field entrance animations (AuthForm) | 16 sequential stagger — form feels broken loading |
| `scale: [1, 1.1, 1]` background pulsing | Continuous CPU consumption |

---

## File-by-File Changes

### 1. `src/app/[locale]/page.tsx`

**Current:** 20+ motion elements, delays up to 2.3s, 3 infinite background circles.

**Changes:**
- **Lines 157–181**: Delete all 3 `motion.div` floating circle elements entirely. Replace with static `div` (keep CSS classes for blur/opacity visual).
- **Lines 190–192**: `motion.nav` → `nav` (remove animation).
- **Lines 235–297**: Wrap entire left content section in ONE `motion.div`:
  ```tsx
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
  ```
  Remove individual animations on h1, p, buttons, stats — they become plain `div`/`h1`/`p`.
- **Lines 316–375**: Same — wrap right side (dashboard preview card) in ONE wrapper fade. Delete all nested `motion.div` including `rotateY`.
- **Lines 394–463**: Feature cards + CTA — single wrapper fade, no stagger, no per-card motion.
- **Result**: 20+ → 1 wrapper fade.

---

### 2. `src/components/AuthForm.tsx`

**Current:** 16 motion elements, field delays up to 2.0s, 4 infinite floating circles.

**Changes:**
- **Lines 198–221**: Delete all 4 `motion.div` floating circle elements → plain `div`.
- **Lines 229–233**: Simplify main card entry:
  ```tsx
  // Before: initial={{ opacity: 0, scale: 0.9, y: 30 }} transition={{ duration: 0.6 }}
  // After:
  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
  ```
- **Lines 237–249**: `motion.h1` → `h1`, `motion.p` → `p` (plain elements, no animation).
- **Lines 262–266**: Keep `AnimatePresence` on error message, simplify:
  ```tsx
  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
  ```
  Remove `y: -10` slide.
- **Lines 306–310**: Same simplification for success message.
- **Lines 332–337**: Keep `AnimatePresence` for signup/login toggle, opacity only, `duration: 0.2`.
- **Lines 340–517**: Replace all 12 individual field/button `motion.div` → plain `div`. Remove ALL delay values.
- **Result**: 16 → 3 motion elements (card fade, error, success).

---

### 3. `src/components/PocketSetup.tsx`

**Current:** 14 motion elements, 3 infinite background circles, per-card stagger.

**Changes:**
- **Lines 353–377**: Delete all 3 floating gradient circle `motion.div` → plain `div`.
- **Lines 382–475**: `motion.nav`, `motion.div` header, button container → plain elements. Wrap entire page content in ONE wrapper fade:
  ```tsx
  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
  ```
- **Lines 514–519**: Keep `AnimatePresence` for create/join form swap, simplify to:
  ```tsx
  initial={{ opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
  ```
  Remove `x: ±20` slide.
- **Lines 630–635**: Same simplification for join form.
- **Lines 749–826**: Pocket list and individual pocket cards — remove all `motion.div` with stagger delays → plain `div`.
- **Lines 827–829**: Create pocket form overlay — keep fade in (`duration: 0.15`), remove scale.
- **Lines 944–947**: Delete confirmation backdrop — `motion.div` → plain `div` (CSS `opacity-50` is enough).
- **Lines 953–956**: Delete confirmation dialog — keep entry animation, simplify:
  ```tsx
  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.15 }}
  ```
- **Result**: 14 → 2 motion elements.

---

### 4. `src/components/PocketSelection.tsx`

**Current:** 9 motion elements, 2 infinite background circles.

**Changes:**
- **Lines 139–155**: Delete 2 floating circle `motion.div` → plain `div`.
- **Lines 160–162**: `motion.header` → `header`.
- **Lines 195–291**: Replace all 6 remaining motion elements with ONE wrapper fade on the outer container:
  ```tsx
  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
  ```
  Inner elements (`motion.h1`, `motion.p`, pocket `motion.button` grid) → plain elements.
- **Result**: 9 → 1 wrapper fade.

---

### 5. `src/app/[locale]/join/page.tsx`

**Current:** 14 motion elements, 3 infinite background circles, `whileHover/whileTap` on role buttons.

**Changes:**
- **Lines 163–181**: Delete 3 floating circle `motion.div` → plain `div`.
- **Lines 184–186**: `motion.nav` → `nav`.
- **Lines 215–218**: Invalid link card — plain `div`.
- **Lines 229–232**: Go back button — remove `whileHover`, keep `whileTap={{ scale: 0.97 }}`.
- **Lines 309–326**: Main content + join form card — wrap in ONE wrapper fade, remove individual delays.
- **Lines 337–375**: Provider + Spender role buttons — remove `whileHover`, keep `whileTap={{ scale: 0.97 }}`.
- **Lines 424–426**: Error message — opacity fade only (same as AuthForm pattern).
- **Lines 438–440**: Join button — remove `whileHover`, keep `whileTap={{ scale: 0.97 }}`.
- **Lines 462–496**: Existing pockets card + list — plain `div` elements, remove per-item stagger.
- **Result**: 14 → 2 motion elements (wrapper fade + error message).

---

### 6. `src/components/PocketSelector.tsx`

**Changes:**
- Lines 119–122: Keep as-is. Already minimal — `opacity + y` over 0.15s is exactly right for a dropdown.

---

## What Stays Untouched
| File | Reason |
|------|--------|
| `src/components/Dashboard.tsx` | No Framer Motion used (uses CSS transitions via Tailwind) |
| `src/app/globals.css` | Keep `prefers-reduced-motion` rule — it's an accessibility requirement |
| `src/components/ui/MobileModal.tsx` | No Framer Motion |
| `src/components/ui/WaitingOverlay.tsx` | No Framer Motion |

---

## Import Cleanup
After removing motion elements, audit each file's import:
```tsx
// Before (potentially):
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';

// After (example for page.tsx with just 1 wrapper):
import { motion } from 'framer-motion';

// After (example for PocketSelection.tsx with just 1 wrapper):
import { motion } from 'framer-motion';
```
Remove `AnimatePresence` import if no `AnimatePresence` remains. Remove `MotionConfig` if removed.

---

## Deliverables
- [ ] All 9 `repeat: Infinity` floating background circles removed across all files
- [ ] No stagger delay above 0.1s anywhere in the codebase
- [ ] Total motion element count ≤ 15 (grep-verified)
- [ ] `prefers-reduced-motion` accessibility rule still present in `globals.css`
- [ ] Page load feels instant — no entrance chain visible to user

---

## Success Criteria
```bash
grep -rn "repeat: Infinity" src/       # must return 0 results
grep -rn "delay: [0-9]" src/           # must return ≤ 5 results (only modal ones)
grep -rn "motion\." src/ | wc -l       # must be ≤ 15
npm run build                          # must pass
```
Visual check: Load the landing page, auth form, pocket setup — none should have visible entrance animations beyond a quick fade.

---

## Estimated Effort
Medium — mechanical work across 5 files. No logic changes, only JSX element type changes and prop removal.

## Dependencies
Sprint 1 should be complete (color tokens in place). However, this sprint can technically run in parallel with Sprint 1 since animation changes don't touch color classes.

## Unlocks
Sprints 3, 4, 5 (no dependency on this sprint, but the app will feel much better for testing).
