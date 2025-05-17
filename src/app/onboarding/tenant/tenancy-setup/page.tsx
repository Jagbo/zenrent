"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SidebarLayout } from "../../../components/sidebar-layout";
import { SideboardOnboardingContent } from "../../../components/sideboard-onboarding-content";
import { CheckIcon as CheckIconSolid } from "@heroicons/react/24/solid";
import { PlusIcon } from "@heroicons/react/24/outline";
import { createClient } from "@supabase/supabase-js";

// Create a Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

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
    status: "complete",
  },
  {
    id: "03",
    name: "Property",
    href: "/onboarding/property/import-options",
    status: "complete",
  },
  {
    id: "04",
    name: "Tenants",
    href: "/onboarding/tenant/import-options",
    status: "current",
  },
  { id: "05", name: "Setup", href: "#", status: "upcoming" },
];

export default function TenancySetup() {
  const router = useRouter();

  // State for loading and errors
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [propertyId, setPropertyId] = useState<string | null>(null);

  // Property data from localStorage
  const [propertyData, setPropertyData] = useState({
    address: "",
    propertyType: "",
    bedrooms: "",
    isHmo: false,
  });

  // State for tenants
  const [tenants, setTenants] = useState([
    {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      email: "",
      roomNumber: "1", // Only relevant for HMO
      // Individual tenant/room information for HMOs
      // Tenancy Type
      agreementType: "",
      tenancyTerm: "",
      // Tenancy Dates
      startDate: "",
      endDate: "",
      hasBreakClause: false,
      breakClauseDetails: "",
      // Rent Schedule
      rentAmount: "",
      rentFrequency: "monthly",
      rentDueDay: "",
      paymentMethod: "",
      // Deposit Information
      depositAmount: "",
      depositScheme: "",
      depositRegistrationDate: "",
      depositRegistrationRef: "",
    },
  ]);

  // State for form data
  const [formData, setFormData] = useState({
    // Tenancy Type
    agreementType: "",
    tenancyTerm: "",

    // Tenancy Dates
    startDate: "",
    endDate: "",
    hasBreakClause: false,
    breakClauseDetails: "",

    // Rent Schedule
    rentAmount: "1200.00", // Pre-filled from property
    rentDueDay: "",
    paymentMethod: "",
    rentFrequency: "monthly", // Pre-filled

    // Deposit Information
    depositAmount: "1200.00", // Pre-filled (usually 1 month's rent)
    depositScheme: "",
    depositRegistrationDate: "",
    depositRegistrationRef: "",
  });

  // Fetch the current user and property when component mounts
  useEffect(() => {
    const fetchUserAndProperty = async () => {
      try {
        // In development mode, set a fixed userId for testing
        if (process.env.NODE_ENV === "development") {
          const devUserId =
            localStorage.getItem("devUserId") ||
            "00000000-0000-0000-0000-000000000000";
          setUserId(devUserId);
          localStorage.setItem("devUserId", devUserId);
        } else {
          // In production, get the actual user
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();

          if (userError) {
            throw userError;
          }

          if (user) {
            setUserId(user.id);
          } else {
            // If no user is found, redirect to login
            router.push("/login");
            return;
          }
        }

        // Load property data from localStorage
        try {
          const savedProperty = localStorage.getItem("propertyData");
          console.log("Raw saved property data:", savedProperty);

          // Also check saved properties
          const savedPropertiesString = localStorage.getItem("savedProperties");
          console.log("Saved properties:", savedPropertiesString);

          if (savedProperty) {
            const parsedData = JSON.parse(savedProperty);
            console.log("Parsed property data:", parsedData);
            console.log("Property type:", parsedData.propertyType);
            console.log("Is HMO flag:", parsedData.isHmo);

            setPropertyData({
              address: parsedData.address || "",
              propertyType: parsedData.propertyType || "",
              bedrooms: parsedData.bedrooms || "",
              isHmo: parsedData.isHmo || parsedData.propertyType === "hmo", // Also check property type as a fallback
            });

            // If HMO, create tenant entries for each bedroom
            if (
              (parsedData.isHmo || parsedData.propertyType === "hmo") &&
              parsedData.bedrooms
            ) {
              console.log(
                "Setting up HMO tenants for",
                parsedData.bedrooms,
                "bedrooms",
              );
              const bedroomCount = parseInt(parsedData.bedrooms);
              if (!isNaN(bedroomCount) && bedroomCount > 0) {
                setTenants(
                  Array.from({ length: bedroomCount }, (_, i) => ({
                    firstName: "",
                    lastName: "",
                    phoneNumber: "",
                    email: "",
                    roomNumber: (i + 1).toString(),
                    // Tenancy Type
                    agreementType: "",
                    tenancyTerm: "",
                    // Tenancy Dates
                    startDate: "",
                    endDate: "",
                    hasBreakClause: false,
                    breakClauseDetails: "",
                    // Rent Schedule
                    rentAmount: "",
                    rentFrequency: "monthly",
                    rentDueDay: "",
                    paymentMethod: "",
                    // Deposit Information
                    depositAmount: "",
                    depositScheme: "",
                    depositRegistrationDate: "",
                    depositRegistrationRef: "",
                  })),
                );
              }
            }

            // If we have property UUID in the data, save it
            if (parsedData.id) {
              setPropertyId(parsedData.id);
            }
          }
        } catch (error) {
          console.error("Error loading property data:", error);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        setError("Failed to authenticate user. Please try again.");
      }
    };

    fetchUserAndProperty();
  }, [router]);

  // Handle input changes for tenancy form
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    if (type === "checkbox") {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Handle input changes for tenant details
  const handleTenantChange = (
    index: number,
    field: string,
    value: string | boolean,
  ) => {
    const updatedTenants = [...tenants];
    updatedTenants[index] = {
      ...updatedTenants[index],
      [field]: value,
    };
    setTenants(updatedTenants);
  };

  // Add a new tenant (for non-HMO properties)
  const handleAddTenant = () => {
    if (!propertyData.isHmo) {
      setTenants([
        ...tenants,
        {
          firstName: "",
          lastName: "",
          phoneNumber: "",
          email: "",
          roomNumber: "",
          // Tenancy Type
          agreementType: "",
          tenancyTerm: "",
          // Tenancy Dates
          startDate: "",
          endDate: "",
          hasBreakClause: false,
          breakClauseDetails: "",
          // Rent Schedule
          rentAmount: "",
          rentFrequency: "monthly",
          rentDueDay: "",
          paymentMethod: "",
          // Deposit Information
          depositAmount: "",
          depositScheme: "",
          depositRegistrationDate: "",
          depositRegistrationRef: "",
        },
      ]);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Make sure we have a user ID
      if (!userId) {
        throw new Error("User not authenticated. Please log in and try again.");
      }

      // Make sure we have a property to link to
      if (!propertyId) {
        throw new Error(
          "Property information is missing. Please start from the property step.",
        );
      }

      // For HMO properties, all fields are at the tenant level
      if (propertyData.isHmo) {
        // Validate all tenant/room specific information for HMO
        const hasMissingTenantInfo = tenants.some((tenant) => {
          const basicFieldsMissing =
            !tenant.firstName || !tenant.lastName || !tenant.email;
          const tenancyTypeFieldsMissing =
            !tenant.agreementType || !tenant.tenancyTerm;
          const tenancyDatesMissing = !tenant.startDate;
          const rentFieldsMissing =
            !tenant.rentAmount || !tenant.rentDueDay || !tenant.rentFrequency;

          return (
            basicFieldsMissing ||
            tenancyTypeFieldsMissing ||
            tenancyDatesMissing ||
            rentFieldsMissing
          );
        });

        if (hasMissingTenantInfo) {
          throw new Error(
            "Please fill in all required tenant and room information for each room",
          );
        }
      } else {
        // For non-HMO properties, validate property level fields
        if (
          !formData.agreementType ||
          !formData.tenancyTerm ||
          !formData.startDate ||
          !formData.rentAmount ||
          !formData.rentFrequency ||
          !formData.rentDueDay
        ) {
          throw new Error("Please fill in all required fields");
        }

        // Validate tenant basic information for non-HMO
        const hasMissingTenantInfo = tenants.some((tenant) => {
          return !tenant.firstName || !tenant.lastName || !tenant.email;
        });

        if (hasMissingTenantInfo) {
          throw new Error("Please fill in all tenant information");
        }
      }

      // Save to Supabase
      const tenancySuccess = [];

      // Process each tenant
      for (const tenant of tenants) {
        // 1. Create the tenant record
        const { data: tenantData, error: tenantError } = await supabase
          .from("tenants")
          .insert({
            user_id: userId,
            name: `${tenant.firstName} ${tenant.lastName}`,
            email: tenant.email,
            phone: tenant.phoneNumber,
            status: "active",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (tenantError) {
          throw new Error(`Failed to create tenant: ${tenantError.message}`);
        }

        const tenantId = tenantData.id;

        // 2. Create the lease record
        if (propertyData.isHmo) {
          // For HMO: Each tenant has their own lease details
          const { error: leaseError } = await supabase.from("leases").insert({
            tenant_id: tenantId,
            property_uuid: propertyId,
            start_date: tenant.startDate,
            end_date: tenant.endDate || null,
            rent_amount: parseFloat(tenant.rentAmount) || 0,
            rent_frequency: tenant.rentFrequency,
            rent_due_day: parseInt(tenant.rentDueDay) || 1,
            payment_method: tenant.paymentMethod || null,
            deposit_amount: parseFloat(tenant.depositAmount) || null,
            deposit_protection_scheme: tenant.depositScheme || null,
            deposit_protection_id: tenant.depositRegistrationRef || null,
            deposit_protected_on: tenant.depositRegistrationDate || null,
            status: "active",
            has_break_clause: tenant.hasBreakClause,
            break_clause_notice_period: tenant.breakClauseDetails ? 2 : null, // Default to 2 months if there's any break clause
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          if (leaseError) {
            throw new Error(
              `Failed to create lease for HMO tenant: ${leaseError.message}`,
            );
          }
        } else {
          // For non-HMO: One lease but many tenants
          const { error: leaseError } = await supabase.from("leases").insert({
            tenant_id: tenantId,
            property_uuid: propertyId,
            start_date: formData.startDate,
            end_date: formData.endDate || null,
            rent_amount: parseFloat(formData.rentAmount) || 0,
            rent_frequency: formData.rentFrequency,
            rent_due_day: parseInt(formData.rentDueDay) || 1,
            payment_method: formData.paymentMethod || null,
            deposit_amount: parseFloat(formData.depositAmount) || null,
            deposit_protection_scheme: formData.depositScheme || null,
            deposit_protection_id: formData.depositRegistrationRef || null,
            deposit_protected_on: formData.depositRegistrationDate || null,
            status: "active",
            has_break_clause: formData.hasBreakClause,
            break_clause_notice_period: formData.breakClauseDetails ? 2 : null, // Default to 2 months if there's any break clause
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          if (leaseError) {
            throw new Error(
              `Failed to create lease for tenant: ${leaseError.message}`,
            );
          }
        }

        tenancySuccess.push(tenantId);
      }

      // Save tenancy completion to user profile
      const { error: profileError } = await supabase
        .from("user_profiles")
        .upsert({
          user_id: userId,
          tenancy_setup_completed: true,
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error("Error updating user profile:", profileError);
        // Continue anyway as this is not critical
      }

      // Save to localStorage for reference
      const completeData = {
        property: propertyData,
        tenancy: propertyData.isHmo ? null : formData,
        tenants: tenants,
      };
      localStorage.setItem("tenancyData", JSON.stringify(completeData));

      // Navigate to the next step
      router.push("/onboarding/tenant/confirmation");
    } catch (error) {
      console.error("Error saving tenancy data:", error);
      setError(
        error instanceof Error ? error.message : "An unknown error occurred",
      );
      setIsSubmitting(false);
    }
  };

  // Handle save as draft
  const handleSaveAsDraft = async () => {
    // Save to localStorage and Supabase
    try {
      setIsSubmitting(true);
      setError(null);

      // Make sure we have a user ID
      if (!userId) {
        throw new Error("User not authenticated. Please log in and try again.");
      }

      const draftData = {
        property: propertyData,
        tenancy: formData,
        tenants: tenants,
      };

      localStorage.setItem("tenancyDataDraft", JSON.stringify(draftData));

      // Save draft status to Supabase
      const { error: profileError } = await supabase
        .from("user_profiles")
        .upsert({
          user_id: userId,
          tenancy_setup_draft: true,
          tenancy_setup_draft_data: draftData,
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        throw new Error(`Failed to save draft: ${profileError.message}`);
      }

      // Navigate to next step
      router.push("/onboarding/tenant/confirmation");
    } catch (error) {
      console.error("Error saving tenancy draft data:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to save draft. Please try again.",
      );
      setIsSubmitting(false);
    }
  };

  return (
    <SidebarLayout sidebar={<SideboardOnboardingContent />} isOnboarding={true}>
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
                        <span className="flex size-8 sm:size-10 shrink-0 items-center justify-center rounded-full bg-[#D9E8FF] group-hover:bg-[#D9E8FF]/80">
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
                        <span className="flex size-8 sm:size-10 shrink-0 items-center justify-center rounded-full border-2 border-[#D9E8FF]">
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
              Tenancy Setup
            </h2>
            <p className="mt-1 text-sm/6 text-gray-600">
              Configure the tenancy details for your property.
            </p>

            {/* Display error if any */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit}
            className="bg-white border border-gray-300 ring-1 shadow-xs ring-gray-900/5 sm:rounded-xl md:col-span-2"
          >
            {/* Property Address Display */}
            {propertyData.address && (
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-5 sm:rounded-t-xl sm:px-6">
                <div className="flex justify-between">
                  <h3 className="text-base font-semibold leading-7 text-gray-900">
                    {propertyData.address}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {propertyData.propertyType} • {propertyData.bedrooms}{" "}
                    {parseInt(propertyData.bedrooms) > 1
                      ? "Bedrooms"
                      : "Bedroom"}
                    {propertyData.isHmo ? " • HMO" : ""}
                  </p>
                </div>
              </div>
            )}

            <div className="px-4 py-4 sm:p-6">
              <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8">
                {/* Tenancy Dates - Only show full property tenancy dates for non-HMO properties */}
                {propertyData.isHmo ? (
                  <div className="border-b border-gray-900/10 pb-6">
                    <h2 className="text-base/7 title-font text-gray-900">
                      HMO Property
                    </h2>
                    <p className="mt-1 text-sm/6 text-gray-600">
                      For HMO properties, each room has its own tenancy
                      agreement and tenant information.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Tenancy Type */}
                    <div className="border-b border-gray-900/10 pb-6">
                      <h2 className="text-base/7 title-font text-gray-900">
                        Tenancy Type
                      </h2>
                      <p className="mt-1 text-sm/6 text-gray-600">
                        Specify the type and term of the tenancy agreement.
                      </p>

                      <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
                        <div className="sm:col-span-3">
                          <label htmlFor="agreementType"
                            className="block text-sm font-medium leading-6 text-gray-900"
                          >
                            Agreement type{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <div className="mt-2">
                            <select id="agreementType"
                              name="agreementType"
                              required
                              value={formData.agreementType}
                              onChange={handleInputChange}
                              className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                            >
                              <option value="">Select agreement type</option>
                              <option value="ast">
                                Assured Shorthold Tenancy (AST)
                              </option>
                              <option value="non-ast">Non-AST</option>
                              <option value="company-let">Company Let</option>
                              <option value="student">Student</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                        </div>

                        <div className="sm:col-span-3">
                          <label htmlFor="tenancyTerm"
                            className="block text-sm font-medium leading-6 text-gray-900"
                          >
                            Tenancy term <span className="text-red-500">*</span>
                          </label>
                          <div className="mt-2">
                            <select id="tenancyTerm"
                              name="tenancyTerm"
                              required
                              value={formData.tenancyTerm}
                              onChange={handleInputChange}
                              className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                            >
                              <option value="">Select tenancy term</option>
                              <option value="fixed">Fixed Term</option>
                              <option value="periodic">Periodic</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tenancy Dates */}
                    <div className="border-b border-gray-900/10 pb-6">
                      <h2 className="text-base/7 title-font text-gray-900">
                        Tenancy Dates
                      </h2>
                      <p className="mt-1 text-sm/6 text-gray-600">
                        Specify the start and end dates of the tenancy.
                      </p>

                      <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
                        <div className="sm:col-span-3">
                          <label htmlFor="startDate"
                            className="block text-sm font-medium leading-6 text-gray-900"
                          >
                            Start date <span className="text-red-500">*</span>
                          </label>
                          <div className="mt-2">
                            <input type="date"
                              name="startDate"
                              id="startDate"
                              required
                              value={formData.startDate}
                              onChange={handleInputChange}
                              className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                            />
                          </div>
                        </div>

                        {formData.tenancyTerm === "fixed" && (
                          <div className="sm:col-span-3">
                            <label htmlFor="endDate"
                              className="block text-sm font-medium leading-6 text-gray-900"
                            >
                              End date
                            </label>
                            <div className="mt-2">
                              <input type="date"
                                name="endDate"
                                id="endDate"
                                value={formData.endDate}
                                onChange={handleInputChange}
                                className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                              />
                            </div>
                          </div>
                        )}

                        <div className="sm:col-span-6">
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center">
                              <input id="hasBreakClause"
                                name="hasBreakClause"
                                type="checkbox"
                                checked={formData.hasBreakClause}
                                onChange={handleInputChange}
                                className="size-4 text-gray-900 focus:ring-[#D9E8FF]"
                              />
                              <label htmlFor="hasBreakClause"
                                className="ml-2 text-sm font-medium text-gray-900"
                              >
                                Break clause
                              </label>
                            </div>

                            {formData.hasBreakClause && (
                              <div className="ml-6">
                                <label htmlFor="breakClauseDetails"
                                  className="block text-sm font-medium leading-6 text-gray-700"
                                >
                                  Break clause details
                                </label>
                                <div className="mt-1">
                                  <textarea id="breakClauseDetails"
                                    name="breakClauseDetails"
                                    rows={3}
                                    value={formData.breakClauseDetails}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                                    placeholder="e.g. After 6 months with 2 months notice"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Rent Schedule */}
                    <div className="border-b border-gray-900/10 pb-6">
                      <h2 className="text-base/7 title-font text-gray-900">
                        Rent Schedule
                      </h2>
                      <p className="mt-1 text-sm/6 text-gray-600">
                        Specify the rent amount, frequency and payment details.
                      </p>

                      <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
                        <div className="sm:col-span-3">
                          <label htmlFor="rentAmount"
                            className="block text-sm font-medium leading-6 text-gray-900"
                          >
                            Rent amount <span className="text-red-500">*</span>
                          </label>
                          <div className="mt-2 relative rounded-md shadow-sm">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                              <span className="text-gray-500 sm:text-sm">
                                £
                              </span>
                            </div>
                            <input type="text"
                              name="rentAmount"
                              id="rentAmount"
                              required
                              value={formData.rentAmount}
                              onChange={handleInputChange}
                              className="block w-full rounded-md border border-gray-300 py-1.5 pl-7 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                              placeholder="0.00"
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-3">
                          <label htmlFor="rentFrequency"
                            className="block text-sm font-medium leading-6 text-gray-900"
                          >
                            Frequency <span className="text-red-500">*</span>
                          </label>
                          <div className="mt-2">
                            <select id="rentFrequency"
                              name="rentFrequency"
                              required
                              value={formData.rentFrequency}
                              onChange={handleInputChange}
                              className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                            >
                              <option value="weekly">Weekly</option>
                              <option value="monthly">Monthly</option>
                              <option value="quarterly">Quarterly</option>
                              <option value="annually">Annually</option>
                            </select>
                          </div>
                        </div>

                        <div className="sm:col-span-3">
                          <label htmlFor="rentDueDay"
                            className="block text-sm font-medium leading-6 text-gray-900"
                          >
                            Due on day <span className="text-red-500">*</span>
                          </label>
                          <div className="mt-2">
                            <input type="number"
                              name="rentDueDay"
                              id="rentDueDay"
                              required
                              min="1"
                              max="31"
                              value={formData.rentDueDay}
                              onChange={handleInputChange}
                              className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                              placeholder="1"
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-3">
                          <label htmlFor="paymentMethod"
                            className="block text-sm font-medium leading-6 text-gray-900"
                          >
                            Payment method
                          </label>
                          <div className="mt-2">
                            <select id="paymentMethod"
                              name="paymentMethod"
                              value={formData.paymentMethod}
                              onChange={handleInputChange}
                              className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                            >
                              <option value="">Select payment method</option>
                              <option value="bank-transfer">
                                Bank Transfer
                              </option>
                              <option value="standing-order">
                                Standing Order
                              </option>
                              <option value="direct-debit">Direct Debit</option>
                              <option value="cash">Cash</option>
                              <option value="check">Check</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Deposit Information */}
                    <div className="border-b border-gray-900/10 pb-6">
                      <h2 className="text-base/7 title-font text-gray-900">
                        Deposit Information
                      </h2>
                      <p className="mt-1 text-sm/6 text-gray-600">
                        Provide details about the security deposit if
                        applicable.
                      </p>

                      <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
                        <div className="sm:col-span-3">
                          <label htmlFor="depositAmount"
                            className="block text-sm font-medium leading-6 text-gray-900"
                          >
                            Deposit amount
                          </label>
                          <div className="mt-2 relative rounded-md shadow-sm">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                              <span className="text-gray-500 sm:text-sm">
                                £
                              </span>
                            </div>
                            <input type="text"
                              name="depositAmount"
                              id="depositAmount"
                              value={formData.depositAmount}
                              onChange={handleInputChange}
                              className="block w-full rounded-md border border-gray-300 py-1.5 pl-7 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                              placeholder="0.00"
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-3">
                          <label htmlFor="depositScheme"
                            className="block text-sm font-medium leading-6 text-gray-900"
                          >
                            Deposit scheme
                          </label>
                          <div className="mt-2">
                            <select id="depositScheme"
                              name="depositScheme"
                              value={formData.depositScheme}
                              onChange={handleInputChange}
                              className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                            >
                              <option value="">Select deposit scheme</option>
                              <option value="deposit-protection-service">
                                Deposit Protection Service (DPS)
                              </option>
                              <option value="my-deposits">My Deposits</option>
                              <option value="tenancy-deposit-scheme">
                                Tenancy Deposit Scheme (TDS)
                              </option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                        </div>

                        <div className="sm:col-span-3">
                          <label htmlFor="depositRegistrationDate"
                            className="block text-sm font-medium leading-6 text-gray-900"
                          >
                            Registration date
                          </label>
                          <div className="mt-2">
                            <input type="date"
                              name="depositRegistrationDate"
                              id="depositRegistrationDate"
                              value={formData.depositRegistrationDate}
                              onChange={handleInputChange}
                              className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-3">
                          <label htmlFor="depositRegistrationRef"
                            className="block text-sm font-medium leading-6 text-gray-900"
                          >
                            Registration reference
                          </label>
                          <div className="mt-2">
                            <input type="text"
                              name="depositRegistrationRef"
                              id="depositRegistrationRef"
                              value={formData.depositRegistrationRef}
                              onChange={handleInputChange}
                              className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                              placeholder="Enter reference number"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Tenants */}
                <div>
                  <h2 className="text-base/7 title-font text-gray-900">
                    Tenant Information
                  </h2>
                  <p className="mt-1 text-sm/6 text-gray-600">
                    Enter details for each tenant occupying the property.
                  </p>

                  {tenants.map((tenant, index) => (
                    <div key={index}
                      className="mt-6 border border-gray-200 rounded-md p-4"
                    >
                      <h3 className="text-sm/6 title-font text-gray-900 mb-4">
                        {propertyData.isHmo
                          ? `Room ${tenant.roomNumber} Tenant`
                          : `Tenant ${index + 1}`}
                      </h3>

                      {/* Tenant Basic Information */}
                      <div className="mt-2 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
                        <div className="sm:col-span-3">
                          <label htmlFor={`firstName-${index}`}
                            className="block text-sm font-medium leading-6 text-gray-900"
                          >
                            First name <span className="text-red-500">*</span>
                          </label>
                          <div className="mt-2">
                            <input type="text"
                              id={`firstName-${index}`}
                              required
                              value={tenant.firstName}
                              onChange={(e) =>
                                handleTenantChange(
                                  index,
                                  "firstName",
                                  e.target.value,
                                )
                              }
                              className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-3">
                          <label htmlFor={`lastName-${index}`}
                            className="block text-sm font-medium leading-6 text-gray-900"
                          >
                            Last name <span className="text-red-500">*</span>
                          </label>
                          <div className="mt-2">
                            <input type="text"
                              id={`lastName-${index}`}
                              required
                              value={tenant.lastName}
                              onChange={(e) =>
                                handleTenantChange(
                                  index,
                                  "lastName",
                                  e.target.value,
                                )
                              }
                              className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-3">
                          <label htmlFor={`email-${index}`}
                            className="block text-sm font-medium leading-6 text-gray-900"
                          >
                            Email <span className="text-red-500">*</span>
                          </label>
                          <div className="mt-2">
                            <input type="email"
                              id={`email-${index}`}
                              required
                              value={tenant.email}
                              onChange={(e) =>
                                handleTenantChange(
                                  index,
                                  "email",
                                  e.target.value,
                                )
                              }
                              className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-3">
                          <label htmlFor={`phoneNumber-${index}`}
                            className="block text-sm font-medium leading-6 text-gray-900"
                          >
                            Phone number
                          </label>
                          <div className="mt-2">
                            <input type="tel"
                              id={`phoneNumber-${index}`}
                              value={tenant.phoneNumber}
                              onChange={(e) =>
                                handleTenantChange(
                                  index,
                                  "phoneNumber",
                                  e.target.value,
                                )
                              }
                              className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                            />
                          </div>
                        </div>
                      </div>

                      {/* For HMO properties, show individual tenancy information for each room */}
                      {propertyData.isHmo && (
                        <>
                          {/* Tenancy Type for HMO room */}
                          <div className="sm:col-span-6 border-b border-gray-200 pt-4 pb-4 mb-2">
                            <h4 className="text-sm font-medium leading-6 text-gray-900 mb-3">
                              Room Tenancy Type
                            </h4>

                            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
                              <div className="sm:col-span-3">
                                <label htmlFor={`agreementType-${index}`}
                                  className="block text-sm font-medium leading-6 text-gray-900"
                                >
                                  Agreement type{" "}
                                  <span className="text-red-500">*</span>
                                </label>
                                <div className="mt-2">
                                  <select id={`agreementType-${index}`}
                                    required
                                    value={tenant.agreementType}
                                    onChange={(e) =>
                                      handleTenantChange(
                                        index,
                                        "agreementType",
                                        e.target.value,
                                      )
                                    }
                                    className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                                  >
                                    <option value="">
                                      Select agreement type
                                    </option>
                                    <option value="ast">
                                      Assured Shorthold Tenancy (AST)
                                    </option>
                                    <option value="non-ast">Non-AST</option>
                                    <option value="company-let">
                                      Company Let
                                    </option>
                                    <option value="student">Student</option>
                                    <option value="other">Other</option>
                                  </select>
                                </div>
                              </div>

                              <div className="sm:col-span-3">
                                <label htmlFor={`tenancyTerm-${index}`}
                                  className="block text-sm font-medium leading-6 text-gray-900"
                                >
                                  Tenancy term{" "}
                                  <span className="text-red-500">*</span>
                                </label>
                                <div className="mt-2">
                                  <select id={`tenancyTerm-${index}`}
                                    required
                                    value={tenant.tenancyTerm}
                                    onChange={(e) =>
                                      handleTenantChange(
                                        index,
                                        "tenancyTerm",
                                        e.target.value,
                                      )
                                    }
                                    className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                                  >
                                    <option value="">
                                      Select tenancy term
                                    </option>
                                    <option value="fixed">Fixed Term</option>
                                    <option value="periodic">Periodic</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}

                  {/* Add tenant button (only visible for non-HMO properties) */}
                  {!propertyData.isHmo && (
                    <div className="mt-4">
                      <button type="button"
                        onClick={handleAddTenant}
                        className="flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-[#D9E8FF]/50 hover:bg-[#D9E8FF]/5"
                      >
                        <PlusIcon className="mr-1 size-5" aria-hidden="true" />
                        Add another tenant
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="py-4 px-4 sm:px-6 flex items-center justify-between gap-x-6 border-t border-gray-900/10">
              <button type="button"
                onClick={handleSaveAsDraft}
                disabled={isSubmitting}
                className="text-sm font-semibold leading-6 text-gray-900 disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save as draft"}
              </button>
              <button type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-[#D9E8FF] px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-[#D9E8FF]/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9E8FF] disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Continue"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </SidebarLayout>
  );
}
