import "./globals.css";
import { Inter } from "next/font/google";
import Script from "next/script";
import { Providers } from "./components/providers";
import { initSupabaseEnvironment } from "@/lib/supabase-init";
import { Toaster } from "react-hot-toast";
import { ZenAgentProvider } from "@/components/zen-agent-provider";
import { cabinetGrotesk } from "./fonts";
import { ErrorBoundary } from "@/components/error-boundary";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600"],
  variable: '--font-inter',
});

export const metadata = {
  title: "PropBot",
  description: "Property Management Made Easy",
};

// Initialize Supabase environment (sets development mode for RLS)
initSupabaseEnvironment();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} ${cabinetGrotesk.variable} h-full`} suppressHydrationWarning>
        <Script src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"
          strategy="beforeInteractive"
        />
        <ZenAgentProvider>
          <Providers>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </Providers>
        </ZenAgentProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
