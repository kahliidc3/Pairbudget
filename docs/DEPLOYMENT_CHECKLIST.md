# Deployment Checklist

## Pre-deploy
- [ ] `.env` values configured in target environment.
- [ ] `npm ci` completes successfully.
- [ ] `npm run lint` passes.
- [ ] `npm run typecheck` passes.
- [ ] `npm run test` passes.
- [ ] `npm run build` passes.

## Firebase checks
- [ ] Firestore rules deployed.
- [ ] Required indexes deployed.
- [ ] Auth providers configured.

## Monitoring and security
- [ ] Sentry DSN configured (`NEXT_PUBLIC_SENTRY_DSN`).
- [ ] Security headers enabled through `next.config.ts`.
- [ ] Remote logger endpoint configured or intentionally disabled.

## Rollback
- [ ] Keep previous deployment artifact available.
- [ ] Confirm rollback command/process in hosting platform.
- [ ] Validate DB backward-compatibility before rollout.
