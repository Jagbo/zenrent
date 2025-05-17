import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Financial | ZenRent",
  description: "Manage your property finances and tax reporting",
};

export default function FinancialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 