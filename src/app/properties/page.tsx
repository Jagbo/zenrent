"use client";

import { useState, useEffect } from "react";
import { SidebarLayout } from "../components/sidebar-layout";
import { SidebarContent } from "../components/sidebar-content";
import { Heading } from "../components/heading";
import { Text } from "../components/text";
import { Link } from "../../components/link";
import { BuildingOffice2Icon, PlusIcon, MagnifyingGlassIcon, EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
import {
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { Menu, MenuButton, MenuItem, MenuItems, Portal } from "@headlessui/react";
import {
  PencilIcon,
  ArrowLeftOnRectangleIcon,
  Squares2X2Icon,
  ListBulletIcon,
  MegaphoneIcon,
} from "@heroicons/react/20/solid";
import { PropertyFormDrawer } from "../components/PropertyFormDrawer";
import { EditPropertyDrawer } from "../components/EditPropertyDrawer";
import { AdvertisePropertyDrawer } from "../components/AdvertisePropertyDrawer";
import { useAuth } from "../../lib/auth-provider";
import { getProperties, IProperty } from "../../lib/propertyService";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import { PropertyFormState } from "../components/PropertyFormDrawer";
import { toast } from "react-hot-toast";
import Image from "next/image";

// Helper function for class names
function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

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
}

// Status colors based on occupancy rate
const getOccupancyStatus = (rate: number) => {
  if (rate >= 90)
    return {
      text: "High",
      style: "text-green-700 bg-green-50 ring-green-600/20",
    };
  if (rate >= 75)
    return {
      text: "Medium",
      style: "text-yellow-700 bg-yellow-50 ring-yellow-600/20",
    };
  return { text: "Low", style: "text-red-700 bg-red-50 ring-red-600/10" };
};

// Convert IProperty from Supabase to PropertyForUI for display
const convertToUIProperty = (property: IProperty): PropertyForUI => {
  const getDefaultImageByType = (type: string) => {
    const typeToLower = (type || "").toLowerCase();
    
    if (typeToLower.includes('hmo')) {
      return "/images/default/HMO-image.png";
    } else if (typeToLower.includes('flat') || typeToLower.includes('apartment')) {
      return "/images/default/Flat-image.png";
    } else if (typeToLower.includes('house') || typeToLower.includes('townhouse') || typeToLower.includes('detached')) {
      return "/images/default/House-image.png";
    }
    
    // Use local placeholder instead of Unsplash
    return "/images/default/property-placeholder.png";
  };

  // Log the property for debugging purposes
  console.log("Converting property to UI:", property.id, property.address);

  // Calculate occupancy rate if units data is available
  const units = property.units || 1;
  const occupiedUnits = property.occupied_units || 0;
  const occupancyRate =
    units > 0 ? Math.round((occupiedUnits / units) * 100) : 0;

  // Extract amenities from metadata if available
  let amenities: string[] = [];
  if (
    property.metadata &&
    typeof property.metadata === "object" &&
    "amenities" in property.metadata
  ) {
    amenities = (property.metadata.amenities as string[]) || [];
  }

  // Calculate monthly revenue or use default
  const rentAmount =
    typeof property.rentAmount === "number" ? property.rentAmount : 0;

  // Get the property type and determine default image
  const propertyType = property.property_type || "Not specified";
  const defaultImage = getDefaultImageByType(propertyType);

  return {
    id: property.id,
    name: property.name || property.address,
    address: property.address
      ? `${property.address}${property.city ? `, ${property.city}` : ""}${property.postcode ? `, ${property.postcode}` : ""}`
      : "Address not available",
    city: property.city || "",
    state: property.state || "",
    zipCode: property.postcode || property.zipCode || "",
    type: propertyType,
    status: property.status || "available",
    bedrooms: property.bedrooms || 0,
    bathrooms: property.bathrooms || 0,
    squareFeet: property.metadata?.square_footage || property.squareFeet || 0,
    rentAmount: rentAmount,
    description: property.description || "",
    amenities: amenities,
    yearBuilt: property.metadata?.year_built || property.yearBuilt || 0,
    parkingSpots: property.has_parking ? 1 : 0,
    units: units,
    occupancyRate: occupancyRate,
    monthlyRevenue: rentAmount, // For now use rent amount as monthly revenue
    image: property.photo_url || property.image || defaultImage,
  };
};

export default function Properties() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<PropertyForUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isAdvertiseDrawerOpen, setIsAdvertiseDrawerOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] =
    useState<PropertyForUI | null>(null);
  const [editedProperty, setEditedProperty] = useState<PropertyFormState>({
    address: "",
    city: "",
    postcode: "",
    property_type: "HMO",
    bedrooms: "",
    bathrooms: "",
    description: "",
    is_furnished: false,
    has_garden: false,
    has_parking: false,
    energy_rating: "",
    council_tax_band: "",
    notes: "",
  });
  const [newProperty, setNewProperty] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    type: "apartment",
    status: "available",
    bedrooms: "",
    bathrooms: "",
    squareFeet: "",
    rentAmount: "",
    description: "",
    amenities: "",
    yearBuilt: "",
    parkingSpots: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  // Fetch properties when the component mounts
  useEffect(() => {
    const fetchPropertiesData = async () => {
      setLoading(true);
      try {
        let propData: IProperty[] = [];

        if (user?.id) {
          propData = await getProperties(user.id);
          console.log("Properties fetched:", propData.length);
        } else if (process.env.NODE_ENV === "development") {
          // In development mode, try to get properties without user ID
          console.log(
            "No user ID available in development mode, trying to fetch properties anyway",
          );
          propData = await getProperties();
        }

        if (propData.length > 0) {
          // Convert to UI format
          const uiProperties = propData.map(convertToUIProperty);
          setProperties(uiProperties);
        } else {
          console.log("No properties found in the API response");
          setProperties([]);
        }
      } catch (error) {
        console.error("Error in fetchPropertiesData:", error);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPropertiesData();
  }, [user?.id]);

  // Filter properties based on search term
  const filteredProperties = properties.filter(
    (property) =>
      property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.type.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setNewProperty((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setEditedProperty((prev: PropertyFormState) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (formData: PropertyFormState) => {
    try {
      const supabase = createClientComponentClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please sign in to add a property");
        return;
      }

      // Generate a unique property code
      const propertyCode = uuidv4().slice(0, 8).toUpperCase();

      const { data, error } = await supabase
        .from("properties")
        .insert([
          {
            user_id: user.id,
            property_code: propertyCode,
            address: formData.address,
            city: formData.city,
            postcode: formData.postcode,
            property_type: formData.property_type,
            bedrooms: parseInt(formData.bedrooms),
            bathrooms: parseInt(formData.bathrooms),
            description: formData.description,
            is_furnished: formData.is_furnished,
            has_garden: formData.has_garden,
            has_parking: formData.has_parking,
            energy_rating: formData.energy_rating,
            council_tax_band: formData.council_tax_band,
            notes: formData.notes,
            status: "available",
          },
        ])
        .select();

      if (error) {
        toast.error("Failed to save property. Please try again.");
        console.error("Error saving property:", error);
        return;
      }

      toast.success("Property added successfully!");
      setIsDrawerOpen(false);
      // Refresh the properties list
      router.refresh();
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
      console.error("Error saving property:", error);
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Updated property:", editedProperty);
    setIsEditDrawerOpen(false);
  };

  const handleEditClick = (property: PropertyForUI) => {
    setSelectedProperty(property);
    setIsEditDrawerOpen(true);
  };

  const handleAdvertiseClick = (property: PropertyForUI) => {
    setSelectedProperty(property);
    setIsAdvertiseDrawerOpen(true);
  };

  const handleEditSave = (updatedProperty: unknown) => {
    console.log("Updated property:", updatedProperty);
    setIsEditDrawerOpen(false);
  };

  const handleDeleteProperty = async (property: PropertyForUI) => {
    try {
      const supabase = createClientComponentClient();

      const { error } = await supabase
        .from("properties")
        .delete()
        .eq("id", property.id);

      if (error) {
        toast.error("Failed to delete property. Please try again.");
        console.error("Error deleting property:", error);
        return;
      }

      toast.success("Property deleted successfully!");
      // Refresh the properties list
      router.refresh();
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
      console.error("Error deleting property:", error);
    }
  };

  return (
    <SidebarLayout sidebar={<SidebarContent currentPath="/properties" />}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <Heading level={1} className="text-2xl font-bold">
              Properties
            </Heading>
            <Text className="text-gray-500 mt-1">
              Manage your properties and view details.
            </Text>
          </div>
          <div className="mt-4 md:mt-0">
            <button onClick={() => setIsDrawerOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-[#D9E8FF] rounded-md text-sm font-medium text-black hover:bg-[#C8D7EE]"
            >
              <PlusIcon className="h-5 w-5 mr-1" />
              Add Property
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </div>
          <input type="text"
            name="search"
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-md border-0 py-2.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-900 sm:text-sm sm:leading-6 bg-white"
            placeholder="Search properties..."
          />
        </div>

        {/* Property Form Drawer */}
        <PropertyFormDrawer isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onSubmit={handleSubmit}
          title="Add New Property"
        />

        {/* Edit Property Drawer */}
        <EditPropertyDrawer isOpen={isEditDrawerOpen}
          onClose={() => setIsEditDrawerOpen(false)}
          property={selectedProperty}
          onSave={handleEditSave}
        />

        {/* Advertise Property Drawer */}
        <AdvertisePropertyDrawer isOpen={isAdvertiseDrawerOpen}
          onClose={() => setIsAdvertiseDrawerOpen(false)}
          propertyName={selectedProperty?.name}
        />

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredProperties.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <BuildingOffice2Icon className="h-full w-full"
                aria-hidden="true"
              />
            </div>
            <h3 className="mt-2 text-sm font-cabinet-grotesk-bold text-gray-900">
              No Properties
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm
                ? "No properties match your search criteria."
                : "Get started by adding your first property."}
            </p>
            <div className="mt-6">
              <button onClick={() => setIsDrawerOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-[#D9E8FF] rounded-md text-sm font-medium text-black hover:bg-[#C8D7EE]"
              >
                <PlusIcon className="h-5 w-5 mr-1" />
                Add Property
              </button>
            </div>
          </div>
        )}

        {/* Property Grid List */}
        {!loading && filteredProperties.length > 0 && (
          <ul role="list"
            className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8"
          >
            {filteredProperties.map((property) => {
              const occupancyStatus = getOccupancyStatus(
                property.occupancyRate,
              );

              return (
                <li key={property.id}
                  className="rounded-xl border border-gray-200 bg-white" style={{ overflow: 'visible' }}
                >
                  <div className="relative h-48 border-b border-gray-200">
                    {property.image ? (
                      <Image 
                        alt={property.name}
                        src={property.image}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-100">
                        <BuildingOffice2Icon className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-4">
                      <div className="text-base font-medium text-white">
                        {property.name}
                      </div>
                      <Menu as="div" className="relative" data-component-name="Properties">
                        <MenuButton className="rounded-full bg-white/80 p-1.5 text-gray-700 hover:bg-white">
                          <span className="sr-only">Open options</span>
                          <EllipsisHorizontalIcon aria-hidden="true"
                            className="size-5"
                          />
                        </MenuButton>
                        <div className="absolute z-50" style={{ right: 0, top: '100%', minWidth: '8rem', overflow: 'visible', transformOrigin: 'top right' }}>
                          <MenuItems className="mt-1 w-32 origin-top-right rounded-md bg-white py-2 ring-1 shadow-lg ring-gray-900/5 focus:outline-none">
                            <MenuItem>
                              <Link href={`/properties/${property.id}`}
                                className="block px-3 py-1 text-sm/6 text-gray-900 data-focus:bg-gray-50 data-focus:outline-hidden"
                              >
                                View
                                <span className="sr-only">, {property.name}</span>
                              </Link>
                            </MenuItem>
                            <MenuItem>
                              <a href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleEditClick(property);
                                }}
                                className="block px-3 py-1 text-sm/6 text-gray-900 data-focus:bg-gray-50 data-focus:outline-hidden"
                              >
                                Edit
                                <span className="sr-only">, {property.name}</span>
                              </a>
                            </MenuItem>
                            <MenuItem>
                              <a href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleAdvertiseClick(property);
                                }}
                                className="block px-3 py-1 text-sm/6 text-gray-900 data-focus:bg-gray-50 data-focus:outline-hidden"
                              >
                                Advertise
                                <span className="sr-only">, {property.name}</span>
                              </a>
                            </MenuItem>
                            <MenuItem>
                              <a href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (
                                    window.confirm(
                                      "Are you sure you want to delete this property? This action cannot be undone.",
                                    )
                                  ) {
                                    handleDeleteProperty(property);
                                  }
                                }}
                                className="block px-3 py-1 text-sm/6 text-red-600 data-focus:bg-gray-50 data-focus:outline-hidden"
                              >
                                Delete
                                <span className="sr-only">, {property.name}</span>
                              </a>
                            </MenuItem>
                          </MenuItems>
                        </div>
                      </Menu>
                    </div>
                  </div>
                  <dl className="-my-3 divide-y divide-gray-100 px-6 py-4 text-sm/6">
                    <div className="flex justify-between gap-x-4 py-3">
                      <dt className="text-gray-500">Property Type</dt>
                      <dd className="text-gray-700">{property.type}</dd>
                    </div>
                    <div className="flex justify-between gap-x-4 py-3">
                      <dt className="text-gray-500" data-component-name="Properties">Monthly Rent</dt>
                      <dd className="font-medium text-gray-900" data-component-name="Properties">
                        £{property.rentAmount > 0 ? property.rentAmount.toLocaleString() : property.monthlyRevenue.toLocaleString()}
                      </dd>
                    </div>
                  </dl>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </SidebarLayout>
  );
}
