import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tax Wizard | ZenRent",
  description: "Manage your tax reporting for rental properties",
};

export default function TaxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 