import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Setup | Onboarding | ZenRent",
  description: "Complete your account preferences and setup",
};

export default function SetupOnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 