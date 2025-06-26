import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from '@/components/AuthProvider';
import FirebaseErrorBoundary from '@/components/FirebaseErrorBoundary';

const inter = Inter({ 
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="scroll-smooth">
      <head>
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" 
          integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" 
          crossOrigin="anonymous" 
          referrerPolicy="no-referrer" 
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        <FirebaseErrorBoundary>
          <AuthProvider>
            <div className="min-h-screen relative overflow-hidden">
              {/* Background Particles */}
              <div className="bg-particles">
                {/* Floating Orbs */}
                <div className="floating-orb w-64 h-64 top-10 left-10 opacity-30" />
                <div className="floating-orb w-96 h-96 top-1/3 right-20 opacity-20" />
                <div className="floating-orb w-48 h-48 bottom-20 left-1/4 opacity-25" />
                
                {/* Geometric Blobs */}
                <div className="geometric-blob w-80 h-80 top-1/2 right-10 opacity-15" />
                <div className="geometric-blob w-72 h-72 bottom-10 right-1/3 opacity-10" />
              </div>
              
              {/* Main Content */}
              <div className="relative z-10">
                {children}
              </div>
            </div>
          </AuthProvider>
        </FirebaseErrorBoundary>
      </body>
    </html>
  );
}
