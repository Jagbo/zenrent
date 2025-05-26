import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Issues | ZenRent',
  description: 'Track and manage property maintenance requests and issues',
};

export default function IssuesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 