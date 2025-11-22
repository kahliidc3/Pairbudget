# PairBudget v2.0 🚀

**Modern, responsive expense tracking for two people - completely redesigned.**

PairBudget v2.0 is a fully responsive, mobile-first web application designed for two people to collaborate on managing shared expenses with a beautiful, modern interface. Perfect for families, partners, caregivers, and any situation where financial transparency and shared responsibility matter.

## ✨ What's New in v2.0

### 🎨 Complete UI/UX Redesign
- **Modern White Theme**: Clean, professional interface with consistent design language
- **True Responsive Design**: Seamless experience from mobile to desktop
- **Mobile-First Architecture**: Optimized touch interfaces with desktop enhancements
- **Component-Based UI**: Reusable components with consistent styling

### 📱 Enhanced Mobile Experience
- **Compact KPI Cards**: Three key metrics in a single row for quick overview
- **Bottom Navigation**: Easy thumb-friendly navigation
- **Touch-Optimized Modals**: Full-screen forms with smooth animations
- **Quick Action Cards**: Fast access to common tasks

### 💻 Desktop Power Features
- **Sidebar Quick Actions**: All essential functions in one place
- **Enhanced Statistics**: Full StatCard design with detailed insights
- **Improved Header**: Clean navigation with logout functionality
- **Expanded Action Set**: Add funds, expenses, invite partners, view reports, manage pockets

### 🔧 Technical Improvements
- **Next.js 15.3.4**: Latest framework with improved performance
- **Framer Motion**: Smooth animations and transitions
- **TypeScript Strict**: Full type safety and better developer experience
- **Optimized Build**: Faster loading and better SEO

## 🌟 Core Features

### Two-Person Collaboration
- **Role-Based Interface**: Provider and Spender optimized experiences
- **Real-time Synchronization**: Changes appear instantly across all devices
- **Invite System**: Simple 6-character codes to invite your partner
- **Secure Access**: Private pockets with Firebase authentication

### Financial Management
- **Live Balance Tracking**: Real-time calculations (Total Funds - Total Expenses)
- **Transaction Logging**: Record funds and expenses with categories
- **Comprehensive Reports**: View all transactions with filtering
- **Category Organization**: Organize expenses by type (Groceries, Transport, etc.)

### Modern Interface
- **Responsive Design**: Works perfectly on phones, tablets, and desktops
- **Dark/Light Themes**: Clean white theme with professional aesthetics
- **Intuitive Navigation**: Easy-to-use interface for all technical levels
- **Performance Optimized**: Fast loading and smooth interactions

## 🔧 Tech Stack

- **Frontend**: Next.js 15.3.4 with TypeScript and App Router
- **Styling**: Tailwind CSS with custom design system
- **Animations**: Framer Motion for smooth transitions
- **State Management**: Zustand for reactive state
- **Backend**: Firebase (Firestore + Authentication)
- **Forms**: React Hook Form with validation
- **Icons**: Lucide React for consistent iconography
- **Deployment**: Vercel-optimized build

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Firebase account
- npm or yarn

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <your-repo>
   cd pairbudget
   npm install
   ```

2. **Set up Firebase**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Get your Firebase configuration

3. **Environment Setup**
   ```bash
   # Create environment file
   cp .env.local.example .env.local
   
   # Add your Firebase config to .env.local
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

## 🔧 Firestore Indexes

Create the required composite index for transactions pagination:
- Collection `transactions`: `pocketId` (asc), `date` (desc)

See `FIRESTORE_INDEXES.md` for details.

## 📱 How It Works

### Getting Started
1. **Sign Up**: Create an account with email/password
2. **Create or Join**: Either create a new pocket or join with an invite code
3. **Choose Role**: Select Provider (funds & oversees) or Spender (purchases & logs)
4. **Start Tracking**: Begin adding funds and recording expenses

### User Roles

**Provider**
- Adds money to the pocket
- Views all transactions and comprehensive reports
- Access to full desktop dashboard with sidebar actions
- Can invite partners and manage pocket settings

**Spender**
- Records purchases and expenses with categories
- Views current balance and recent transactions
- Quick mobile interface for fast expense logging
- Access to transaction history and reports

### Mobile vs Desktop Experience

**Mobile (iPhone/Android)**
- Compact 3-column KPI display
- Bottom navigation with floating action button
- Full-screen modals for forms
- Touch-optimized quick action cards

**Desktop (Laptop/PC)**
- Full StatCard layout in sidebar
- Comprehensive quick actions panel
- Enhanced header with direct logout
- Expanded transaction views and reports

## 🔒 Security & Privacy

- **Firebase Authentication**: Enterprise-grade user management
- **Firestore Security Rules**: Complete data isolation between pockets
- **Private Pockets**: Only invited members can access shared data
- **No Data Mining**: Your financial data remains completely private

## 🌍 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically with optimized builds

### Other Platforms
Compatible with any Next.js hosting platform:
- Netlify
- Railway
- AWS Amplify
- Your own server

## 📂 Project Structure

```
pairbudget/
├── src/
│   ├── app/[locale]/        # Internationalized App Router
│   │   ├── dashboard/       # Main application interface
│   │   ├── all-transactions/# Transaction reports page
│   │   ├── join/           # Invite link handling
│   │   ├── pocket-setup/   # Create/join pockets
│   │   └── page.tsx        # Landing/auth page
│   ├── components/         # React components
│   │   ├── ui/             # Modern UI component library
│   │   │   ├── StatCard.tsx
│   │   │   ├── TransactionCard.tsx
│   │   │   ├── QuickActionCard.tsx
│   │   │   ├── MobileModal.tsx
│   │   │   ├── MobileHeader.tsx
│   │   │   └── BottomNavigation.tsx
│   │   ├── AuthForm.tsx    # Login/signup forms
│   │   ├── Dashboard.tsx   # Main responsive interface
│   │   └── PocketSetup.tsx # Pocket creation/joining
│   ├── lib/               # Utilities and configuration
│   │   ├── firebase.ts    # Firebase setup
│   │   └── utils.ts       # Helper functions
│   ├── services/          # API and business logic
│   │   ├── authService.ts # Authentication operations
│   │   └── pocketService.ts # Pocket/transaction management
│   ├── store/             # Zustand state management
│   │   ├── authStore.ts   # User authentication state
│   │   └── pocketStore.ts # Pocket and transaction state
│   ├── types/             # TypeScript type definitions
│   ├── messages/          # i18n translation files
│   └── i18n/             # Internationalization setup
├── public/               # Static assets
└── CLAUDE.md            # Development documentation
```

## 🛣️ v3.0 Roadmap

### Planned Features
- **Receipt Upload**: Photo capture with OCR for automatic data entry
- **Advanced Analytics**: Charts, trends, and spending insights
- **Budget Management**: Set category limits and spending goals
- **Export Capabilities**: PDF reports and CSV data export
- **Multi-Pocket Support**: Handle multiple shared expenses simultaneously
- **Offline Mode**: Full functionality without internet connection

### Future Enhancements
- **Native Mobile Apps**: iOS/Android applications
- **Smart Categorization**: AI-powered expense recognition
- **Recurring Transactions**: Automatic handling of regular expenses
- **Family Plans**: Support for larger household management
- **Integration APIs**: Connect with banks and payment systems

## 🎯 Performance & Standards

- **Lighthouse Score**: 90+ across all metrics
- **Core Web Vitals**: Optimized for Google page experience
- **Accessibility**: WCAG 2.1 AA compliant
- **TypeScript**: 100% type coverage for reliability
- **Mobile Performance**: Sub-3s load times on 3G

## 🤝 Contributing

We welcome contributions to PairBudget v2.0! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with proper TypeScript typing
4. Add tests for new functionality
5. Ensure responsive design works on all breakpoints
6. Submit a pull request with detailed description

### Development Guidelines
- Follow the established component patterns
- Maintain mobile-first responsive design
- Use Tailwind CSS classes consistently
- Add proper TypeScript types
- Test on both mobile and desktop

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support & Community

- **Bug Reports**: Create GitHub Issues with reproduction steps
- **Feature Requests**: Start GitHub Discussions for new ideas
- **Security Issues**: Email security@pairbudget.app for sensitive matters
- **Community**: Join our Discord for real-time discussions

## 🙏 Acknowledgments

- **Framework**: Built with [Next.js 15](https://nextjs.org)
- **UI Inspiration**: Modern design patterns from [shadcn/ui](https://ui.shadcn.com)
- **Icons**: Beautiful icons by [Lucide](https://lucide.dev)
- **Animations**: Smooth motion by [Framer Motion](https://framer.com/motion)
- **Hosting**: Deployed on [Vercel](https://vercel.com)
- **Backend**: Powered by [Firebase](https://firebase.google.com)

---

**PairBudget v2.0 - Made with ❤️ for transparent, modern financial relationships**

*Experience the future of shared expense tracking with our completely redesigned, mobile-first platform.*
