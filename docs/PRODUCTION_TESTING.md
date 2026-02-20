# Production Testing Report

## Build used
- Command: `npm run build`
- Date: 2026-02-20

## Critical flow checklist
- [ ] Sign up and sign in with valid credentials.
- [ ] Create pocket and join with invite link.
- [ ] Add fund transaction and expense transaction.
- [ ] View paginated all-transactions page.
- [ ] Export my data ZIP from dashboard.
- [ ] Leave pocket and verify membership update.
- [ ] Delete account and verify data cleanup.

## Browser/device matrix
- [ ] Chrome desktop latest
- [ ] Edge desktop latest
- [ ] Safari iOS latest
- [ ] Chrome Android latest

## Security checks
- [ ] Response headers include CSP, X-Frame-Options, nosniff, XSS protection, Referrer-Policy.
- [ ] Sentry receives test client/server errors.
- [ ] Audit logs are created for sensitive actions.

## Lighthouse checks
- [ ] Performance >= 90
- [ ] Accessibility >= 90
- [ ] Best Practices >= 90
- [ ] SEO >= 90
