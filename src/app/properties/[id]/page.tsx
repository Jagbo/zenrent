"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SidebarLayout } from "../../components/sidebar-layout";
import { SidebarContent } from "../../components/sidebar-content";
import { Heading } from "../../components/heading";
import { Text } from "../../components/text";
import { Link } from "../../../components/link";
import Image from "next/image";
import {
  BuildingOffice2Icon,
  CurrencyDollarIcon,
  ExclamationCircleIcon,
  UserGroupIcon,
  KeyIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { classNames } from "../../../utils/classNames";
import {
  PencilIcon,
  XMarkIcon,
  MegaphoneIcon,
} from "@heroicons/react/24/solid";
import { IssueDrawer, Issue } from "../../components/IssueDrawer";
import { PropertyFormDrawer } from "../../components/PropertyFormDrawer";
import { EditPropertyDrawer } from "../../components/EditPropertyDrawer";
import { AdvertisePropertyDrawer } from "../../components/AdvertisePropertyDrawer";
import { IssueFormDrawer } from "../../components/IssueFormDrawer";
import {
  getPropertyWithTenants,
  IPropertyWithTenants,
  ITenant,
} from "../../../lib/propertyService";
import { getPropertyIssues, createIssue } from "../../../lib/issueService";
import { supabase } from "../../../lib/supabase";
import { ChevronDownIcon } from "@heroicons/react/24/solid";

// Define the Property interface for UI
interface PropertyForUI {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  type: string;
  status: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  rentAmount: number;
  description: string;
  amenities: string[];
  yearBuilt: number;
  parkingSpots: number;
  units: number;
  occupancyRate: number;
  monthlyRevenue: number;
  image: string;
  images?: string[]; // Optional for backward compatibility
  floorPlan?: string; // Optional for backward compatibility
  tenants: ITenant[];
  stats: {
    totalRooms: number;
    occupiedRooms: number;
    monthlyRevenue: number;
    maintenanceCosts: number;
  };
  // Optional properties for backward compatibility
  financials?: {
    monthlyIncome: number;
    expenses: number;
    netIncome: number;
    occupancyRate: number;
  };
  details?: {
    mortgage: {
      lender: string;
      amount: number;
      rate: string;
      term: string;
      monthlyPayment: number;
    };
    insurance: {
      provider: string;
      coverage: number;
      premium: number;
      expiryDate: string;
    };
  };
}

// Define the Property interface expected by EditPropertyDrawer
interface PropertyForEdit {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  type: string;
  status: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  rentAmount: number;
  description: string;
  amenities: string[];
  yearBuilt: number;
  parkingSpots: number;
}

// Convert Supabase property to UI format
const convertToUIProperty = (property: IPropertyWithTenants): PropertyForUI => {
  // Default image if not available
  const defaultImage =
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914";

  // Calculate stats
  const totalRooms = property.units || 1;
  const occupiedRooms = property.tenants?.length || 0;
  const occupancyRate =
    totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
  const monthlyRevenue =
    property.tenants?.reduce(
      (sum, tenant) => sum + (tenant.rent_amount || 0),
      0,
    ) || 0;

  // Maintenance costs are not in the database yet, using a placeholder
  const maintenanceCosts = Math.round(monthlyRevenue * 0.1); // 10% of revenue as placeholder

  return {
    id: property.id,
    name: property.name || property.address,
    address: property.address,
    city: property.city,
    state: property.state || "",
    zipCode: property.zipCode || "",
    type: property.property_type,
    status: property.status || "available",
    bedrooms: property.bedrooms || 0,
    bathrooms: property.bathrooms || 0,
    squareFeet: property.squareFeet || 0,
    rentAmount: property.rentAmount || 0,
    description: property.description || "",
    amenities: property.amenities || [],
    yearBuilt: property.yearBuilt || 0,
    parkingSpots: property.parkingSpots || 0,
    units: totalRooms,
    occupancyRate: occupancyRate,
    monthlyRevenue: monthlyRevenue,
    image: property.image || defaultImage,
    images: [property.image || defaultImage], // Create array with single image
    floorPlan: "/sample-floor-plan.png", // Default floor plan
    tenants: property.tenants || [],
    stats: {
      totalRooms: totalRooms,
      occupiedRooms: occupiedRooms,
      monthlyRevenue: monthlyRevenue,
      maintenanceCosts: maintenanceCosts,
    },
    // Add these for backward compatibility
    financials: {
      monthlyIncome: monthlyRevenue,
      expenses: maintenanceCosts,
      netIncome: monthlyRevenue - maintenanceCosts,
      occupancyRate: occupancyRate,
    },
    details: {
      mortgage: {
        lender: "ABC Bank",
        amount: 2500000,
        rate: "3.5%",
        term: "30 years",
        monthlyPayment: 11220,
      },
      insurance: {
        provider: "XYZ Insurance",
        coverage: 3000000,
        premium: 1200,
        expiryDate: "2025-03-15",
      },
    },
  };
};

// Sample data - used as fallback if property not found in database
const sampleProperty: PropertyForUI = {
  id: "123-main",
  name: "123 Main Street",
  address: "123 Main Street",
  city: "Manchester",
  state: "Greater Manchester",
  zipCode: "M1 1AA",
  type: "Apartment Building",
  status: "available",
  bedrooms: 2,
  bathrooms: 1,
  squareFeet: 800,
  rentAmount: 1200,
  description: "Modern apartment building in Manchester city center",
  amenities: ["Parking", "Elevator", "Security"],
  yearBuilt: 2010,
  parkingSpots: 12,
  units: 24,
  occupancyRate: 92,
  monthlyRevenue: 52000,
  image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914",
  images: [
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914",
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994",
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be",
  ],
  floorPlan: "/sample-floor-plan.png",
  tenants: [
    {
      id: "1",
      name: "Leslie Abbott",
      email: "leslie.abbott@example.com",
      phone: "123-456-7890",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      about: "Excellent tenant who always pays on time.",
      rent_amount: 1200,
    },
    {
      id: "2",
      name: "Michael Foster",
      email: "michael.foster@example.com",
      phone: "123-456-7891",
      image:
        "https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      about: "Good tenant, occasionally late with payments.",
      rent_amount: 1300,
    },
  ],
  stats: {
    totalRooms: 24,
    occupiedRooms: 22,
    monthlyRevenue: 52000,
    maintenanceCosts: 3200,
  },
  financials: {
    monthlyIncome: 52000,
    expenses: 12000,
    netIncome: 40000,
    occupancyRate: 91.6,
  },
  details: {
    mortgage: {
      lender: "ABC Bank",
      amount: 2500000,
      rate: "3.5%",
      term: "30 years",
      monthlyPayment: 11220,
    },
    insurance: {
      provider: "XYZ Insurance",
      coverage: 3000000,
      premium: 1200,
      expiryDate: "2025-03-15",
    },
  },
};

export default function PropertyDetails() {
  const params = useParams();
  const propertyId = params.id as string;
  const [property, setProperty] = useState<PropertyForUI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAdvertiseDrawerOpen, setIsAdvertiseDrawerOpen] = useState(false);
  const [isIssueDrawerOpen, setIsIssueDrawerOpen] = useState(false);
  const [isNewIssueDrawerOpen, setIsNewIssueDrawerOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [selectedProperty, setSelectedProperty] =
    useState<PropertyForEdit | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(true);
  const [issuesError, setIssuesError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState("images");

  // Update tabs to use state
  const tabs = [
    { name: "Images", value: "images", current: selectedTab === "images" },
    {
      name: "Floor Plan",
      value: "floor-plan",
      current: selectedTab === "floor-plan",
    },
    {
      name: "Financials",
      value: "financials",
      current: selectedTab === "financials",
    },
    { name: "Details", value: "details", current: selectedTab === "details" },
    {
      name: "Documents",
      value: "documents",
      current: selectedTab === "documents",
    },
  ];

  const handleTabChange = (value: string) => {
    setSelectedTab(value);
  };

  // Fetch property data when component mounts
  useEffect(() => {
    const fetchProperty = async () => {
      setLoading(true);
      setError(null);

      console.log("Fetching property details for ID:", propertyId);

      try {
        const data = await getPropertyWithTenants(propertyId);
        console.log("Property data received:", data ? "yes" : "no");

        if (data) {
          console.log("Property found:", data.id);
          // Convert to UI format
          const uiProperty = convertToUIProperty(data);
          setProperty(uiProperty);

          // Set selected property for edit drawer
          setSelectedProperty({
            id: uiProperty.id,
            name: uiProperty.name,
            address: uiProperty.address,
            city: uiProperty.city,
            state: uiProperty.state || "",
            zipCode: uiProperty.zipCode || "",
            type: uiProperty.type,
            status: uiProperty.status || "available",
            bedrooms: uiProperty.bedrooms || 0,
            bathrooms: uiProperty.bathrooms || 0,
            squareFeet: uiProperty.squareFeet || 0,
            rentAmount: uiProperty.rentAmount || 0,
            description: uiProperty.description || "",
            amenities: uiProperty.amenities || [],
            yearBuilt: uiProperty.yearBuilt || 0,
            parkingSpots: uiProperty.parkingSpots || 0,
          });
        } else {
          console.error("No property data returned for ID:", propertyId);
          setError(`Property not found with ID: ${propertyId}`);

          // In development mode, use sample data as fallback
          if (process.env.NODE_ENV === "development") {
            console.log("Using sample data as fallback");
            setProperty(sampleProperty);
            setSelectedProperty({
              id: sampleProperty.id,
              name: sampleProperty.name,
              address: sampleProperty.address,
              city: sampleProperty.city,
              state: sampleProperty.state || "",
              zipCode: sampleProperty.zipCode || "",
              type: sampleProperty.type,
              status: sampleProperty.status || "available",
              bedrooms: sampleProperty.bedrooms || 0,
              bathrooms: sampleProperty.bathrooms || 0,
              squareFeet: sampleProperty.squareFeet || 0,
              rentAmount: sampleProperty.rentAmount || 0,
              description: sampleProperty.description || "",
              amenities: sampleProperty.amenities || [],
              yearBuilt: sampleProperty.yearBuilt || 0,
              parkingSpots: sampleProperty.parkingSpots || 0,
            });
            setError(null);
          }
        }
      } catch (error) {
        console.error(`Error fetching property ${propertyId}:`, error);
        setError(
          `Error loading property: ${error instanceof Error ? error.message : String(error)}`,
        );

        // In development mode, use sample data as fallback
        if (process.env.NODE_ENV === "development") {
          console.log("Using sample data as fallback after error");
          setProperty(sampleProperty);
          setSelectedProperty({
            id: sampleProperty.id,
            name: sampleProperty.name,
            address: sampleProperty.address,
            city: sampleProperty.city,
            state: sampleProperty.state || "",
            zipCode: sampleProperty.zipCode || "",
            type: sampleProperty.type,
            status: sampleProperty.status || "available",
            bedrooms: sampleProperty.bedrooms || 0,
            bathrooms: sampleProperty.bathrooms || 0,
            squareFeet: sampleProperty.squareFeet || 0,
            rentAmount: sampleProperty.rentAmount || 0,
            description: sampleProperty.description || "",
            amenities: sampleProperty.amenities || [],
            yearBuilt: sampleProperty.yearBuilt || 0,
            parkingSpots: sampleProperty.parkingSpots || 0,
          });
          setError(null);
        }
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      fetchProperty();
    } else {
      setError("No property ID provided");
      setLoading(false);
    }
  }, [propertyId]);

  // Fetch issues for this property
  useEffect(() => {
    const fetchIssues = async () => {
      if (!propertyId) return;

      console.log(
        "Property details: Starting to fetch issues for property:",
        propertyId,
      );
      setIssuesLoading(true);
      setIssuesError(null);

      try {
        // Let the getPropertyIssues function handle the conversion from UUID to property_code
        const propertyIssues = await getPropertyIssues(propertyId);
        console.log(
          "Property details: Received issues data:",
          propertyIssues.length,
          "issues",
        );

        if (propertyIssues.length === 0) {
          console.log("Property details: No issues returned for this property");
        } else {
          console.log(
            "Property details: First issue sample:",
            propertyIssues[0],
          );
        }

        // Convert to the expected Issue format
        const formattedIssues = propertyIssues.map((issue) => ({
          id: issue.id,
          title: issue.title,
          status: issue.status,
          priority: issue.priority,
          property: issue.property_id
            .replace("prop_", "")
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" "),
          reported: new Date(issue.reported_date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
        }));

        setIssues(formattedIssues);
      } catch (err) {
        console.error("Property details: Error fetching property issues:", err);
        setIssuesError("Failed to load property issues");

        // In development mode, use sample data as fallback
        if (process.env.NODE_ENV === "development") {
          // Sample issues data for development fallback
          const sampleIssues = [
            {
              id: 1,
              title: "Leaking roof",
              priority: "High",
              status: "Open",
              reported: "2024-03-08",
            },
            {
              id: 2,
              title: "Broken heating",
              priority: "Medium",
              status: "In Progress",
              reported: "2024-03-07",
            },
          ];
          console.log("Property details: Using sample issues as fallback");
          setIssues(sampleIssues);
          setIssuesError(null);
        }
      } finally {
        setIssuesLoading(false);
      }
    };

    fetchIssues();
  }, [propertyId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", selectedProperty);
    setIsDrawerOpen(false);
  };

  const handleEditClick = () => {
    setIsDrawerOpen(true);
  };

  const handleEditSave = (updatedProperty: PropertyForEdit) => {
    console.log("Updated property:", updatedProperty);
    setIsDrawerOpen(false);
  };

  const openIssueDrawer = (issue: Issue) => {
    setSelectedIssue(issue);
    setIsIssueDrawerOpen(true);
  };

  const openNewIssueDrawer = () => {
    setIsNewIssueDrawerOpen(true);
  };

  const handleIssueSubmit = async (formData: unknown) => {
    try {
      console.log("Creating new issue for property:", propertyId);

      // Create issue in Supabase - the createIssue function will handle getting the property_code if needed
      const issueData = {
        title: formData.title,
        description: formData.description || "",
        property_id: propertyId, // The service will handle converting this if necessary
        unit_id: formData.unitNumber || null,
        status: "Todo" as const,
        priority: formData.priority as "Low" | "Medium" | "High",
        type: "Bug" as const,
        assigned_to: formData.assignedTo || null,
        due_date: formData.dueDate || null,
        is_emergency: formData.priority === "High",
      };

      const newIssueResult = await createIssue(issueData);
      console.log("Issue created:", newIssueResult ? "success" : "failed");

      if (newIssueResult) {
        // Refresh the issues list
        const propertyIssues = await getPropertyIssues(propertyId);

        // Convert to the expected Issue format
        const formattedIssues = propertyIssues.map((issue) => ({
          id: issue.id,
          title: issue.title,
          status: issue.status,
          priority: issue.priority,
          property: issue.property_id
            .replace("prop_", "")
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" "),
          reported: new Date(issue.reported_date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
        }));

        setIssues(formattedIssues);
      }
    } catch (err) {
      console.error("Error creating issue:", err);
    } finally {
      setIsNewIssueDrawerOpen(false);
    }
  };

  if (loading) {
    return (
      <SidebarLayout sidebar={<SidebarContent currentPath="/properties" />}>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
        </div>
      </SidebarLayout>
    );
  }

  if (error && !property) {
    return (
      <SidebarLayout sidebar={<SidebarContent currentPath="/properties" />}>
        <div className="space-y-6">
          <div className="text-center py-12">
            <h3 className="text-base font-semibold text-gray-900">
              Property not found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              The property you're looking for doesn't exist or has been removed.
            </p>
            {process.env.NODE_ENV === "development" && (
              <div className="mt-4 p-4 bg-gray-100 text-left rounded">
                <p className="text-xs font-mono">Debug info:</p>
                <p className="text-xs font-mono">Property ID: {propertyId}</p>
                <p className="text-xs font-mono">Error: {error}</p>
              </div>
            )}
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (!property) {
    return null; // This should not happen, but TypeScript requires it
  }

  return (
    <SidebarLayout sidebar={<SidebarContent currentPath="/properties" />}>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 flex items-center justify-center rounded-lg bg-gray-100">
              <BuildingOffice2Icon className="h-8 w-8 text-gray-600" />
            </div>
            <div>
              <Heading level={1} className="text-2xl font-bold">
                {property.name}
              </Heading>
              <Text className="text-gray-500 mt-1">
                {property.tenants.length} tenants
              </Text>
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <button onClick={() => setIsAdvertiseDrawerOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <MegaphoneIcon className="h-5 w-5 mr-2" />
              Advertise Property
            </button>
            <button onClick={handleEditClick}
              className="inline-flex items-center px-4 py-2 bg-[#D9E8FF] rounded-md text-sm font-medium text-black hover:bg-[#C8D7EE]"
            >
              <PencilIcon className="h-5 w-5 mr-2" />
              Edit Property
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BuildingOffice2Icon className="h-6 w-6 text-gray-400"
                    aria-hidden="true"
                  />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Rooms
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {property.stats.totalRooms}
                      </div>
                      <div className="ml-2 text-sm text-gray-500">rooms</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserGroupIcon className="h-6 w-6 text-gray-400"
                    aria-hidden="true"
                  />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Occupied Rooms
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {property.stats.occupiedRooms}
                      </div>
                      <div className="ml-2 text-sm text-gray-500">rooms</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-6 w-6 text-gray-400"
                    aria-hidden="true"
                  />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Monthly Revenue
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        £{property.stats.monthlyRevenue.toLocaleString()}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <KeyIcon className="h-6 w-6 text-gray-400"
                    aria-hidden="true"
                  />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Maintenance Costs
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        £{property.stats.maintenanceCosts.toLocaleString()}
                      </div>
                      <div className="ml-2 text-sm text-gray-500">/mo</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Two Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Property Info & Tabs (2/3 width) */}
          <div className="col-span-1 md:col-span-2 space-y-6">
            {/* Property Information */}
            <div className="bg-white shadow-sm sm:rounded-lg border border-gray-200">
              <div className="px-4 py-6 sm:px-6">
                <h3 className="text-base/7 font-semibold text-gray-900">
                  Property Information
                </h3>
                <p className="mt-1 max-w-2xl text-sm/6 text-gray-500">
                  Basic details about the property.
                </p>
              </div>
              <div className="border-t border-gray-100">
                <dl className="divide-y divide-gray-100">
                  <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-900">
                      Address
                    </dt>
                    <dd className="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0">
                      {property.name}
                    </dd>
                  </div>
                  <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-900">
                      Total Rooms
                    </dt>
                    <dd className="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0">
                      {property.stats.totalRooms}
                    </dd>
                  </div>
                  <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-900">
                      Occupancy Rate
                    </dt>
                    <dd className="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0">
                      {(
                        (property.stats.occupiedRooms /
                          property.stats.totalRooms) *
                        100
                      ).toFixed(1)}
                      %
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Tabs Section */}
            <div className="space-y-6 pb-6">
              {/* Tabs Navigation */}
              <div className="w-full">
                <div>
                  <div className="grid grid-cols-1 sm:hidden">
                    <select value={selectedTab}
                      onChange={(e) => handleTabChange(e.target.value)}
                      aria-label="Select a tab"
                      className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-2 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-[#D9E8FF]"
                    >
                      {tabs.map((tab) => (
                        <option key={tab.name} value={tab.value}>
                          {tab.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon aria-hidden="true"
                      className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end fill-gray-500"
                    />
                  </div>
                  <div className="hidden sm:block pb-6">
                    <nav aria-label="Tabs"
                      className="isolate flex divide-x divide-gray-200 rounded-lg shadow-sm"
                    >
                      {tabs.map((tab, tabIdx) => (
                        <button key={tab.name}
                          onClick={() => handleTabChange(tab.value)}
                          aria-current={tab.current ? "page" : undefined}
                          className={classNames(
                            tab.current
                              ? "text-gray-900"
                              : "text-gray-500 hover:text-gray-700",
                            tabIdx === 0 ? "rounded-l-lg" : "",
                            tabIdx === tabs.length - 1 ? "rounded-r-lg" : "",
                            "group relative min-w-0 flex-1 overflow-hidden bg-white px-4 py-4 text-center text-sm font-medium hover:bg-gray-50 focus:z-10",
                          )}
                        >
                          <span>{tab.name}</span>
                          <span aria-hidden="true"
                            className={classNames(
                              tab.current ? "bg-[#FF503E]" : "bg-transparent",
                              "absolute inset-x-0 bottom-0 h-0.5",
                            )}
                          />
                        </button>
                      ))}
                    </nav>
                  </div>
                </div>

                <Tabs value={selectedTab}
                  onValueChange={handleTabChange}
                  className="w-full"
                >
                  {/* Tab Content */}
                  <div>
                    <TabsContent value="images" className="mt-0">
                      <div className="rounded-md border p-4 bg-white">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {property.images && property.images.length > 0 ? (
                            property.images.map(
                              (image: string, index: number) => (
                                <div key={index}
                                  className="aspect-[4/3] relative overflow-hidden rounded-lg"
                                >
                                  <Image src={image}
                                    alt={`Property image ${index + 1}`}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ),
                            )
                          ) : (
                            <div className="aspect-[4/3] relative overflow-hidden rounded-lg">
                              <Image src={property.image}
                                alt="Property image"
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="floor-plan" className="mt-0">
                      <div className="rounded-md border p-4 bg-white">
                        <div className="aspect-[16/9] relative overflow-hidden rounded-lg">
                          {property.floorPlan ? (
                            <Image src={property.floorPlan as string}
                              alt="Floor plan"
                              fill
                              className="object-contain"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full w-full bg-gray-100">
                              <p className="text-gray-500">
                                No floor plan available
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="financials" className="mt-0">
                      <div className="rounded-md border p-4 bg-white">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <h4 className="text-sm font-medium text-gray-900">
                              Monthly Income
                            </h4>
                            <p className="mt-2 text-2xl font-semibold text-gray-900">
                              £
                              {property.financials?.monthlyIncome.toLocaleString() ||
                                property.stats.monthlyRevenue.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <h4 className="text-sm font-medium text-gray-900">
                              Monthly Expenses
                            </h4>
                            <p className="mt-2 text-2xl font-semibold text-gray-900">
                              £
                              {property.financials?.expenses.toLocaleString() ||
                                property.stats.maintenanceCosts.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <h4 className="text-sm font-medium text-gray-900">
                              Net Income
                            </h4>
                            <p className="mt-2 text-2xl font-semibold text-gray-900">
                              £
                              {property.financials?.netIncome.toLocaleString() ||
                                (
                                  property.stats.monthlyRevenue -
                                  property.stats.maintenanceCosts
                                ).toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <h4 className="text-sm font-medium text-gray-900">
                              Occupancy Rate
                            </h4>
                            <p className="mt-2 text-2xl font-semibold text-gray-900">
                              {property.financials?.occupancyRate ||
                                property.occupancyRate}
                              %
                            </p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="details" className="mt-0">
                      {property.details ? (
                        <div className="rounded-md border p-4 bg-white">
                          <div className="space-y-6">
                            {/* Mortgage Information */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-4">
                                Mortgage Information
                              </h4>
                              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                  <dt className="text-sm font-medium text-gray-500">
                                    Lender
                                  </dt>
                                  <dd className="mt-1 text-sm text-gray-900">
                                    {property.details.mortgage.lender}
                                  </dd>
                                </div>
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                  <dt className="text-sm font-medium text-gray-500">
                                    Amount
                                  </dt>
                                  <dd className="mt-1 text-sm text-gray-900">
                                    £
                                    {property.details.mortgage.amount.toLocaleString()}
                                  </dd>
                                </div>
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                  <dt className="text-sm font-medium text-gray-500">
                                    Interest Rate
                                  </dt>
                                  <dd className="mt-1 text-sm text-gray-900">
                                    {property.details.mortgage.rate}
                                  </dd>
                                </div>
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                  <dt className="text-sm font-medium text-gray-500">
                                    Monthly Payment
                                  </dt>
                                  <dd className="mt-1 text-sm text-gray-900">
                                    £
                                    {property.details.mortgage.monthlyPayment.toLocaleString()}
                                  </dd>
                                </div>
                              </dl>
                            </div>
                            {/* Insurance Information */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-4">
                                Insurance Information
                              </h4>
                              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                  <dt className="text-sm font-medium text-gray-500">
                                    Provider
                                  </dt>
                                  <dd className="mt-1 text-sm text-gray-900">
                                    {property.details.insurance.provider}
                                  </dd>
                                </div>
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                  <dt className="text-sm font-medium text-gray-500">
                                    Coverage Amount
                                  </dt>
                                  <dd className="mt-1 text-sm text-gray-900">
                                    £
                                    {property.details.insurance.coverage.toLocaleString()}
                                  </dd>
                                </div>
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                  <dt className="text-sm font-medium text-gray-500">
                                    Monthly Premium
                                  </dt>
                                  <dd className="mt-1 text-sm text-gray-900">
                                    £
                                    {property.details.insurance.premium.toLocaleString()}
                                  </dd>
                                </div>
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                  <dt className="text-sm font-medium text-gray-500">
                                    Expiry Date
                                  </dt>
                                  <dd className="mt-1 text-sm text-gray-900">
                                    {new Date(
                                      property.details.insurance.expiryDate,
                                    ).toLocaleDateString()}
                                  </dd>
                                </div>
                              </dl>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-md border p-4 bg-white">
                          <div className="flex items-center justify-center h-40 w-full">
                            <p className="text-gray-500">
                              No mortgage or insurance details available
                            </p>
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="documents" className="mt-0">
                      <div className="rounded-md border p-4 bg-white">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="text-sm font-medium text-gray-900">
                              Property Documents
                            </h4>
                            <button className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-gray-800">
                              <PlusIcon className="h-4 w-4 mr-1" />
                              Upload Document
                            </button>
                          </div>

                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col"
                                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Document Name
                                </th>
                                <th scope="col"
                                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Type
                                </th>
                                <th scope="col"
                                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Upload Date
                                </th>
                                <th scope="col"
                                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Size
                                </th>
                                <th scope="col"
                                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                ></th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              <tr>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                  Mortgage Document.pdf
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                    Mortgage
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  Jan 15, 2024
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  2.3 MB
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                  <a href="#"
                                    className="text-blue-600 hover:text-blue-900 mr-3"
                                  >
                                    View
                                  </a>
                                  <a href="#"
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    Download
                                  </a>
                                </td>
                              </tr>
                              <tr>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                  Insurance Policy.pdf
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    Insurance
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  Feb 10, 2024
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  3.1 MB
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                  <a href="#"
                                    className="text-blue-600 hover:text-blue-900 mr-3"
                                  >
                                    View
                                  </a>
                                  <a href="#"
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    Download
                                  </a>
                                </td>
                              </tr>
                              <tr>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                  Energy Performance Certificate.pdf
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                    EPC
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  Nov 5, 2023
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  1.5 MB
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                  <a href="#"
                                    className="text-blue-600 hover:text-blue-900 mr-3"
                                  >
                                    View
                                  </a>
                                  <a href="#"
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    Download
                                  </a>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </div>
          </div>

          {/* Right Column - Issues & Tenants (1/3 width) */}
          <div className="col-span-1 space-y-6">
            {/* Open Issues */}
            <div className="bg-white shadow-sm sm:rounded-lg border border-gray-200">
              <div className="p-4 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 gap-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Open Issues
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Current maintenance and repair issues.
                  </p>
                </div>
                <button className="w-full sm:w-auto px-4 py-2 bg-gray-900 rounded-md text-sm font-medium text-white hover:bg-gray-800 flex items-center justify-center"
                  onClick={openNewIssueDrawer}
                >
                  <PlusIcon className="h-4 w-4 mr-1.5" />
                  Add issue
                </button>
              </div>
              <div className="overflow-x-auto">
                {issuesLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : issuesError ? (
                  <div className="text-center py-8 text-red-500">
                    {issuesError}
                  </div>
                ) : issues.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No issues found for this property
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Issue
                        </th>
                        <th scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Priority
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {issues.map((issue) => (
                        <tr key={issue.id}
                          onClick={() => openIssueDrawer(issue)}
                          className="cursor-pointer hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {issue.title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                issue.priority === "High"
                                  ? "bg-red-100 text-red-800"
                                  : issue.priority === "Medium"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-green-100 text-green-800"
                              }`}
                            >
                              {issue.priority}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="px-6 py-4 border-t border-gray-200">
                <a href="/issues"
                  className="text-sm text-gray-900 hover:text-indigo-900"
                >
                  View all issues →
                </a>
              </div>
            </div>

            {/* Tenants Table */}
            <div className="bg-white shadow-sm sm:rounded-lg border border-gray-200">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-base font-semibold text-gray-900">
                  Current Tenants
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  List of tenants and their rooms.
                </p>
              </div>
              <div className="border-t border-gray-200">
                <ul role="list" className="divide-y divide-gray-200">
                  {property.tenants.map((tenant) => (
                    <li key={tenant.id} className="px-4 py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <Image src={
                              tenant.image ||
                              "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                            }
                            alt={tenant.name}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {tenant.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {tenant.email || "No email available"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {(tenant as any).lease_end_date
                              ? `Lease ends ${new Date((tenant as any).lease_end_date).toLocaleDateString()}`
                              : "No lease end date available"}
                          </p>
                        </div>
                        <div>
                          <Link href={`/residents/${tenant.id}`}
                            className="text-sm text-gray-900 hover:text-indigo-900"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Property Drawer */}
        <EditPropertyDrawer isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          property={selectedProperty}
          onSave={handleEditSave}
        />

        {/* Advertise Property Drawer */}
        <AdvertisePropertyDrawer isOpen={isAdvertiseDrawerOpen}
          onClose={() => setIsAdvertiseDrawerOpen(false)}
          propertyName={property.name}
        />

        {/* Issue Drawer */}
        <IssueDrawer isOpen={isIssueDrawerOpen}
          issue={selectedIssue}
          onClose={() => setIsIssueDrawerOpen(false)}
        />

        {/* New Issue Form Drawer */}
        <IssueFormDrawer isOpen={isNewIssueDrawerOpen}
          onClose={() => setIsNewIssueDrawerOpen(false)}
          onSubmit={handleIssueSubmit}
          title="Report New Issue"
          preSelectedPropertyId={propertyId}
        />
      </div>
    </SidebarLayout>
  );
}
