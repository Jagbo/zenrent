import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Summary | Tax Wizard | ZenRent",
  description: "Review your tax summary for rental properties",
};

export default function SummaryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 