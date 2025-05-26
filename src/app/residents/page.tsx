"use client";

import { useState, useEffect } from "react";
import { SidebarLayout } from "../components/sidebar-layout";
import { SidebarContent } from "../components/sidebar-content";
import { Heading } from "../components/heading";
import { Text } from "../components/text";
import { Link } from "../../components/link";
import Image from "next/image";
import { BuildingOffice2Icon, PlusIcon } from "@heroicons/react/24/outline";
import { PaperClipIcon } from "@heroicons/react/20/solid";
import { ResidentFormDrawer } from "../components/ResidentFormDrawer";
import { useAuth } from "../../lib/auth-provider";
import { getTenants } from "../../lib/tenantService";
import { ITenant } from "../../lib/propertyService";

// Helper to create placeholder image URLs from name
const getInitialsAvatar = (name: string) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=256`;
};

// Define tenant attachments
interface TenantAttachment {
  name: string;
  size: string;
}

// Define tenant with UI specific properties
interface TenantWithUI extends ITenant {
  unit?: string;
  leaseEnd?: string;
  attachments: Array<{ name: string; size: string }>;
  property_name: string;
  property_address?: string;
  property_id?: string;
  property_code?: string;
  image: string;
}

// Define property type for UI
interface PropertyListItem {
  id: string;
  name: string;
}

interface Attachment {
  name: string;
  size: string;
}

export default function Residents() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<TenantWithUI[]>([]);
  const [properties, setProperties] = useState<PropertyListItem[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<TenantWithUI | null>(
    null,
  );
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Fetch tenants when component mounts
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        setLoading(true);
        let fetchedTenants: ITenant[] = [];

        if (user?.id) {
          fetchedTenants = await getTenants(user.id);
        }

        // Transform tenants for UI display
        const tenantsWithUI = fetchedTenants.map((tenant: ITenant) => ({
          ...tenant,
          image: tenant.image || getInitialsAvatar(tenant.name),
          attachments: [], // Remove hardcoded attachments - fetch from database when available
          property_name: tenant.property_address || "Unassigned",
        }));

        setTenants(tenantsWithUI);

        // Create unique property list from property_address
        const propertySet = new Set<string>();
        const propertyList: PropertyListItem[] = [];

        tenantsWithUI.forEach((tenant: TenantWithUI) => {
          if (
            tenant.property_address &&
            !propertySet.has(tenant.property_address)
          ) {
            propertySet.add(tenant.property_address);
            propertyList.push({
              id: tenant.property_address,
              name: tenant.property_address,
            });
          }
        });

        setProperties(propertyList);
      } catch (error) {
        console.error("Error fetching tenants:", error);
        setTenants([]);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
  }, [user?.id]);

  const handleSubmit = (formData: unknown) => {
    // Here you would typically save the resident to your backend
    console.log("New resident:", formData);
    setIsDrawerOpen(false);
  };

  // Filter tenants by selected property
  const filteredTenants =
    selectedPropertyId === "all"
      ? tenants
      : tenants.filter(
          (t: TenantWithUI) => t.property_address === selectedPropertyId,
        );

  // Group tenants by property
  const tenantsByProperty: Record<string, TenantWithUI[]> = {};

  filteredTenants.forEach((tenant: TenantWithUI) => {
    const propertyName = tenant.property_address || "Unassigned";
    if (!tenantsByProperty[propertyName]) {
      tenantsByProperty[propertyName] = [];
    }
    tenantsByProperty[propertyName].push(tenant);
  });

  return (
    <SidebarLayout sidebar={<SidebarContent currentPath="/residents" />}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <Heading level={1} className="text-2xl font-bold">
              Residents
            </Heading>
            <Text className="text-gray-500 mt-1">
              Manage your property residents and tenants.
            </Text>
          </div>
          <div className="mt-4 md:mt-0">
            <button onClick={() => setIsDrawerOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-[#D9E8FF] rounded-md text-sm font-medium text-black hover:bg-[#C8D7EE]"
            >
              <PlusIcon className="h-5 w-5 mr-1" />
              Add Resident
            </button>
          </div>
        </div>

        {/* ResidentFormDrawer */}
        <ResidentFormDrawer isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onSubmit={handleSubmit}
          properties={properties}
          title="Add New Resident"
        />

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
          </div>
        )}

        {/* Empty state */}
        {!loading && tenants.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg className="h-full w-full"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-cabinet-grotesk-bold text-gray-900">
              No Residents
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding a new resident.
            </p>
            <div className="mt-6">
              <button onClick={() => setIsDrawerOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-[#D9E8FF] rounded-md text-sm font-medium text-black hover:bg-[#C8D7EE]"
              >
                <PlusIcon className="h-5 w-5 mr-1" />
                Add Resident
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!loading && tenants.length > 0 && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Panel - Tenant List */}
            <div className="w-full lg:w-1/3 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Tenants by Property
                </h2>
                <p className="text-sm text-gray-500">
                  Organized listing of all tenants by property.
                </p>
              </div>

              {/* Property Tabs */}
              <div className="flex overflow-x-auto border-b border-gray-200">
                <button onClick={() => setSelectedPropertyId("all")}
                  className={`px-4 py-2 text-sm font-medium ${
                    selectedPropertyId === "all"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  All
                </button>
                {properties.map((property: PropertyListItem) => (
                  <button key={property.id}
                    onClick={() => setSelectedPropertyId(property.id)}
                    className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                      selectedPropertyId === property.id
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {property.name}
                  </button>
                ))}
              </div>

              {/* Tenant List */}
              <div className="divide-y divide-gray-200">
                {Object.entries(tenantsByProperty).map(
                  ([propertyName, propertyTenants]: [
                    string,
                    TenantWithUI[],
                  ]) => (
                    <div key={propertyName}>
                      <div className="px-4 py-3 bg-gray-50">
                        <h3 className="text-sm font-cabinet-grotesk-bold text-gray-900">
                          {propertyName}
                        </h3>
                      </div>
                      {propertyTenants.map((tenant: TenantWithUI) => (
                        <button key={tenant.id}
                          onClick={() => setSelectedTenant(tenant)}
                          className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 ${
                            selectedTenant?.id === tenant.id ? "bg-gray-50" : ""
                          }`}
                        >
                          <Image src={tenant.image || getInitialsAvatar(tenant.name)}
                            alt={tenant.name}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-gray-900">
                              {tenant.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {tenant.unit || "No unit assigned"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {tenant.email}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Right Panel - Tenant Details */}
            <div className="flex-1">
              {selectedTenant ? (
                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg border border-gray-200">
                  <div className="px-4 py-6 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base/7 font-cabinet-grotesk-bold text-gray-900">
                          Tenant Information
                        </h3>
                        <p className="mt-1 max-w-2xl text-sm/6 text-gray-500">
                          Personal details and lease information.
                        </p>
                      </div>
                      <Link href={`/residents/${selectedTenant.id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md bg-white text-gray-700 hover:bg-gray-50"
                      >
                        View more
                      </Link>
                    </div>
                  </div>
                  <div className="border-t border-gray-100">
                    <dl className="divide-y divide-gray-100">
                      <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-900">
                          Full name
                        </dt>
                        <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                          {selectedTenant.name}
                        </dd>
                      </div>
                      {selectedTenant.unit && (
                        <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-900">
                            Room/Unit
                          </dt>
                          <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                            {selectedTenant.unit}
                          </dd>
                        </div>
                      )}
                      <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-900">
                          Email address
                        </dt>
                        <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                          {selectedTenant.email}
                        </dd>
                      </div>
                      {selectedTenant.phone && (
                        <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-900">
                            Phone number
                          </dt>
                          <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                            {selectedTenant.phone}
                          </dd>
                        </div>
                      )}
                      {selectedTenant.leaseEnd && (
                        <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-900">
                            Lease end date
                          </dt>
                          <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                            {selectedTenant.leaseEnd}
                          </dd>
                        </div>
                      )}
                      {selectedTenant.about && (
                        <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-900">
                            About
                          </dt>
                          <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                            {selectedTenant.about}
                          </dd>
                        </div>
                      )}
                      <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm/6 font-medium text-gray-900">
                          Attachments
                        </dt>
                        <dd className="mt-2 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                          {selectedTenant.attachments.length > 0 ? (
                            <ul role="list"
                              className="divide-y divide-gray-100 rounded-md border border-gray-200"
                            >
                              {selectedTenant.attachments.map(
                                (attachment: Attachment, index: number) => (
                                  <li key={index}
                                    className="flex items-center justify-between py-4 pr-5 pl-4 text-sm/6"
                                  >
                                    <div className="flex w-0 flex-1 items-center">
                                      <PaperClipIcon className="size-5 shrink-0 text-gray-400"
                                        aria-hidden="true"
                                      />
                                      <div className="ml-4 flex min-w-0 flex-1 gap-2">
                                        <span className="truncate font-medium">
                                          {attachment.name}
                                        </span>
                                        <span className="shrink-0 text-gray-400">
                                          {attachment.size}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="ml-4 shrink-0">
                                      <a href="#"
                                        className="font-medium text-gray-900 hover:text-gray-700"
                                      >
                                        Download
                                      </a>
                                    </div>
                                  </li>
                                ),
                              )}
                            </ul>
                          ) : (
                            <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <p className="mt-2 text-sm text-gray-500">No documents uploaded</p>
                              <p className="text-xs text-gray-400">Lease agreements and other documents will appear here</p>
                            </div>
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center bg-white shadow-sm sm:rounded-lg">
                  <div className="text-center">
                    <div className="mx-auto h-12 w-12 text-gray-400">
                      <svg className="h-full w-full"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <h3 className="mt-2 text-sm font-cabinet-grotesk-bold text-gray-900">
                      No Tenant Selected
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Please select a tenant from the list on the left to view
                      their details.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
