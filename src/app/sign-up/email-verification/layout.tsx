import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Email Verification | Sign Up | ZenRent",
  description: "Verify your email to complete account creation",
};

export default function EmailVerificationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 