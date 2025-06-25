# 🔥 Firebase Setup Guide for PairBudget

Follow these steps exactly to connect your app to Firebase.

## Step 1: Create Firebase Project

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com
   - Sign in with your Google account

2. **Create New Project**
   - Click "Create a project"
   - Project name: `pairbudget` (or your choice)
   - Continue through the setup wizard
   - Choose to enable/disable Google Analytics (optional)
   - Click "Create project"

## Step 2: Enable Authentication

1. **Navigate to Authentication**
   - In your Firebase project dashboard
   - Click "Authentication" in the left sidebar
   - Click "Get started"

2. **Enable Email/Password**
   - Go to "Sign-in method" tab
   - Click on "Email/Password"
   - Enable the first toggle (Email/Password)
   - Leave "Email link" disabled for now
   - Click "Save"

## Step 3: Create Firestore Database

1. **Navigate to Firestore**
   - Click "Firestore Database" in the left sidebar
   - Click "Create database"

2. **Security Rules**
   - Choose "Start in test mode" (temporary)
   - We'll update rules later for security

3. **Location**
   - Choose a location close to your users
   - Click "Done"

## Step 4: Get Your Firebase Configuration

1. **Project Settings**
   - Click the gear icon ⚙️ next to "Project Overview"
   - Click "Project settings"

2. **Add Web App**
   - Scroll down to "Your apps" section
   - Click the web icon `</>`
   - App nickname: `pairbudget-web`
   - Don't check "Firebase Hosting" for now
   - Click "Register app"

3. **Copy Configuration**
   - You'll see a config object like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyC...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef123456"
   };
   ```
   - **Copy these values** - you'll need them!

## Step 5: Update Environment Variables

1. **Copy Environment File**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Edit .env.local** 
   Replace the placeholder values with your actual Firebase config:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
   ```

## Step 6: Update Firestore Security Rules

1. **In Firebase Console**
   - Go to "Firestore Database"
   - Click "Rules" tab

2. **Replace Default Rules**
   - Copy the content from `firestore.rules` file in this project
   - Paste it into the Firebase console
   - Click "Publish"

## Step 7: Test Your Setup

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Open App**
   - Visit: http://localhost:3000
   - Try signing up with a test email
   - If successful, Firebase is connected!

## 🚨 Important Security Notes

1. **Never commit .env.local** to git (it's already in .gitignore)
2. **Use different projects** for development/production
3. **Update Firestore rules** before going live
4. **Enable additional security** features in Firebase console

## 🔧 Troubleshooting

### Common Issues:

1. **"Firebase: Error (auth/invalid-api-key)"**
   - Check your API key in .env.local
   - Make sure there are no extra spaces
   - Restart the dev server after changes

2. **"Missing or insufficient permissions"**
   - Check Firestore rules are published
   - Verify user is authenticated

3. **"Module not found" errors**
   - Run `npm install` again
   - Delete `.next` folder and restart

### Getting Help:

1. **Check Firebase Console logs**
   - Go to "Authentication" > "Users" to see signups
   - Go to "Firestore" > "Data" to see documents

2. **Check Browser Console**
   - Open DevTools (F12)
   - Look for Firebase-related errors

## 🎉 Next Steps

Once Firebase is connected:

1. **Create your first pocket**
2. **Invite a partner**
3. **Start tracking expenses**
4. **Set up deployment** (see README.md)

---

**Need help?** Check the Firebase documentation: https://firebase.google.com/docs 