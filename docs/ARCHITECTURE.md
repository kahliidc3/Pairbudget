# Architecture

## System overview
- Frontend: Next.js App Router with locale routes (`/en`, `/fr`, `/ar`).
- State: Zustand (`authStore`, `pocketStore`).
- Backend: Firebase Auth + Firestore + Storage.
- Monitoring: Sentry (client/server/edge) and internal logger.

## Component hierarchy
- `app/[locale]/layout.tsx`: locale + auth providers.
- `app/[locale]/page.tsx`: landing + auth entry.
- `app/[locale]/dashboard/page.tsx`: authenticated dashboard wrapper.
- `components/Dashboard.tsx`: pocket operations and transaction actions.

## Data model (Firestore)
- `users/{uid}`: profile, pocket membership, preferences.
- `pockets/{pocketId}`: participants, roles, invite code, balances.
- `transactions/{txId}`: pocket transaction history.
- `audit-logs/{logId}`: security/audit events.

## Data flow
1. Auth state is observed in `AuthProvider`.
2. Profile and pocket IDs resolve from Firestore.
3. `pocketService` loads pocket and subscribes to transactions.
4. Dashboard renders derived balance stats from store state.

## State management pattern
- Services perform all Firebase reads/writes.
- Stores hold normalized UI state.
- Components dispatch service actions and react to store updates.

## i18n pattern
- UI strings come from `src/messages/*.json`.
- `next-intl` provides locale-aware formatting and message access.
