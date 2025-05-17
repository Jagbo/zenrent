import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transactions | ZenRent",
  description: "View and manage your property financial transactions",
};

export default function TransactionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 