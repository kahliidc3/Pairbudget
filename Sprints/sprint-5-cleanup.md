# Sprint 5 — Code Cleanup & Refactoring

## Status: TODO

## Goal
Break up the two massive component files by extracting their self-contained modal and form pieces into dedicated files.
Remove dead debug code from production. Clean up unused imports, leftover TODO comments, and duplicate utility code.

After this sprint: `Dashboard.tsx` ≤ 500 lines, `PocketSetup.tsx` ≤ 400 lines.

---

## Part A: Dashboard.tsx Extractions

**Current size:** ~1,139 lines
**Target size:** ~500 lines

Create folder: `src/components/dashboard/`

### What to extract

#### 1. `src/components/dashboard/AddTransactionModal.tsx`
**Extracted from:** `Dashboard.tsx` lines ~765–900
**Approx size:** ~135 lines

Contains the full transaction form modal:
- Form fields: type (fund/expense), category, description, amount, date
- React Hook Form integration
- Submit handler call (receives `onSubmit` as prop)
- Edit mode (prefills form when `editingTransaction` is provided)

**Props it receives:**
```tsx
interface AddTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: TransactionFormData) => Promise<void>
  editingTransaction?: Transaction | null
  userRole: 'provider' | 'spender'
  isSubmitting: boolean
}
```

---

#### 2. `src/components/dashboard/DeleteTransactionModal.tsx`
**Extracted from:** `Dashboard.tsx` lines ~975–1008
**Approx size:** ~35 lines

Contains the delete confirmation dialog:
- Transaction description display
- Confirm / Cancel buttons

**Props:**
```tsx
interface DeleteTransactionModalProps {
  isOpen: boolean
  transaction: Transaction | null
  onConfirm: () => Promise<void>
  onClose: () => void
  isDeleting: boolean
}
```

---

#### 3. `src/components/dashboard/LeaveModal.tsx`
**Extracted from:** `Dashboard.tsx` lines ~1010–1045
**Approx size:** ~35 lines

Leave pocket confirmation modal:
- Warning message
- Confirm / Cancel buttons

**Props:**
```tsx
interface LeaveModalProps {
  isOpen: boolean
  pocketName: string
  onConfirm: () => Promise<void>
  onClose: () => void
  isLeaving: boolean
}
```

---

#### 4. `src/components/dashboard/DeleteAccountModal.tsx`
**Extracted from:** `Dashboard.tsx` lines ~1047–1090
**Approx size:** ~45 lines

Delete account confirmation:
- Strong warning message
- Two-step confirm (type "DELETE" or similar)
- Confirm / Cancel buttons

**Props:**
```tsx
interface DeleteAccountModalProps {
  isOpen: boolean
  onConfirm: () => Promise<void>
  onClose: () => void
  isDeleting: boolean
}
```

---

#### 5. `src/components/dashboard/InviteModal.tsx`
**Extracted from:** `Dashboard.tsx` lines ~900–975
**Approx size:** ~75 lines

Invite code share modal:
- Displays invite link
- Copy to clipboard button
- Share button (if navigator.share available)
- QR code hint (if applicable)

**Props:**
```tsx
interface InviteModalProps {
  isOpen: boolean
  onClose: () => void
  inviteLink: string
  pocketName: string
}
```

---

### How Dashboard.tsx looks after extraction

Replace each extracted block with a single import and usage:
```tsx
import AddTransactionModal from '@/components/dashboard/AddTransactionModal'
import DeleteTransactionModal from '@/components/dashboard/DeleteTransactionModal'
import LeaveModal from '@/components/dashboard/LeaveModal'
import DeleteAccountModal from '@/components/dashboard/DeleteAccountModal'
import InviteModal from '@/components/dashboard/InviteModal'

// In JSX:
<AddTransactionModal
  isOpen={showTransactionForm}
  onClose={() => setShowTransactionForm(false)}
  onSubmit={handleAddTransaction}
  editingTransaction={editingTransaction}
  userRole={userRole}
  isSubmitting={isTransactionSubmitting}
/>
// ... etc
```

Dashboard.tsx retains: state declarations, Firebase subscription setup, event handlers, and the main layout JSX.

---

## Part B: PocketSetup.tsx Extractions

**Current size:** ~1,012 lines
**Target size:** ~400 lines

Create folder: `src/components/pocket-setup/`

### What to extract

#### 1. `src/components/pocket-setup/CreatePocketForm.tsx`
**Extracted from:** `PocketSetup.tsx` lines ~514–629
**Approx size:** ~115 lines

The create pocket form:
- Pocket name input
- Submit handler

**Props:**
```tsx
interface CreatePocketFormProps {
  onSubmit: (name: string) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
}
```

---

#### 2. `src/components/pocket-setup/JoinPocketForm.tsx`
**Extracted from:** `PocketSetup.tsx` lines ~630–748
**Approx size:** ~120 lines

The join pocket form:
- Invite code input
- Role selection (provider/spender)
- Submit handler

**Props:**
```tsx
interface JoinPocketFormProps {
  onSubmit: (code: string, role: 'provider' | 'spender') => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
  prefillCode?: string
}
```

---

#### 3. `src/components/pocket-setup/PocketList.tsx`
**Extracted from:** `PocketSetup.tsx` lines ~749–826
**Approx size:** ~80 lines

The list of existing pockets:
- Renders each pocket as a card
- Select / delete actions per pocket

**Props:**
```tsx
interface PocketListProps {
  pockets: Pocket[]
  currentPocketId: string | undefined
  onSelect: (pocket: Pocket) => void
  onDelete: (pocket: Pocket) => void
}
```

---

#### 4. `src/components/pocket-setup/DeletePocketModal.tsx`
**Extracted from:** `PocketSetup.tsx` lines ~944–1010
**Approx size:** ~65 lines

Delete pocket confirmation modal.

**Props:**
```tsx
interface DeletePocketModalProps {
  isOpen: boolean
  pocket: Pocket | null
  onConfirm: () => Promise<void>
  onClose: () => void
  isDeleting: boolean
}
```

---

## Part C: Dead Code Removal

### 1. `src/components/FirebaseStatus.tsx`
**Issue:** Debug component showing Firebase configuration status. Should never appear in production.

**Fix:** Find where it's rendered and wrap with dev-only guard:
```tsx
{process.env.NODE_ENV === 'development' && <FirebaseStatus />}
```
Or remove from render entirely if it's no longer needed.

**Search for usage:**
```bash
grep -rn "FirebaseStatus" src/
```

---

### 2. `src/components/DebugAuthFix.tsx`
**Issue:** Debug component for fixing orphaned auth states. Dev-only tool.

**Fix:** Same approach — either:
- Wrap with `process.env.NODE_ENV === 'development'`
- Or remove render call entirely (keep the file but don't render it)

**Search for usage:**
```bash
grep -rn "DebugAuthFix" src/
```

---

### 3. `src/lib/firebase.ts` — Consolidate recovery logic
**Issue:** The 5-stage progressive recovery strategy (~lines 180–270) has repetitive code blocks for each stage.

**Fix:** Extract the repeated pattern into a named helper:
```ts
// Instead of repeating reset logic 5 times, write:
const recoveryStages = [
  () => resetFirestoreConnection(),
  () => resetFirestoreConnection(true),
  () => clearFirestoreCache(),
  async () => { performMemoryCleanup(); await clearFirestoreCache() },
  () => terminateAndReinitializeFirestore(),
]
```
Iterate over stages instead of duplicating code. Keep all existing behavior — just less repetition.

---

### 4. Comment Cleanup — All Files
Remove leftover developer comments that don't explain WHY (they just describe WHAT the code does):

```bash
# Find all TODO and FIXME comments:
grep -rn "// TODO\|// FIXME\|// @ts-ignore\|// eslint-disable" src/
```

For each result:
- If it's a `// TODO` describing planned work → it either gets done in one of the sprints or it gets deleted
- If it's a `// @ts-ignore` → investigate if the type issue can be fixed properly
- If it's `// eslint-disable` → investigate if the lint rule can be satisfied instead

---

## Part D: Unused Import Cleanup

After Sprints 2 and 3 change/remove components, some imports may become unused.

Run after all other sprints:
```bash
npm run lint
```
ESLint will flag unused imports. Fix them by removing the unused identifiers.

Common expected removals after Sprint 2:
- `AnimatePresence` from files that no longer use it
- `MotionConfig` from AuthForm if removed
- Some specific `motion` usage removed from lucide imports if icon-based motion elements are deleted

---

## Part E: globals.css Keyframe Cleanup

After Sprint 2 removes all Framer Motion entrance animations, check if the CSS keyframes in `globals.css` are still referenced:

```bash
grep -rn "fadeIn\|slideUp\|scaleIn" src/
```

If these keyframe names appear nowhere in JSX/TSX files, remove the `@keyframes` blocks from `globals.css` (lines ~334–375).

---

## Files to Create / Modify

| File | Action |
|------|--------|
| `src/components/dashboard/AddTransactionModal.tsx` | **CREATE** |
| `src/components/dashboard/DeleteTransactionModal.tsx` | **CREATE** |
| `src/components/dashboard/LeaveModal.tsx` | **CREATE** |
| `src/components/dashboard/DeleteAccountModal.tsx` | **CREATE** |
| `src/components/dashboard/InviteModal.tsx` | **CREATE** |
| `src/components/pocket-setup/CreatePocketForm.tsx` | **CREATE** |
| `src/components/pocket-setup/JoinPocketForm.tsx` | **CREATE** |
| `src/components/pocket-setup/PocketList.tsx` | **CREATE** |
| `src/components/pocket-setup/DeletePocketModal.tsx` | **CREATE** |
| `src/components/Dashboard.tsx` | **MODIFY** — remove extracted blocks, add imports |
| `src/components/PocketSetup.tsx` | **MODIFY** — remove extracted blocks, add imports |
| `src/lib/firebase.ts` | **MODIFY** — consolidate recovery logic |
| `src/app/globals.css` | **MODIFY** — remove unused keyframes |
| Various files | **MODIFY** — remove unused imports after lint |

---

## Deliverables
- [ ] `src/components/dashboard/` folder with 5 extracted modal components
- [ ] `src/components/pocket-setup/` folder with 4 extracted form/list components
- [ ] `Dashboard.tsx` ≤ 500 lines
- [ ] `PocketSetup.tsx` ≤ 400 lines
- [ ] `FirebaseStatus` and `DebugAuthFix` not rendered in production builds
- [ ] `firebase.ts` recovery logic consolidated (no duplicate code blocks)
- [ ] `npm run lint` passes with 0 warnings

---

## Success Criteria
```bash
npm run lint                               # 0 warnings
npm run typecheck                          # 0 errors
npm run build                              # passes
wc -l src/components/Dashboard.tsx        # ≤ 500
wc -l src/components/PocketSetup.tsx      # ≤ 400
grep -rn "FirebaseStatus" src/app/        # 0 results (not rendered in app routes)
```

---

## Estimated Effort
High — most files touched, but all changes are mechanical extractions. No logic changes.
The key risk is breaking props/state threading when extracting modals. Test thoroughly after each extraction.

## Dependencies
Sprints 1–4 should be complete so that extracted components use final class names.

## Unlocks
Nothing downstream — this is the final sprint.

---

## Recommended Extraction Order
Do one extraction at a time, run `npm run typecheck` after each:
1. `InviteModal` (most self-contained)
2. `DeleteTransactionModal` (smallest)
3. `LeaveModal`
4. `DeleteAccountModal`
5. `AddTransactionModal` (most complex — has form state)
6. Then PocketSetup extractions in same order (simplest first)
