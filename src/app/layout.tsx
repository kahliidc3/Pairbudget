import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppToaster from '@/components/AppToaster';
import FirebaseErrorBoundary from '@/components/FirebaseErrorBoundary';

export const metadata: Metadata = {
  title: "PairBudget — Shared Expense Tracking for Two",
  description: "Real-time, role-based budget tracking for couples and partners.",
  keywords: "expense tracking, budget management, shared expenses, family budget, couples finance",
  authors: [{ name: "PairBudget" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  minimumScale: 1,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#2d6a4f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="scroll-smooth" lang="en">
      <body>
        <FirebaseErrorBoundary>
          <main>{children}</main>
          <AppToaster />
        </FirebaseErrorBoundary>
      </body>
    </html>
  );
}
