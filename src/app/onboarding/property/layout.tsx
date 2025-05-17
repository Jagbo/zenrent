import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Property Setup | Onboarding | ZenRent",
  description: "Set up your rental properties",
};

export default function PropertyOnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 