import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password | ZenRent",
  description: "Reset your ZenRent password",
};

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <main className="flex-1">{children}</main>
    </div>
  );
}
