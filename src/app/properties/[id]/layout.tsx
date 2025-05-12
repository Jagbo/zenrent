import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Property Details | ZenRent",
  description: "View and manage property details",
};

export default function PropertyDetailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 