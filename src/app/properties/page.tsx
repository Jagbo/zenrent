'use client'

import { useState } from 'react'
import { SidebarLayout } from '../components/sidebar-layout'
import { SidebarContent } from '../components/sidebar-content'
import { Heading } from '../components/heading'
import { Text } from '../components/text'
import { Link } from '../../components/link'
import { BuildingOffice2Icon } from '@heroicons/react/24/outline'
import { EllipsisHorizontalIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/solid'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'

// Helper function for class names
function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

// Define the Property interface
interface Property {
  id: string;
  name: string;
  address: string;
  type: string;
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

// Reuse the sample data from the residents page
const properties: Property[] = [
  {
    id: '123-main',
    name: '123 Main Street',
    address: 'Manchester, M1 1AA',
    type: 'Apartment Building',
    units: 12,
    occupancyRate: 92,
    monthlyRevenue: 15000,
    image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&h=400'
  },
  {
    id: '456-park',
    name: '456 Park Avenue',
    address: 'Liverpool, L1 1AA',
    type: 'Townhouse Complex',
    units: 8,
    occupancyRate: 100,
    monthlyRevenue: 12000,
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&h=400'
  },
  {
    id: '789-ocean',
    name: '789 Ocean Drive',
    address: 'Brighton, BN1 1AA',
    type: 'Apartment Building',
    units: 15,
    occupancyRate: 87,
    monthlyRevenue: 18000,
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&h=400'
  },
  {
    id: '321-victoria',
    name: '321 Victoria Road',
    address: 'Edinburgh, EH1 1AA',
    type: 'Victorian Houses',
    units: 6,
    occupancyRate: 100,
    monthlyRevenue: 9000,
    image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=800&h=400'
  },
  {
    id: '654-royal',
    name: '654 Royal Crescent',
    address: 'Bath, BA1 1AA',
    type: 'Heritage Building',
    units: 10,
    occupancyRate: 90,
    monthlyRevenue: 14000,
    image: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&h=400'
  },
  {
    id: '987-kings',
    name: '987 Kings Road',
    address: 'London, SW3 1AA',
    type: 'Luxury Apartments',
    units: 20,
    occupancyRate: 95,
    monthlyRevenue: 45000,
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&h=400'
  }
]

export default function Properties() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically save the property to your backend
    console.log('New property:', newProperty);
    setIsDrawerOpen(false);
    setNewProperty({
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
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically update the property in your backend
    console.log('Updated property:', editedProperty);
    setIsEditDrawerOpen(false);
  };

  const handleEditClick = (property: Property) => {
    // Here you would typically fetch the property data from your backend
    // For now, we'll use the property data we have
    setEditedProperty({
      name: property.name,
      address: property.address,
      city: '', // Add these from your property data when available
      state: '',
      zipCode: '',
      type: property.type,
      status: 'available',
      bedrooms: '',
      bathrooms: '',
      squareFeet: '',
      rentAmount: property.monthlyRevenue.toString(),
      description: '',
      amenities: '',
      yearBuilt: '',
      parkingSpots: ''
    });
    setIsEditDrawerOpen(true);
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
              className="inline-flex items-center px-4 py-2 bg-gray-900 rounded-md text-sm font-medium text-white hover:bg-gray-800"
            >
              <PlusIcon className="h-5 w-5 mr-1" />
              Add Property
            </button>
          </div>
        </div>

        {/* Property Form Drawer */}
        {isDrawerOpen && (
          <div className="fixed inset-0 overflow-hidden z-50">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-0 bg-transparent transition-opacity" onClick={() => setIsDrawerOpen(false)} />
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <div className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col bg-white shadow-xl">
                    <div className="flex-1 h-0 overflow-y-auto">
                      <div className="py-6 px-4 bg-gray-50 sm:px-6">
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-medium text-gray-900">Add New Property</h2>
                          <button
                            type="button"
                            className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                            onClick={() => setIsDrawerOpen(false)}
                          >
                            <XMarkIcon className="h-6 w-6" />
                          </button>
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="px-4 sm:px-6">
                          <form onSubmit={handleSubmit} className="space-y-6 pt-6 pb-5">
                            <div>
                              <label htmlFor="name" className="block text-sm font-medium text-gray-900">
                                Property Name
                              </label>
                              <input
                                type="text"
                                name="name"
                                id="name"
                                required
                                value={newProperty.name}
                                onChange={handleInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                                placeholder="e.g., Sunset Apartments"
                              />
                            </div>

                            <div>
                              <label htmlFor="address" className="block text-sm font-medium text-gray-900">
                                Street Address
                              </label>
                              <input
                                type="text"
                                name="address"
                                id="address"
                                required
                                value={newProperty.address}
                                onChange={handleInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label htmlFor="city" className="block text-sm font-medium text-gray-900">
                                  City
                                </label>
                                <input
                                  type="text"
                                  name="city"
                                  id="city"
                                  required
                                  value={newProperty.city}
                                  onChange={handleInputChange}
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                                />
                              </div>
                              <div>
                                <label htmlFor="state" className="block text-sm font-medium text-gray-900">
                                  State
                                </label>
                                <input
                                  type="text"
                                  name="state"
                                  id="state"
                                  required
                                  value={newProperty.state}
                                  onChange={handleInputChange}
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                                />
                              </div>
                            </div>

                            <div>
                              <label htmlFor="zipCode" className="block text-sm font-medium text-gray-900">
                                ZIP Code
                              </label>
                              <input
                                type="text"
                                name="zipCode"
                                id="zipCode"
                                required
                                value={newProperty.zipCode}
                                onChange={handleInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                              />
                            </div>

                            <div>
                              <label htmlFor="type" className="block text-sm font-medium text-gray-900">
                                Property Type
                              </label>
                              <select
                                name="type"
                                id="type"
                                required
                                value={newProperty.type}
                                onChange={handleInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                              >
                                <option value="apartment">Apartment</option>
                                <option value="house">House</option>
                                <option value="condo">Condo</option>
                                <option value="townhouse">Townhouse</option>
                                <option value="duplex">Duplex</option>
                                <option value="commercial">Commercial</option>
                              </select>
                            </div>

                            <div>
                              <label htmlFor="status" className="block text-sm font-medium text-gray-900">
                                Status
                              </label>
                              <select
                                name="status"
                                id="status"
                                required
                                value={newProperty.status}
                                onChange={handleInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                              >
                                <option value="available">Available</option>
                                <option value="rented">Rented</option>
                                <option value="maintenance">Under Maintenance</option>
                                <option value="renovation">Under Renovation</option>
                              </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-900">
                                  Bedrooms
                                </label>
                                <input
                                  type="number"
                                  name="bedrooms"
                                  id="bedrooms"
                                  required
                                  value={newProperty.bedrooms}
                                  onChange={handleInputChange}
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                                />
                              </div>
                              <div>
                                <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-900">
                                  Bathrooms
                                </label>
                                <input
                                  type="number"
                                  name="bathrooms"
                                  id="bathrooms"
                                  required
                                  value={newProperty.bathrooms}
                                  onChange={handleInputChange}
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label htmlFor="squareFeet" className="block text-sm font-medium text-gray-900">
                                  Square Feet
                                </label>
                                <input
                                  type="number"
                                  name="squareFeet"
                                  id="squareFeet"
                                  required
                                  value={newProperty.squareFeet}
                                  onChange={handleInputChange}
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                                />
                              </div>
                              <div>
                                <label htmlFor="rentAmount" className="block text-sm font-medium text-gray-900">
                                  Monthly Rent ($)
                                </label>
                                <input
                                  type="number"
                                  name="rentAmount"
                                  id="rentAmount"
                                  required
                                  value={newProperty.rentAmount}
                                  onChange={handleInputChange}
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                                />
                              </div>
                            </div>

                            <div>
                              <label htmlFor="amenities" className="block text-sm font-medium text-gray-900">
                                Amenities
                              </label>
                              <input
                                type="text"
                                name="amenities"
                                id="amenities"
                                value={newProperty.amenities}
                                onChange={handleInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                                placeholder="e.g., Pool, Gym, Parking"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label htmlFor="yearBuilt" className="block text-sm font-medium text-gray-900">
                                  Year Built
                                </label>
                                <input
                                  type="number"
                                  name="yearBuilt"
                                  id="yearBuilt"
                                  value={newProperty.yearBuilt}
                                  onChange={handleInputChange}
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                                />
                              </div>
                              <div>
                                <label htmlFor="parkingSpots" className="block text-sm font-medium text-gray-900">
                                  Parking Spots
                                </label>
                                <input
                                  type="number"
                                  name="parkingSpots"
                                  id="parkingSpots"
                                  value={newProperty.parkingSpots}
                                  onChange={handleInputChange}
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                                />
                              </div>
                            </div>

                            <div>
                              <label htmlFor="description" className="block text-sm font-medium text-gray-900">
                                Description
                              </label>
                              <textarea
                                name="description"
                                id="description"
                                rows={3}
                                value={newProperty.description}
                                onChange={handleInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                                placeholder="Property description and additional details..."
                              />
                            </div>

                            <div className="mt-5 sm:mt-6">
                              <button
                                type="submit"
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-900 text-base font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 sm:text-sm"
                              >
                                Add Property
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Property Drawer */}
        {isEditDrawerOpen && (
          <div className="fixed inset-0 overflow-hidden z-50">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-gray-500/75 transition-opacity" onClick={() => setIsEditDrawerOpen(false)} />
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full">
                <div className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col bg-white shadow-xl">
                    <div className="flex-1 h-0 overflow-y-auto">
                      <div className="py-6 px-4 bg-gray-50 sm:px-6">
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-medium text-gray-900">Edit Property</h2>
                          <button
                            type="button"
                            className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                            onClick={() => setIsEditDrawerOpen(false)}
                          >
                            <XMarkIcon className="h-6 w-6" />
                          </button>
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="px-4 sm:px-6">
                          <form onSubmit={handleEditSubmit} className="space-y-6 pt-6 pb-5">
                            <div>
                              <label htmlFor="name" className="block text-sm font-medium text-gray-900">
                                Property Name
                              </label>
                              <input
                                type="text"
                                name="name"
                                id="name"
                                required
                                value={editedProperty.name}
                                onChange={handleEditInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                                placeholder="e.g., Sunset Apartments"
                              />
                            </div>

                            <div>
                              <label htmlFor="address" className="block text-sm font-medium text-gray-900">
                                Street Address
                              </label>
                              <input
                                type="text"
                                name="address"
                                id="address"
                                required
                                value={editedProperty.address}
                                onChange={handleEditInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label htmlFor="city" className="block text-sm font-medium text-gray-900">
                                  City
                                </label>
                                <input
                                  type="text"
                                  name="city"
                                  id="city"
                                  required
                                  value={editedProperty.city}
                                  onChange={handleEditInputChange}
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                                />
                              </div>
                              <div>
                                <label htmlFor="state" className="block text-sm font-medium text-gray-900">
                                  State
                                </label>
                                <input
                                  type="text"
                                  name="state"
                                  id="state"
                                  required
                                  value={editedProperty.state}
                                  onChange={handleEditInputChange}
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                                />
                              </div>
                            </div>

                            <div>
                              <label htmlFor="type" className="block text-sm font-medium text-gray-900">
                                Property Type
                              </label>
                              <select
                                name="type"
                                id="type"
                                required
                                value={editedProperty.type}
                                onChange={handleEditInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                              >
                                <option value="apartment">Apartment</option>
                                <option value="house">House</option>
                                <option value="condo">Condo</option>
                                <option value="townhouse">Townhouse</option>
                                <option value="duplex">Duplex</option>
                                <option value="commercial">Commercial</option>
                              </select>
                            </div>

                            <div>
                              <label htmlFor="status" className="block text-sm font-medium text-gray-900">
                                Status
                              </label>
                              <select
                                name="status"
                                id="status"
                                required
                                value={editedProperty.status}
                                onChange={handleEditInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                              >
                                <option value="available">Available</option>
                                <option value="rented">Rented</option>
                                <option value="maintenance">Under Maintenance</option>
                                <option value="renovation">Under Renovation</option>
                              </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-900">
                                  Bedrooms
                                </label>
                                <input
                                  type="number"
                                  name="bedrooms"
                                  id="bedrooms"
                                  required
                                  value={editedProperty.bedrooms}
                                  onChange={handleEditInputChange}
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                                />
                              </div>
                              <div>
                                <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-900">
                                  Bathrooms
                                </label>
                                <input
                                  type="number"
                                  name="bathrooms"
                                  id="bathrooms"
                                  required
                                  value={editedProperty.bathrooms}
                                  onChange={handleEditInputChange}
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label htmlFor="squareFeet" className="block text-sm font-medium text-gray-900">
                                  Square Feet
                                </label>
                                <input
                                  type="number"
                                  name="squareFeet"
                                  id="squareFeet"
                                  required
                                  value={editedProperty.squareFeet}
                                  onChange={handleEditInputChange}
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                                />
                              </div>
                              <div>
                                <label htmlFor="rentAmount" className="block text-sm font-medium text-gray-900">
                                  Monthly Rent ($)
                                </label>
                                <input
                                  type="number"
                                  name="rentAmount"
                                  id="rentAmount"
                                  required
                                  value={editedProperty.rentAmount}
                                  onChange={handleEditInputChange}
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                                />
                              </div>
                            </div>

                            <div>
                              <label htmlFor="amenities" className="block text-sm font-medium text-gray-900">
                                Amenities
                              </label>
                              <input
                                type="text"
                                name="amenities"
                                id="amenities"
                                value={editedProperty.amenities}
                                onChange={handleEditInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                                placeholder="e.g., Pool, Gym, Parking"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label htmlFor="yearBuilt" className="block text-sm font-medium text-gray-900">
                                  Year Built
                                </label>
                                <input
                                  type="number"
                                  name="yearBuilt"
                                  id="yearBuilt"
                                  value={editedProperty.yearBuilt}
                                  onChange={handleEditInputChange}
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                                />
                              </div>
                              <div>
                                <label htmlFor="parkingSpots" className="block text-sm font-medium text-gray-900">
                                  Parking Spots
                                </label>
                                <input
                                  type="number"
                                  name="parkingSpots"
                                  id="parkingSpots"
                                  value={editedProperty.parkingSpots}
                                  onChange={handleEditInputChange}
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                                />
                              </div>
                            </div>

                            <div>
                              <label htmlFor="description" className="block text-sm font-medium text-gray-900">
                                Description
                              </label>
                              <textarea
                                name="description"
                                id="description"
                                rows={3}
                                value={editedProperty.description}
                                onChange={handleEditInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                                placeholder="Property description and additional details..."
                              />
                            </div>

                            <div className="mt-5 sm:mt-6">
                              <button
                                type="submit"
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-900 text-base font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 sm:text-sm"
                              >
                                Save Changes
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Property Grid List */}
        <ul role="list" className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
          {properties.map((property) => {
            const occupancyStatus = getOccupancyStatus(property.occupancyRate);
            
            return (
              <li key={property.id} className="overflow-hidden rounded-xl border border-gray-200">
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
                    <dt className="text-gray-500">Occupancy</dt>
                    <dd className="flex items-start gap-x-2">
                      <div className="font-medium text-gray-900">{property.occupancyRate}%</div>
                      <div
                        className={classNames(
                          occupancyStatus.style,
                          'rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset'
                        )}
                      >
                        {occupancyStatus.text}
                      </div>
                    </dd>
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
      </div>
    </SidebarLayout>
  )
} 