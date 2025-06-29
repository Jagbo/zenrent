"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SidebarLayout } from "../../components/sidebar-layout";
import { SideboardOnboardingContent } from "../../components/sideboard-onboarding-content";
import { UserCircleIcon, PhoneIcon } from "@heroicons/react/24/outline";
import { BuildingOfficeIcon, HomeIcon } from "@heroicons/react/24/solid";
import { CheckIcon } from "@heroicons/react/24/solid";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const steps = [
  {
    id: "01",
    name: "Account",
    href: "/sign-up/account-creation",
    status: "current",
  },
  { id: "02", name: "Landlord", href: "#", status: "upcoming" },
  { id: "03", name: "Property", href: "#", status: "upcoming" },
  { id: "04", name: "Tenants", href: "#", status: "upcoming" },
  { id: "05", name: "Setup", href: "#", status: "upcoming" },
];

// Add titles array
const titles = [
  { id: "mr", name: "Mr" },
  { id: "mrs", name: "Mrs" },
  { id: "miss", name: "Miss" },
  { id: "ms", name: "Ms" },
  { id: "dr", name: "Dr" },
  { id: "other", name: "Other" },
];

export default function AccountCreation() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobile, setMobile] = useState("");
  const [title, setTitle] = useState("");
  const [accountType, setAccountType] = useState("individual");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  // Get the current user on component mount
  useEffect(() => {
    async function getUser() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error fetching session:", error);
          router.push("/sign-up");
          return;
        }

        if (!session) {
          console.log("No active session found");
          router.push("/sign-up");
          return;
        }

        setUserId(session.user.id);
      } catch (error) {
        console.error("Error in getUser:", error);
        router.push("/sign-up");
      }
    }

    getUser();
  }, [router, supabase.auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!firstName || !lastName) {
      setError("First name and last name are required");
      return;
    }

    // Validate UK phone number if provided
    if (mobile) {
      // Remove spaces and check if it's a valid UK mobile format
      const cleanedMobile = mobile.replace(/\s/g, '');
      // UK mobile numbers start with 07 and have 9 more digits
      const ukMobileRegex = /^7\d{9}$/;
      
      if (!ukMobileRegex.test(cleanedMobile)) {
        setError("Please enter a valid UK mobile number (e.g., 7700 900123)");
        return;
      }
    }

    if (!agreeTerms || !agreePrivacy) {
      setError("You must agree to the terms of service and privacy policy");
      return;
    }

    if (!userId) {
      setError("User authentication error. Please sign up again.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.log("Submitting user profile for ID:", userId);

      // Get current session to ensure we're authenticated
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error("Authentication error: No active session");
      }

      // Insert profile data
      const { error: insertError } = await supabase
        .from("user_profiles")
        .upsert({
          user_id: userId,
          title: title,
          first_name: firstName,
          last_name: lastName,
          phone: mobile ? `+44${mobile}` : null,
          account_type: accountType,
          agreed_terms: agreeTerms,
          agreed_privacy: agreePrivacy,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        throw new Error(`Failed to create profile: ${insertError.message}`);
      }

      console.log("Profile created successfully");

      // Redirect to the next step in the onboarding flow
      router.push("/onboarding/landlord/personal-profile");
    } catch (err) {
      console.error("Error saving profile:", err);
      setError(err instanceof Error ? err.message : "Failed to create profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SidebarLayout isOnboarding={true}>
      <div className="space-y-8">
        {/* Progress Bar */}
        <div className="py-0">
          <nav aria-label="Progress">
            <ol role="list"
              className="flex overflow-x-auto border border-gray-300 rounded-md bg-white"
            >
              {steps.map((step, stepIdx) => (
                <li key={step.name}
                  className="relative flex flex-1 min-w-[80px] sm:min-w-[120px]"
                >
                  {step.status === "complete" ? (
                    <a href={step.href}
                      className="group flex w-full items-center"
                    >
                      <span className="flex flex-col items-center md:flex-row md:items-center px-3 py-3 text-sm font-medium sm:px-6 sm:py-4">
                        <span className="flex size-8 sm:size-10 shrink-0 items-center justify-center rounded-full bg-d9e8ff group-hover:bg-d9e8ff-80">
                          <CheckIcon aria-hidden="true"
                            className="size-4 sm:size-6 text-gray-900"
                          />
                        </span>
                        <span className="mt-2 text-center md:mt-0 md:text-left md:ml-4 text-xs sm:text-sm font-medium text-gray-900">
                          {step.name}
                        </span>
                      </span>
                    </a>
                  ) : step.status === "current" ? (
                    <a href={step.href}
                      aria-current="step"
                      className="flex items-center"
                    >
                      <span className="flex flex-col items-center md:flex-row md:items-center px-3 py-3 text-sm font-medium sm:px-6 sm:py-4">
                        <span className="flex size-8 sm:size-10 shrink-0 items-center justify-center rounded-full border-2 border-d9e8ff">
                          <span className="text-xs sm:text-sm text-gray-900">
                            {step.id}
                          </span>
                        </span>
                        <span className="mt-2 text-center md:mt-0 md:text-left md:ml-4 text-xs sm:text-sm font-medium text-gray-900">
                          {step.name}
                        </span>
                      </span>
                    </a>
                  ) : (
                    <a href={step.href} className="group flex items-center">
                      <span className="flex flex-col items-center md:flex-row md:items-center px-3 py-3 text-sm font-medium sm:px-6 sm:py-4">
                        <span className="flex size-8 sm:size-10 shrink-0 items-center justify-center rounded-full border-2 border-gray-300 group-hover:border-gray-400">
                          <span className="text-xs sm:text-sm text-gray-500 group-hover:text-gray-900">
                            {step.id}
                          </span>
                        </span>
                        <span className="mt-2 text-center md:mt-0 md:text-left md:ml-4 text-xs sm:text-sm font-medium text-gray-500 group-hover:text-gray-900">
                          {step.name}
                        </span>
                      </span>
                    </a>
                  )}

                  {stepIdx !== steps.length - 1 ? (
                    <>
                      {/* Arrow separator - hide on mobile, show on desktop */}
                      <div aria-hidden="true"
                        className="absolute top-0 right-0 hidden md:block h-full w-5"
                      >
                        <svg fill="none"
                          viewBox="0 0 22 80"
                          preserveAspectRatio="none"
                          className="size-full text-gray-300"
                        >
                          <path d="M0 -2L20 40L0 82"
                            stroke="currentcolor"
                            vectorEffect="non-scaling-stroke"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </>
                  ) : null}
                </li>
              ))}
            </ol>
          </nav>
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-8 py-8 md:grid-cols-3">
          <div className="px-4 sm:px-0">
            <h2 className="text-base/7 title-font text-gray-900">
              Account Creation
            </h2>
            <p className="mt-1 text-sm/6 text-gray-600">
              Please provide your information to create your ZenRent account.
            </p>
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Free Trial Active</strong> - You&apos;re starting with a 30-day free trial. 
                No payment required to explore core features.
              </p>
            </div>
          </div>

          <form className="bg-white border border-gray-300 ring-1 shadow-xs ring-gray-900/5 sm:rounded-xl md:col-span-2"
            onSubmit={handleSubmit}
          >
            {/* Display error message if any */}
            {error && (
              <div className="px-4 py-3 bg-red-50 border-l-4 border-red-400 text-red-700 mb-4">
                <p>{error}</p>
              </div>
            )}

            <div className="px-4 py-4 sm:p-6">
              <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8">
                {/* Personal Details */}
                <div className="border-b border-gray-900/10 pb-4">
                  <h2 className="text-base/7 title-font text-gray-900">
                    Personal Details
                  </h2>
                  <p className="mt-1 text-sm/6 text-gray-600">
                    Information about you as a landlord.
                  </p>
                  <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                    <div className="sm:col-span-2">
                      <label htmlFor="title"
                        className="block text-sm/6 font-medium text-gray-900"
                      >
                        Title
                      </label>
                      <div className="mt-2">
                        <select id="title"
                          name="title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 border border-gray-300 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-d9e8ff sm:text-sm/6"
                        >
                          <option value="">Select title</option>
                          {titles.map((title) => (
                            <option key={title.id} value={title.id}>
                              {title.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="first-name"
                        className="block text-sm/6 font-medium text-gray-900"
                      >
                        First name *
                      </label>
                      <div className="mt-2">
                        <input id="first-name"
                          name="first-name"
                          type="text"
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          autoComplete="given-name"
                          className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 border border-gray-300 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-d9e8ff sm:text-sm/6"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="last-name"
                        className="block text-sm/6 font-medium text-gray-900"
                      >
                        Last name *
                      </label>
                      <div className="mt-2">
                        <input id="last-name"
                          name="last-name"
                          type="text"
                          required
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          autoComplete="family-name"
                          className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 border border-gray-300 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-d9e8ff sm:text-sm/6"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-4">
                      <label htmlFor="mobile"
                        className="block text-sm/6 font-medium text-gray-900"
                      >
                        Mobile number
                      </label>
                      <div className="mt-2 grid grid-cols-1">
                        <div className="col-start-1 row-start-1 flex items-center rounded-md bg-white pl-3 border border-gray-300 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-d9e8ff">
                          <span className="shrink-0 text-base text-gray-500 select-none sm:text-sm/6">
                            +44
                          </span>
                          <input type="tel"
                            name="mobile"
                            id="mobile"
                            value={mobile}
                            onChange={(e) => {
                              // Allow only numbers and spaces
                              const value = e.target.value.replace(/[^\d\s]/g, '');
                              // Limit to 11 digits (excluding spaces)
                              const digitsOnly = value.replace(/\s/g, '');
                              if (digitsOnly.length <= 10) {
                                setMobile(value);
                              }
                            }}
                            className="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
                            placeholder="7700 900123"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Type */}
                <div className="border-b border-gray-900/10 pb-4">
                  <h2 className="text-base/7 title-font text-gray-900">
                    Account Type
                  </h2>
                  <p className="mt-1 text-sm/6 text-gray-600">
                    Select the type of account that best describes you.
                  </p>
                  <div className="mt-4 flex gap-6">
                    <div className={`flex flex-1 flex-col items-center gap-3 rounded-lg border p-4 cursor-pointer
                        ${accountType === "individual" ? "border-[#FF503E] bg-[#FF503E]/10" : "border-gray-300"}`}
                      onClick={() => setAccountType("individual")}
                    >
                      <HomeIcon className="h-8 w-8 text-[#FF503E]" />
                      <div className="flex flex-col items-center">
                        <span className="font-medium text-gray-900">
                          Individual Landlord
                        </span>
                        <span className="text-sm text-gray-500 text-center mt-1">
                          For personal property owners
                        </span>
                      </div>
                      <div className="mt-1 flex h-6 items-center">
                        <input id="individual"
                          name="account-type"
                          type="radio"
                          checked={accountType === "individual"}
                          onChange={() => setAccountType("individual")}
                          className="relative size-4 appearance-none rounded-full border border-gray-300 bg-white before:absolute before:inset-1 before:rounded-full before:bg-white not-checked:before:hidden checked:border-[#FF503E] checked:bg-[#FF503E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF503E] disabled:border-gray-300 disabled:bg-gray-100 disabled:before:bg-gray-400 forced-colors:appearance-auto forced-colors:before:hidden"
                        />
                      </div>
                    </div>

                    <div className={`flex flex-1 flex-col items-center gap-3 rounded-lg border p-4 cursor-pointer
                        ${accountType === "company" ? "border-[#FF503E] bg-[#FF503E]/10" : "border-gray-300"}`}
                      onClick={() => setAccountType("company")}
                    >
                      <BuildingOfficeIcon className="h-8 w-8 text-[#FF503E]" />
                      <div className="flex flex-col items-center">
                        <span className="font-medium text-gray-900">
                          Company Landlord
                        </span>
                        <span className="text-sm text-gray-500 text-center mt-1">
                          For property management businesses
                        </span>
                      </div>
                      <div className="mt-1 flex h-6 items-center">
                        <input id="company"
                          name="account-type"
                          type="radio"
                          checked={accountType === "company"}
                          onChange={() => setAccountType("company")}
                          className="relative size-4 appearance-none rounded-full border border-gray-300 bg-white before:absolute before:inset-1 before:rounded-full before:bg-white not-checked:before:hidden checked:border-[#FF503E] checked:bg-[#FF503E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF503E] disabled:border-gray-300 disabled:bg-gray-100 disabled:before:bg-gray-400 forced-colors:appearance-auto forced-colors:before:hidden"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Terms & Consent */}
                <div>
                  <fieldset>
                    <legend className="text-base/7 title-font text-gray-900">
                      Terms & Consent
                    </legend>
                    <p className="mt-1 text-sm/6 text-gray-600">
                      Please review and accept our terms and privacy policy.
                    </p>
                    <div className="mt-4 space-y-4">
                      <div className="flex gap-3">
                        <div className="flex h-6 shrink-0 items-center">
                          <div className="group grid size-4 grid-cols-1">
                            <input id="terms"
                              name="terms"
                              type="checkbox"
                              required
                              checked={agreeTerms}
                              onChange={(e) => setAgreeTerms(e.target.checked)}
                              aria-describedby="terms-description"
                              className="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-[#FF503E] checked:bg-[#FF503E] indeterminate:border-[#FF503E] indeterminate:bg-[#FF503E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF503E] disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
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
                        <div className="text-sm/6">
                          <label htmlFor="terms"
                            className="font-medium text-gray-900"
                          >
                            I agree to the Terms of Service *
                          </label>
                          <p id="terms-description" className="text-gray-500">
                            By checking this box, you agree to our{" "}
                            <a href="/terms-of-service"
                              className="text-[#FF503E] hover:text-[#FF503E]/80"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Terms of Service
                            </a>
                            .
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex h-6 shrink-0 items-center">
                          <div className="group grid size-4 grid-cols-1">
                            <input id="privacy"
                              name="privacy"
                              type="checkbox"
                              required
                              checked={agreePrivacy}
                              onChange={(e) =>
                                setAgreePrivacy(e.target.checked)
                              }
                              aria-describedby="privacy-description"
                              className="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-[#FF503E] checked:bg-[#FF503E] indeterminate:border-[#FF503E] indeterminate:bg-[#FF503E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF503E] disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
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
                        <div className="text-sm/6">
                          <label htmlFor="privacy"
                            className="font-medium text-gray-900"
                          >
                            I agree to the Privacy Policy *
                          </label>
                          <p id="privacy-description" className="text-gray-500">
                            By checking this box, you agree to our{" "}
                            <a href="/privacy-policy"
                              className="text-[#FF503E] hover:text-[#FF503E]/80"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Privacy Policy
                            </a>
                            .
                          </p>
                        </div>
                      </div>
                    </div>
                  </fieldset>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-6">
              <button type="button"
                onClick={() => router.back()}
                className="text-sm/6 font-semibold text-gray-900"
                disabled={isSubmitting}
              >
                Back
              </button>
              <button type="submit"
                className="rounded-md bg-d9e8ff px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs hover:bg-d9e8ff-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-d9e8ff disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating Account..." : "Create Account"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </SidebarLayout>
  );
}
