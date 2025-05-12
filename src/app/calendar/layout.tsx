import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calendar | ZenRent",
  description: "View and manage your property schedule and appointments",
};

export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 