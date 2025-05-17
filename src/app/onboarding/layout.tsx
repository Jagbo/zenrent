import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Onboarding | ZenRent",
  description: "Complete your ZenRent account setup",
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 