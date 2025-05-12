import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Adjustments | Tax Wizard | ZenRent",
  description: "Make adjustments to your rental property tax calculations",
};

export default function AdjustmentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 