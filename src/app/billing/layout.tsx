import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Billing | ZenRent",
  description: "Manage your ZenRent subscription and billing information",
};

export default function BillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 