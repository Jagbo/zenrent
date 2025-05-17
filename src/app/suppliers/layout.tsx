import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Suppliers | ZenRent",
  description: "Manage your property service suppliers and contractors",
};

export default function SuppliersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 