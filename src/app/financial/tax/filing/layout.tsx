import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Filing | Tax Wizard | ZenRent",
  description: "File your rental property tax return",
};

export default function FilingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 