import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resident Details | ZenRent",
  description: "View and manage resident details",
};

export default function ResidentDetailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 