"use client";

import { ZenAgent } from "@/components/ui/zen-agent";

interface ZenAgentProviderProps {
  children: React.ReactNode;
}

export function ZenAgentProvider({ children }: ZenAgentProviderProps) {
  return (
    <>
      {children}
    </>
  );
}
