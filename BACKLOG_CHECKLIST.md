# PairBudget - Professional Development Backlog & Sprint Plan

**Last Updated**: 2025-11-22
**Version**: 2.1
**Total Project Duration**: 6 weeks (30 working days)
**Developer Capacity**: 1 full-time developer (8 hours/day)

---

## 📊 Executive Summary

| Metric | Value | Status |
|--------|-------|--------|
| **Total Tasks** | 130 tasks | In Progress |
| **Completed** | 19 tasks (15%) | ✅ Complete |
| **Remaining** | 111 tasks (85%) | 🔄 In Progress |
| **Critical Issues** | 1 | 🚨 New (user profile access gap) |
| **High Priority** | 47 tasks | 📋 Planned |
| **Medium Priority** | 55 tasks | 📋 Planned |
| **Low Priority** | 27 tasks | 📋 Planned |
| **Security Score** | 92% | ⚠️ Harden profiles/logging |

---

## 🎯 Strategic Priorities

### Completed Achievements ✅
- ✅ **Major Security Vulnerabilities Addressed** (15/16 tasks)
  - Firestore transaction rules hardened
  - Input validation implemented
  - Rate limiting on signup/join/transactions (client-side)
  - GDPR-compliant user deletion
  - Cryptographically secure invite codes
  - Error message sanitization
  - Environment variable validation
  - **Open gap**: user profile read access still too broad (see Task #124)

### Next Focus Areas
0. **Immediate**: Close security gaps (Tasks #124-129: profile rules, App Check, rate limiting, logging)
1. **Week 1-2**: Performance & Code Quality (Foundation)
2. **Week 3**: Internationalization (User Experience)
3. **Week 4**: Design Consistency & Accessibility (UI/UX)
4. **Week 5**: Testing & Quality Assurance (Stability)
5. **Week 6**: Documentation & Deployment (Production Readiness)

---

## 📅 6-Week Sprint Plan

### **WEEK 1: Performance & Critical Code Quality** (40 hours)

#### Sprint 1.1 - Performance Critical Path (20 hours)

**Day 1: Monday - Database Performance (8h)**
- [x] **Task #1** [CRITICAL] Fix N+1 Query Problem (4h)
  - `src/components/Dashboard.tsx:79-102`, `src/app/[locale]/all-transactions/page.tsx:54-70`
  - Create `useLoadUserNames` hook with caching
  - Implement batch user profile loading
  - Add in-memory cache with TTL
  - Test with 100+ transactions
  - **Impact**: 70-90% reduction in Firestore reads

- [x] **Task #2** [HIGH] Implement Transaction Pagination (4h)
  - `src/app/[locale]/all-transactions/page.tsx`
  - Add Firestore `.limit(20)` and cursor pagination
  - Create pagination UI component
  - Implement infinite scroll
  - **Impact**: 95% reduction in initial load time

**Day 2: Tuesday - Memory & Subscription Management (8h)**
- [x] **Task #3** [HIGH] Fix Subscription Memory Leaks (4h)
  - `src/services/pocketService.ts:150-358`
  - Implement subscription cleanup timers
  - Add max subscription age (5 min)
  - Create subscription health dashboard
  - Test with multiple pocket switches

- [x] **Task #4** [MEDIUM] Add Firestore Query Indexes (2h)
  - Create composite indexes for common queries
  - Document index requirements
  - Test query performance

- [ ] **Task #5** [MEDIUM] Implement Server-Side Transaction Ordering (2h)
  - `src/services/pocketService.ts:178-222`
  - Replace client `.sort()` with Firestore `.orderBy('date', 'desc')`
  - Create required composite index

**Day 3: Wednesday - Code Quality Foundation (8h)**
- [ ] **Task #6** [HIGH] Extract Duplicate Subscription Logic (4h)
  - `src/services/pocketService.ts` (280 lines duplicated)
  - Create `createSubscription()` factory function
  - Refactor `subscribeToTransactions()` and `subscribeToPocket()`
  - Add unit tests for subscription factory

- [ ] **Task #7** [MEDIUM] Extract Magic Numbers to Constants (2h)
  - Create `src/constants/config.ts`
  - Extract all timeouts, limits, retries
  - Document each constant's purpose

- [ ] **Task #8** [MEDIUM] Memoize UI Components (2h)
  - `src/components/ui/StatCard.tsx`, `TransactionCard.tsx`
  - Wrap with `React.memo()`
  - Add prop comparison functions
  - Measure render performance

**Day 4: Thursday - Component Refactoring (8h)**
- [ ] **Task #9** [HIGH] Split PocketSetup.tsx (6h)
  - Break 919 lines into 4 focused components:
    - `PocketSetupLayout.tsx` (navigation wrapper)
    - `CreatePocketForm.tsx` (~250 lines)
    - `JoinPocketForm.tsx` (~200 lines)
    - `PocketManagementGrid.tsx` (~300 lines)
  - Move to `src/components/pocket-setup/` directory

- [ ] **Task #10** [MEDIUM] Add useCallback to Event Handlers (2h)
  - `src/components/Dashboard.tsx:110-210`
  - Wrap all handlers with `useCallback`
  - Add dependency arrays

**Day 5: Friday - Code Cleanup & Review (8h)**
- [ ] **Task #11** [LOW] Fix Type Assertions (2h)
  - `src/services/pocketService.ts:66,369,414`
  - Add runtime validation before casting
  - Consider using Zod for schema validation

- [ ] **Task #12** [LOW] Improve Error Context (2h)
  - `src/services/pocketService.ts:83-85`
  - Add meaningful context before re-throwing
  - Standardize error handling pattern

- [ ] **Task #13** [LOW] Standardize Import Ordering (2h)
  - Add ESLint rule for import order
  - Run auto-fix across codebase
  - Document import conventions

- [ ] **Task #14** [BUFFER] Code Review & Testing (2h)
  - Manual testing of all Week 1 changes
  - Performance benchmarking
  - Git commit cleanup

---

### **WEEK 2: Advanced Refactoring & Bundle Optimization** (40 hours)

#### Sprint 2.1 - Large Component Decomposition (16 hours)

**Day 6: Monday - Dashboard Refactoring (8h)**
- [ ] **Task #15** [HIGH] Split Dashboard.tsx into Sub-Components (6h)
  - Break 790 lines into 6 files:
    - `DashboardLayout.tsx` (main wrapper)
    - `DashboardStats.tsx` (KPI cards)
    - `RecentTransactionsList.tsx` (transaction display)
    - `QuickActionsGrid.tsx` (action buttons)
    - `TransactionFormModal.tsx` (add transaction form)
    - `InviteCodeModal.tsx` & `LeavePocketModal.tsx`

- [ ] **Task #16** [MEDIUM] Extract Modal State Management (2h)
  - Create `useModals()` custom hook
  - Centralize 4 modal states
  - Add modal transition animations

**Day 7: Tuesday - Auth & Provider Refactoring (8h)**
- [ ] **Task #17** [HIGH] Refactor AuthProvider (5h)
  - `src/components/AuthProvider.tsx:28-206`
  - Extract into `useAuthOrchestration()` hook
  - Replace 5 refs with proper state machine
  - Simplify redirect logic

- [ ] **Task #18** [MEDIUM] Split AuthForm.tsx (3h)
  - Break 529 lines into 3 components:
    - `AuthFormFields.tsx` (input fields)
    - `LanguageSelector.tsx` (shared component)
    - `TermsAgreement.tsx` (checkbox section)

#### Sprint 2.2 - Performance & Bundle (16 hours)

**Day 8: Wednesday - Bundle Optimization (8h)**
- [ ] **Task #19** [HIGH] Implement Code Splitting (4h)
  - Lazy load modals with `React.lazy()`
  - Add `Suspense` boundaries
  - Split by route with dynamic imports

- [ ] **Task #20** [MEDIUM] Analyze Bundle Size (2h)
  - Run `npm run build` and analyze
  - Use `@next/bundle-analyzer`
  - Identify heavy dependencies
  - Create optimization roadmap

- [ ] **Task #21** [MEDIUM] Optimize Animation Variants (2h)
  - `src/components/ui/StatCard.tsx:49-52`, `TransactionCard.tsx:31-34`
  - Wrap variants in `useMemo()`
  - Consider lazy-loading Framer Motion

**Day 9: Thursday - Soft Delete & Cleanup (8h)**
- [ ] **Task #22** [MEDIUM] Implement Soft Delete Filtering (4h)
  - `src/services/pocketService.ts:405-450`
  - Add `where('deleted', '!=', true)` to all queries
  - Create Firestore composite indexes
  - Test with deleted data

- [ ] **Task #23** [MEDIUM] Create Data Cleanup Cloud Function (4h)
  - Write Firebase Function for automated cleanup
  - Schedule daily cron job
  - Delete expired soft-deleted resources
  - Add cleanup monitoring

**Day 10: Friday - Dependency Updates (8h)**
- [ ] **Task #24** [HIGH] Minor Package Updates (3h)
  - Update Tailwind CSS 4.1.12 → 4.1.17
  - Update framer-motion 12.23.12 → 12.23.24
  - Update lucide-react 0.523.0 → 0.554.0
  - Update react-hook-form 7.62.0 → 7.66.1
  - Update zustand 5.0.7 → 5.0.8
  - Update next-intl 4.3.4 → 4.5.5
  - Update eslint 9.33.0 → 9.39.1
  - Update TypeScript 5.9.2 → 5.9.3

- [ ] **Task #25** [HIGH] Type Definitions Updates (2h)
  - Update @types/node 20.19.11 → 24.10.1
  - Update @types/react 19.1.10 → 19.2.6
  - Update @types/react-dom 19.1.7 → 19.2.3

- [ ] **Task #26** [BUFFER] Testing & Verification (3h)
  - Test all user flows after updates
  - Check for breaking changes
  - Update package-lock.json

---

### **WEEK 3: Internationalization & Major Upgrades** (40 hours)

#### Sprint 3.1 - i18n Implementation (24 hours)

**Day 11: Monday - Core i18n Infrastructure (8h)**
- [ ] **Task #27** [HIGH] Update Translation Files Structure (3h)
  - Fix UTF-8 encoding in `en.json`, `fr.json`, `ar.json`
  - Create comprehensive key structure
  - Add missing namespaces (errors, auth, dashboard, etc.)

- [ ] **Task #28** [HIGH] Externalize AuthForm Strings (5h)
  - `src/components/AuthForm.tsx:55-515`
  - Move 40+ hardcoded strings to i18n
  - Error messages, validation messages, UI text
  - Test in all 3 languages

**Day 12: Tuesday - Dashboard & Components i18n (8h)**
- [ ] **Task #29** [HIGH] Internationalize Dashboard (4h)
  - `src/components/Dashboard.tsx`
  - Move 50+ strings to i18n keys
  - Test modal text, stat labels, actions

- [ ] **Task #30** [HIGH] Internationalize PocketSetup (4h)
  - `src/components/PocketSetup.tsx`
  - Move 30+ strings to i18n
  - Form labels, error messages, stats

**Day 13: Wednesday - Pages & Service Errors (8h)**
- [ ] **Task #31** [MEDIUM] Localize All Transactions Page (3h)
  - `src/app/[locale]/all-transactions/page.tsx`
  - Move page headings, search placeholder, CSV export text

- [ ] **Task #32** [MEDIUM] Internationalize Mobile UI (2h)
  - `src/components/ui/MobileHeader.tsx`
  - `src/components/ui/BottomNavigation.tsx`
  - Time-based greetings, navigation labels

- [ ] **Task #33** [MEDIUM] Externalize Service Layer Errors (3h)
  - `src/services/authService.ts`, `pocketService.ts`
  - Move error messages to i18n
  - Ensure consistency across services

#### Sprint 3.2 - Locale-Aware Utilities (8 hours)

**Day 14: Thursday - Formatting & Major Upgrades Prep (8h)**
- [ ] **Task #34** [HIGH] Make Currency Formatting Locale-Aware (3h)
  - `src/lib/utils.ts:8-16`
  - Remove hardcoded USD/MAD logic
  - Use user's preferred currency from profile
  - Support multi-currency

- [ ] **Task #35** [HIGH] Make Date Formatting Locale-Aware (2h)
  - `src/lib/utils.ts:18-24`
  - Use active locale from next-intl context
  - Test with different date formats (EN, FR, AR)

- [ ] **Task #36** [MEDIUM] Locale-Aware Invite Links (1h)
  - `src/lib/utils.ts:27-32`
  - Generate links with locale prefix: `/${locale}/join?code=...`

- [ ] **Task #37** [MEDIUM] Translation File Audit (2h)
  - Ensure all 3 language files have matching keys
  - Add missing translations for new components
  - Consider next-intl strict mode

**Day 15: Friday - Major Version Upgrades (8h)**
- [ ] **Task #38** [MAJOR] Upgrade Next.js 15.3.4 → 16.0.3 (4h)
  - Run `npx @next/codemod@canary upgrade latest`
  - Await all async Request APIs (params, searchParams, cookies, headers)
  - Test Turbopack stability
  - **Breaking changes documented**: See [Next.js 16 guide](https://nextjs.org/docs/app/guides/upgrading/version-16)

- [ ] **Task #39** [MAJOR] Upgrade React 19.1.1 → 19.2.0 (2h)
  - Update @types/react and @types/react-dom to 19.2.6 / 19.2.3
  - Test new `use()` hook compatibility
  - Consider React Compiler for auto-memoization
  - **Reference**: [React 19.2 features](https://react.dev/blog/2025/10/01/react-19-2)

- [ ] **Task #40** [MAJOR] Upgrade Firebase 11.10.0 → 12.6.0 (2h)
  - Review [Firebase 12.x migration guide](https://firebase.google.com/docs/web/setup)
  - Test Firestore, Auth operations
  - Verify no Vertex AI usage (deprecated)

---

### **WEEK 4: Design Consistency & Accessibility** (40 hours)

#### Sprint 4.1 - Theme Unification (16 hours)

**Day 16: Monday - Major Component Theme Updates (8h)**
- [ ] **Task #41** [HIGH] Convert PocketSetup to White Theme (4h)
  - `src/components/PocketSetup.tsx:293-917`
  - Remove dark gradients (`from-slate-900 via-blue-900`)
  - Replace glassmorphism with solid white cards
  - Update buttons from gradients to solid colors
  - Change background to `bg-gray-50`

- [ ] **Task #42** [HIGH] Convert PocketSelection to White Theme (2h)
  - `src/components/PocketSelection.tsx:123-297`
  - Match Dashboard.tsx styling
  - Remove animated background shapes

- [ ] **Task #43** [HIGH] Convert Join Page to White Theme (2h)
  - `src/app/[locale]/join/page.tsx:139-458`
  - Update modals to solid white
  - Error alerts to `bg-red-50 border-red-200`

**Day 17: Tuesday - UI Consistency (8h)**
- [ ] **Task #44** [MEDIUM] Update Landing Page Navigation (2h)
  - `src/app/[locale]/page.tsx`
  - Navigation to `bg-white border-b border-gray-100`
  - Feature cards consistency

- [ ] **Task #45** [MEDIUM] Remove All Glassmorphism Effects (3h)
  - Find/replace `backdrop-blur-xl` and `bg-white/10`
  - Update across PocketSetup, PocketSelection, Join, Landing
  - Test visual consistency

- [ ] **Task #46** [MEDIUM] Standardize Button Styles (2h)
  - Replace all gradient buttons with solid colors
  - Use Dashboard pattern: `bg-blue-600 hover:bg-blue-700`
  - Test hover states

- [ ] **Task #47** [LOW] Standardize Hover Effects (1h)
  - Remove `hover:-translate-y-1` animations
  - Replace with subtle shadow changes

#### Sprint 4.2 - Accessibility Implementation (16 hours)

**Day 18: Wednesday - WCAG 2.2 Compliance (8h)**
- [ ] **Task #48** [HIGH] Add ARIA Labels to Icons (3h)
  - Audit all icon-only buttons
  - Add `aria-label` to Share, SignOut, action icons
  - Test with screen reader
  - **Reference**: [WCAG 2.2 checklist](https://webaim.org/standards/wcag/checklist)

- [ ] **Task #49** [MEDIUM] Fix Color Contrast Violations (2h)
  - Audit all text/background combinations
  - Ensure minimum 4.5:1 contrast ratio
  - Fix `text-white/70` on light backgrounds

- [ ] **Task #50** [MEDIUM] Implement Focus Management (3h)
  - Add focus trap in modals using `react-focus-lock`
  - Focus first input on modal open
  - Return focus to trigger on close

**Day 19: Thursday - Accessibility & UX (8h)**
- [ ] **Task #51** [MEDIUM] Add Accessible Labels to Forms (2h)
  - `src/app/[locale]/all-transactions/page.tsx:233-248`
  - Replace placeholder-only inputs with proper `<label>`
  - Add `aria-describedby` for error messages

- [ ] **Task #52** [LOW] Keyboard Navigation (2h)
  - Ensure logical tab order
  - Add keyboard shortcuts (Alt+H for home)
  - Test navigation without mouse

- [ ] **Task #53** [MEDIUM] Touch Target Optimization (2h)
  - Ensure all buttons ≥ 48x48px
  - Test on mobile devices
  - Fix small interactive elements

- [ ] **Task #54** [HIGH] Replace alert() with Toast Notifications (2h)
  - `src/components/Dashboard.tsx:132,178,190`
  - Install `react-hot-toast` or `sonner`
  - Create consistent toast styling

**Day 20: Friday - Input Validation & UX Polish (8h)**
- [ ] **Task #55** [MEDIUM] Add Client-Side Input Validation (3h)
  - `src/components/PocketSetup.tsx:97-144`
  - Trim whitespace, length limits (3-50 chars)
  - Real-time feedback with error messages

- [ ] **Task #56** [MEDIUM] Normalize Invite Code Input (2h)
  - Auto-uppercase, trim whitespace
  - Format as ABC-123
  - Prevent invalid characters

- [ ] **Task #57** [LOW] Add Transaction Description Length Limit (1h)
  - Max 500 characters
  - Show character counter
  - Prevent overflow

- [ ] **Task #58** [MEDIUM] Add Loading States (2h)
  - Disable buttons during async operations
  - Show clear loading indicators
  - Prevent double-submission

---

### **WEEK 5: Testing & Quality Assurance** (40 hours)

#### Sprint 5.1 - Test Infrastructure (16 hours)

**Day 21: Monday - Testing Framework Setup (8h)**
- [ ] **Task #59** [HIGH] Configure Testing Framework (4h)
  - Choose Vitest (modern, fast) over Jest
  - Create `vitest.config.ts`
  - Install dependencies:
    - `vitest`
    - `@testing-library/react`
    - `@testing-library/jest-dom`
    - `@testing-library/user-event`
  - Add `test` script to package.json

- [ ] **Task #60** [HIGH] Set Up E2E Testing (4h)
  - Install Playwright
  - Create `e2e/` directory structure
  - Configure `playwright.config.ts`
  - Create helper utilities

**Day 22: Tuesday - Service Unit Tests (8h)**
- [ ] **Task #61** [HIGH] Write authService Tests (4h)
  - Test: `signUp`, `signIn`, `signOut`, `getUserProfile`
  - Mock Firebase Auth responses
  - Test error handling for each error code
  - Test orphaned user recovery
  - **Target**: 80%+ code coverage

- [ ] **Task #62** [HIGH] Write pocketService Tests (4h)
  - Test: `createPocket`, `joinPocket`, `leavePocket`, `deletePocket`
  - Test: `addTransaction` with balance calculations
  - Test invite code validation
  - Mock Firestore responses

#### Sprint 5.2 - Component & Integration Tests (16 hours)

**Day 23: Wednesday - Store & Utility Tests (8h)**
- [ ] **Task #63** [MEDIUM] Write Zustand Store Tests (3h)
  - Test authStore state updates
  - Test pocketStore transaction additions
  - Test subscription management

- [ ] **Task #64** [MEDIUM] Write Utility Function Tests (3h)
  - Test `formatCurrency` with different locales
  - Test `formatDate` with edge cases
  - Test `generateInviteLink`
  - Test `clearAuthCache`

- [ ] **Task #65** [MEDIUM] Write Component Unit Tests (2h)
  - Test StatCard rendering
  - Test TransactionCard props
  - Test form validation logic

**Day 24: Thursday - E2E Test Suite (8h)**
- [ ] **Task #66** [HIGH] Write Critical Flow E2E Tests (6h)
  - Test: Signup → Pocket Creation → Invite → Join
  - Test: Login → Add Funds → Add Expense → Verify Balance
  - Test: Join with Invite Code
  - Test: Leave Pocket → Data Cleanup
  - Test: Multi-locale switching (EN, FR, AR)

- [ ] **Task #67** [MEDIUM] Write Error Path Tests (2h)
  - Test: Invalid credentials
  - Test: Network errors
  - Test: Invalid invite codes

**Day 25: Friday - CI/CD & Quality Gates (8h)**
- [ ] **Task #68** [HIGH] Configure GitHub Actions CI (4h)
  - Create `.github/workflows/ci.yml`
  - Add steps: lint, typecheck, test, build
  - Configure test coverage reporting
  - Add status badges to README

- [ ] **Task #69** [MEDIUM] Add Pre-commit Hooks (2h)
  - Install Husky
  - Add pre-commit: lint-staged, type-check
  - Add commit-msg: conventional commits

- [ ] **Task #70** [MEDIUM] Configure Dependabot (1h)
  - Create `.github/dependabot.yml`
  - Auto-update npm dependencies weekly
  - Configure PR auto-merge for patches

- [ ] **Task #71** [BUFFER] Final Testing & Bug Fixes (1h)

---

### **WEEK 6: Documentation, Compliance & Production** (40 hours)

#### Sprint 6.1 - Documentation (16 hours)

**Day 26: Monday - Core Documentation (8h)**
- [ ] **Task #72** [HIGH] Create .env.local.example (1h)
  - All NEXT_PUBLIC_FIREBASE_* variables
  - Add comments explaining each variable
  - Document how to get Firebase credentials

- [ ] **Task #73** [HIGH] Write FIREBASE_SETUP.md (3h)
  - How to create Firebase project
  - Firestore setup guide
  - Security rules deployment
  - Email/password auth setup
  - Environment variable configuration
  - Local emulator setup

- [ ] **Task #74** [MEDIUM] Create CONTRIBUTING.md (2h)
  - Code style guidelines
  - Branch naming (feat/, fix/, docs/)
  - PR process and review checklist
  - Testing requirements
  - Commit message conventions

- [ ] **Task #75** [MEDIUM] Write ARCHITECTURE.md (2h)
  - System architecture diagram
  - Component hierarchy
  - Data flow diagrams
  - State management patterns
  - Firebase schema documentation

**Day 27: Tuesday - Code Documentation (8h)**
- [ ] **Task #76** [MEDIUM] Add JSDoc to Services (4h)
  - Document all public functions in authService.ts
  - Document all public functions in pocketService.ts
  - Add parameter descriptions, return types, examples

- [ ] **Task #77** [MEDIUM] Document i18n Workflow (2h)
  - How to add new translation keys
  - How to add new languages
  - Pluralization rules
  - Currency and date formatting

- [ ] **Task #78** [LOW] Add Inline Comments for Complex Logic (2h)
  - Subscription retry logic
  - Auth orchestration
  - Firebase recovery strategies

#### Sprint 6.2 - GDPR Compliance (8 hours)

**Day 28: Wednesday - Data Privacy (8h)**
- [ ] **Task #79** [CRITICAL] User Data Deletion Already Implemented ✅
  - Verify implementation
  - Test cascade deletion
  - Document process

- [ ] **Task #80** [HIGH] Data Export Functionality (4h)
  - Create "Export My Data" button in settings
  - Export user profile as JSON
  - Export transactions as CSV
  - ZIP download with all data

- [ ] **Task #81** [HIGH] Create Terms of Service Page (2h)
  - `src/app/[locale]/terms/page.tsx`
  - Localize for EN, FR, AR
  - Include data retention periods

- [ ] **Task #82** [HIGH] Create Privacy Policy Page (2h)
  - `src/app/[locale]/privacy/page.tsx`
  - Document Firebase data handling
  - Cookie usage policy
  - User rights (GDPR)

#### Sprint 6.3 - Production Readiness (16 hours)

**Day 29: Thursday - Security & Monitoring (8h)**
- [ ] **Task #83** [HIGH] Integrate Sentry Error Monitoring (3h)
  - Install `@sentry/nextjs`
  - Configure `sentry.client.config.ts`, `sentry.server.config.ts`
  - Set up source maps
  - Add performance monitoring
  - Connect to `NEXT_PUBLIC_LOGGER_ENDPOINT`

- [ ] **Task #84** [HIGH] Add Next.js Security Headers (2h)
  - Configure `next.config.ts` headers:
    - Content-Security-Policy
    - X-Frame-Options: DENY
    - X-Content-Type-Options: nosniff
    - X-XSS-Protection: 1; mode=block
    - Referrer-Policy: strict-origin-when-cross-origin
  - **Reference**: [Next.js Security Guide](https://www.turbostarter.dev/blog/complete-nextjs-security-guide-2025-authentication-api-protection-and-best-practices)

- [ ] **Task #85** [MEDIUM] Implement Audit Logging (2h)
  - Create `audit-logs` Firestore collection
  - Log: account deletion, pocket deletion, role changes
  - Include: timestamp, user ID, action, IP

- [ ] **Task #86** [MEDIUM] Add Firebase Performance Monitoring (1h)
  - Enable Firebase Performance
  - Track page load times
  - Track Firestore query performance

**Day 30: Friday - Final Deployment Prep (8h)**
- [ ] **Task #87** [HIGH] Create Deployment Checklist (2h)
  - Pre-deployment verification steps
  - Database migration process
  - Rollback procedure
  - Environment variable checklist

- [ ] **Task #88** [HIGH] Bundle Size Optimization (2h)
  - Run bundle analyzer
  - Ensure main bundle < 200KB gzipped
  - Optimize images
  - Remove unused dependencies

- [ ] **Task #89** [MEDIUM] Lighthouse CI Setup (2h)
  - Add Lighthouse CI to GitHub Actions
  - Set performance budgets
  - Monitor Core Web Vitals

- [ ] **Task #90** [HIGH] Final Production Testing (2h)
  - Test all critical flows in production build
  - Verify Firestore rules in production
  - Test on multiple devices/browsers
  - Performance audit

---

## 📊 Remaining Tasks by Category (Reference)

### New Security & Data Integrity Findings (7 tasks, 18 hours)
- [ ] **Task #124** [CRITICAL] Harden user profile visibility (3h)
  - Restrict Firestore user reads to self/participants or public projection
  - Update `firestore.rules` and `getUserProfile` consumers (Dashboard, All Transactions)
  - Add emulator tests for user access

- [ ] **Task #125** [HIGH] Add sign-in rate limiting (2h)
  - Apply `enforceRateLimit` in `authService.signIn`
  - Surface localized throttle message in `AuthForm`

- [ ] **Task #126** [HIGH] Scrub PII before remote logging (3h)
  - Redact emails/UIDs from `src/lib/logger.ts` payloads
  - Disable remote forwarding until consent and endpoint configured
  - Document data retention and sampling

- [ ] **Task #127** [HIGH] Enforce Firebase App Check (4h)
  - Enable App Check for Firestore/Storage and emulator config
  - Add rule conditions requiring valid App Check token
  - Handle fallback UX when verification fails

- [ ] **Task #128** [MEDIUM] Use Firestore `serverTimestamp()` (2h)
  - Transactions/pockets: replace client `new Date()` writes
  - Backfill/null-safe handling for existing documents

- [ ] **Task #129** [MEDIUM] Server-side rate limiting (2h)
  - Move join/signup/transaction throttles to Cloud Function or edge middleware
  - Include App Check verification and IP/device fingerprinting
  - Keep client limiter for UX messaging

- [ ] **Task #130** [MEDIUM] December dependency sweep validation (2h)
  - Verify `next@16.0.3`, `firebase@12.6.0`, `firebase-admin@13.6.0`, `lucide-react@0.554.0`, `next-intl@4.5.5`
  - Rebuild, lint, and smoke-test auth/pocket flows
  - Regenerate `package-lock.json`

### Additional Technical Debt (33 tasks)

#### Font Awesome Major Upgrade (1 task, 2 hours)
- [ ] **Task #91** [LOW] Upgrade Font Awesome 6.7.2 → 7.1.0 (2h)
  - Review breaking changes
  - Test icon rendering
  - Update all icon imports

#### Mobile UX Improvements (4 tasks, 6 hours)
- [ ] **Task #92** [LOW] Add Pull-to-Refresh (2h)
- [ ] **Task #93** [LOW] Implement Infinite Scroll (2h)
- [ ] **Task #94** [LOW] Add Haptic Feedback (1h)
- [ ] **Task #95** [LOW] Optimize Touch Targets (1h)

#### Firebase Specific (3 tasks, 8 hours)
- [ ] **Task #96** [MEDIUM] Review Firestore Security Rules (2h)
- [ ] **Task #97** [MEDIUM] Implement Firestore Emulator (3h)
- [ ] **Task #98** [LOW] Add Firebase Admin SDK Server Routes (3h)

#### Analytics & Monitoring (3 tasks, 6 hours)
- [ ] **Task #99** [MEDIUM] Add Google Analytics (2h)
- [ ] **Task #100** [LOW] Track User Flows (2h)
- [ ] **Task #101** [LOW] Track Invite Conversion (2h)

#### Data Retention Policies (2 tasks, 6 hours)
- [ ] **Task #102** [MEDIUM] Define Retention Policies (2h)
- [ ] **Task #103** [MEDIUM] Implement Auto-Cleanup (4h)

#### Minor Fixes & Enhancements (20 tasks, 20 hours)
- [ ] **Task #104-123** Various low-priority fixes
  - Border consistency updates
  - Landing page demo content localization
  - Translation file encoding fixes
  - Remaining minor dependency updates
  - Code comment additions
  - Import ordering enforcement
  - UUID upgrade (11.1.0 → 13.0.0)
  - Firebase Admin upgrade (13.4.0 → 13.6.0)
  - Additional modal improvements
  - CSV export success feedback
  - Optimistic UI updates
  - Dark mode support (future consideration)
  - Additional responsive breakpoint testing

---

## 🎯 Success Metrics & KPIs

### Performance Targets
- [ ] **Lighthouse Score**: >= 90 (Performance, Accessibility, Best Practices, SEO)
- [ ] **First Contentful Paint**: < 1.5s
- [ ] **Time to Interactive**: < 3.5s
- [ ] **Bundle Size**: < 200KB gzipped (main)
- [ ] **Firestore Reads**: 70% reduction via caching

### Quality Targets
- [ ] **Test Coverage**: >= 80% for services and utilities
- [ ] **TypeScript Strict**: 100% compliance
- [ ] **ESLint Errors**: 0 errors, < 10 warnings
- [ ] **WCAG 2.2 Level AA**: 100% compliance

### Security Targets
- [ ] **Security Score**: >= 95% (App Check + profile rules pending)
- [ ] **Critical Vulnerabilities**: 0 (user profile access gap open)
- [ ] **High Vulnerabilities**: 0 (rate limiting/logging hardening pending)
- [ ] **Medium Vulnerabilities**: 0 (timestamp integrity pending)

---

## 📚 References & Resources

### Web Research Sources
1. **Next.js 15 Security**: [TurboStarter Security Guide](https://www.turbostarter.dev/blog/complete-nextjs-security-guide-2025-authentication-api-protection-and-best-practices)
2. **Next.js 16 Upgrade**: [Official Migration Guide](https://nextjs.org/docs/app/guides/upgrading/version-16)
3. **Firebase Security Rules**: [Fireship Rules Cookbook](https://fireship.io/snippets/firestore-rules-recipes/)
4. **React 19 Performance**: [React.dev Blog](https://react.dev/blog/2025/10/01/react-19-2)
5. **WCAG 2.2 Compliance**: [WebAIM Checklist](https://webaim.org/standards/wcag/checklist)
6. **TypeScript Strict Mode**: [Migration Guide](https://preetmishra.com/blog/migrating-to-typescript-strict-mode-at-an-early-stage-startup)
7. **Firebase App Check**: [App Check Web Guide](https://firebase.google.com/docs/app-check/web/recaptcha-provider)

### Key Findings from Codebase Analysis
- **Security**: User profiles readable by any authenticated user; sign-in lacks throttling; remote logger sends PII; App Check not enforced; client timestamps are spoofable
- **Performance**: N+1 queries identified as #1 bottleneck
- **Code Quality**: Large components (900+ lines) need decomposition
- **Accessibility**: Missing ARIA labels and focus management
- **i18n**: 150+ hardcoded strings need translation

---

## 🚀 Quick Start Guide

### For Developers Starting This Backlog

1. **Week 1 Priority**: Start with Tasks #1-14 (Performance & Code Quality)
2. **Dependencies**: Ensure Node.js 20.9.0+, npm 10+
3. **Branch Strategy**: Create feature branches from `main`
4. **Testing**: Run tests before every commit
5. **Documentation**: Update CHANGELOG.md for each completed task

### Estimation Notes
- **Buffer Time**: 10% added to each sprint for unexpected issues
- **Code Review**: Included in task estimates
- **Testing**: Included in task estimates
- **Complexity**: Tasks marked [CRITICAL], [HIGH], [MEDIUM], [LOW]

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.1 | 2025-11-22 | Added new security findings (Tasks #124-130), refreshed dependency targets to Dec 2025 releases |
| 2.0 | 2025-01-22 | Complete restructure with numbered tasks, hourly estimates, 6-week sprint plan |
| 1.0 | 2025-10-26 | Initial backlog creation |

---

**Next Review Date**: End of Week 3 (2025-02-12)
**Project Manager**: KHALID
**Tech Lead**: KHALID Chalhi

_This is a living document. Update after each sprint retrospective._
