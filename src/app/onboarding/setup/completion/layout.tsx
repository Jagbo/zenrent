import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Setup Complete | Onboarding | ZenRent",
  description: "Your ZenRent account is ready to use",
};

export default function SetupCompletionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 