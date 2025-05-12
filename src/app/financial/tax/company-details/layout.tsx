import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Company Details | Tax Wizard | ZenRent",
  description: "Manage your company information for tax reporting",
};

export default function CompanyDetailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 