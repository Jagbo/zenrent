"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SidebarLayout } from "../../../components/sidebar-layout";
import { SidebarContent } from "../../../components/sidebar-content";
import { Navbar, NavbarSection, NavbarItem, NavbarLabel } from "../../../components/navbar";
import { Button } from "../../../components/button";
import { Input } from "../../../components/input";
import { Select } from "../../../components/select";
import { AddressAutocomplete } from "../../../components/address-autocomplete";
import { supabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth-helpers";

// Tax wizard progress steps
const steps = [
  { id: "01", name: "Personal Details", href: "/financial/tax/personal-details", status: "current" },
  { id: "02", name: "Properties", href: "/financial/tax/properties", status: "upcoming" },
  { id: "03", name: "Transactions", href: "/financial/tax/transactions", status: "upcoming" },
  { id: "04", name: "Adjustments", href: "/financial/tax/adjustments", status: "upcoming" },
  { id: "05", name: "Summary", href: "/financial/tax/summary", status: "upcoming" },
  { id: "06", name: "Filing", href: "/financial/tax/filing", status: "upcoming" },
];

export default function PersonalDetailsForm() {
  const router = useRouter();
  const pathname = usePathname();
  
  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [utr, setUtr] = useState("");
  const [niNumber, setNiNumber] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [townCity, setTownCity] = useState("");
  const [county, setCounty] = useState("");
  const [postcode, setPostcode] = useState("");
  const [taxYear, setTaxYear] = useState("2024/2025");
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Get the current user and existing profile data on component mount
  useEffect(() => {
    async function loadProfile() {
      try {
        // Get the authenticated user
        const user = await getAuthUser();

        if (user) {
          // Set the user ID immediately when we have it
          setUserId(user.id);

          // Load existing user profile
          const { data: profileData, error: profileError } = await supabase
            .from("user_profiles")
            .select("*, utr, national_insurance_number")
            .eq("user_id", user.id)
            .single();

          if (profileError && profileError.code !== "PGRST116") {
            console.error("Error fetching profile:", profileError);
            setError(`Error loading profile: ${profileError.message}`);
          }

          if (profileData) {
            setFirstName(profileData.first_name || "");
            setLastName(profileData.last_name || "");
            setAddressLine1(profileData.address_line1 || "");
            setAddressLine2(profileData.address_line2 || "");
            setTownCity(profileData.town_city || "");
            setCounty(profileData.county || "");
            setPostcode(profileData.postcode || "");
            setUtr(profileData.utr || "");
            setNiNumber(profileData.national_insurance_number || "");
          }

          // Load tax year from tax_profiles
          const { data: taxData, error: taxError } = await supabase
            .from("tax_profiles")
            .select("tax_year")
            .eq("user_id", user.id)
            .single();

          if (taxError && taxError.code !== "PGRST116") {
            console.error("Error fetching tax profile:", taxError);
          }

          if (taxData) {
            // If we have a tax profile, set the tax year
            if (taxData.tax_year) {
              setTaxYear(taxData.tax_year);
            }
          }
        }

        setProfileLoaded(true);
      } catch (error) {
        console.error("Error loading profile:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load profile data"
        );
        setProfileLoaded(true);
      }
    }

    loadProfile();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!firstName || !lastName || !utr || !addressLine1 || !townCity || !postcode) {
      setError("Please fill in all required fields");
      return;
    }

    // Validate UTR (should be 10 digits)
    if (!/^\d{10}$/.test(utr)) {
      setError("UTR must be exactly 10 digits");
      return;
    }

    // Validate NI number if provided
    if (niNumber && !/^[A-Z]{2}\d{6}[A-Z]$/.test(niNumber)) {
      setError("National Insurance number format should be like AB123456C");
      return;
    }

    // Get current authenticated user if userId isn't set
    if (!userId) {
      const user = await getAuthUser();
      if (!user) {
        setError("User authentication error. Please sign in again.");
        return;
      }
      setUserId(user.id);
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Update or insert the user profile first
      const { error: profileError } = await supabase
        .from("user_profiles")
        .upsert(
          {
            user_id: userId,
            first_name: firstName,
            last_name: lastName,
            address_line1: addressLine1,
            address_line2: addressLine2,
            town_city: townCity,
            county: county,
            postcode: postcode,
            utr: utr,
            national_insurance_number: niNumber,
            updated_at: new Date().toISOString(),
          },
          { 
            onConflict: 'user_id',
            ignoreDuplicates: false
          }
        );

      if (profileError) {
        throw new Error(`Failed to save profile: ${profileError.message}`);
      }

      // Then save tax-specific information
      console.log('[handleSubmit] Saving tax_year to tax_profiles:', taxYear);
      const { error: taxError } = await supabase
        .from("tax_profiles")
        .upsert(
          {
            user_id: userId,
            tax_year: taxYear,
            updated_at: new Date().toISOString(),
          },
          { 
            onConflict: 'user_id',
            ignoreDuplicates: false
          }
        );

      if (taxError) {
        throw new Error(`Failed to save tax information: ${taxError.message}`);
      }

      // Navigate to the next step
      router.push("/financial/tax/properties");
    } catch (err) {
      console.error("Error saving profile:", err);
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save as draft
  const handleSaveAsDraft = async () => {
    if (!userId) {
      setError("User authentication error. Please sign in again.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Only save what the user has entered so far
      if (firstName || lastName || addressLine1 || utr || niNumber) {
        const { error: profileError } = await supabase
          .from("user_profiles")
          .upsert(
            {
              user_id: userId,
              first_name: firstName,
              last_name: lastName,
              address_line1: addressLine1,
              address_line2: addressLine2,
              town_city: townCity,
              county: county,
              postcode: postcode,
              utr: utr,
              national_insurance_number: niNumber,
              updated_at: new Date().toISOString(),
            },
            { 
              onConflict: 'user_id',
              ignoreDuplicates: false
            }
          );

        if (profileError) {
          throw new Error(`Failed to save profile draft: ${profileError.message}`);
        }
      }

      // Save tax year information if tax year is set
      if (taxYear) {
        console.log('[handleSaveAsDraft] Saving tax_year to tax_profiles:', taxYear);
        const { error: taxError } = await supabase
          .from("tax_profiles")
          .upsert(
            {
              user_id: userId,
              tax_year: taxYear,
              updated_at: new Date().toISOString(),
            },
            { 
              onConflict: 'user_id',
              ignoreDuplicates: false
            }
          );

        if (taxError) {
          throw new Error(`Failed to save tax draft: ${taxError.message}`);
        }
      }

      router.push("/dashboard");
    } catch (error) {
      console.error("Error saving draft:", error);
      setError(error instanceof Error ? error.message : "Failed to save draft");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state if profile is not loaded yet
  if (!profileLoaded) {
    return (
      <SidebarLayout 
        sidebar={<SidebarContent currentPath={pathname} />} 
        isOnboarding={false}
        searchValue=""
      >
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Loading profile data...</p>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout 
      sidebar={<SidebarContent currentPath={pathname} />} 
      isOnboarding={false}
      searchValue=""
    >
      <div className="space-y-8">
        {/* Progress Bar */}
        <div className="py-0">
          <nav aria-label="Progress" className="overflow-x-auto">
            <ol role="list"
              className="divide-y divide-gray-300 rounded-md border border-gray-300 md:flex md:divide-y-0 bg-white min-w-full w-max md:w-full"
            >
              {steps.map((step, stepIdx) => (
                <li key={step.name} className="relative md:flex md:flex-1">
                  {step.status === "complete" ? (
                    <a href={step.href}
                      className="group flex w-full items-center"
                    >
                      <span className="flex items-center px-3 py-3 md:px-6 md:py-4 text-sm font-medium">
                        <span className="flex size-8 md:size-10 shrink-0 items-center justify-center rounded-full bg-[#D9E8FF] group-hover:bg-[#D9E8FF]/80">
                          <svg className="h-5 w-5 md:h-6 md:w-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                        <span className="ml-3 md:ml-4 text-xs md:text-sm font-cabinet-grotesk font-bold text-gray-900">
                          {step.name}
                        </span>
                      </span>
                    </a>
                  ) : step.status === "current" ? (
                    <a href={step.href}
                      aria-current="step"
                      className="flex items-center px-3 py-3 md:px-6 md:py-4 text-sm font-medium"
                    >
                      <span className="flex size-8 md:size-10 shrink-0 items-center justify-center rounded-full border-2 border-[#D9E8FF]">
                        <span className="text-xs md:text-sm text-gray-900">{step.id}</span>
                      </span>
                      <span className="ml-3 md:ml-4 text-xs md:text-sm font-cabinet-grotesk font-bold text-gray-900">
                        {step.name}
                      </span>
                    </a>
                  ) : (
                    <a href={step.href} className="group flex items-center">
                      <span className="flex items-center px-3 py-3 md:px-6 md:py-4 text-sm font-medium">
                        <span className="flex size-8 md:size-10 shrink-0 items-center justify-center rounded-full border-2 border-gray-300 group-hover:border-gray-400">
                          <span className="text-xs md:text-sm text-gray-500 group-hover:text-gray-900">
                            {step.id}
                          </span>
                        </span>
                        <span className="ml-3 md:ml-4 text-xs md:text-sm font-cabinet-grotesk font-bold text-gray-500 group-hover:text-gray-900">
                          {step.name}
                        </span>
                      </span>
                    </a>
                  )}

                  {stepIdx !== steps.length - 1 ? (
                    <>
                      {/* Arrow separator for lg screens and up */}
                      <div aria-hidden="true"
                        className="absolute top-0 right-0 hidden h-full w-5 md:block"
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

        <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3">
          <div className="px-4 sm:px-0">
            <h2 className="text-base/7 font-cabinet-grotesk font-bold text-gray-900">
              Your Details for Tax Filing
            </h2>
            <p className="mt-1 text-sm/6 text-gray-600">
              We need a few more details to complete your tax forms. This information is solely used for your Self Assessment return.
            </p>
          </div>

          <form 
            className="bg-white border border-gray-300 ring-1 shadow-xs ring-gray-900/5 sm:rounded-xl md:col-span-2"
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
                <div className="border-b border-gray-900/10 pb-6">
                  <h3 className="text-base/7 font-cabinet-grotesk font-bold text-gray-900">
                    Personal Information
                  </h3>
                  <p className="mt-1 text-sm/6 text-gray-600">
                    Your personal details for the tax return.
                  </p>
                  <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor="first-name"
                        className="block text-sm/6 font-medium text-gray-900"
                      >
                        First Name *
                      </label>
                      <div className="mt-2">
                        <Input 
                          id="first-name"
                          name="first-name"
                          type="text"
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="block w-full"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="last-name"
                        className="block text-sm/6 font-medium text-gray-900"
                      >
                        Last Name *
                      </label>
                      <div className="mt-2">
                        <Input 
                          id="last-name"
                          name="last-name"
                          type="text"
                          required
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="block w-full"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-4">
                      <label htmlFor="utr"
                        className="block text-sm/6 font-medium text-gray-900"
                      >
                        Self Assessment UTR (10-digit) *
                      </label>
                      <div className="mt-2">
                        <Input 
                          id="utr"
                          name="utr"
                          type="text"
                          required
                          value={utr}
                          onChange={(e) => setUtr(e.target.value)}
                          className="block w-full"
                          maxLength={10}
                        />
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        You can find this on any HMRC letter regarding your tax return.
                      </p>
                    </div>

                    <div className="sm:col-span-4">
                      <label htmlFor="ni-number"
                        className="block text-sm/6 font-medium text-gray-900"
                      >
                        National Insurance Number
                      </label>
                      <div className="mt-2">
                        <Input 
                          id="ni-number"
                          name="ni-number"
                          type="text"
                          value={niNumber}
                          onChange={(e) => setNiNumber(e.target.value)}
                          className="block w-full"
                        />
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Format: Two letters, six numbers, one letter (e.g. AB123456C).
                      </p>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="tax-year"
                        className="block text-sm/6 font-medium text-gray-900"
                      >
                        Tax Year to Prepare *
                      </label>
                      <div className="mt-2">
                        <Select
                          id="tax-year"
                          name="tax-year"
                          value={taxYear}
                          onChange={(e) => setTaxYear(e.target.value)}
                          className="block w-full"
                          required
                        >
                          <option value="2024/2025">2024/2025</option>
                          <option value="2023/2024">2023/2024</option>
                          <option value="2022/2023">2022/2023</option>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Address */}
                <div>
                  <h3 className="text-base/7 font-cabinet-grotesk font-bold text-gray-900">
                    Contact Address
                  </h3>
                  <p className="mt-1 text-sm/6 text-gray-600">
                    Your current contact address for HMRC correspondence.
                  </p>
                  <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                    <div className="sm:col-span-6">
                      <label htmlFor="address-line-1"
                        className="block text-sm/6 font-medium text-gray-900"
                      >
                        Address line 1 *
                      </label>
                      <div className="mt-2">
                        <AddressAutocomplete addressLine1={addressLine1}
                          onAddressSelect={(address) => {
                            setAddressLine1(address.addressLine1);
                            setAddressLine2(address.addressLine2);
                            setTownCity(address.townCity);
                            setCounty(address.county);
                            setPostcode(address.postcode);
                          }}
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-6">
                      <label htmlFor="address-line-2"
                        className="block text-sm/6 font-medium text-gray-900"
                      >
                        Address line 2 (optional)
                      </label>
                      <div className="mt-2">
                        <Input 
                          id="address-line-2"
                          name="address-line-2"
                          type="text"
                          value={addressLine2}
                          onChange={(e) => setAddressLine2(e.target.value)}
                          className="block w-full"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="town-city"
                        className="block text-sm/6 font-medium text-gray-900"
                      >
                        Town/City *
                      </label>
                      <div className="mt-2">
                        <Input 
                          id="town-city"
                          name="town-city"
                          type="text"
                          required
                          value={townCity}
                          onChange={(e) => setTownCity(e.target.value)}
                          className="block w-full"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="county"
                        className="block text-sm/6 font-medium text-gray-900"
                      >
                        County
                      </label>
                      <div className="mt-2">
                        <Input 
                          id="county"
                          name="county"
                          type="text"
                          value={county}
                          onChange={(e) => setCounty(e.target.value)}
                          className="block w-full"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="postcode"
                        className="block text-sm/6 font-medium text-gray-900"
                      >
                        Postcode *
                      </label>
                      <div className="mt-2">
                        <Input 
                          id="postcode"
                          name="postcode"
                          type="text"
                          required
                          value={postcode}
                          onChange={(e) => setPostcode(e.target.value)}
                          className="block w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-6">
              <button type="button"
                onClick={() => router.push("/financial/tax/company-or-personal")}
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
                {isSubmitting ? "Saving..." : "Continue"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </SidebarLayout>
  );
} 