import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | ZenRent",
  description: "Create your ZenRent account",
};

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 