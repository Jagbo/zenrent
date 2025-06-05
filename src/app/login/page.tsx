"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-provider";
import Link from "next/link";
import Image from "next/image";
import { AuthError } from "@supabase/supabase-js";

// Function to trigger property enrichment in the background
const triggerPropertyEnrichment = async () => {
  try {
    const response = await fetch('/api/property-enrichment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.warn('Property enrichment service returned an error:', await response.text());
    } else {
      console.log('Property enrichment service triggered successfully');
    }
  } catch (error) {
    console.error('Failed to trigger property enrichment service:', error);
  }
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { signIn, signInWithGoogle, signInWithFacebook } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await signIn(email, password);
      
      // Trigger property enrichment in the background
      triggerPropertyEnrichment();
      
      router.push("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      
      // Handle rate limit errors specifically
      const authError = err as AuthError;
      if (authError.message?.includes("rate limit")) {
        setError(
          "You've reached the authentication rate limit. Please wait a few minutes before trying again."
        );
      } else {
        setError(
          authError.message || "Failed to sign in. Please check your credentials."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setOauthLoading("google");
    setError(null);

    try {
      const { error } = await signInWithGoogle();

      if (error) {
        // Handle rate limit errors specifically
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes("rate limit")) {
          setError("You've reached the authentication rate limit. Please wait a few minutes before trying again.");
        } else {
          setError(errorMessage || "Failed to sign in with Google.");
        }
      } else {
        // Trigger property enrichment in the background on successful OAuth sign-in
        triggerPropertyEnrichment();
      }
      // Note: For successful sign-in, the page will be redirected by Supabase OAuth flow
    } catch (err) {
      console.error("Google login error:", err);
      // Check for rate limit in the caught error as well
      const authError = err as AuthError;
      const errorMessage = authError.message || String(err);
      if (errorMessage.includes("rate limit")) {
        setError("You've reached the authentication rate limit. Please wait a few minutes before trying again.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setOauthLoading(null);
    }
  };

  const handleFacebookSignIn = async () => {
    setOauthLoading("facebook");
    setError(null);

    try {
      const { error } = await signInWithFacebook();

      if (error) {
        // Handle rate limit errors specifically
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes("rate limit")) {
          setError("You've reached the authentication rate limit. Please wait a few minutes before trying again.");
        } else {
          setError(errorMessage || "Failed to sign in with Facebook.");
        }
      } else {
        // Trigger property enrichment in the background on successful OAuth sign-in
        triggerPropertyEnrichment();
      }
      // Note: For successful sign-in, the page will be redirected by Supabase OAuth flow
    } catch (err) {
      console.error("Facebook login error:", err);
      // Check for rate limit in the caught error as well
      const authError = err as AuthError;
      const errorMessage = authError.message || String(err);
      if (errorMessage.includes("rate limit")) {
        setError("You've reached the authentication rate limit. Please wait a few minutes before trying again.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setOauthLoading(null);
    }
  };

  return (
    <>
      <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Image alt="ZenRent"
            src="/images/logo/zenrent-square-logo.png"
            className="mx-auto h-10 w-auto"
            width={40}
            height={40}
          />
          <h2 className="mt-6 text-center text-3xl/9 title-font text-gray-900">
            Sign in to your account
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
          <div className="bg-white px-6 py-12 shadow-sm sm:rounded-lg sm:px-12 border border-gray-200">
            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} method="post" action="#" className="space-y-6">
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
                <label htmlFor="password"
                  className="block text-sm/6 font-medium text-gray-900"
                >
                  Password
                </label>
                <div className="mt-2">
                  <input id="password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="block w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-base text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-[#D9E8FF] focus:outline-none focus:ring-1 focus:ring-[#D9E8FF] sm:text-sm/6"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-3">
                  <div className="flex h-6 shrink-0 items-center">
                    <div className="group grid size-4 grid-cols-1">
                      <input id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        className="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-[#D9E8FF] checked:bg-[#D9E8FF] indeterminate:border-[#D9E8FF] indeterminate:bg-[#D9E8FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9E8FF] disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
                      />
                      <svg fill="none"
                        viewBox="0 0 14 14"
                        className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-gray-950/25"
                      >
                        <path d="M3 8L6 11L11 3.5"
                          strokeWidth={2}
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  </div>
                  <label htmlFor="remember-me"
                    className="ml-3 block text-sm/6 text-gray-900"
                  >
                    Remember me
                  </label>
                </div>

                <div className="text-sm/6">
                  <Link href="/forgot-password"
                    className="font-semibold text-gray-900 hover:text-gray-700"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <div>
                <button type="submit"
                  disabled={isLoading}
                  data-component-name="LoginPage" className="flex w-full justify-center rounded-md bg-[#D9E8FF] px-3 py-1.5 text-sm/6 font-semibold text-gray-900 shadow-sm hover:bg-[#c4d9f7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9E8FF] disabled:opacity-70"
                >
                  {isLoading ? "Signing in..." : "Sign in"}
                </button>
              </div>
            </form>

            <div>
              <div className="relative mt-10">
                <div aria-hidden="true"
                  className="absolute inset-0 flex items-center"
                >
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm/6 font-medium">
                  <span className="bg-white px-6 text-gray-900">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <button type="button"
                  onClick={handleGoogleSignIn}
                  disabled={!!oauthLoading}
                  className="flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 border border-gray-300 shadow-sm hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9E8FF] disabled:opacity-70"
                >
                  <svg viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="h-5 w-5"
                  >
                    <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                      fill="#EA4335"
                    />
                    <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                      fill="#4285F4"
                    />
                    <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                      fill="#FBBC05"
                    />
                    <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
                      fill="#34A853"
                    />
                  </svg>
                  <span className="text-sm/6 font-semibold">
                    {oauthLoading === "google" ? "Signing in..." : "Google"}
                  </span>
                </button>

                <button type="button"
                  onClick={handleFacebookSignIn}
                  disabled={!!oauthLoading}
                  className="flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 border border-gray-300 shadow-sm hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9E8FF] disabled:opacity-70"
                >
                  <svg viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="h-5 w-5"
                  >
                    <path
                      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                      fill="#1877F2"
                    />
                  </svg>
                  <span className="text-sm/6 font-semibold">
                    {oauthLoading === "facebook" ? "Signing in..." : "Facebook"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <p className="mt-10 text-center text-sm/6 text-gray-500">
            Not a member?{" "}
            <Link href="/sign-up"
              className="font-semibold text-gray-900 hover:text-gray-700"
            >
              Start a 14 day free trial
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
