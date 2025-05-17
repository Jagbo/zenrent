import "../globals.css";
import { Inter } from "next/font/google";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | ZenRent",
  description: "Sign in to your ZenRent account to manage your properties and tenants.",
};

// Configure the Inter font
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "900"],
});

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="h-full bg-gray-50">{children}</div>;
}
