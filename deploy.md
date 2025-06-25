# 🚀 Deployment Guide

## Option 1: Vercel (Recommended)

### Quick Deploy
1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial PairBudget setup"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure project settings:
     - Framework Preset: `Next.js`
     - Build Command: `npm run build`
     - Output Directory: `.next`

3. **Add Environment Variables**
   In Vercel dashboard:
   - Go to your project settings
   - Add all your Firebase environment variables:
     ```
     NEXT_PUBLIC_FIREBASE_API_KEY
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
     NEXT_PUBLIC_FIREBASE_PROJECT_ID
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
     NEXT_PUBLIC_FIREBASE_APP_ID
     ```

4. **Deploy**
   - Click "Deploy"
   - Your app will be live at `your-project.vercel.app`

### Production Firestore Rules

Before going live, update your Firestore rules for production:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Pockets: only participants can access
    match /pockets/{pocketId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.participants;
      allow create: if request.auth != null && 
        request.auth.uid in request.resource.data.participants &&
        request.resource.data.participants.size() <= 2;
    }
    
    // Transactions: only pocket participants
    match /transactions/{transactionId} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/pockets/$(resource.data.pocketId)) &&
        request.auth.uid in get(/databases/$(database)/documents/pockets/$(resource.data.pocketId)).data.participants;
      allow create: if request.auth != null && 
        exists(/databases/$(database)/documents/pockets/$(request.resource.data.pocketId)) &&
        request.auth.uid in get(/databases/$(database)/documents/pockets/$(request.resource.data.pocketId)).data.participants;
    }
  }
}
```

## Option 2: Netlify

1. **Build Command**: `npm run build`
2. **Publish Directory**: `.next`
3. **Add environment variables** in Netlify dashboard

## Option 3: Railway

1. **Connect GitHub repository**
2. **Add environment variables**
3. **Deploy automatically**

## Post-Deployment Checklist

- [ ] Test user registration
- [ ] Test pocket creation
- [ ] Test invite system
- [ ] Test transaction recording
- [ ] Verify real-time updates
- [ ] Check mobile responsiveness
- [ ] Test with multiple users

## Domain Setup (Optional)

1. **Purchase domain** from your preferred registrar
2. **Add custom domain** in your hosting platform
3. **Configure DNS** records
4. **Update Firebase authorized domains**:
   - Go to Firebase Console > Authentication > Settings
   - Add your custom domain to "Authorized domains"

## Monitoring & Analytics

Consider adding:
- **Firebase Analytics** for user insights
- **Error tracking** (Sentry, LogRocket)
- **Performance monitoring** (Firebase Performance)
- **Uptime monitoring** (UptimeRobot)

---

**🎉 Your PairBudget app is now live!** 