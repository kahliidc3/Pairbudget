# GDPR Deletion Verification

## Existing implementation status
User data deletion is implemented in `src/services/authService.ts` via `deleteUserAccountAndData()`.

## Verified behavior
- Deletes user document from `users/{uid}`.
- Removes user from pocket participants and roles.
- Reassigns provider role when needed.
- Soft-deletes empty pockets and removes related transactions.
- Deletes user-owned transactions.
- Attempts Firebase Auth user deletion and surfaces reauth requirement.

## Manual test checklist
- [ ] Create user and join/create pocket.
- [ ] Add funds and expenses.
- [ ] Trigger account deletion from dashboard.
- [ ] Confirm user document removed.
- [ ] Confirm membership and role updates in pocket documents.
- [ ] Confirm transactions cleanup.
- [ ] Confirm login blocked for deleted account.
