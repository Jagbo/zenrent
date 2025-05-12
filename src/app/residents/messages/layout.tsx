import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resident Messages | ZenRent",
  description: "Communicate with your residents",
};

export default function ResidentMessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 