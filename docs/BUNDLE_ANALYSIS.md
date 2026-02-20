# Bundle Analysis

Generated with:

```bash
npm run analyze
```

Reports:

- `.next/analyze/client.html`
- `.next/analyze/nodejs.html`
- `.next/analyze/edge.html`

## Snapshot (2026-02-20)

- First Load JS shared by all routes: **175 kB** (below 200 kB budget target)
- Largest route bundle: `"/[locale]/all-transactions"` at **411 kB**
- Next largest route bundles:
  - `"/[locale]"` at **410 kB**
  - `"/[locale]/join"` at **410 kB**
  - `"/[locale]/dashboard"` at **360 kB**

## Optimization Roadmap

1. Lazy-load large route-only UI blocks in `Dashboard` and `PocketSetup`.
2. Move low-frequency modals to dynamic imports.
3. Reduce icon footprint by avoiding broad icon imports in large pages.
4. Re-run `npm run analyze` after each refactor and compare report deltas.
