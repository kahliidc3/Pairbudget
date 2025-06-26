import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from '@/components/AuthProvider';
import FirebaseErrorBoundary from '@/components/FirebaseErrorBoundary';

const inter = Inter({ 
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "PairBudget - Expense Tracking for Two",
  description: "Simple expense tracking and budget management for couples and partners.",
  keywords: "expense tracking, budget management, shared expenses, family budget, couples finance",
  authors: [{ name: "PairBudget Team" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={`scroll-smooth ${inter.variable}`} lang="en">
      <body className={`${inter.className} font-sans antialiased bg-slate-50 text-slate-900`}>
        <FirebaseErrorBoundary>
          <AuthProvider>
            <main className="min-h-screen">
              {children}
            </main>
          </AuthProvider>
        </FirebaseErrorBoundary>
      </body>
    </html>
  );
}
