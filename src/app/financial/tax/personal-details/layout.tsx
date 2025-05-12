import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Personal Details | Tax Wizard | ZenRent",
  description: "Manage your personal information for tax reporting",
};

export default function PersonalDetailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 