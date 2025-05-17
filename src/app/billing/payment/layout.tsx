import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment | Billing | ZenRent",
  description: "Make a payment for your ZenRent subscription",
};

export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 