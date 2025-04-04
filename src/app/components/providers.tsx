"use client";

import { AuthProvider } from "../../lib/auth-provider";
import { QueryProvider } from "@/components/providers/QueryProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <QueryProvider>{children}</QueryProvider>
    </AuthProvider>
  );
}
