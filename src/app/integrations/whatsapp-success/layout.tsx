import { Metadata } from "next";

export const metadata: Metadata = {
  title: "WhatsApp Integration Success | ZenRent",
  description: "WhatsApp integration successfully connected",
};

export default function WhatsAppSuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 