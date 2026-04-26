# PairBudget

**Shared expense tracking built for two.**

[![CI](https://github.com/kahliidc3/Pairbudget/actions/workflows/ci.yml/badge.svg)](https://github.com/kahliidc3/Pairbudget/actions/workflows/ci.yml)

PairBudget is a real-time, mobile-first web app that lets two people manage shared finances together — with distinct roles, live balance tracking, and a clean interface that works seamlessly on any device.

---

## Features

- **Two roles** — Provider funds the pocket; Spender logs expenses. Both see the same live data.
- **Real-time sync** — Firestore listeners push changes instantly to both users.
- **Invite system** — Share a 6-character code or link to bring your partner in.
- **Multi-pocket** — Create or join multiple pockets and switch between them.
- **Full transaction history** — Filter by type, date, and category across all time.
- **Data export** — Download your transaction history as a file.
- **Three languages** — English, Français, العربية (RTL supported).
- **Profile page** — Edit your display name and switch language at any time.
- **Mobile-first** — Bottom navigation, pocket switcher sheet, always-visible actions.
- **Responsive desktop** — Sidebar quick-actions, sticky header, full stat cards.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| Backend | Firebase — Firestore + Auth |
| i18n | next-intl (en / fr / ar) |
| Forms | React Hook Form |
| Animations | Framer Motion |
| Notifications | Sonner |
| Monitoring | Sentry |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Firebase](https://console.firebase.google.com) project with **Authentication** (Email/Password) and **Firestore** enabled

### 1 — Clone and install

```bash
git clone https://github.com/kahliidc3/Pairbudget.git
cd pairbudget
npm install
```

### 2 — Configure environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

Fill in the values from your Firebase project settings.

### 3 — Firestore index

Create one composite index in Firestore:

- **Collection:** `transactions`
- **Fields:** `pocketId` (Ascending) → `date` (Descending)

### 4 — Run

```bash
npm run dev       # development server at http://localhost:3000
npm run build     # production build
npm run lint      # ESLint
npm test          # unit tests (Vitest)
npm run test:e2e  # end-to-end tests (Playwright)
```

---

## How It Works

1. **Sign up** with email and password.
2. **Create a pocket** (or join one with an invite code).
3. **Choose your role** — Provider or Spender.
4. **Share the invite link** with your partner so they can join.
5. **Track together** — add funds, log expenses, view history in real time.

### Roles

| | Provider | Spender |
|---|---|---|
| Add funds | ✓ | ✓ |
| Record expenses | — | ✓ |
| Edit any transaction | ✓ | own only |
| View full history | ✓ | ✓ |
| Invite partners | ✓ | ✓ |

---

## Project Structure

```
src/
├── app/[locale]/             # App Router pages (i18n)
│   ├── dashboard/            # Main app page
│   ├── all-transactions/     # Full transaction history
│   ├── pocket-setup/         # Create / join pockets
│   ├── profile/              # User profile & settings
│   └── join/                 # Invite link handler
├── components/
│   ├── dashboard/            # Dashboard sub-components
│   │   ├── AddTransactionModal.tsx
│   │   ├── EditTransactionModal.tsx
│   │   ├── DeleteTransactionModal.tsx
│   │   ├── InviteModal.tsx
│   │   ├── LeaveModal.tsx
│   │   ├── DesktopHeader.tsx
│   │   └── DesktopSidebar.tsx
│   ├── pocket-setup/         # Pocket-setup sub-components
│   │   ├── CreatePocketForm.tsx
│   │   ├── JoinPocketForm.tsx
│   │   ├── PocketList.tsx
│   │   ├── DeletePocketModal.tsx
│   │   └── RoleSelector.tsx
│   ├── ui/                   # Shared UI primitives
│   ├── Dashboard.tsx
│   ├── PocketSetup.tsx
│   ├── Profile.tsx
│   └── AuthForm.tsx
├── services/                 # Firebase service layer
├── store/                    # Zustand stores (auth, pocket)
├── types/                    # TypeScript definitions
├── hooks/                    # Custom React hooks
├── lib/                      # Firebase init, utilities, logger
└── messages/                 # i18n strings (en / fr / ar)
```

---

## Deployment

### Vercel (recommended)

1. Push to GitHub.
2. Import the repo in [Vercel](https://vercel.com).
3. Add all `NEXT_PUBLIC_*` environment variables in the Vercel dashboard.
4. Deploy — Vercel handles the rest automatically.

Any other Next.js-compatible host (Netlify, Railway, AWS Amplify) works the same way.

---

## Security

- Firestore security rules enforce per-pocket data isolation — users can only read and write data they belong to.
- Firebase Authentication handles all credential management.
- No financial data is exposed to third parties.

---

## License

MIT
