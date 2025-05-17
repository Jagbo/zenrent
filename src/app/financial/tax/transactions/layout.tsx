import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transactions | Tax Wizard | ZenRent",
  description: "Review and categorize your rental property transactions for tax reporting",
};

export default function TransactionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 