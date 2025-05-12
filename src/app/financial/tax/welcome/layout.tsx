import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Welcome | Tax Wizard | ZenRent",
  description: "Start your rental property tax reporting process",
};

export default function WelcomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 