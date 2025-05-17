import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notification Preferences | Setup | ZenRent",
  description: "Configure your notification preferences",
};

export default function NotificationsSetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 