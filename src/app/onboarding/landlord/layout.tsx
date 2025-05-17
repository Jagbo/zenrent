import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Landlord Setup | Onboarding | ZenRent",
  description: "Set up your landlord profile information",
};

export default function LandlordOnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 