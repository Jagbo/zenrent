'use client'

import { useState, useEffect } from 'react'
import { SidebarLayout } from '../components/sidebar-layout'
import { SidebarContent } from '../components/sidebar-content'
import { Heading } from '../components/heading'
import { Text } from '../components/text'
import { Link } from '../../components/link'
import { BuildingOffice2Icon } from '@heroicons/react/24/outline'
import { EllipsisHorizontalIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/solid'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { MagnifyingGlassIcon, PencilIcon, ArrowLeftOnRectangleIcon, Squares2X2Icon, ListBulletIcon, MegaphoneIcon } from '@heroicons/react/20/solid'
import { PropertyFormDrawer } from '../components/PropertyFormDrawer'
import { EditPropertyDrawer } from '../components/EditPropertyDrawer'
import { AdvertisePropertyDrawer } from '../components/AdvertisePropertyDrawer'
import { useAuth } from '../../lib/auth'
import { getProperties, IProperty } from '../../lib/propertyService'

// Helper function for class names
function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
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

// Define the PropertyFormState interface
interface PropertyFormState {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  type: string;
  status: string;
  bedrooms: string;
  bathrooms: string;
  squareFeet: string;
  rentAmount: string;
  description: string;
  amenities: string;
  yearBuilt: string;
  parkingSpots: string;
}

// Status colors based on occupancy rate
const getOccupancyStatus = (rate: number) => {
  if (rate >= 90) return { text: 'High', style: 'text-green-700 bg-green-50 ring-green-600/20' };
  if (rate >= 75) return { text: 'Medium', style: 'text-yellow-700 bg-yellow-50 ring-yellow-600/20' };
  return { text: 'Low', style: 'text-red-700 bg-red-50 ring-red-600/10' };
}

// Convert IProperty from Supabase to PropertyForUI for display
const convertToUIProperty = (property: IProperty): PropertyForUI => {
  // Default image if not available
  const defaultImage = 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&h=400';
  
  // Calculate occupancy rate if units data is available
  const units = property.units || 1;
  const occupiedUnits = property.occupied_units || 0;
  const occupancyRate = Math.round((occupiedUnits / units) * 100);
  
  // Calculate monthly revenue based on rent amount
  const monthlyRevenue = property.rentAmount || 0;
  
  return {
    id: property.id,
    name: property.name || property.address,
    address: `${property.address}, ${property.city}${property.zipCode ? `, ${property.zipCode}` : ''}`,
    city: property.city,
    state: property.state || '',
    zipCode: property.zipCode || '',
    type: property.property_type,
    status: property.status || 'available',
    bedrooms: property.bedrooms || 0,
    bathrooms: property.bathrooms || 0,
    squareFeet: property.squareFeet || 0,
    rentAmount: property.rentAmount || 0,
    description: property.description || '',
    amenities: property.amenities || [],
    yearBuilt: property.yearBuilt || 0,
    parkingSpots: property.parkingSpots || 0,
    units: units,
    occupancyRate: occupancyRate,
    monthlyRevenue: monthlyRevenue,
    image: property.image || defaultImage
  };
};

// Sample data for fallback
const sampleProperties: PropertyForUI[] = [
  {
    id: '123-main',
    name: '123 Main Street',
    address: 'Manchester, M1 1AA',
    city: 'Manchester',
    state: 'Greater Manchester',
    zipCode: 'M1 1AA',
    type: 'Apartment Building',
    status: 'available',
    units: 12,
    occupancyRate: 92,
    monthlyRevenue: 15000,
    rentAmount: 15000,
    bedrooms: 2,
    bathrooms: 1,
    squareFeet: 800,
    description: 'Modern apartment building in Manchester city center',
    amenities: ['Parking', 'Elevator', 'Security'],
    yearBuilt: 2010,
    parkingSpots: 12,
    image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&h=400'
  },
  {
    id: '456-park',
    name: '456 Park Avenue',
    address: 'Liverpool, L1 1AA',
    city: 'Liverpool',
    state: 'Merseyside',
    zipCode: 'L1 1AA',
    type: 'Townhouse Complex',
    status: 'available',
    units: 8,
    occupancyRate: 100,
    monthlyRevenue: 12000,
    rentAmount: 12000,
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1200,
    description: 'Modern townhouse complex in Liverpool',
    amenities: ['Garden', 'Parking', 'Pet Friendly'],
    yearBuilt: 2015,
    parkingSpots: 10,
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&h=400'
  },
  {
    id: '789-ocean',
    name: '789 Ocean Drive',
    address: 'Brighton, BN1 1AA',
    city: 'Brighton',
    state: 'East Sussex',
    zipCode: 'BN1 1AA',
    type: 'Apartment Building',
    status: 'available',
    units: 15,
    occupancyRate: 87,
    monthlyRevenue: 18000,
    rentAmount: 18000,
    bedrooms: 2,
    bathrooms: 1,
    squareFeet: 750,
    description: 'Seafront apartment complex in Brighton',
    amenities: ['Sea View', 'Balcony', 'Gym'],
    yearBuilt: 2008,
    parkingSpots: 15,
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&h=400'
  },
  {
    id: '321-victoria',
    name: '321 Victoria Road',
    address: 'Edinburgh, EH1 1AA',
    city: 'Edinburgh',
    state: 'Midlothian',
    zipCode: 'EH1 1AA',
    type: 'Victorian Houses',
    status: 'available',
    units: 6,
    occupancyRate: 100,
    monthlyRevenue: 9000,
    rentAmount: 9000,
    bedrooms: 4,
    bathrooms: 2,
    squareFeet: 1500,
    description: 'Charming Victorian houses in Edinburgh',
    amenities: ['Garden', 'Fireplace', 'High Ceilings'],
    yearBuilt: 1890,
    parkingSpots: 6,
    image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=800&h=400'
  },
  {
    id: '654-royal',
    name: '654 Royal Crescent',
    address: 'Bath, BA1 1AA',
    city: 'Bath',
    state: 'Somerset',
    zipCode: 'BA1 1AA',
    type: 'Heritage Building',
    status: 'available',
    units: 10,
    occupancyRate: 90,
    monthlyRevenue: 14000,
    rentAmount: 14000,
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1300,
    description: 'Stunning heritage building in Bath city center',
    amenities: ['Period Features', 'Communal Garden', 'Parking'],
    yearBuilt: 1820,
    parkingSpots: 8,
    image: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&h=400'
  },
  {
    id: '987-kings',
    name: '987 Kings Road',
    address: 'London, SW3 1AA',
    city: 'London',
    state: 'Greater London',
    zipCode: 'SW3 1AA',
    type: 'Luxury Apartments',
    status: 'available',
    units: 20,
    occupancyRate: 95,
    monthlyRevenue: 45000,
    rentAmount: 45000,
    bedrooms: 3,
    bathrooms: 3,
    squareFeet: 2000,
    description: 'High-end luxury apartments in Chelsea',
    amenities: ['Concierge', 'Gym', 'Spa', 'Underground Parking'],
    yearBuilt: 2018,
    parkingSpots: 25,
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&h=400'
  }
]

export default function Properties() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<PropertyForUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isAdvertiseDrawerOpen, setIsAdvertiseDrawerOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<PropertyForUI | null>(null);
  const [editedProperty, setEditedProperty] = useState<PropertyFormState>({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    type: 'apartment',
    status: 'available',
    bedrooms: '',
    bathrooms: '',
    squareFeet: '',
    rentAmount: '',
    description: '',
    amenities: '',
    yearBuilt: '',
    parkingSpots: ''
  });
  const [newProperty, setNewProperty] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    type: 'apartment',
    status: 'available',
    bedrooms: '',
    bathrooms: '',
    squareFeet: '',
    rentAmount: '',
    description: '',
    amenities: '',
    yearBuilt: '',
    parkingSpots: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch properties when the component mounts
  useEffect(() => {
    const fetchPropertiesData = async () => {
      if (user?.id) {
        setLoading(true);
        try {
          const propData = await getProperties(user.id);
          console.log('Properties fetched:', propData.length);
          
          if (propData.length > 0) {
            // Convert to UI format
            const uiProperties = propData.map(convertToUIProperty);
            setProperties(uiProperties);
          } else {
            console.log('No properties found, using sample data');
            setProperties(sampleProperties);
          }
        } catch (error) {
          console.error('Error fetching properties:', error);
          setProperties(sampleProperties);
        } finally {
          setLoading(false);
        }
      } else {
        console.log('No user ID available, using sample data');
        setProperties(sampleProperties);
        setLoading(false);
      }
    };

    fetchPropertiesData();
  }, [user?.id]);

  // Filter properties based on search term
  const filteredProperties = properties.filter(property => 
    property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewProperty(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedProperty((prev: PropertyFormState) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (formData: PropertyFormState) => {
    console.log('New property data:', formData);
    setIsDrawerOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Updated property:', editedProperty);
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

  const handleEditSave = (updatedProperty: any) => {
    console.log('Updated property:', updatedProperty);
    setIsEditDrawerOpen(false);
  };

  return (
    <SidebarLayout
      sidebar={<SidebarContent currentPath="/properties" />}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <Heading level={1} className="text-2xl font-bold">Properties</Heading>
            <Text className="text-gray-500 mt-1">Manage your properties and view details.</Text>
          </div>
          <div className="mt-4 md:mt-0">
            <button
              onClick={() => setIsDrawerOpen(true)}
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
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            name="search"
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-md border-0 py-2.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-900 sm:text-sm sm:leading-6 bg-white"
            placeholder="Search properties..."
          />
        </div>

        {/* Property Form Drawer */}
        <PropertyFormDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onSubmit={handleSubmit}
          title="Add New Property"
        />

        {/* Edit Property Drawer */}
        <EditPropertyDrawer
          isOpen={isEditDrawerOpen}
          onClose={() => setIsEditDrawerOpen(false)}
          property={selectedProperty}
          onSave={handleEditSave}
        />

        {/* Advertise Property Drawer */}
        <AdvertisePropertyDrawer
          isOpen={isAdvertiseDrawerOpen}
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
              <BuildingOffice2Icon className="h-full w-full" aria-hidden="true" />
            </div>
            <h3 className="mt-2 text-sm font-cabinet-grotesk-bold text-gray-900">No Properties</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? "No properties match your search criteria." : "Get started by adding your first property."}
            </p>
            <div className="mt-6">
              <button
                onClick={() => setIsDrawerOpen(true)}
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
          <ul role="list" className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
            {filteredProperties.map((property) => {
              const occupancyStatus = getOccupancyStatus(property.occupancyRate);
              
              return (
                <li key={property.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <div className="relative h-48 border-b border-gray-200">
                    {property.image ? (
                      <img
                        alt={property.name}
                        src={property.image}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-100">
                        <BuildingOffice2Icon className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-4">
                      <div className="text-base font-medium text-white">{property.name}</div>
                      <Menu as="div" className="relative">
                        <MenuButton className="rounded-full bg-white/80 p-1.5 text-gray-700 hover:bg-white">
                          <span className="sr-only">Open options</span>
                          <EllipsisHorizontalIcon aria-hidden="true" className="size-5" />
                        </MenuButton>
                        <MenuItems
                          transition
                          className="absolute right-0 z-10 mt-0.5 w-32 origin-top-right rounded-md bg-white py-2 ring-1 shadow-lg ring-gray-900/5 transition focus:outline-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
                        >
                          <MenuItem>
                            <Link
                              href={`/properties/${property.id}`}
                              className="block px-3 py-1 text-sm/6 text-gray-900 data-focus:bg-gray-50 data-focus:outline-hidden"
                            >
                              View<span className="sr-only">, {property.name}</span>
                            </Link>
                          </MenuItem>
                          <MenuItem>
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                handleEditClick(property);
                              }}
                              className="block px-3 py-1 text-sm/6 text-gray-900 data-focus:bg-gray-50 data-focus:outline-hidden"
                            >
                              Edit<span className="sr-only">, {property.name}</span>
                            </a>
                          </MenuItem>
                          <MenuItem>
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                handleAdvertiseClick(property);
                              }}
                              className="block px-3 py-1 text-sm/6 text-gray-900 data-focus:bg-gray-50 data-focus:outline-hidden"
                            >
                              Advertise<span className="sr-only">, {property.name}</span>
                            </a>
                          </MenuItem>
                        </MenuItems>
                      </Menu>
                    </div>
                  </div>
                  <dl className="-my-3 divide-y divide-gray-100 px-6 py-4 text-sm/6">
                    <div className="flex justify-between gap-x-4 py-3">
                      <dt className="text-gray-500">Property Type</dt>
                      <dd className="text-gray-700">{property.type}</dd>
                    </div>
                    <div className="flex justify-between gap-x-4 py-3">
                      <dt className="text-gray-500">Monthly Revenue</dt>
                      <dd className="font-medium text-gray-900">£{property.monthlyRevenue.toLocaleString()}</dd>
                    </div>
                  </dl>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </SidebarLayout>
  )
} 