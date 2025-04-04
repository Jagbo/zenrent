"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { SidebarLayout } from "../../../components/sidebar-layout";
import { SideboardOnboardingContent } from "../../../components/sideboard-onboarding-content";
import {
  ArrowUpTrayIcon,
  CheckIcon,
  DocumentArrowDownIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { CheckIcon as CheckIconSolid } from "@heroicons/react/24/solid";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import {
  downloadPropertyTemplate,
  parsePropertySpreadsheet,
  validatePropertyData,
  preparePropertyDataForSubmission,
} from "./property-template";

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

export default function PropertySpreadsheetImport() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Validate file type
      const validTypes = [
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/csv",
      ];
      if (!validTypes.includes(selectedFile.type)) {
        setUploadError("Please upload an Excel (.xls, .xlsx) or CSV file");
        setFile(null);
        return;
      }

      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setUploadError("File size should not exceed 5MB");
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setUploadError("");
    }
  };

  const processPropertyData = async (propertyData: unknown[]) => {
    try {
      const response = await fetch("/api/property-processor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          spreadsheetData: propertyData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process property data");
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error processing property data:", error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setUploadError("Please select a file to upload");
      return;
    }

    setUploading(true);
    setProcessing(true);

    try {
      // Parse the spreadsheet file
      const rawData = await parsePropertySpreadsheet(file);

      // Validate the property data
      const validation = validatePropertyData(rawData);
      if (!validation.valid) {
        setUploadError(validation.error || "Invalid property data");
        setUploading(false);
        setProcessing(false);
        return;
      }

      // Prepare the data for API submission
      const preparedData = preparePropertyDataForSubmission(rawData);

      // Process the data through the OpenAI function
      const processedResult = await processPropertyData(preparedData);

      if (!processedResult.success) {
        throw new Error(processedResult.error || "Processing failed");
      }

      // Save the processed properties to localStorage
      if (processedResult.properties && processedResult.properties.length > 0) {
        // Just save the first property for now (can be enhanced to handle multiple properties)
        const property = processedResult.properties[0];

        localStorage.setItem(
          "propertyData",
          JSON.stringify({
            id: property.id,
            address: property.address,
            propertyType: property.propertyType,
            bedrooms: property.bedrooms || "",
            bathrooms: property.bathrooms || "",
            isHmo: property.isHmo || property.propertyType === "hmo",
            // Financial details
            purchasePrice: property.purchasePrice || "",
            currentValue: property.currentValue || "",
            mortgageProvider: property.mortgageProvider || "",
            mortgageAmount: property.mortgageAmount || "",
            monthlyPayment: property.monthlyPayment || "",
          }),
        );

        // Success handling
        setUploadSuccess(true);
        setUploading(false);
        setProcessing(false);

        // Automatically redirect after successful upload (after 2 seconds)
        setTimeout(() => {
          router.push("/onboarding/tenant/import-options");
        }, 2000);
      } else {
        throw new Error("No property data was processed");
      }
    } catch (error) {
      console.error("Error processing file:", error);
      setUploadError(
        error instanceof Error
          ? error.message
          : "There was an error processing your property data. Please check your file format and try again.",
      );
      setUploading(false);
      setProcessing(false);
    }
  };

  return (
    <SidebarLayout sidebar={<SideboardOnboardingContent />} isOnboarding={true}>
      <div className="divide-y divide-gray-900/10">
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
            <h2 className="text-base/7 font-semibold text-gray-900">
              Import Properties
            </h2>
            <p className="mt-1 text-sm/6 text-gray-600">
              Upload your property data using our Excel or CSV template.
            </p>
          </div>

          <div className="bg-white border border-gray-300 ring-1 shadow-xs ring-gray-900/5 sm:rounded-xl md:col-span-2">
            <div className="px-4 py-4 sm:p-6">
              <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8">
                {/* Template Download */}
                <div className="border-b border-gray-900/10 pb-6">
                  <h2 className="text-base/7 font-semibold text-gray-900">
                    Download Template
                  </h2>
                  <p className="mt-1 text-sm/6 text-gray-600">
                    Start by downloading our template file to ensure your
                    property data is formatted correctly.
                  </p>

                  <div className="mt-4">
                    <button type="button"
                      onClick={downloadPropertyTemplate}
                      className="inline-flex items-center gap-x-2 rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-d9e8ff-50 hover:bg-d9e8ff-5"
                    >
                      <DocumentArrowDownIcon className="-ml-0.5 size-5"
                        aria-hidden="true"
                      />
                      Download template
                    </button>
                  </div>
                </div>

                {/* File Upload */}
                <div className="border-b border-gray-900/10 pb-6">
                  <h2 className="text-base/7 font-semibold text-gray-900">
                    Upload Your File
                  </h2>
                  <p className="mt-1 text-sm/6 text-gray-600">
                    Once you've completed the template, upload your file here.
                  </p>

                  <form onSubmit={handleSubmit} className="mt-4">
                    <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                      <div className="text-center">
                        <ArrowUpTrayIcon className="mx-auto size-12 text-gray-300"
                          aria-hidden="true"
                        />
                        <div className="mt-4 flex text-sm leading-6 text-gray-600">
                          <label htmlFor="file-upload"
                            className="relative cursor-pointer rounded-md bg-white font-semibold text-gray-900 focus-within:outline-none focus-within:ring-2 focus-within:ring-d9e8ff focus-within:ring-offset-2 hover:text-gray-700"
                          >
                            <span>Upload a file</span>
                            <input id="file-upload"
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              onChange={handleFileChange}
                              accept=".csv,.xls,.xlsx"
                              disabled={uploading}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs leading-5 text-gray-600">
                          Excel or CSV up to 5MB
                        </p>

                        {file && (
                          <div className="mt-4">
                            <div className="flex items-center justify-center gap-x-2 text-sm text-gray-700">
                              <CheckIcon className="size-5 text-green-500"
                                aria-hidden="true"
                              />
                              <span>{file.name}</span>
                              <span className="text-gray-500">
                                ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                              </span>
                            </div>
                          </div>
                        )}

                        {uploadError && (
                          <div className="mt-4">
                            <div className="flex items-center justify-center gap-x-2 text-sm text-red-600">
                              <ExclamationCircleIcon className="size-5"
                                aria-hidden="true"
                              />
                              <span>{uploadError}</span>
                            </div>
                          </div>
                        )}

                        {processing && (
                          <div className="mt-4">
                            <div className="flex items-center justify-center gap-x-2 text-sm text-gray-900">
                              <svg className="animate-spin size-5 text-gray-900"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              <span>Processing property data...</span>
                            </div>
                          </div>
                        )}

                        {uploadSuccess && (
                          <div className="mt-4">
                            <div className="flex items-center justify-center gap-x-2 text-sm text-green-600">
                              <CheckIcon className="size-5"
                                aria-hidden="true"
                              />
                              <span>
                                Upload successful! Redirecting to tenant
                                setup...
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button type="submit"
                        disabled={!file || uploading}
                        className={`rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                          !file || uploading
                            ? "bg-d9e8ff cursor-not-allowed"
                            : "bg-d9e8ff hover:bg-d9e8ff-80 focus-visible:outline-d9e8ff"
                        }`}
                      >
                        {uploading ? "Uploading..." : "Upload File"}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Import Guidelines */}
                <div className="border-b border-gray-900/10 pb-6">
                  <h2 className="text-base/7 font-semibold text-gray-900">
                    Import Guidelines
                  </h2>
                  <div className="mt-2 text-sm text-gray-600">
                    <p>For successful property imports:</p>
                    <ul className="mt-2 list-disc pl-5 space-y-1">
                      <li>
                        Complete all required fields (marked with * in the
                        template)
                      </li>
                      <li>
                        Use the exact format shown in the template examples
                      </li>
                      <li>
                        For addresses, include the full address with postcode
                      </li>
                      <li>
                        For property types, use: house, apartment, studio, hmo,
                        or commercial
                      </li>
                      <li>
                        For the "Is HMO" field, use "true" or "false" (without
                        quotes)
                      </li>
                      <li>For dates, use DD/MM/YYYY format</li>
                      <li>
                        For currency values, don't include currency symbols (£)
                      </li>
                      <li>
                        Each row in the spreadsheet represents one property
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Data Protection Notice */}
                <div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <ShieldCheckIcon className="size-6 text-gray-900"
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        Data Protection Notice
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        Your property data is securely stored and processed in
                        accordance with our
                        <a href="#"
                          className="text-gray-900 hover:text-gray-700"
                        >
                          {" "}
                          Privacy Policy
                        </a>
                        . We use industry-standard encryption and security
                        measures to protect your information.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-6">
              <button type="button"
                onClick={() =>
                  router.push("/onboarding/property/import-options")
                }
                className="text-sm/6 font-semibold text-gray-900"
              >
                Back to Import Options
              </button>
              <button type="button"
                onClick={() => router.push("/onboarding/property/add-property")}
                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Skip to manual entry
              </button>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
