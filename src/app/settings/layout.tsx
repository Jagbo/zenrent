import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings | ZenRent",
  description: "Manage your account settings",
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 