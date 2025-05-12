import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Integrations | ZenRent",
  description: "Connect and manage third-party integrations",
};

export default function IntegrationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 