"use client";

import "./globals.css";
import { Inter } from "next/font/google";
import Script from 'next/script'
import { AuthProvider } from '../lib/auth';

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '900'],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <Script
          src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className={`${inter.className} h-full`} suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
