import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account | Sign Up | ZenRent",
  description: "Complete your account creation process",
};

export default function AccountCreationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 