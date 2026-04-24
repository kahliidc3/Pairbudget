# Sprint 3 — Mobile UX: Pocket Switching + Transaction Delete

## Status: TODO

## Goal
Fix two mobile UX gaps:
1. Users on mobile currently cannot switch pockets inline — they get routed away to `/pocket-setup`. This sprint adds a bottom-sheet pocket switcher that works without leaving the dashboard.
2. The transaction delete button is hidden behind a tap/hover reveal. This sprint makes it always visible.

---

## Part A: Mobile Pocket Switcher

### Root Cause
In `src/components/Dashboard.tsx` line 357:
```tsx
<MobileHeader
  onPocketSelect={() => router.push(`/${locale}/pocket-setup`)}
/>
```
Mobile taps the pocket area → full page navigation → user must navigate back.
Desktop uses `<PocketSwitcher />` (line 382) which is a dropdown inside `hidden lg:block` — never shown on mobile.

### Solution
Create a new `MobilePocketSheet` bottom-sheet component.
Wire it into Dashboard so that tapping the pocket area on mobile opens the sheet instead of navigating away.
Also add a dedicated **Pockets** tab to `BottomNavigation`.

---

### New File: `src/components/ui/MobilePocketSheet.tsx`

**Purpose:** A fixed bottom-sheet that lists all the user's pockets. Tapping one switches to it and closes the sheet.

**Props interface:**
```tsx
interface MobilePocketSheetProps {
  isOpen: boolean
  onClose: () => void
  pockets: Pocket[]              // all pockets user belongs to
  currentPocketId: string | undefined
  onSelect: (pocketId: string) => void
}
```

**UI structure:**
```
┌─────────────────────────────────┐  ← fixed overlay (bg-black/40, z-50)
│                                 │
│  [tap to close]                 │
│                                 │
├─────────────────────────────────┤  ← sheet (white, rounded-t-2xl)
│        ────  (drag handle)      │
│   Switch Pocket                 │  ← heading
│  ┌───────────────────────────┐  │
│  │ ✓  Pocket Name     $bal   │  │  ← current pocket (check icon)
│  │    Other Pocket    $bal   │  │
│  └───────────────────────────┘  │
│                                 │
│  [Manage Pockets  →]            │  ← links to /pocket-setup
└─────────────────────────────────┘
```

**Switching logic (reuse from `src/components/PocketSwitcher.tsx` lines 58–76):**
```tsx
import { updateUserProfile } from '@/services/authService'
import { useAuthStore } from '@/store/authStore'
import { usePocketStore } from '@/store/pocketStore'
import { getPocket } from '@/services/pocketService'

const handleSelect = async (pocketId: string) => {
  if (!user) return
  await updateUserProfile(user.uid, { currentPocketId: pocketId })
  useAuthStore.getState().setUserProfile({ ...userProfile, currentPocketId: pocketId })
  const pocket = await getPocket(pocketId)
  if (pocket) usePocketStore.getState().setCurrentPocket(pocket)
  onClose()
}
```

**Sheet animation:** Simple CSS `translateY` — open: `translate-y-0`, closed: `translate-y-full`. Use Tailwind `transition-transform duration-200`. No Framer Motion needed.

**Overlay:** `onClick={onClose}` on the backdrop div closes the sheet.

---

### Modify: `src/components/Dashboard.tsx`

**Add state (near line 57 with other modal states):**
```tsx
const [showMobilePocketSheet, setShowMobilePocketSheet] = useState(false)
```

**Change MobileHeader callback (line 357):**
```tsx
// Before:
onPocketSelect={() => router.push(`/${locale}/pocket-setup`)}

// After:
onPocketSelect={() => setShowMobilePocketSheet(true)}
```

**Add sheet render (inside `lg:hidden` section, after MobileHeader):**
```tsx
<MobilePocketSheet
  isOpen={showMobilePocketSheet}
  onClose={() => setShowMobilePocketSheet(false)}
  pockets={userPockets}          // derive from userProfile.pocketIds
  currentPocketId={currentPocket?.id}
  onSelect={...}                 // inline handler using PocketSwitcher logic
/>
```

**Wire BottomNavigation `onTabChange`:**
When the user taps the new Pockets tab, set `showMobilePocketSheet(true)`.
Pass a new `onTabChange` prop to `BottomNavigation` or handle via the existing `activeTab` state.

**Load all pockets for the sheet:**
The Dashboard currently only loads `currentPocket`. For the sheet, we need all pockets.
Use `userProfile.pocketIds` to batch-fetch names using the existing `getUserProfilesBatch` pattern,
or fetch pocket names from `pocketService.getPocket()` per ID. Cache the result in local state.

---

### Modify: `src/components/ui/BottomNavigation.tsx`

**Current tabs (lines 33–38):**
```tsx
{ id: 'home', label: 'Home', icon: Home },
{ id: 'add',  label: 'Add',  icon: Plus, isAction: true },
{ id: 'history', label: 'History', icon: History },
{ id: 'settings', label: 'Settings', icon: Settings },
```

**New tabs (add Pockets between home and add):**
```tsx
{ id: 'home',    label: 'Home',    icon: Home },
{ id: 'pockets', label: 'Pockets', icon: Layers },   // NEW
{ id: 'add',     label: 'Add',     icon: Plus, isAction: true },
{ id: 'history', label: 'History', icon: History },
{ id: 'settings', label: 'Settings', icon: Settings },
```

**Add to imports:**
```tsx
import { Home, Layers, Plus, History, Settings } from 'lucide-react'
```

**Add `onTabChange` prop:**
```tsx
interface BottomNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void  // already exists or needs adding
}
```
When `tab === 'pockets'`, the parent (Dashboard) opens the sheet.

---

## Part B: Always-Visible Transaction Delete Button

### Root Cause
In `src/components/ui/TransactionCard.tsx` the delete button is conditionally rendered:
```tsx
{showActions && onDelete && (
  <button ...>
```
`showActions` is only true when actions are in a "revealed" state — not obvious on mobile.

### Solution
When `onDelete` is provided, render a `Trash2` icon in the card's top-right corner — always visible, no tap-to-reveal.

---

### Modify: `src/components/ui/TransactionCard.tsx`

**Add `relative` to card container** (if not already present):
```tsx
<div className="relative ... (existing classes)">
```

**Replace the gated delete button** (around lines 109–121) with always-visible icon:
```tsx
// Remove the showActions-gated block entirely.
// Add this at the end of the card container:

{onDelete && (
  <button
    onClick={(e) => {
      e.stopPropagation()
      onDelete()
    }}
    className="absolute top-3 right-3 p-1.5 rounded-lg
               text-slate-400 hover:text-red-600 hover:bg-red-50
               active:scale-95 transition-colors"
    aria-label="Delete transaction"
  >
    <Trash2 size={15} />
  </button>
)}
```

**Adjust card content padding** if needed to avoid the icon overlapping transaction text on mobile:
Add `pr-10` (or `pr-8`) to the card's text content area so the delete icon doesn't overlap.

**No changes needed to Dashboard.tsx delete logic** — the existing `openDeleteTransactionModal()` callback is already wired and the confirmation modal already exists.

---

## Files to Create / Modify

| File | Action | What changes |
|------|--------|-------------|
| `src/components/ui/MobilePocketSheet.tsx` | **CREATE** | New bottom-sheet component |
| `src/components/Dashboard.tsx` | **MODIFY** | Add state, wire sheet, change `onPocketSelect` callback, load all pockets |
| `src/components/ui/BottomNavigation.tsx` | **MODIFY** | Add Pockets tab, add `Layers` icon import |
| `src/components/ui/TransactionCard.tsx` | **MODIFY** | Always-visible Trash2 delete icon, add `relative` to container |

---

## Deliverables
- [ ] Tapping the pocket area in MobileHeader opens the bottom sheet (does NOT navigate away)
- [ ] Bottom sheet lists all user pockets with a check on the current one
- [ ] Tapping a pocket in the sheet switches it and updates the dashboard
- [ ] BottomNavigation has 5 tabs: Home, Pockets, Add, History, Settings
- [ ] Tapping the Pockets tab also opens the bottom sheet
- [ ] Every transaction card shows a Trash2 icon in the top-right corner (no tap needed)
- [ ] Tapping Trash2 opens the existing delete confirmation modal

---

## Success Criteria
```bash
npm run build       # must pass
npm run typecheck   # must pass
```
Manual tests on a mobile viewport (Chrome DevTools → iPhone 12 Pro):
- [ ] Open dashboard → tap pocket area in header → sheet appears
- [ ] Tap a different pocket in the sheet → dashboard updates, sheet closes
- [ ] Tap Pockets tab in bottom nav → sheet appears
- [ ] Every transaction card shows a trash icon top-right
- [ ] Tap trash → confirmation modal appears → confirm → transaction deleted

---

## Estimated Effort
Medium-High — requires creating 1 new component and modifying 3 existing ones. The pocket-loading logic for the sheet needs care (async, potential loading state).

## Dependencies
Sprint 1 (for consistent styling of the new sheet component).
Sprint 2 is optional but recommended before testing mobile feel.

## Unlocks
Sprint 4 and Sprint 5 can run in parallel with this.
