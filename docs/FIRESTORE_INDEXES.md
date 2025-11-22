# Firestore Indexes

Required composite indexes for PairBudget. Create these in the Firebase Console under **Firestore Database → Indexes → Composite**.

1) **Transactions by pocket + date (for pagination)**
   - Collection: `transactions`
   - Fields:
     - `pocketId` – Ascending
     - `date` – Descending
   - Query usage: `where('pocketId', '==', pocketId)` + `orderBy('date', 'desc')` with pagination (`startAfter`, `limit`).

After creating, wait for the index build to complete before testing. If you change field names or add filters (e.g., `deleted != true`), add corresponding composite indexes. 
