"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

// Loading Skeleton Component
function ResetPasswordLoading() {
  return (
    <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8 animate-pulse">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto h-10 w-10 bg-gray-200 rounded-md"></div>
        <div className="mt-6 mx-auto h-8 w-48 bg-gray-200 rounded"></div>
      </div>
      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-white px-6 py-12 shadow-sm sm:rounded-lg sm:px-12 border border-gray-200">
          <div className="space-y-6">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
            <div className="h-10 bg-gray-300 rounded w-full mt-4"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Renamed original component
function ResetPasswordContent() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // New states for token-based flow
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [tokenVerified, setTokenVerified] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(false);

  useEffect(() => {
    // Check for email and token in URL params
    const emailParam = searchParams.get("email");
    const tokenParam = searchParams.get("token");

    if (emailParam) {
      setEmail(emailParam);
    }

    if (tokenParam) {
      setToken(tokenParam);
      // If we have both email and token in URL, verify automatically
      if (emailParam && tokenParam) {
        verifyToken(emailParam, tokenParam);
      }
    }
  }, [searchParams]);

  // Function to verify token
  const verifyToken = async (emailToVerify: string, tokenToVerify: string) => {
    setIsCheckingToken(true);
    setError(null);

    try {
      const response = await fetch("/api/verify-reset-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailToVerify,
          token: tokenToVerify,
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        // Handle cases where the response is not valid JSON (e.g., server error HTML page)
        console.error("Failed to parse response as JSON:", jsonError);
        // Attempt to read response as text for more context
        const textResponse = await response.text();
        console.error("Server response text:", textResponse);
        throw new Error(
          `Server error: ${response.status} ${response.statusText}`,
        );
      }

      if (!response.ok) {
        throw new Error(data?.error || "Failed to verify token");
      }

      if (data.valid) {
        setTokenVerified(true);
      } else {
        setError(
          "Invalid or expired token. Please request a new password reset.",
        );
      }
    } catch (err: unknown) {
      console.error("Token verification error:", err);
      if (err instanceof Error) {
        setError(err.message || "Failed to verify token. Please try again.");
      } else {
         setError("Failed to verify token. Please try again.");
      }
    } finally {
      setIsCheckingToken(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password length
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // For token-based flow, call our API to reset password
      if (token && tokenVerified) {
        const response = await fetch("/api/verify-reset-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            token,
            newPassword: password,
          }),
        });

        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
            console.error("Failed to parse reset response as JSON:", jsonError);
            const textResponse = await response.text();
            console.error("Server response text:", textResponse);
            throw new Error(
            `Server error: ${response.status} ${response.statusText}`,
            );
        }

        if (!response.ok) {
          throw new Error(data?.error || "Failed to reset password");
        }

        setIsSuccess(true);
      } else {
        // Handle case where token wasn't verified or isn't present (though UI should prevent this)
         setError("Token not verified. Please verify the reset code first.");
         // Fallback to old Supabase direct flow (might be deprecated/removed later)
        // const { error } = await supabase.auth.updateUser({
        //   password,
        // });
        // if (error) throw error;
        // setIsSuccess(true);
      }
    } catch (err: unknown) {
      console.error("Password reset error:", err);
       if (err instanceof Error) {
        setError(err.message || "Failed to reset password. Please try again.");
      } else {
         setError("Failed to reset password. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && token) {
      verifyToken(email, token);
    } else {
      setError("Both email and token are required");
    }
  };

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Image alt="ZenRent"
          src="/images/logo/zenrent-square-logo.png"
          className="mx-auto h-10 w-auto"
          width={40}
          height={40}
        />
        <h2 className="mt-6 text-center text-3xl/9 title-font text-gray-900">
          {tokenVerified ? "Create new password" : "Reset your password"}
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-white px-6 py-12 shadow-sm sm:rounded-lg sm:px-12 border border-gray-200">
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {isSuccess ? (
            <div className="text-center">
              <div className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-700">
                Password successfully reset!
              </div>
              <p className="mt-6 text-sm text-gray-600">
                You can now login with your new password.
              </p>
              <div className="mt-6">
                <Link href="/login"
                  className="flex w-full justify-center rounded-md bg-[#D9E8FF] px-3 py-1.5 text-sm/6 font-semibold text-gray-900 shadow-sm hover:bg-[#D9E8FF]/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9E8FF]"
                >
                  Go to login
                </Link>
              </div>
            </div>
          ) : !tokenVerified ? (
            // Token verification form
            <form onSubmit={handleTokenSubmit} className="space-y-6">
              <div>
                <label htmlFor="email"
                  className="block text-sm/6 font-medium text-gray-900"
                >
                  Email address
                </label>
                <div className="mt-2">
                  <input id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="block w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-base text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-[#D9E8FF] focus:outline-none focus:ring-1 focus:ring-[#D9E8FF] sm:text-sm/6"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="token"
                  className="block text-sm/6 font-medium text-gray-900"
                >
                  Reset Code
                </label>
                <div className="mt-2">
                  <input id="token"
                    name="token"
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Enter the 6-digit code"
                    required
                    autoComplete="one-time-code"
                    className="block w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-base text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-[#D9E8FF] focus:outline-none focus:ring-1 focus:ring-[#D9E8FF] sm:text-sm/6"
                  />
                </div>
              </div>

              <div>
                <button type="submit"
                  disabled={isCheckingToken}
                  className="flex w-full justify-center rounded-md bg-[#D9E8FF] px-3 py-1.5 text-sm/6 font-semibold text-gray-900 shadow-sm hover:bg-[#D9E8FF]/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9E8FF] disabled:opacity-70"
                >
                  {isCheckingToken ? "Verifying..." : "Verify Code"}
                </button>
              </div>

              <div className="mt-4 text-center text-sm text-gray-500">
                <p>
                  Don't have a reset code?{" "}
                  <Link href="/forgot-password"
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    Request one here
                  </Link>
                </p>
              </div>
            </form>
          ) : (
            // Password reset form after token verification
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="password"
                  className="block text-sm/6 font-medium text-gray-900"
                >
                  New password
                </label>
                <div className="mt-2">
                  <input id="password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="block w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-base text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-[#D9E8FF] focus:outline-none focus:ring-1 focus:ring-[#D9E8FF] sm:text-sm/6"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword"
                  className="block text-sm/6 font-medium text-gray-900"
                >
                  Confirm new password
                </label>
                <div className="mt-2">
                  <input id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                     autoComplete="new-password"
                    className="block w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-base text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-[#D9E8FF] focus:outline-none focus:ring-1 focus:ring-[#D9E8FF] sm:text-sm/6"
                  />
                </div>
              </div>

              <div>
                <button type="submit"
                  disabled={isLoading}
                  className="flex w-full justify-center rounded-md bg-[#D9E8FF] px-3 py-1.5 text-sm/6 font-semibold text-gray-900 shadow-sm hover:bg-[#D9E8FF]/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9E8FF] disabled:opacity-70"
                >
                  {isLoading ? "Resetting..." : "Reset password"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// New default export wrapping content in Suspense
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
