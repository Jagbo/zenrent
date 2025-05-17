import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Properties | ZenRent",
  description: "Manage your rental properties",
};

export default function PropertiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 