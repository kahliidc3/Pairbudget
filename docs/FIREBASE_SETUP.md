# Firebase Setup

## 1. Create Firebase project
1. Open Firebase Console.
2. Create a new project.
3. Enable Firestore Database in production mode.
4. Enable Authentication with Email/Password provider.
5. Enable Storage if receipt uploads are used.

## 2. Web app registration
1. Add a web app in Firebase project settings.
2. Copy config values to `.env.local` (see `.env.local.example`).

## 3. Firestore indexes
1. Deploy indexes required by the app.
2. Reference: `docs/FIRESTORE_INDEXES.md`.

## 4. Security rules deployment
1. Update `firestore.rules`.
2. Deploy rules:
```bash
firebase deploy --only firestore:rules
```

## 5. Local emulator setup
1. Install Firebase CLI.
2. Start local emulators:
```bash
firebase emulators:start
```
3. Set `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true` in `.env.local` for local testing.

## 6. Verify app startup
```bash
npm install
npm run dev
```
If Firebase env vars are missing, the app fails fast at startup with an explicit error.
