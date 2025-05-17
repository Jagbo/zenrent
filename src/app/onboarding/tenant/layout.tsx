import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tenant Setup | Onboarding | ZenRent",
  description: "Set up your tenants and residents information",
};

export default function TenantOnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 