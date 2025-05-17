import { Metadata } from "next";

export const metadata: Metadata = {
  title: "WhatsApp Integration | Settings | ZenRent",
  description: "Set up and configure your WhatsApp integration",
};

export default function WhatsAppSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 