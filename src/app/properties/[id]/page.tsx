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
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  getAllPropertyDetails,
  IPropertyImage,
  IPropertyFloorPlan,
  IPropertyInsurance,
  IPropertyMortgage
} from "../../../lib/propertyDetailsService";
import { getPropertyEnergyDataClient } from "../../../services/propertyEnrichmentService";

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
  current_valuation?: number; // Property value from database
  purchase_price?: number; // Purchase price from database
  energy_rating?: string; // Energy efficiency rating
  council_tax_band?: string; // Council tax band
  is_furnished?: boolean; // Whether the property is furnished
  tenants: ITenant[];
  stats: {
    totalRooms: number;
    occupiedRooms: number;
    monthlyRevenue: number;
    maintenanceCosts: number;
  };
  // Energy efficiency data from enrichment service
  energyData?: {
    epcRating?: string;
    energyScore?: number;
    potentialRating?: string;
    potentialScore?: number;
    estimatedEnergyCost?: number;
    heatingCost?: number;
    hotWaterCost?: number;
    totalEnergyCost?: number;
    potentialSaving?: number;
    co2Emissions?: number;
    validUntil?: string;
    recommendations?: Array<{
      improvement: string;
      savingEstimate: string;
      impact: string;
    }>;
  };
  // Optional properties for backward compatibility
  financials?: {
    monthlyIncome: number;
    expenses: number;
    netIncome: number;
    occupancyRate: number;
  };
  details?: {
    mortgage?: {
      lender: string;
      amount: number;
      rate: string;
      term: string;
      monthlyPayment: number;
    };
    insurance?: {
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

// Fetch financial data for a property from Supabase
const fetchFinancialData = async (propertyId: string) => {
  const supabase = createClientComponentClient();
  const currentDate = new Date();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  // Format dates for SQL query
  const startDate = firstDayOfMonth.toISOString();
  const endDate = lastDayOfMonth.toISOString();
  
  try {
    // Get total income for the current month
    const { data: incomeData, error: incomeError } = await supabase
      .from('income')
      .select('amount')
      .eq('property_id', propertyId)
      .gte('date', startDate)
      .lte('date', endDate);
      
    if (incomeError) throw incomeError;
    
    // Get total expenses for the current month
    const { data: expenseData, error: expenseError } = await supabase
      .from('expenses')
      .select('amount')
      .eq('property_id', propertyId)
      .gte('date', startDate)
      .lte('date', endDate);
      
    if (expenseError) throw expenseError;
    
    // Get latest financial metrics
    const { data: metricsData, error: metricsError } = await supabase
      .from('financial_metrics')
      .select('*')
      .eq('property_id', propertyId)
      .order('period_end', { ascending: false })
      .limit(1);
      
    if (metricsError) throw metricsError;
    
    // Calculate totals
    const totalIncome = incomeData.reduce((sum, item) => sum + Number(item.amount), 0);
    const totalExpenses = expenseData.reduce((sum, item) => sum + Number(item.amount), 0);
    const netIncome = totalIncome - totalExpenses;
    
    // Get occupancy rate from metrics or calculate default
    const occupancyRate = metricsData && metricsData.length > 0 
      ? Number(metricsData[0].occupancy_rate) 
      : null;
    
    return {
      monthlyIncome: totalIncome,
      expenses: totalExpenses,
      netIncome: netIncome,
      occupancyRate: occupancyRate
    };
  } catch (error) {
    console.error('Error fetching financial data:', error);
    return null;
  }
};

// Convert Supabase property to UI format
const convertToUIProperty = (property: IPropertyWithTenants): PropertyForUI => {
  // Use actual property image or null - no default fallback
  const propertyImage = property.image || null;

  // Calculate stats based on actual data
  const totalRooms = property.bedrooms || 0;
  // Calculate occupied rooms from actual tenants
  const occupiedRooms = property.tenants?.length || 0;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
  
  const monthlyRevenue = property.tenants?.reduce(
      (sum, tenant) => sum + (tenant.rent_amount || 0),
      0,
    ) || 0;

  // Don't calculate placeholder maintenance costs - leave empty if not in database
  const maintenanceCosts = 0; // Will be populated from actual financial data if available

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
    current_valuation: property.current_valuation ?? undefined,
    purchase_price: property.purchase_price ?? undefined,
    energy_rating: property.energy_rating ?? undefined,
    council_tax_band: property.council_tax_band ?? undefined,
    is_furnished: property.is_furnished || false,
    yearBuilt: property.yearBuilt || 0,
    parkingSpots: property.parkingSpots || 0,
    units: totalRooms,
    occupancyRate: occupancyRate,
    monthlyRevenue: monthlyRevenue,
    image: propertyImage || "https://images.unsplash.com/photo-1580587771525-78b9dba3b914", // Keep minimal fallback for UI
    images: propertyImage ? [propertyImage] : [], // Empty array if no image
    floorPlan: undefined, // Remove hardcoded floor plan
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
    // Remove hardcoded details - these will be populated from database if available
    details: undefined,
  };
};

export default function PropertyDetails() {
  const { id: propertyId } = useParams<{ id: string }>();
  const [property, setProperty] = useState<PropertyForUI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("images");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAdvertiseDrawerOpen, setIsAdvertiseDrawerOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<PropertyForEdit | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(true);
  const [issuesError, setIssuesError] = useState<string | null>(null);
  const [isIssueDrawerOpen, setIsIssueDrawerOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isNewIssueDrawerOpen, setIsNewIssueDrawerOpen] = useState(false);
  const [financialData, setFinancialData] = useState<any>(null);
  const [financialDataLoading, setFinancialDataLoading] = useState(true);
  
  // New state for property details from database
  const [propertyImages, setPropertyImages] = useState<IPropertyImage[]>([]);
  const [propertyFloorPlans, setPropertyFloorPlans] = useState<IPropertyFloorPlan[]>([]);
  const [propertyInsurance, setPropertyInsurance] = useState<IPropertyInsurance | null>(null);
  const [propertyMortgage, setPropertyMortgage] = useState<IPropertyMortgage | null>(null);
  const [propertyAmenities, setPropertyAmenities] = useState<string[]>([]);
  const [leaseRentAmount, setLeaseRentAmount] = useState<number | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(true);
  
  // State for energy efficiency data
  const [energyData, setEnergyData] = useState<any>(null);
  const [energyDataLoading, setEnergyDataLoading] = useState(true);

  // Update tabs to use state
  const tabs = [
    { name: "Images", value: "images", current: activeTab === "images" },
    {
      name: "Floor Plan",
      value: "floor-plan",
      current: activeTab === "floor-plan",
    },
    {
      name: "Mortgage",
      value: "mortgage",
      current: activeTab === "mortgage",
    },
    {
      name: "Insurance",
      value: "insurance",
      current: activeTab === "insurance",
    },
    {
      name: "Certificates",
      value: "certificates",
      current: activeTab === "certificates",
    },
    {
      name: "Documents",
      value: "documents",
      current: activeTab === "documents",
    },
  ];

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Fetch property details from database
  const fetchPropertyDetails = async (propertyId: string) => {
    setDetailsLoading(true);
    try {
      console.log("Fetching property details from database for ID:", propertyId);
      
      // Fetch all property details in a single call
      const details = await getAllPropertyDetails(propertyId);
      
      // Update state with the fetched data
      setPropertyImages(details.images);
      setPropertyFloorPlans(details.floorPlans);
      setPropertyInsurance(details.insurance);
      setPropertyMortgage(details.mortgage);
      setPropertyAmenities(details.amenities);
      
      console.log("Property details fetched successfully:", details);
    } catch (error) {
      console.error("Error fetching property details:", error);
    } finally {
      setDetailsLoading(false);
    }
  };
  
  // Fetch property data when component mounts
  useEffect(() => {
    const fetchProperty = async () => {
      setLoading(true);
      setError(null);

      console.log("Fetching property details for ID:", propertyId);

      // Fetch lease information for this property
      try {
        const supabase = createClientComponentClient();
        const { data: leaseData, error: leaseError } = await supabase
          .from('leases')
          .select('rent_amount')
          .eq('property_id', propertyId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (leaseError) {
          console.error('Error fetching lease data:', leaseError);
        } else if (leaseData && leaseData.length > 0) {
          setLeaseRentAmount(parseFloat(leaseData[0].rent_amount));
          console.log('Lease rent amount:', leaseData[0].rent_amount);
        }
      } catch (error) {
        console.error('Error in lease data fetch:', error);
      }
      
      try {
        const data = await getPropertyWithTenants(propertyId);
        console.log("Property data received:", data ? "yes" : "no");

        if (data) {
          console.log("Property found:", data.id);
          // Convert to UI format
          const uiProperty = convertToUIProperty(data);
          
          // Fetch property details from database (images, floor plans, insurance, mortgage, amenities)
          await fetchPropertyDetails(propertyId);
          
          // Update property with database details if available
          if (propertyInsurance || propertyMortgage) {
            uiProperty.details = {
              mortgage: propertyMortgage ? {
                lender: propertyMortgage.lender,
                amount: propertyMortgage.amount,
                rate: `${propertyMortgage.interest_rate}%`,
                term: `${propertyMortgage.term_years} years`,
                monthlyPayment: propertyMortgage.monthly_payment,
              } : undefined,
              insurance: propertyInsurance ? {
                provider: propertyInsurance.provider,
                coverage: propertyInsurance.coverage,
                premium: propertyInsurance.premium,
                expiryDate: propertyInsurance.expiry_date,
              } : undefined,
            };
          }
          
          // Fetch financial data
          setFinancialDataLoading(true);
          const financials = await fetchFinancialData(propertyId);
          if (financials) {
            setFinancialData(financials);
            
            // Update property with financial data
            uiProperty.financials = {
              monthlyIncome: financials.monthlyIncome,
              expenses: financials.expenses,
              netIncome: financials.netIncome,
              occupancyRate: financials.occupancyRate || uiProperty.occupancyRate
            };
          }
          
          // Fetch energy efficiency data
          setEnergyDataLoading(true);
          try {
            const energyInfo = await getPropertyEnergyDataClient(propertyId);
            if (energyInfo) {
              console.log('Energy data fetched:', energyInfo);
              setEnergyData(energyInfo);
              
              // Update property with energy data - map actual field names from PropertyData API
              uiProperty.energyData = {
                epcRating: energyInfo.current_energy_rating,
                energyScore: energyInfo.current_energy_efficiency,
                potentialRating: energyInfo.potential_energy_rating,
                potentialScore: energyInfo.potential_energy_efficiency,
                heatingCost: energyInfo.heating_cost_current,
                hotWaterCost: energyInfo.hot_water_cost_current,
                totalEnergyCost: (energyInfo.heating_cost_current || 0) + (energyInfo.hot_water_cost_current || 0) + (energyInfo.lighting_cost_current || 0),
                potentialSaving: ((energyInfo.heating_cost_current || 0) + (energyInfo.hot_water_cost_current || 0) + (energyInfo.lighting_cost_current || 0)) - 
                                ((energyInfo.heating_cost_potential || 0) + (energyInfo.hot_water_cost_potential || 0) + (energyInfo.lighting_cost_potential || 0)),
                co2Emissions: energyInfo.co2_emissions_current,
                validUntil: energyInfo.lodgement_date ? new Date(new Date(energyInfo.lodgement_date).getTime() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
                recommendations: [] // PropertyData API doesn't provide recommendations in this format
              };
            } else {
              console.log('No energy data found for property');
            }
          } catch (error) {
            console.error('Error fetching energy data:', error);
          } finally {
            setEnergyDataLoading(false);
          }
          
          // Update property with database amenities if available
          if (propertyAmenities.length > 0) {
            uiProperty.amenities = propertyAmenities;
          }
          
          setProperty(uiProperty);
          setFinancialDataLoading(false);

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
        }
      } catch (error) {
        console.error(`Error fetching property ${propertyId}:`, error);
        setError(
          `Error loading property: ${error instanceof Error ? error.message : String(error)}`,
        );
        // Remove sample property fallback - only show error state
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
        // Remove sample issues fallback - only show error state
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

  const handleEditSave = (updatedProperty: any) => {
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

  const handleIssueSubmit = async (formData: any) => {
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
      <SidebarLayout>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
        </div>
      </SidebarLayout>
    );
  }

  if (error && !property) {
    return (
      <SidebarLayout>
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
    <SidebarLayout>
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
                      Bathrooms
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
                      Monthly Rent
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        £{leaseRentAmount ? leaseRentAmount.toLocaleString() : property.rentAmount ? property.rentAmount.toLocaleString() : '0'}
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
                      Property Value
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        £{(property.current_valuation || property.purchase_price || 0).toLocaleString()}
                      </div>
                      <div className="ml-2 text-sm text-gray-500"></div>
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
                <div className="mt-4 p-4 bg-gray-50 text-left rounded border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Full Address</h4>
                  <p className="text-sm text-gray-700">
                    {property.name}<br />
                    {property.address}<br />
                    {property.city}, {property.state} {property.zipCode}
                  </p>
                </div>
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
                      {property.occupancyRate}%
                    </dd>
                  </div>
                  <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-900">
                      Energy Rating
                    </dt>
                    <dd className="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0">
                      {property.energy_rating || 'Not available'}
                    </dd>
                  </div>
                  <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-900">
                      Council Tax Band
                    </dt>
                    <dd className="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0">
                      {property.council_tax_band || 'Not available'}
                    </dd>
                  </div>
                  <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-900">
                      Furnished
                    </dt>
                    <dd className="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0">
                      {property.is_furnished ? 'Yes' : 'No'}
                    </dd>
                  </div>
                  <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-900">
                      Purchase Price
                    </dt>
                    <dd className="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0">
                      {property.purchase_price ? `£${property.purchase_price.toLocaleString()}` : 'Not available'}
                    </dd>
                  </div>
                  <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-900">
                      Current Valuation
                    </dt>
                    <dd className="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0">
                      {property.current_valuation ? `£${property.current_valuation.toLocaleString()}` : 'Not available'}
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
                    <select value={activeTab}
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

                <Tabs value={activeTab}
                  onValueChange={handleTabChange}
                  className="w-full"
                >
                  {/* Tab Content */}
                    <TabsContent value="images" className="mt-0">
                      {propertyImages && propertyImages.length > 0 ? (
                      <div className="rounded-md border p-4 bg-white">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {propertyImages.map((image, index) => (
                              <div key={image.id}
                                  className="aspect-[4/3] relative overflow-hidden rounded-lg"
                                >
                                <Image src={image.image_url}
                                    alt={`Property image ${index + 1}`}
                                    fill
                                    className="object-cover"
                                  />
                                {image.is_primary && (
                                  <div className="absolute top-2 left-2">
                                    <span className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded">
                                      Primary
                                    </span>
                                </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                          ) : (
                        <div className="rounded-md border p-4 bg-white">
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <h4 className="text-sm font-medium text-gray-900">
                                Add Property Images
                              </h4>
                            </div>
                            <div className="bg-gray-50 p-6 rounded-lg border border-dashed border-gray-300">
                              <div className="text-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">Upload property images</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                  Add photos to showcase your property and attract potential tenants
                                </p>
                                <div className="mt-6">
                                  <label htmlFor="images-file-upload" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-[#D9E8FF] hover:bg-[#C5DAFF] cursor-pointer" data-component-name="PropertyDetails">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    Upload Images
                                  </label>
                                  <input id="images-file-upload" name="images-file-upload" type="file" multiple accept="image/*" className="sr-only" />
                        </div>
                      </div>
                            </div>
                            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <h5 className="text-sm font-medium text-blue-900">Tips for great property photos:</h5>
                              <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
                                <li>Take photos in good lighting (natural light works best)</li>
                                <li>Include shots of all rooms, exterior, and key features</li>
                                <li>Make sure rooms are clean and tidy</li>
                                <li>Consider wide-angle shots to show room size</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="floor-plan" className="mt-0">
                      {propertyFloorPlans && propertyFloorPlans.length > 0 ? (
                      <div className="rounded-md border p-4 bg-white">
                          <div className="space-y-4">
                            {propertyFloorPlans.map((floorPlan, index) => (
                              <div key={floorPlan.id} className="space-y-2">
                        <div className="aspect-[16/9] relative overflow-hidden rounded-lg">
                                  <Image src={floorPlan.floor_plan_url}
                                    alt={floorPlan.description || `Floor plan ${index + 1}`}
                              fill
                              className="object-contain"
                            />
                                </div>
                                {floorPlan.description && (
                                  <p className="text-sm text-gray-600">{floorPlan.description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-md border p-4 bg-white">
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <h4 className="text-sm font-medium text-gray-900">
                                Add Floor Plan
                              </h4>
                            </div>
                            <div className="bg-gray-50 p-6 rounded-lg border border-dashed border-gray-300">
                              <div className="text-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">Upload floor plan</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                  Add a floor plan to help tenants understand the property layout
                                </p>
                                <div className="mt-6">
                                  <label htmlFor="floorplan-file-upload" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-[#D9E8FF] hover:bg-[#C5DAFF] cursor-pointer" data-component-name="PropertyDetails">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    Upload Floor Plan
                                  </label>
                                  <input id="floorplan-file-upload" name="floorplan-file-upload" type="file" accept="image/*,.pdf" className="sr-only" />
                            </div>
                        </div>
                      </div>
                            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <h5 className="text-sm font-medium text-blue-900">Floor plan tips:</h5>
                              <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
                                <li>Upload high-resolution images or PDF files</li>
                                <li>Include room dimensions if available</li>
                                <li>Show the flow between rooms clearly</li>
                                <li>Consider including outdoor spaces and parking</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </TabsContent>




                    
                    <TabsContent value="mortgage" className="mt-0">
                      {property.details?.mortgage ? (
                        <div className="rounded-md border p-4 bg-white">
                          <div className="space-y-4">
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
                                  £{property.details.mortgage.amount.toLocaleString()}
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
                                  Term
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                  {property.details.mortgage.term}
                                </dd>
                              </div>
                              <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <dt className="text-sm font-medium text-gray-500">
                                  Monthly Payment
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                  £{property.details.mortgage.monthlyPayment.toLocaleString()}
                                </dd>
                              </div>
                              <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <dt className="text-sm font-medium text-gray-500">
                                  Purchase Price
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                  {property.purchase_price ? `£${property.purchase_price.toLocaleString()}` : 'Not available'}
                                </dd>
                              </div>
                              <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <dt className="text-sm font-medium text-gray-500">
                                  Current Valuation
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                  {property.current_valuation ? `£${property.current_valuation.toLocaleString()}` : 'Not available'}
                                </dd>
                              </div>
                            </dl>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-md border p-4 bg-white">
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <h4 className="text-sm font-medium text-gray-900">
                                Add Mortgage Information
                              </h4>
                            </div>
                            <div className="bg-gray-50 p-6 rounded-lg border border-dashed border-gray-300">
                              <div className="text-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">Upload mortgage documents</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                  Upload your mortgage agreement to keep track of your financial details
                                </p>
                                <div className="mt-6">
                                  <label htmlFor="mortgage-file-upload" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-[#D9E8FF] hover:bg-[#C5DAFF] cursor-pointer" data-component-name="PropertyDetails">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    Upload Document
                                  </label>
                                  <input id="mortgage-file-upload" name="mortgage-file-upload" type="file" className="sr-only" />
                                </div>
                              </div>
                            </div>
                            <div className="mt-4">
                              <h5 className="text-sm font-medium text-gray-700 mb-2">Or enter details manually</h5>
                              <button
                                type="button"
                                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                              >
                                Add Mortgage Details
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="insurance" className="mt-0">
                      {property.details?.insurance ? (
                        <div className="space-y-6">
                          <div className="rounded-md border p-4 bg-white">
                            <div className="space-y-4">
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
                                    £{property.details.insurance.coverage.toLocaleString()}
                                  </dd>
                                </div>
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                  <dt className="text-sm font-medium text-gray-500">
                                    Monthly Premium
                                  </dt>
                                  <dd className="mt-1 text-sm text-gray-900">
                                    £{property.details.insurance.premium.toLocaleString()}
                                  </dd>
                                </div>
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                  <dt className="text-sm font-medium text-gray-500">
                                    Expiry Date
                                  </dt>
                                  <dd className="mt-1 text-sm text-gray-900">
                                    {new Date(property.details.insurance.expiryDate).toLocaleDateString()}
                                  </dd>
                                </div>
                              </dl>
                            </div>
                          </div>
                          
                          {/* Insurance Upsell Opportunity */}
                          <div className="rounded-md border p-4 bg-[#F0F7FF] border-[#D9E8FF]">
                            <div className="flex items-start">
                              <div className="flex-shrink-0 mt-0.5">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div className="ml-3">
                                <h3 className="text-sm font-medium text-blue-800">Save up to 15% on your landlord insurance</h3>
                                <div className="mt-2 text-sm text-blue-700">
                                  <p>ZenRent has partnered with top insurance providers to offer exclusive discounts for our users. Compare quotes and potentially save £{Math.round(property.details.insurance.premium * 0.15 * 12)} annually.</p>
                                </div>
                                <div className="mt-4">
                                  <button
                                    type="button"
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-[#D9E8FF] hover:bg-blue-100"
                                  >
                                    Compare Insurance Quotes
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-md border p-4 bg-white">
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <h4 className="text-sm font-medium text-gray-900">
                                Add Insurance Information
                              </h4>
                            </div>
                            <div className="bg-gray-50 p-6 rounded-lg border border-dashed border-gray-300">
                              <div className="text-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">Upload insurance documents</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                  Upload your landlord insurance policy to keep track of coverage details
                                </p>
                                <div className="mt-6">
                                  <label htmlFor="insurance-file-upload" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-[#D9E8FF] hover:bg-[#C5DAFF] cursor-pointer" data-component-name="PropertyDetails">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    Upload Document
                                  </label>
                                  <input id="insurance-file-upload" name="insurance-file-upload" type="file" className="sr-only" />
                                </div>
                              </div>
                            </div>
                            <div className="mt-4">
                              <h5 className="text-sm font-medium text-gray-700 mb-2">Or enter details manually</h5>
                              <button
                                type="button"
                                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                              >
                                Add Insurance Details
                              </button>
                            </div>
                            
                            {/* Insurance Upsell Opportunity */}
                            <div className="mt-6 rounded-md border p-4 bg-[#F0F7FF] border-[#D9E8FF]">
                              <div className="flex items-start">
                                <div className="flex-shrink-0 mt-0.5">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <div className="ml-3">
                                  <h3 className="text-sm font-medium text-blue-800">Save up to 15% on your landlord insurance</h3>
                                  <div className="mt-2 text-sm text-blue-700">
                                    <p>ZenRent has partnered with top insurance providers to offer exclusive discounts for our users. Compare quotes and potentially save hundreds of pounds annually.</p>
                                  </div>
                                  <div className="mt-4">
                                    <button
                                      type="button"
                                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-[#D9E8FF] hover:bg-blue-100"
                                    >
                                      Compare Insurance Quotes
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="certificates" className="mt-0">
                      <div className="rounded-md border p-4 bg-white">
                        <div className="space-y-6">
                          <div className="flex justify-between items-center">
                            <h4 className="text-sm font-medium text-gray-900">
                              Property Certificates
                            </h4>
                            <button className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-gray-800">
                              <PlusIcon className="h-4 w-4 mr-1" />
                              Upload Certificate
                            </button>
                          </div>
                          
                          {/* EPC Certificate */}
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h5 className="text-sm font-medium text-gray-900">Energy Performance Certificate (EPC)</h5>
                                
                                {energyDataLoading ? (
                                  <div className="mt-2">
                                    <div className="animate-pulse">
                                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                    </div>
                                  </div>
                                ) : property.energyData ? (
                                  <div className="mt-2 space-y-2">
                                    <div className="flex items-center space-x-4">
                                      <div>
                                        <p className="text-sm text-gray-500">
                                          Energy Rating: <span className="font-medium text-gray-900">{property.energyData.epcRating}</span>
                                        </p>
                                        {property.energyData.energyScore && (
                                          <p className="text-sm text-gray-500">
                                            Energy Score: <span className="font-medium text-gray-900">{property.energyData.energyScore}</span>
                                          </p>
                                        )}
                                      </div>
                                      {property.energyData.potentialRating && (
                                        <div>
                                          <p className="text-sm text-gray-500">
                                            Potential Rating: <span className="font-medium text-gray-900">{property.energyData.potentialRating}</span>
                                          </p>
                                          {property.energyData.potentialScore && (
                                            <p className="text-sm text-gray-500">
                                              Potential Score: <span className="font-medium text-gray-900">{property.energyData.potentialScore}</span>
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    
                                    {property.energyData.totalEnergyCost && (
                                      <p className="text-sm text-gray-500">
                                        Annual Energy Cost: <span className="font-medium text-gray-900">£{property.energyData.totalEnergyCost}</span>
                                      </p>
                                    )}
                                    
                                    {property.energyData.co2Emissions && (
                                      <p className="text-sm text-gray-500">
                                        CO2 Emissions: <span className="font-medium text-gray-900">{property.energyData.co2Emissions} tonnes/year</span>
                                      </p>
                                    )}
                                    
                                    <p className="text-xs text-gray-500">
                                      {property.energyData.validUntil 
                                        ? `Valid until: ${new Date(property.energyData.validUntil).toLocaleDateString('en-GB')}`
                                        : 'Certificate validity date not available'
                                      }
                                    </p>
                                    
                                    {property.energyData.recommendations && property.energyData.recommendations.length > 0 && (
                                      <div className="mt-3 p-3 bg-green-50 rounded-md">
                                        <h6 className="text-xs font-medium text-green-800 mb-2">Energy Efficiency Recommendations:</h6>
                                        <ul className="text-xs text-green-700 space-y-1">
                                          {property.energyData.recommendations.slice(0, 3).map((rec, index) => (
                                            <li key={index} className="flex justify-between">
                                              <span>{rec.improvement}</span>
                                              <span className="font-medium">{rec.savingEstimate}</span>
                                            </li>
                                          ))}
                                          {property.energyData.recommendations.length > 3 && (
                                            <li className="text-green-600 font-medium">
                                              +{property.energyData.recommendations.length - 3} more recommendations
                                            </li>
                                          )}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="mt-2">
                                    <p className="text-sm text-gray-500">
                                  Energy Rating: {property.energy_rating || 'Not available'}
                                </p>
                                    <p className="text-xs text-gray-500">
                                      {property.energy_rating ? 'Certificate details not enriched' : 'No certificate on file'}
                                </p>
                              </div>
                                )}
                              </div>
                              
                              {!property.energyData && !property.energy_rating && (
                                <button className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-black bg-[#D9E8FF] hover:bg-blue-100">
                                  Book Inspection
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {/* Gas Safety Certificate */}
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="text-sm font-medium text-gray-900">Gas Safety Certificate</h5>
                                <p className="mt-1 text-sm text-gray-500">
                                  Last inspection: Not available
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                  No certificate on file
                                </p>
                              </div>
                              <button className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-black bg-[#D9E8FF] hover:bg-blue-100">
                                Book Inspection
                              </button>
                            </div>
                          </div>
                          
                          {/* Electrical Safety Certificate */}
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="text-sm font-medium text-gray-900">Electrical Installation Condition Report (EICR)</h5>
                                <p className="mt-1 text-sm text-gray-500">
                                  Last inspection: Not available
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                  No certificate on file
                                </p>
                              </div>
                              <button className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-black bg-[#D9E8FF] hover:bg-blue-100">
                                Book Inspection
                              </button>
                            </div>
                          </div>
                          
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <h5 className="text-sm font-medium text-gray-900">Need to book an inspection?</h5>
                            <p className="mt-1 text-sm text-gray-500">
                              We can arrange certified inspectors to visit your property and provide all necessary certificates to ensure legal compliance.
                            </p>
                            <button className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-[#D9E8FF] hover:bg-blue-100">
                              Schedule Inspections
                            </button>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="documents" className="mt-0">
                      <div className="rounded-md border p-4 bg-white">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center" data-component-name="PropertyDetails">
                            <h4 className="text-sm font-medium text-gray-900" data-component-name="PropertyDetails">
                              Property Documents
                            </h4>
                            <button className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-gray-800">
                              <PlusIcon className="h-4 w-4 mr-1" />
                              Upload Document
                            </button>
                          </div>

                          {/* No documents found - show upload interface */}
                          <div className="bg-gray-50 p-6 rounded-lg border border-dashed border-gray-300">
                            <div className="text-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <h3 className="mt-2 text-sm font-medium text-gray-900">No documents uploaded</h3>
                              <p className="mt-1 text-sm text-gray-500">
                                Upload important property documents like deeds, surveys, or contracts
                              </p>
                              <div className="mt-6">
                                <label htmlFor="document-file-upload" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-[#D9E8FF] hover:bg-[#C5DAFF] cursor-pointer" data-component-name="PropertyDetails">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                  </svg>
                                  Upload Documents
                                </label>
                                <input id="document-file-upload" name="document-file-upload" type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="sr-only" />
                                    </div>
                                    </div>
                                    </div>
                          
                          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <h5 className="text-sm font-medium text-blue-900">Recommended documents to upload:</h5>
                            <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
                              <li>Property deed or title documents</li>
                              <li>Building survey or structural reports</li>
                              <li>Planning permissions or building regulations</li>
                              <li>Warranty information for appliances</li>
                              <li>Service contracts (heating, security, etc.)</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
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
                  <h3 className="text-lg font-cabinet-grotesk font-bold text-gray-900">
                    Open Issues
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Current maintenance and repair issues.
                  </p>
                </div>
                <button className="w-full sm:w-auto px-4 py-2 bg-gray-900 rounded-md text-sm font-medium text-white hover:bg-gray-800 flex items-center justify-center"
                  onClick={openNewIssueDrawer}
                >
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
                  <div className="overflow-x-auto -mx-4 sm:mx-0 sm:rounded-lg" data-component-name="PropertyDetails">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            data-component-name="PropertyDetails"
                          >
                            Issue
                          </th>
                          <th scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell"
                            data-component-name="PropertyDetails"
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
                            <td className="px-6 py-4 text-sm text-gray-900" data-component-name="PropertyDetails">
                              <div className="flex items-center">
                                <div className="sm:hidden mr-2">
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
                                </div>
                                <span className="truncate">{issue.title}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
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
                  </div>
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
                              "/images/default/user-placeholder.png"
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
