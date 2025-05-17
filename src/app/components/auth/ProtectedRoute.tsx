"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-provider";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If authentication is complete and no user, redirect to login
    if (!loading && !user) {
      console.log("No authenticated user found, redirecting to login");
      router.push(
        `/login?redirectedFrom=${encodeURIComponent(window.location.pathname)}`,
      );
    }
  }, [user, loading, router]);

  // Show nothing while loading or redirecting
  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-gray-900"></div>
      </div>
    );
  }

  // If user is authenticated, render children
  return <>{children}</>;
}
