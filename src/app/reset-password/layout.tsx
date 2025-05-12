import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password | ZenRent",
  description: "Create a new password for your ZenRent account",
};

export default function ResetPasswordLayout({
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
