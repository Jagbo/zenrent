import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rental Properties | Tax Wizard | ZenRent",
  description: "Manage your rental properties for tax reporting",
};

export default function PropertiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 