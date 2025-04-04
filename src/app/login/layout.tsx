"use client";

import "../globals.css";
import { Inter } from "next/font/google";

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
