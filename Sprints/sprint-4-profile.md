# Sprint 4 — Profile Page

## Status: TODO

## Goal
Add a dedicated `/profile` page where the user can edit their display name and preferred language.
Changes are persisted to Firestore via the existing `updateUserProfile()` function.
The page is accessible from both the desktop sidebar and the mobile Settings tab.

---

## What the Profile Page Contains

```
┌─────────────────────────────────────────┐
│  ← Back to Dashboard          Profile   │  ← header
├─────────────────────────────────────────┤
│                                         │
│         [KH]                            │  ← initials avatar (generated, no upload)
│      Khalid Chalhi                      │  ← name (read-only display)
│      khalid@example.com                 │  ← email (read-only)
│                                         │
├─ Display Name ──────────────────────────┤
│  [  Khalid Chalhi                    ]  │  ← prefilled input
│  [Save Name]                            │  ← saves to Firestore
│                                         │
├─ Language ──────────────────────────────┤
│  [ English ]  [ Français ]  [ العربية ] │  ← toggle buttons, current is highlighted
│  [Save Language]                        │  ← saves to Firestore + reroutes locale
│                                         │
└─────────────────────────────────────────┘
```

---

## New Files

### 1. `src/app/[locale]/profile/page.tsx`
Route file — minimal, just renders the component.
```tsx
import Profile from '@/components/Profile'

export default function ProfilePage() {
  return <Profile />
}
```

### 2. `src/components/Profile.tsx`
Main component (~200 lines). Structure:

```tsx
'use client'

import { useAuthStore } from '@/store/authStore'
import { updateUserProfile } from '@/services/authService'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
```

**Sections:**

#### Header
```tsx
<div className="flex items-center gap-3 mb-8">
  <button onClick={() => router.push(`/${locale}/dashboard`)} className="btn-ghost">
    <ArrowLeft size={20} />
  </button>
  <h1 className="section-heading">{t('title')}</h1>
</div>
```

#### Avatar + Read-Only Info
Generate initials from `userProfile.name`:
```tsx
const initials = userProfile.name
  .split(' ')
  .map(word => word[0])
  .join('')
  .toUpperCase()
  .slice(0, 2)
```
Display as a colored circle (`bg-emerald-600 text-white`).

#### Edit Name Section
Use React Hook Form:
```tsx
const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
  defaultValues: { name: userProfile?.name ?? '' }
})

const onSaveName = async (data: { name: string }) => {
  await updateUserProfile(user.uid, { name: data.name })
  useAuthStore.getState().setUserProfile({ ...userProfile, name: data.name })
  toast.success(t('successName'))
}
```
Validation: `minLength: 2`, `maxLength: 40`.

#### Edit Language Section
Three toggle buttons, not a form — just a state variable:
```tsx
const [selectedLang, setSelectedLang] = useState(userProfile?.preferredLanguage ?? 'en')
const languages = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'ar', label: 'العربية' },
]

const onSaveLanguage = async () => {
  await updateUserProfile(user.uid, { preferredLanguage: selectedLang })
  useAuthStore.getState().setUserProfile({ ...userProfile, preferredLanguage: selectedLang })
  toast.success(t('successLanguage'))
  router.replace(`/${selectedLang}/profile`)   // switch locale
}
```

**Protected route:** If `!user || !userProfile`, redirect to `/${locale}/` (same pattern as dashboard/page.tsx).

---

## Files to Modify

### 3. `src/components/Dashboard.tsx`

**Desktop sidebar** (around lines 410–530 — the quick actions area):
Add a "Profile" link button using the existing `User` icon (already imported at line 27 as part of lucide-react imports):
```tsx
<button
  onClick={() => router.push(`/${locale}/profile`)}
  className="btn-ghost flex items-center gap-2 w-full text-left"
>
  <User size={16} />
  {tCommon('profile')}  {/* or a new translation key */}
</button>
```
Place it above the existing "Leave Pocket" action.

### 4. `src/components/ui/BottomNavigation.tsx`

**Settings tab** (currently opens some action in Dashboard):
Change the Settings tab's behavior to navigate to the profile page:
```tsx
{ id: 'settings', label: 'Settings', icon: Settings }
```
In Dashboard.tsx where `onTabChange` is handled, when `tab === 'settings'`:
```tsx
router.push(`/${locale}/profile`)
```

---

## Translation Keys to Add

### `src/messages/en.json`
```json
"profile": {
  "title": "Profile",
  "displayName": "Display Name",
  "namePlaceholder": "Your full name",
  "saveNameBtn": "Save Name",
  "language": "Language",
  "saveLanguageBtn": "Save Language",
  "successName": "Name updated successfully",
  "successLanguage": "Language updated",
  "errorName": "Failed to update name",
  "errorLanguage": "Failed to update language",
  "back": "Back to Dashboard",
  "nameMinLength": "Name must be at least 2 characters",
  "nameMaxLength": "Name must be 40 characters or fewer"
}
```

### `src/messages/fr.json`
```json
"profile": {
  "title": "Profil",
  "displayName": "Nom affiché",
  "namePlaceholder": "Votre nom complet",
  "saveNameBtn": "Enregistrer le nom",
  "language": "Langue",
  "saveLanguageBtn": "Enregistrer la langue",
  "successName": "Nom mis à jour",
  "successLanguage": "Langue mise à jour",
  "errorName": "Échec de la mise à jour du nom",
  "errorLanguage": "Échec de la mise à jour de la langue",
  "back": "Retour au tableau de bord",
  "nameMinLength": "Le nom doit comporter au moins 2 caractères",
  "nameMaxLength": "Le nom ne doit pas dépasser 40 caractères"
}
```

### `src/messages/ar.json`
```json
"profile": {
  "title": "الملف الشخصي",
  "displayName": "الاسم المعروض",
  "namePlaceholder": "اسمك الكامل",
  "saveNameBtn": "حفظ الاسم",
  "language": "اللغة",
  "saveLanguageBtn": "حفظ اللغة",
  "successName": "تم تحديث الاسم",
  "successLanguage": "تم تحديث اللغة",
  "errorName": "فشل تحديث الاسم",
  "errorLanguage": "فشل تحديث اللغة",
  "back": "العودة إلى لوحة التحكم",
  "nameMinLength": "يجب أن يتكون الاسم من حرفين على الأقل",
  "nameMaxLength": "يجب ألا يتجاوز الاسم 40 حرفاً"
}
```

---

## Existing Functions to Reuse

| Function | File | What it does |
|----------|------|-------------|
| `updateUserProfile(uid, updates)` | `src/services/authService.ts` ~line 300 | Persists partial user updates to Firestore |
| `useAuthStore().setUserProfile(profile)` | `src/store/authStore.ts` | Updates in-memory auth state |
| `useAuthStore().userProfile` | `src/store/authStore.ts` | Read current user profile |
| `useAuthStore().user` | `src/store/authStore.ts` | Read Firebase Auth user (for uid) |

No new service functions needed.

---

## Files to Create / Modify

| File | Action | What changes |
|------|--------|-------------|
| `src/app/[locale]/profile/page.tsx` | **CREATE** | Route page |
| `src/components/Profile.tsx` | **CREATE** | Profile component (~200 lines) |
| `src/components/Dashboard.tsx` | **MODIFY** | Add Profile link in sidebar + settings tab routing |
| `src/components/ui/BottomNavigation.tsx` | **MODIFY** | Settings tab routes to profile |
| `src/messages/en.json` | **MODIFY** | Add `profile` translation namespace |
| `src/messages/fr.json` | **MODIFY** | Add `profile` translations |
| `src/messages/ar.json` | **MODIFY** | Add `profile` translations |

---

## Deliverables
- [ ] `/en/profile`, `/fr/profile`, `/ar/profile` routes all render correctly
- [ ] Avatar circle shows user's initials in emerald
- [ ] Name field is prefilled, validation works (min 2, max 40 chars)
- [ ] Saving name updates Firestore and shows success toast
- [ ] Language buttons show current language as active/highlighted
- [ ] Saving language switches the locale and updates Firestore
- [ ] Back button returns to dashboard
- [ ] Profile is reachable from desktop sidebar
- [ ] Profile is reachable from mobile Settings tab

---

## Success Criteria
```bash
npm run typecheck   # must pass
npm run build       # must pass
```
Manual tests:
- [ ] Change name → refresh page → new name is displayed
- [ ] Change language to French → page switches to French → refresh → still French
- [ ] Direct visit to `/en/profile` without being logged in → redirected to landing

---

## Estimated Effort
Medium — 2 new files, 2 modified files, 3 translation files. Logic is straightforward; most complexity is in the locale-switch behavior after language save.

## Dependencies
Sprint 1 (for `.btn-primary`, `.input-field`, `.card`, `.section-heading` CSS classes).

## Unlocks
Nothing downstream — this can run in parallel with Sprints 3 and 5.
