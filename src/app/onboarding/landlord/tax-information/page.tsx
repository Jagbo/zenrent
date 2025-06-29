"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SidebarLayout } from "../../../components/sidebar-layout";
import { SideboardOnboardingContent } from "../../../components/sideboard-onboarding-content";
import {
  CheckIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import { CheckIcon as CheckIconSolid } from "@heroicons/react/24/solid";
import { supabase } from "@/lib/supabase";
import { Select, SelectItem } from "@tremor/react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const steps = [
  {
    id: "01",
    name: "Account",
    href: "/sign-up/account-creation",
    status: "complete",
  },
  {
    id: "02",
    name: "Landlord",
    href: "/onboarding/landlord/tax-information",
    status: "current",
  },
  { id: "03", name: "Property", href: "#", status: "upcoming" },
  { id: "04", name: "Tenants", href: "#", status: "upcoming" },
  { id: "05", name: "Setup", href: "#", status: "upcoming" },
];

const taxStatusOptions = [
  { id: "individual", name: "Individual" },
  { id: "partnership", name: "Partnership" },
  { id: "limited-company", name: "Limited Company" },
];

const taxYearOptions = [
  { id: "2023-2024", name: "2023/2024 (6 April 2023 - 5 April 2024)" },
  { id: "2022-2023", name: "2022/2023 (6 April 2022 - 5 April 2023)" },
  { id: "2021-2022", name: "2021/2022 (6 April 2021 - 5 April 2022)" },
];

const mtdStatusOptions = [
  { id: "enrolled", name: "Enrolled" },
  { id: "not-enrolled", name: "Not enrolled" },
  { id: "exempt", name: "Exempt" },
  { id: "not-sure", name: "Not sure" },
];

export default function TaxInformation() {
  const router = useRouter();

  // Form state
  const [taxStatus, setTaxStatus] = useState("");
  const [taxReference, setTaxReference] = useState("");
  const [isUKTaxResident, setIsUKTaxResident] = useState(true);
  const [utr, setUtr] = useState("");
  const [mtdStatus, setMtdStatus] = useState("");
  const [isNonResidentScheme, setIsNonResidentScheme] = useState(false);
  const [accountingPeriod, setAccountingPeriod] = useState("");

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Reference label based on tax status
  const [taxReferenceLabel, setTaxReferenceLabel] = useState(
    "Tax Reference Number",
  );

  // Load existing user profile data
  useEffect(() => {
    async function getUserAndProfile() {
      try {
        const { data: userData, error: userError } =
          await supabase.auth.getUser();

        if (userError) {
          console.error("Error fetching user:", userError);
          router.push("/sign-up");
          return;
        }

        if (userData && userData.user) {
          setUserId(userData.user.id);

          const { data: profileData, error: profileError } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("user_id", userData.user.id)
            .single();

          if (profileError && profileError.code !== "PGRST116") {
            console.error("Error fetching tax info:", profileError);
          }

          if (profileData) {
            setTaxStatus(profileData.tax_status || "");
            setTaxReference(profileData.tax_reference_number || "");
            setUtr(profileData.utr || "");
            setMtdStatus(profileData.mtd_status || "");
            setIsUKTaxResident(profileData.is_uk_tax_resident !== false);
            setIsNonResidentScheme(profileData.is_non_resident_scheme || false);
            setAccountingPeriod(profileData.accounting_period || "");
          }
        } else {
          router.push("/sign-up");
        }
        setProfileLoaded(true);
      } catch (error) {
        console.error("Error in getUserAndProfile:", error);
        router.push("/sign-up");
      }
    }
    getUserAndProfile();
  }, [router, supabase.auth]);

  // Update tax reference label when tax status changes
  useEffect(() => {
    switch (taxStatus) {
      case "individual":
        setTaxReferenceLabel("National Insurance Number");
        break;
      case "partnership":
        setTaxReferenceLabel("Partnership Tax Reference");
        break;
      case "limited-company":
        setTaxReferenceLabel("Company Tax Reference");
        break;
      default:
        setTaxReferenceLabel("Tax Reference Number");
    }
  }, [taxStatus]);

  // Validate UTR (Unique Taxpayer Reference)
  const validateUTR = (utr: string) => {
    // UK UTR is typically a 10-digit number
    return /^[0-9]{10}$/.test(utr);
  };

  // Validate tax reference based on type
  const validateTaxReference = (reference: string) => {
    if (!reference) return true; // Optional field

    switch (taxStatus) {
      case "individual":
        // UK National Insurance number format: 2 letters, 6 numbers, 1 letter
        return /^[A-Z]{2}[0-9]{6}[A-Z]$/i.test(reference);
      case "partnership":
      case "limited-company":
        // Simple validation for tax references
        return reference.length >= 8;
      default:
        return true;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!taxStatus || !accountingPeriod || !mtdStatus) {
      setError("Please fill in all required fields");
      return;
    }

    if (utr && !validateUTR(utr)) {
      setError("Please enter a valid UTR (10 digits)");
      return;
    }

    if (taxReference && !validateTaxReference(taxReference)) {
      setError(`Please enter a valid ${taxReferenceLabel}`);
      return;
    }

    if (!userId) {
      setError("User authentication error. Please sign up again.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Save tax information to Supabase user_profiles table
      const { error: upsertError } = await supabase
        .from("user_profiles")
        .upsert({
          user_id: userId,
          tax_status: taxStatus,
          tax_reference_number: taxReference,
          utr: utr,
          mtd_status: mtdStatus,
          is_uk_tax_resident: isUKTaxResident,
          is_non_resident_scheme: isNonResidentScheme,
          accounting_period: accountingPeriod,
          updated_at: new Date().toISOString(),
        });

      if (upsertError) {
        throw new Error(
          `Failed to save tax information: ${upsertError.message}`,
        );
      }

      // Redirect to next step
      router.push("/onboarding/property/import-options");
    } catch (err) {
      console.error("Error saving tax information:", err);
      setError(
        err instanceof Error ? err.message : "Failed to save tax information",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle save as draft
  const handleSaveAsDraft = async () => {
    if (!userId) {
      setError("User authentication error. Please sign up again.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Save to Supabase
      const { error: upsertError } = await supabase
        .from("user_profiles")
        .upsert({
          user_id: userId,
          tax_status: taxStatus || null,
          tax_reference_number: taxReference || null,
          utr: utr || null,
          mtd_status: mtdStatus || null,
          is_uk_tax_resident: isUKTaxResident,
          is_non_resident_scheme: isNonResidentScheme,
          accounting_period: accountingPeriod || null,
          updated_at: new Date().toISOString(),
        });

      if (upsertError) {
        throw new Error(`Failed to save draft: ${upsertError.message}`);
      }

      // Navigate to next step
      router.push("/onboarding/property/import-options");
    } catch (error) {
      console.error("Error saving tax information draft data:", error);
      setError(error instanceof Error ? error.message : "Failed to save draft");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state if profile is not loaded yet
  if (!profileLoaded) {
    return (
      <SidebarLayout isOnboarding={true}>
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner label="Loading tax information..." />
        </div>
      </SidebarLayout>
    );
  }

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
                          <CheckIconSolid aria-hidden="true"
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
              Tax Information
            </h2>
            <p className="mt-1 text-sm/6 text-gray-600">
              Please provide your tax details to comply with UK regulatory
              requirements and prepare for Making Tax Digital.
            </p>
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
                {/* Tax Status and Reference */}
                <div className="border-b border-gray-900/10 pb-6">
                  <h2 className="text-base/7 title-font text-gray-900">
                    Tax Status
                  </h2>
                  <p className="mt-1 text-sm/6 text-gray-600">
                    Your tax classification and reference information.
                  </p>
                  <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor="tax-status"
                        className="block text-sm/6 font-medium text-gray-900"
                      >
                        Tax status *
                      </label>
                      <div className="mt-2">
                        <select id="tax-status"
                          name="tax-status"
                          required
                          value={taxStatus}
                          onChange={(e) => setTaxStatus(e.target.value)}
                          className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 border border-gray-300 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-d9e8ff sm:text-sm/6"
                        >
                          <option value="">Select tax status</option>
                          {taxStatusOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <div className="flex justify-between">
                        <label htmlFor="tax-reference"
                          className="block text-sm/6 font-medium text-gray-900"
                        >
                          {taxReferenceLabel}
                        </label>
                        <button type="button"
                          className="text-sm font-medium text-gray-900 hover:text-gray-700"
                          title="Help with tax reference"
                        >
                          <QuestionMarkCircleIcon className="inline-block size-4"
                            aria-hidden="true"
                          />
                          <span className="sr-only">
                            Help with tax reference
                          </span>
                        </button>
                      </div>
                      <div className="mt-2">
                        <input id="tax-reference"
                          name="tax-reference"
                          type="text"
                          value={taxReference}
                          onChange={(e) => setTaxReference(e.target.value)}
                          className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 border border-gray-300 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-d9e8ff sm:text-sm/6"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-6">
                      <div className="flex gap-3">
                        <div className="flex h-6 shrink-0 items-center">
                          <div className="group grid size-4 grid-cols-1">
                            <input id="uk-tax-resident"
                              name="uk-tax-resident"
                              type="checkbox"
                              checked={isUKTaxResident}
                              onChange={(e) =>
                                setIsUKTaxResident(e.target.checked)
                              }
                              aria-describedby="uk-tax-resident-description"
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
                          <label htmlFor="uk-tax-resident"
                            className="font-medium text-gray-900"
                          >
                            I confirm I am a UK tax resident
                          </label>
                          <p id="uk-tax-resident-description"
                            className="text-gray-500"
                          >
                            If you are not a UK tax resident, additional
                            information may be required.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Self-assessment and MTD */}
                <div className="border-b border-gray-900/10 pb-6">
                  <h2 className="text-base/7 title-font text-gray-900">
                    Self-assessment & Making Tax Digital
                  </h2>
                  <p className="mt-1 text-sm/6 text-gray-600">
                    Information about your self-assessment and Making Tax
                    Digital status.
                  </p>
                  <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <div className="flex justify-between">
                        <label htmlFor="utr"
                          className="block text-sm/6 font-medium text-gray-900"
                        >
                          UTR (Unique Taxpayer Reference)
                        </label>
                        <button type="button"
                          className="text-sm font-medium text-gray-900 hover:text-gray-700"
                          title="Help with UTR"
                        >
                          <QuestionMarkCircleIcon className="inline-block size-4"
                            aria-hidden="true"
                          />
                          <span className="sr-only">Help with UTR</span>
                        </button>
                      </div>
                      <div className="mt-2">
                        <input id="utr"
                          name="utr"
                          type="text"
                          value={utr}
                          onChange={(e) => setUtr(e.target.value)}
                          placeholder="10 digits e.g. 1234567890"
                          pattern="^[0-9]{10}$"
                          title="UTR must be 10 digits."
                          className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 border border-gray-300 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-d9e8ff sm:text-sm/6"
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Your 10-digit Unique Taxpayer Reference from HMRC
                      </p>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="mtd-status"
                        className="block text-sm/6 font-medium text-gray-900"
                      >
                        MTD enrollment status *
                      </label>
                      <div className="mt-2">
                        <select id="mtd-status"
                          name="mtd-status"
                          required
                          value={mtdStatus}
                          onChange={(e) => setMtdStatus(e.target.value)}
                          className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 border border-gray-300 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-d9e8ff sm:text-sm/6"
                        >
                          <option value="">Select MTD status</option>
                          {mtdStatusOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Making Tax Digital enrollment status with HMRC
                      </p>
                    </div>

                    {!isUKTaxResident && (
                      <div className="sm:col-span-6">
                        <div className="flex gap-3">
                          <div className="flex h-6 shrink-0 items-center">
                            <div className="group grid size-4 grid-cols-1">
                              <input id="non-resident-scheme"
                                name="non-resident-scheme"
                                type="checkbox"
                                checked={isNonResidentScheme}
                                onChange={(e) =>
                                  setIsNonResidentScheme(e.target.checked)
                                }
                                aria-describedby="non-resident-scheme-description"
                                className="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-d9e8ff checked:bg-d9e8ff indeterminate:border-d9e8ff indeterminate:bg-d9e8ff focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-d9e8ff disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
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
                            <label htmlFor="non-resident-scheme"
                              className="font-medium text-gray-900"
                            >
                              I am registered with the Non-resident Landlord
                              Scheme
                            </label>
                            <p id="non-resident-scheme-description"
                              className="text-gray-500"
                            >
                              For overseas landlords renting property in the UK
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Accounting Period */}
                <div>
                  <h2 className="text-base/7 title-font text-gray-900">
                    Accounting Period
                  </h2>
                  <p className="mt-1 text-sm/6 text-gray-600">
                    Select your preferred accounting period for tax reporting.
                  </p>
                  <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                    <div className="sm:col-span-4">
                      <label htmlFor="accounting-period"
                        className="block text-sm/6 font-medium text-gray-900"
                      >
                        Accounting period *
                      </label>
                      <div className="mt-2">
                        <select id="accounting-period"
                          name="accounting-period"
                          required
                          value={accountingPeriod}
                          onChange={(e) => setAccountingPeriod(e.target.value)}
                          className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 border border-gray-300 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-d9e8ff sm:text-sm/6"
                        >
                          <option value="">Select tax year</option>
                          {taxYearOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        UK tax years run from 6 April to 5 April the following
                        year
                      </p>
                    </div>
                  </div>
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
              <button type="button"
                onClick={handleSaveAsDraft}
                className="text-sm/6 font-semibold text-gray-900"
                disabled={isSubmitting}
              >
                Save as Draft
              </button>
              <button type="submit"
                className="rounded-md bg-d9e8ff px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs hover:bg-d9e8ff-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-d9e8ff disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Next"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </SidebarLayout>
  );
}
