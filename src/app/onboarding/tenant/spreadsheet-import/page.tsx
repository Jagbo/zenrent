"use client";

import React, { useState, useEffect } from "react";
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
import * as XLSX from "xlsx";

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

export default function TenantSpreadsheetImport() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [propertyData, setPropertyData] = useState({
    id: "",
    address: "",
    propertyType: "",
    bedrooms: "",
    isHmo: false,
  });

  // Load property data on component mount
  useEffect(() => {
    try {
      const savedPropertyData = localStorage.getItem("propertyData");
      if (savedPropertyData) {
        const parsedData = JSON.parse(savedPropertyData);
        setPropertyData({
          id: parsedData.id || Date.now().toString(), // Generate ID if not present
          address: parsedData.address || "",
          propertyType: parsedData.propertyType || "",
          bedrooms: parsedData.bedrooms || "",
          isHmo: parsedData.isHmo || parsedData.propertyType === "hmo" || false,
        });
      } else {
        // If no property data found, redirect to property setup
        router.push("/onboarding/property/import-options");
      }
    } catch (error) {
      console.error("Error loading property data:", error);
    }
  }, [router]);

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

  const parseSpreadsheet = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(file);
    });
  };

  const processSpreadsheetData = async (data: unknown[]) => {
    try {
      // Make sure we have the necessary property data
      if (!propertyData.id || !propertyData.address) {
        throw new Error(
          "Missing property information. Please complete property setup first.",
        );
      }

      const response = await fetch("/api/tenant-processor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          propertyData: {
            id: propertyData.id,
            address: propertyData.address,
            propertyType: propertyData.propertyType,
            bedrooms: propertyData.bedrooms,
            isHmo: propertyData.isHmo,
          },
          spreadsheetData: data,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process tenant data");
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error processing data:", error);
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
      const spreadsheetData = await parseSpreadsheet(file);

      if (spreadsheetData.length === 0) {
        setUploadError("No data found in the spreadsheet");
        setUploading(false);
        setProcessing(false);
        return;
      }

      // Process the data through the OpenAI function
      const processedResult = await processSpreadsheetData(spreadsheetData);

      if (!processedResult.success) {
        throw new Error(processedResult.error || "Processing failed");
      }

      const processedData = processedResult.structuredData;

      // Save the processed data to localStorage
      if (propertyData.isHmo) {
        // Save HMO tenant data
        const tenants = processedData.rooms.map((room: unknown) => ({
          firstName: room.tenant.firstName,
          lastName: room.tenant.lastName,
          phoneNumber: room.tenant.phoneNumber || "",
          email: room.tenant.email,
          roomNumber: room.roomNumber,
          // Tenancy Type
          agreementType: room.tenancyDetails.agreementType,
          tenancyTerm: room.tenancyDetails.tenancyTerm,
          // Tenancy Dates
          startDate: room.tenancyDetails.startDate,
          endDate: room.tenancyDetails.endDate || "",
          hasBreakClause: room.tenancyDetails.hasBreakClause || false,
          breakClauseDetails: room.tenancyDetails.breakClauseDetails || "",
          // Rent Schedule
          rentAmount: room.tenancyDetails.rentAmount,
          rentFrequency: room.tenancyDetails.rentFrequency,
          rentDueDay: room.tenancyDetails.rentDueDay,
          paymentMethod: room.tenancyDetails.paymentMethod || "",
          // Deposit Information
          depositAmount: room.tenancyDetails.depositAmount || "",
          depositScheme: room.tenancyDetails.depositScheme || "",
          depositRegistrationDate:
            room.tenancyDetails.depositRegistrationDate || "",
          depositRegistrationRef:
            room.tenancyDetails.depositRegistrationRef || "",
        }));

        // Store tenants in localStorage
        localStorage.setItem("tenants", JSON.stringify(tenants));
        localStorage.setItem(
          "tenancyData",
          JSON.stringify({
            property: propertyData,
            tenants: tenants,
          }),
        );
      } else {
        // Save standard property tenant data
        const tenancyDetails = processedData.tenancyDetails;
        const tenants = processedData.tenants.map((tenant: unknown) => ({
          firstName: tenant.firstName,
          lastName: tenant.lastName,
          phoneNumber: tenant.phoneNumber || "",
          email: tenant.email,
          roomNumber: "",
          // Set common tenancy details for all tenants
          agreementType: tenancyDetails.agreementType,
          tenancyTerm: tenancyDetails.tenancyTerm,
          startDate: tenancyDetails.startDate,
          endDate: tenancyDetails.endDate || "",
          hasBreakClause: tenancyDetails.hasBreakClause || false,
          breakClauseDetails: tenancyDetails.breakClauseDetails || "",
          rentAmount: tenancyDetails.rentAmount,
          rentFrequency: tenancyDetails.rentFrequency,
          rentDueDay: tenancyDetails.rentDueDay,
          paymentMethod: tenancyDetails.paymentMethod || "",
          depositAmount: tenancyDetails.depositAmount || "",
          depositScheme: tenancyDetails.depositScheme || "",
          depositRegistrationDate: tenancyDetails.depositRegistrationDate || "",
          depositRegistrationRef: tenancyDetails.depositRegistrationRef || "",
        }));

        // Store tenants and tenancy details in localStorage
        localStorage.setItem("tenants", JSON.stringify(tenants));
        localStorage.setItem(
          "tenancyData",
          JSON.stringify({
            property: propertyData,
            tenancy: tenancyDetails,
            tenants: tenants,
          }),
        );
      }

      // Success handling
      setUploadSuccess(true);
      setUploading(false);
      setProcessing(false);

      // Automatically redirect after successful upload (after 2 seconds)
      setTimeout(() => {
        router.push("/onboarding/tenant/confirmation");
      }, 2000);
    } catch (error) {
      console.error("Error processing file:", error);
      setUploadError(
        error instanceof Error
          ? error.message
          : "There was an error processing your tenant data. Please check your file format and try again.",
      );
      setUploading(false);
      setProcessing(false);
    }
  };

  const downloadTemplate = () => {
    // Create a basic Excel template for tenants
    const worksheet = XLSX.utils.json_to_sheet([]);

    // Add headers based on property type
    if (propertyData.isHmo) {
      // Headers for HMO properties
      XLSX.utils.sheet_add_aoa(
        worksheet,
        [
          [
            "Room Number*",
            "First Name*",
            "Last Name*",
            "Email*",
            "Phone Number",
            "Agreement Type*",
            "Tenancy Term*",
            "Start Date*",
            "End Date",
            "Has Break Clause",
            "Break Clause Details",
            "Rent Amount*",
            "Rent Frequency*",
            "Rent Due Day*",
            "Payment Method",
            "Deposit Amount",
            "Deposit Scheme",
            "Deposit Registration Date",
            "Deposit Registration Reference",
          ],
        ],
        { origin: "A1" },
      );

      // Add sample data
      XLSX.utils.sheet_add_aoa(
        worksheet,
        [
          [
            "1",
            "John",
            "Doe",
            "john.doe@example.com",
            "07700 900123",
            "ast",
            "fixed",
            "01/06/2023",
            "31/05/2024",
            "true",
            "After 6 months with 2 months notice",
            "550",
            "monthly",
            "1",
            "bank-transfer",
            "550",
            "deposit-protection-service",
            "02/06/2023",
            "DPS12345678",
          ],
        ],
        { origin: "A2" },
      );
    } else {
      // Headers for standard properties
      XLSX.utils.sheet_add_aoa(
        worksheet,
        [
          [
            "First Name*",
            "Last Name*",
            "Email*",
            "Phone Number",
            "Agreement Type*",
            "Tenancy Term*",
            "Start Date*",
            "End Date",
            "Has Break Clause",
            "Break Clause Details",
            "Rent Amount*",
            "Rent Frequency*",
            "Rent Due Day*",
            "Payment Method",
            "Deposit Amount",
            "Deposit Scheme",
            "Deposit Registration Date",
            "Deposit Registration Reference",
          ],
        ],
        { origin: "A1" },
      );

      // Add sample data for primary tenant
      XLSX.utils.sheet_add_aoa(
        worksheet,
        [
          [
            "John",
            "Doe",
            "john.doe@example.com",
            "07700 900123",
            "ast",
            "fixed",
            "01/06/2023",
            "31/05/2024",
            "true",
            "After 6 months with 2 months notice",
            "1200",
            "monthly",
            "1",
            "bank-transfer",
            "1200",
            "deposit-protection-service",
            "02/06/2023",
            "DPS12345678",
          ],
        ],
        { origin: "A2" },
      );

      // Add sample data for second tenant
      XLSX.utils.sheet_add_aoa(
        worksheet,
        [
          [
            "Jane",
            "Smith",
            "jane.smith@example.com",
            "07700 900456",
            "ast",
            "fixed",
            "01/06/2023",
            "31/05/2024",
            "true",
            "After 6 months with 2 months notice",
            "1200",
            "monthly",
            "1",
            "bank-transfer",
            "1200",
            "deposit-protection-service",
            "02/06/2023",
            "DPS12345678",
          ],
        ],
        { origin: "A3" },
      );
    }

    // Create a workbook and add the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tenants");

    // Generate Excel file and trigger download
    XLSX.writeFile(
      workbook,
      propertyData.isHmo ? "hmo-tenant-template.xlsx" : "tenant-template.xlsx",
    );
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
            <h2 className="text-base/7 font-semibold text-gray-900">
              Import Tenants
            </h2>
            <p className="mt-1 text-sm/6 text-gray-600">
              Upload your tenant data using our Excel or CSV template.
            </p>
            {propertyData.address && (
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900">Property</h3>
                <p className="text-sm text-gray-600">{propertyData.address}</p>
                <p className="text-xs text-gray-500">
                  {propertyData.propertyType} •{" "}
                  {propertyData.isHmo ? "HMO" : "Standard"} •{" "}
                  {propertyData.bedrooms}{" "}
                  {parseInt(propertyData.bedrooms) > 1 ? "Bedrooms" : "Bedroom"}
                </p>
              </div>
            )}
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
                    Start by downloading our template file to ensure your tenant
                    data is formatted correctly.
                    {propertyData.isHmo
                      ? " This template is customized for HMO properties."
                      : ""}
                  </p>

                  <div className="mt-4">
                    <button type="button"
                      onClick={downloadTemplate}
                      className="inline-flex items-center gap-x-2 rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-[#D9E8FF]/50 hover:bg-[#D9E8FF]/5"
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
                            className="relative cursor-pointer rounded-md bg-white font-semibold text-gray-900 focus-within:outline-none focus-within:ring-2 focus-within:ring-[#D9E8FF] focus-within:ring-offset-2 hover:text-gray-700"
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
                              <span>Processing tenant data...</span>
                            </div>
                          </div>
                        )}

                        {uploadSuccess && (
                          <div className="mt-4">
                            <div className="flex items-center justify-center gap-x-2 text-sm text-green-600">
                              <CheckIcon className="size-5"
                                aria-hidden="true"
                              />
                              <span>Upload successful! Redirecting...</span>
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
                            ? "bg-indigo-400 cursor-not-allowed"
                            : "bg-[#D9E8FF] hover:bg-[#D9E8FF]/80 focus-visible:outline-[#D9E8FF]"
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
                    <p>For successful tenant imports:</p>
                    <ul className="mt-2 list-disc pl-5 space-y-1">
                      <li>
                        Complete all required fields (marked with * in the
                        template)
                      </li>
                      <li>
                        Use the exact format shown in the template examples
                      </li>
                      {propertyData.isHmo && (
                        <li>
                          Include room numbers for each tenant in HMO properties
                        </li>
                      )}
                      <li>
                        For contact information, ensure phone numbers and emails
                        are valid
                      </li>
                      <li>For lease dates, use DD/MM/YYYY format</li>
                      {!propertyData.isHmo && (
                        <li>
                          For standard properties, list each co-tenant in a
                          separate row
                        </li>
                      )}
                      <li>
                        For agreement types, use: ast, non-ast, company-let,
                        student, or other
                      </li>
                      <li>For tenancy terms, use: fixed or periodic</li>
                      <li>
                        For rent frequency, use: weekly, monthly, quarterly, or
                        annually
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
                        Your tenant data is securely stored and processed in
                        accordance with our
                        <a href="#"
                          className="text-gray-900 hover:text-gray-700"
                        >
                          {" "}
                          Privacy Policy
                        </a>{" "}
                        and GDPR requirements. We use industry-standard
                        encryption and security measures to protect this
                        sensitive information.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-6">
              <button type="button"
                onClick={() => router.push("/onboarding/tenant/import-options")}
                className="text-sm/6 font-semibold text-gray-900"
              >
                Back to Import Options
              </button>
              <button type="button"
                onClick={() => router.push("/onboarding/tenant/tenancy-setup")}
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
