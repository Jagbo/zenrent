import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Residents | ZenRent",
  description: "Manage your property residents and tenants",
};

export default function ResidentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 