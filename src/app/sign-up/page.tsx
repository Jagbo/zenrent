"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-provider";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { AuthError } from '@supabase/supabase-js';

export default function Example() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Reset error state
    setError(null);

    // Basic validation
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);

      // Sign up with Supabase Auth and redirect to email verification page
      const response = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/sign-up/account-creation`,
        }
      });

      if (response.error) {
        throw response.error;
      }

      // Check if user was created and confirmation email sent
      if (response.data.user) {
        // Store email in localStorage for verification page
        localStorage.setItem("signupEmail", email);
        
        // Redirect to email verification page
        router.push(
          `/sign-up/email-verification?email=${encodeURIComponent(email)}`,
        );
      }
    } catch (err: unknown) {
      console.error("Signup error:", err);
      const authError = err as AuthError;
      setError(authError.message || "Failed to sign up. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;

      // The user will be redirected to Google for authentication
    } catch (err: unknown) {
      console.error("Google sign in error:", err);
      const authError = err as AuthError;
      setError(
        authError.message || "Failed to sign in with Google. Please try again.",
      );
      setLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "facebook",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          scopes: "email,public_profile",
        },
      });

      if (error) throw error;

      // The user will be redirected to Facebook for authentication
    } catch (err: unknown) {
      console.error("Facebook sign in error:", err);
      const authError = err as AuthError;
      setError(
        authError.message || "Failed to sign in with Facebook. Please try again.",
      );
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex min-h-full flex-1">
        <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-sm lg:w-96">
            <div>
              <Image alt="ZenRent"
                src="/images/logo/ZenRent-square-logo.png"
                className="h-10 w-auto"
                width={40}
                height={40}
              />
              <h2 className="mt-8 text-2xl/9 title-font text-gray-900">
                Create your account
              </h2>
              <p className="mt-2 text-sm/6 text-gray-500">
                Already have an account?{" "}
                <a href="/login"
                  className="font-semibold text-[#330015] hover:text-[#330015]/80"
                >
                  Sign in
                </a>
              </p>
            </div>

            <div className="mt-10">
              <div className="bg-white p-8 border border-gray-200 rounded-lg shadow-sm">
                {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 border-l-4 border-red-400 rounded">
                    {error}
                  </div>
                )}

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
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-base text-gray-900 placeholder:text-gray-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none sm:text-sm/6"
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
                        required
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-base text-gray-900 placeholder:text-gray-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none sm:text-sm/6"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirm-password"
                      className="block text-sm/6 font-medium text-gray-900"
                    >
                      Confirm Password
                    </label>
                    <div className="mt-2">
                      <input id="confirm-password"
                        name="confirm-password"
                        type="password"
                        required
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="block w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-base text-gray-900 placeholder:text-gray-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none sm:text-sm/6"
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
                            className="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 indeterminate:border-indigo-600 indeterminate:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
                          />
                          <svg fill="none"
                            viewBox="0 0 14 14"
                            className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-gray-950/25"
                          >
                            <path d="M3 8L6 11L11 3.5"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="opacity-0 group-has-checked:opacity-100"
                            />
                            <path d="M3 7H11"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="opacity-0 group-has-indeterminate:opacity-100"
                            />
                          </svg>
                        </div>
                      </div>
                      <label htmlFor="remember-me"
                        className="block text-sm/6 text-gray-900"
                      >
                        Remember me
                      </label>
                    </div>

                    <div className="text-sm/6">
                      <a href="#"
                        className="font-semibold text-[#330015] hover:text-[#330015]/80"
                      >
                        Forgot password?
                      </a>
                    </div>
                  </div>

                  <div>
                    <button type="submit"
                      disabled={loading}
                      className="flex w-full justify-center rounded-md bg-[#D9E8FF] px-3 py-1.5 text-sm/6 font-semibold text-gray-900 shadow-xs hover:bg-[#D9E8FF]/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9E8FF] disabled:opacity-70"
                    >
                      {loading ? "Signing up..." : "Sign up"}
                    </button>
                  </div>
                </form>
              </div>

              <div className="mt-10">
                <div className="relative">
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
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 shadow-xs ring-gray-300 ring-inset hover:bg-gray-50 focus-visible:ring-transparent disabled:opacity-70"
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
                    <span className="text-sm/6 font-semibold">Google</span>
                  </button>

                  <button type="button"
                    onClick={handleFacebookSignIn}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 shadow-xs ring-gray-300 ring-inset hover:bg-gray-50 focus-visible:ring-transparent disabled:opacity-70"
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
                    <span className="text-sm/6 font-semibold">Facebook</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="relative hidden w-0 flex-1 lg:block">
          <Image alt=""
            src="/images/hero-gradient.webp"
            className="absolute inset-0 size-full object-cover"
            width={1920}
            height={1080}
            priority
          />
        </div>
      </div>
    </>
  );
}
