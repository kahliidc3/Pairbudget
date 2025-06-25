# PairBudget

**Simple expense tracking for two people.**

PairBudget is a lightweight, mobile-friendly web application designed for two people to collaborate on managing shared expenses. Perfect for families, partners, caregivers, and any situation where financial transparency and shared responsibility matter.

## 🌟 Features

### Core Functionality
- **Two-Person Collaboration**: Designed specifically for pairs - providers and spenders
- **Real-time Synchronization**: Changes appear instantly across all devices
- **Role-Based Access**: Provider funds and oversees, Spender purchases and logs
- **Simple Interface**: Clean, intuitive design focused on ease of use

### Key Capabilities
- **Pocket Management**: Create private shared expense "pockets"
- **Balance Tracking**: Live balance calculations (Total Given - Total Spent)
- **Transaction Logging**: Record funds added and expenses made
- **Category Organization**: Organize expenses by type (Groceries, Transport, etc.)
- **Invite System**: Simple 6-character codes to invite your partner
- **Real-time Updates**: See changes immediately across all devices

## 🔧 Tech Stack

- **Frontend**: Next.js 15.3.4 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Backend**: Firebase (Firestore + Auth)
- **Forms**: React Hook Form
- **Icons**: Lucide React
- **Deployment**: Vercel-ready

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

## 📱 How It Works

### Getting Started
1. **Sign Up**: Create an account with email/password
2. **Create or Join**: Either create a new pocket or join with an invite code
3. **Choose Role**: Select Provider (funds & oversees) or Spender (purchases & logs)
4. **Start Tracking**: Begin adding funds and recording expenses

### User Roles

**Provider**
- Adds money to the pocket
- Views all transactions and balance
- Gets spending summaries and insights
- Can see where money is being spent

**Spender**
- Records purchases and expenses
- Categorizes transactions
- Views current balance
- Can upload receipts (optional)

### Workflow Example
1. **Provider** adds 2000 MAD to the family pocket
2. **Spender** buys groceries for 320 MAD and logs it
3. Both see updated balance: 1680 MAD remaining
4. Real-time transparency and accountability

## 🔒 Security & Privacy

- **Firebase Authentication**: Secure user management
- **Firestore Security Rules**: Data isolation between pockets
- **Private Pockets**: Only invited members can access
- **No Data Mining**: Your financial data stays private

## 🌍 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms
The app works on any platform supporting Next.js:
- Netlify
- Railway
- Your own server

## 📂 Project Structure

```
pairbudget/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── dashboard/       # Main app interface
│   │   ├── join/           # Invite link handling
│   │   └── page.tsx        # Auth landing page
│   ├── components/         # React components
│   │   ├── ui/             # Reusable UI components
│   │   ├── AuthForm.tsx    # Login/signup
│   │   ├── Dashboard.tsx   # Main interface
│   │   └── PocketSetup.tsx # Create/join pockets
│   ├── lib/               # Utilities
│   │   ├── firebase.ts    # Firebase config
│   │   └── utils.ts       # Helper functions
│   ├── services/          # API layer
│   │   ├── authService.ts # Authentication
│   │   └── pocketService.ts # Pocket/transaction operations
│   ├── store/             # State management
│   │   ├── authStore.ts   # User state
│   │   └── pocketStore.ts # Pocket state
│   └── types/             # TypeScript definitions
└── public/               # Static assets
```

## 🛣️ Roadmap

### Planned Features
- **Receipt Upload**: Photo capture for transaction proof
- **Spending Insights**: Charts and analytics
- **Budget Limits**: Set category spending caps
- **Export Data**: PDF reports and CSV export
- **Multiple Pockets**: Handle different purposes/people
- **Offline Support**: Work without internet connection

### Future Enhancements
- **Mobile App**: Native iOS/Android versions
- **Recurring Transactions**: Automatic bills/transfers
- **Smart Categories**: AI-powered expense categorization
- **Team Plans**: Support for families with children

## 🤝 Contributing

We welcome contributions! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- **Issues**: Report bugs via GitHub Issues
- **Questions**: Start a GitHub Discussion
- **Security**: Email security@yourapp.com for sensitive issues

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org)
- UI components inspired by [shadcn/ui](https://ui.shadcn.com)
- Icons by [Lucide](https://lucide.dev)
- Hosted on [Vercel](https://vercel.com)

---

**Made with ❤️ for transparent financial relationships**
