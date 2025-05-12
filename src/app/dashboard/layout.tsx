import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | ZenRent",
  description: "Your property management dashboard",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 