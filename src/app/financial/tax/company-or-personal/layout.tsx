import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Business Type | Tax Wizard | ZenRent",
  description: "Select your business type for tax reporting",
};

export default function BusinessTypeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 