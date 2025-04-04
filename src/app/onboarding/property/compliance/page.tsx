"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { SidebarLayout } from "../../../components/sidebar-layout";
import { SideboardOnboardingContent } from "../../../components/sideboard-onboarding-content";
import { CheckIcon as CheckIconSolid } from "@heroicons/react/24/solid";

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
    status: "current",
  },
  { id: "04", name: "Tenants", href: "#", status: "upcoming" },
  { id: "05", name: "Setup", href: "#", status: "upcoming" },
];

export default function PropertyCompliance() {
  const router = useRouter();

  // State for compliance data
  const [formData, setFormData] = useState({
    gasChecked: false,
    gasDate: "",
    gasExpiry: "",
    electricalChecked: false,
    electricalDate: "",
    electricalExpiry: "",
    epcChecked: false,
    epcDate: "",
    epcExpiry: "",
    fireChecked: false,
    fireDate: "",
    fireExpiry: "",
    legionellaChecked: false,
    legionellaDate: "",
    legionellaExpiry: "",
    asbestosChecked: false,
    asbestosDate: "",
    asbestosExpiry: "",
  });

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setFormData({
        ...formData,
        [name]: checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // In a real application, you would save the data here
    console.log("Form data submitted:", formData);

    // Navigate to the next step
    router.push("/onboarding/tenant/import-options");
  };

  // Handle save as draft
  const handleSaveAsDraft = () => {
    // Save to localStorage
    try {
      localStorage.setItem("propertyComplianceDraft", JSON.stringify(formData));
      // Navigate to next step
      router.push("/onboarding/tenant/import-options");
    } catch (error) {
      console.error("Error saving compliance draft data:", error);
      alert("Failed to save draft. Please try again.");
    }
  };

  return (
    <SidebarLayout sidebar={<SideboardOnboardingContent />} isOnboarding={true}>
      <div className="divide-y divide-gray-900/10">
        {/* Progress Bar */}
        <div className="py-0">
          <nav aria-label="Progress">
            <ol role="list"
              className="divide-y divide-gray-300 rounded-md border border-gray-300 md:flex md:divide-y-0"
            >
              {steps.map((step, stepIdx) => (
                <li key={step.name} className="relative md:flex md:flex-1">
                  {step.status === "complete" ? (
                    <a href={step.href}
                      className="group flex w-full items-center"
                    >
                      <span className="flex items-center px-6 py-4 text-sm font-medium">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#FF503E] group-hover:bg-[#e3402f]">
                          <CheckIconSolid aria-hidden="true"
                            className="size-6 text-white"
                          />
                        </span>
                        <span className="ml-4 text-sm font-medium text-gray-900">
                          {step.name}
                        </span>
                      </span>
                    </a>
                  ) : step.status === "current" ? (
                    <a href={step.href}
                      aria-current="step"
                      className="flex items-center px-6 py-4 text-sm font-medium"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-[#FF503E]">
                        <span className="text-[#FF503E]">{step.id}</span>
                      </span>
                      <span className="ml-4 text-sm font-medium text-[#FF503E]">
                        {step.name}
                      </span>
                    </a>
                  ) : (
                    <a href={step.href} className="group flex items-center">
                      <span className="flex items-center px-6 py-4 text-sm font-medium">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-gray-300 group-hover:border-gray-400">
                          <span className="text-gray-500 group-hover:text-gray-900">
                            {step.id}
                          </span>
                        </span>
                        <span className="ml-4 text-sm font-medium text-gray-500 group-hover:text-gray-900">
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

        <div className="grid grid-cols-1 gap-x-8 gap-y-8 py-8 md:grid-cols-3">
          <div className="px-4 sm:px-0">
            <h2 className="text-base/7 font-semibold text-gray-900">
              Property Compliance
            </h2>
            <p className="mt-1 text-sm/6 text-gray-600">
              Track compliance certificates and safety checks for your property.
            </p>
          </div>

          <form onSubmit={handleSubmit}
            className="bg-white border border-gray-300 ring-1 shadow-xs ring-gray-900/5 sm:rounded-xl md:col-span-2"
          >
            <div className="px-4 py-4 sm:p-6">
              <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8">
                {/* Gas Safety */}
                <div className="border-b border-gray-900/10 pb-6">
                  <div className="flex items-start">
                    <div className="flex h-6 items-center">
                      <input id="gasChecked"
                        name="gasChecked"
                        type="checkbox"
                        checked={formData.gasChecked}
                        onChange={handleInputChange}
                        className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-d9e8ff"
                      />
                    </div>
                    <div className="ml-3 text-sm leading-6">
                      <label htmlFor="gasChecked"
                        className="font-medium text-gray-900"
                      >
                        Gas Safety Certificate
                      </label>
                      <p className="text-gray-500">
                        Required annually for properties with gas appliances.
                      </p>
                    </div>
                  </div>

                  {formData.gasChecked && (
                    <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
                      <div className="sm:col-span-3">
                        <label htmlFor="gasDate"
                          className="block text-sm font-medium leading-6 text-gray-900"
                        >
                          Issue date
                        </label>
                        <div className="mt-2">
                          <input type="date"
                            name="gasDate"
                            id="gasDate"
                            value={formData.gasDate}
                            onChange={handleInputChange}
                            className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-d9e8ff focus:ring-d9e8ff sm:text-sm sm:leading-6"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor="gasExpiry"
                          className="block text-sm font-medium leading-6 text-gray-900"
                        >
                          Expiry date
                        </label>
                        <div className="mt-2">
                          <input type="date"
                            name="gasExpiry"
                            id="gasExpiry"
                            value={formData.gasExpiry}
                            onChange={handleInputChange}
                            className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-d9e8ff focus:ring-d9e8ff sm:text-sm sm:leading-6"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Electrical Safety */}
                <div className="border-b border-gray-900/10 pb-6">
                  <div className="flex items-start">
                    <div className="flex h-6 items-center">
                      <input id="electricalChecked"
                        name="electricalChecked"
                        type="checkbox"
                        checked={formData.electricalChecked}
                        onChange={handleInputChange}
                        className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-d9e8ff"
                      />
                    </div>
                    <div className="ml-3 text-sm leading-6">
                      <label htmlFor="electricalChecked"
                        className="font-medium text-gray-900"
                      >
                        Electrical Installation Condition Report (EICR)
                      </label>
                      <p className="text-gray-500">
                        Required every 5 years for rental properties.
                      </p>
                    </div>
                  </div>

                  {formData.electricalChecked && (
                    <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
                      <div className="sm:col-span-3">
                        <label htmlFor="electricalDate"
                          className="block text-sm font-medium leading-6 text-gray-900"
                        >
                          Issue date
                        </label>
                        <div className="mt-2">
                          <input type="date"
                            name="electricalDate"
                            id="electricalDate"
                            value={formData.electricalDate}
                            onChange={handleInputChange}
                            className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-d9e8ff focus:ring-d9e8ff sm:text-sm sm:leading-6"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor="electricalExpiry"
                          className="block text-sm font-medium leading-6 text-gray-900"
                        >
                          Expiry date
                        </label>
                        <div className="mt-2">
                          <input type="date"
                            name="electricalExpiry"
                            id="electricalExpiry"
                            value={formData.electricalExpiry}
                            onChange={handleInputChange}
                            className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-d9e8ff focus:ring-d9e8ff sm:text-sm sm:leading-6"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* EPC */}
                <div className="border-b border-gray-900/10 pb-6">
                  <div className="flex items-start">
                    <div className="flex h-6 items-center">
                      <input id="epcChecked"
                        name="epcChecked"
                        type="checkbox"
                        checked={formData.epcChecked}
                        onChange={handleInputChange}
                        className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-d9e8ff"
                      />
                    </div>
                    <div className="ml-3 text-sm leading-6">
                      <label htmlFor="epcChecked"
                        className="font-medium text-gray-900"
                      >
                        Energy Performance Certificate (EPC)
                      </label>
                      <p className="text-gray-500">
                        Required every 10 years for rental properties.
                      </p>
                    </div>
                  </div>

                  {formData.epcChecked && (
                    <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
                      <div className="sm:col-span-3">
                        <label htmlFor="epcDate"
                          className="block text-sm font-medium leading-6 text-gray-900"
                        >
                          Issue date
                        </label>
                        <div className="mt-2">
                          <input type="date"
                            name="epcDate"
                            id="epcDate"
                            value={formData.epcDate}
                            onChange={handleInputChange}
                            className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-d9e8ff focus:ring-d9e8ff sm:text-sm sm:leading-6"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor="epcExpiry"
                          className="block text-sm font-medium leading-6 text-gray-900"
                        >
                          Expiry date
                        </label>
                        <div className="mt-2">
                          <input type="date"
                            name="epcExpiry"
                            id="epcExpiry"
                            value={formData.epcExpiry}
                            onChange={handleInputChange}
                            className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-d9e8ff focus:ring-d9e8ff sm:text-sm sm:leading-6"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-6">
              <button type="button"
                onClick={handleSaveAsDraft}
                className="text-sm/6 font-semibold text-gray-900 hover:text-gray-700"
              >
                Save as Draft
              </button>
              <button type="button"
                onClick={() => router.back()}
                className="text-sm/6 font-semibold text-gray-900"
              >
                Back
              </button>
              <button type="submit"
                className="rounded-md bg-d9e8ff px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-d9e8ff-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-d9e8ff"
              >
                Complete Property Setup
              </button>
            </div>
          </form>
        </div>
      </div>
    </SidebarLayout>
  );
}
