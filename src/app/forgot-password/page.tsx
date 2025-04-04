"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Get the reset URL
      const redirectUrl = `${window.location.origin}/reset-password`;

      // Use our server API route to handle password reset
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, redirectUrl }),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("Failed to parse response as JSON:", jsonError);
        throw new Error("Server error: Invalid response format");
      }

      if (!response.ok) {
        throw new Error(data?.error || "Failed to send password reset code");
      }

      setIsSuccess(true);
    } catch (err: unknown) {
      console.error("Password reset error:", err);
      setError(
        err.message || "Failed to send password reset code. Please try again.",
      );
    } finally {
      setIsLoading(false);
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
          Reset your password
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
                Reset code sent! Check your email.
              </div>
              <p className="mt-6 text-sm text-gray-600">
                We've sent a 6-digit code to your email address. Use this code
                to reset your password.
              </p>
              <div className="mt-6">
                <Link href={`/reset-password?email=${encodeURIComponent(email)}`}
                  className="flex w-full justify-center rounded-md bg-[#D9E8FF] px-3 py-1.5 text-sm/6 font-semibold text-gray-900 shadow-sm hover:bg-[#D9E8FF]/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9E8FF]"
                >
                  Enter reset code
                </Link>
              </div>
              <p className="mt-6 text-sm text-gray-600">
                Did not receive the email? Check your spam folder, or{" "}
                <button type="button"
                  onClick={() => {
                    setIsSuccess(false);
                  }}
                  className="font-semibold text-gray-900 hover:text-gray-700"
                >
                  try again
                </button>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
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
                <p className="mt-2 text-sm text-gray-500">
                  We'll send a 6-digit code to this email address to reset your
                  password.
                </p>
              </div>

              <div>
                <button type="submit"
                  disabled={isLoading}
                  className="flex w-full justify-center rounded-md bg-[#D9E8FF] px-3 py-1.5 text-sm/6 font-semibold text-gray-900 shadow-sm hover:bg-[#D9E8FF]/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9E8FF] disabled:opacity-70"
                >
                  {isLoading ? "Sending..." : "Send reset code"}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 flex items-center justify-center">
            <div className="text-sm/6">
              <Link href="/login"
                className="font-semibold text-gray-900 hover:text-gray-700"
              >
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
