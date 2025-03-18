'use client'

import { useParams } from 'next/navigation'
import { SidebarLayout } from '../../components/sidebar-layout'
import { SidebarContent } from '../../components/sidebar-content'
import { Heading } from '../../components/heading'
import { Text } from '../../components/text'
import { Link } from '../../../components/link'
import Image from 'next/image'
import { BuildingOffice2Icon, CurrencyDollarIcon, ExclamationCircleIcon, UserGroupIcon, KeyIcon } from '@heroicons/react/24/outline'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { classNames } from '../../../utils/classNames'
import { useState } from 'react'
import { PencilIcon, XMarkIcon } from '@heroicons/react/24/solid'

// Define property form state type
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

// Sample data - replace with real data from your backend
const properties = [
  {
    id: '123-main',
    name: '123 Main Street',
    stats: {
      totalRooms: 24,
      occupiedRooms: 22,
      monthlyRevenue: 52000,
      maintenanceCosts: 3200
    },
    images: [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914',
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be',
    ],
    floorPlan: '/sample-floor-plan.png',
    financials: {
      monthlyIncome: 52000,
      expenses: 12000,
      netIncome: 40000,
      occupancyRate: 91.6
    },
    details: {
      mortgage: {
        lender: 'ABC Bank',
        amount: 2500000,
        rate: '3.5%',
        term: '30 years',
        monthlyPayment: 11220
      },
      insurance: {
        provider: 'XYZ Insurance',
        coverage: 3000000,
        premium: 1200,
        expiryDate: '2025-03-15'
      }
    },
    issues: [
      { id: 1, title: 'Leaking roof in Room 202', priority: 'High', status: 'Open', reported: '2024-03-08' },
      { id: 2, title: 'Broken heating in Room 105', priority: 'Medium', status: 'In Progress', reported: '2024-03-07' },
    ],
    tenants: [
      {
        id: '1',
        name: 'Leslie Abbott',
        room: 'Room 101',
        email: 'leslie.abbott@example.com',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        status: 'Current',
        leaseEnd: '2024-08-15'
      },
      {
        id: '2',
        name: 'Michael Foster',
       room: 'Room 102',
        email: 'michael.foster@example.com',
        image: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        status: 'Current',
        leaseEnd: '2024-09-30'
      }
    ]
  }
]

export default function PropertyDetails() {
  const params = useParams()
  const propertyId = params.id as string
  const property = properties.find(p => p.id === propertyId)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedProperty(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically update the property in your backend
    console.log('Updated property:', editedProperty);
    setIsDrawerOpen(false);
  };

  // Load initial property data when opening the drawer
  const handleEditClick = () => {
    // Here you would typically fetch the property data from your backend
    // For now, we'll use dummy data
    setEditedProperty({
      name: 'Sunset Apartments',
      address: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      type: 'apartment',
      status: 'available',
      bedrooms: '2',
      bathrooms: '2',
      squareFeet: '1200',
      rentAmount: '3500',
      description: 'Modern apartment complex in prime location',
      amenities: 'Pool, Gym, Parking',
      yearBuilt: '2015',
      parkingSpots: '2'
    });
    setIsDrawerOpen(true);
  };

  if (!property) {
    return (
      <SidebarLayout
        sidebar={<SidebarContent currentPath="/properties" />}
      >
        <div className="space-y-6">
          <div className="text-center py-12">
            <h3 className="text-base font-semibold text-gray-900">Property not found</h3>
            <p className="mt-1 text-sm text-gray-500">The property you're looking for doesn't exist or has been removed.</p>
          </div>
        </div>
      </SidebarLayout>
    )
  }

  return (
    <SidebarLayout
      sidebar={<SidebarContent currentPath="/properties" />}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 flex items-center justify-center rounded-lg bg-gray-100">
              <BuildingOffice2Icon className="h-8 w-8 text-gray-600" />
            </div>
            <div>
              <Heading level={1} className="text-2xl font-bold">{property.name}</Heading>
              <Text className="text-gray-500 mt-1">{property.tenants.length} tenants</Text>
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <button
              onClick={handleEditClick}
              className="inline-flex items-center px-4 py-2 bg-gray-900 rounded-md text-sm font-medium text-white hover:bg-gray-800"
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
                  <BuildingOffice2Icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Rooms</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{property.stats.totalRooms}</div>
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
                  <UserGroupIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Occupied Rooms</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{property.stats.occupiedRooms}</div>
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
                  <CurrencyDollarIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Monthly Revenue</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">£{property.stats.monthlyRevenue.toLocaleString()}</div>
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
                  <KeyIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Maintenance Costs</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">£{property.stats.maintenanceCosts.toLocaleString()}</div>
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
                <h3 className="text-base/7 font-semibold text-gray-900">Property Information</h3>
                <p className="mt-1 max-w-2xl text-sm/6 text-gray-500">Basic details about the property.</p>
              </div>
              <div className="border-t border-gray-100">
                <dl className="divide-y divide-gray-100">
                  <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-900">Address</dt>
                    <dd className="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0">{property.name}</dd>
                  </div>
                  <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-900">Total Rooms</dt>
                    <dd className="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0">{property.stats.totalRooms}</dd>
                  </div>
                  <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-900">Occupancy Rate</dt>
                    <dd className="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0">
                      {((property.stats.occupiedRooms / property.stats.totalRooms) * 100).toFixed(1)}%
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Tabs Section */}
            <div className="space-y-6">
              {/* Tabs Navigation */}
              <div className="w-full">
                <Tabs defaultValue="images" className="w-full">
                  <TabsList className="w-full mb-4 flex flex-row flex-nowrap">
                    <TabsTrigger value="images" className="flex-1 text-center w-full">
                      Images
                    </TabsTrigger>
                    <TabsTrigger value="floor-plan" className="flex-1 text-center w-full">
                      Floor Plan
                    </TabsTrigger>
                    <TabsTrigger value="financials" className="flex-1 text-center w-full">
                      Financials
                    </TabsTrigger>
                    <TabsTrigger value="details" className="flex-1 text-center w-full">
                      Details
                    </TabsTrigger>
                  </TabsList>

                  {/* Tab Content */}
                  <div>
                    <TabsContent value="images" className="mt-0">
                      <div className="rounded-md border p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {property.images.map((image, index) => (
                            <div key={index} className="aspect-[4/3] relative overflow-hidden rounded-lg">
                              <Image
                                src={image}
                                alt={`Property image ${index + 1}`}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="floor-plan" className="mt-0">
                      <div className="rounded-md border p-4">
                        <div className="aspect-[16/9] relative overflow-hidden rounded-lg">
                          <Image
                            src={property.floorPlan}
                            alt="Floor plan"
                            fill
                            className="object-contain"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="financials" className="mt-0">
                      <div className="rounded-md border p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-900">Monthly Income</h4>
                            <p className="mt-2 text-2xl font-semibold text-gray-900">
                              £{property.financials.monthlyIncome.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-900">Monthly Expenses</h4>
                            <p className="mt-2 text-2xl font-semibold text-gray-900">
                              £{property.financials.expenses.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-900">Net Income</h4>
                            <p className="mt-2 text-2xl font-semibold text-gray-900">
                              £{property.financials.netIncome.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-900">Occupancy Rate</h4>
                            <p className="mt-2 text-2xl font-semibold text-gray-900">
                              {property.financials.occupancyRate}%
                            </p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="details" className="mt-0">
                      <div className="rounded-md border p-4">
                        <div className="space-y-6">
                          {/* Mortgage Information */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-4">Mortgage Information</h4>
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <dt className="text-sm font-medium text-gray-500">Lender</dt>
                                <dd className="mt-1 text-sm text-gray-900">{property.details.mortgage.lender}</dd>
                              </div>
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <dt className="text-sm font-medium text-gray-500">Amount</dt>
                                <dd className="mt-1 text-sm text-gray-900">£{property.details.mortgage.amount.toLocaleString()}</dd>
                              </div>
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <dt className="text-sm font-medium text-gray-500">Interest Rate</dt>
                                <dd className="mt-1 text-sm text-gray-900">{property.details.mortgage.rate}</dd>
                              </div>
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <dt className="text-sm font-medium text-gray-500">Monthly Payment</dt>
                                <dd className="mt-1 text-sm text-gray-900">£{property.details.mortgage.monthlyPayment.toLocaleString()}</dd>
                              </div>
                            </dl>
                          </div>
                          {/* Insurance Information */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-4">Insurance Information</h4>
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <dt className="text-sm font-medium text-gray-500">Provider</dt>
                                <dd className="mt-1 text-sm text-gray-900">{property.details.insurance.provider}</dd>
                              </div>
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <dt className="text-sm font-medium text-gray-500">Coverage Amount</dt>
                                <dd className="mt-1 text-sm text-gray-900">£{property.details.insurance.coverage.toLocaleString()}</dd>
                              </div>
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <dt className="text-sm font-medium text-gray-500">Monthly Premium</dt>
                                <dd className="mt-1 text-sm text-gray-900">£{property.details.insurance.premium.toLocaleString()}</dd>
                              </div>
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <dt className="text-sm font-medium text-gray-500">Expiry Date</dt>
                                <dd className="mt-1 text-sm text-gray-900">{new Date(property.details.insurance.expiryDate).toLocaleDateString()}</dd>
                              </div>
                            </dl>
                          </div>
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
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-base font-semibold text-gray-900">Open Issues</h3>
                <p className="mt-1 text-sm text-gray-500">Current maintenance and repair issues.</p>
              </div>
              <div className="border-t border-gray-200">
                <ul role="list" className="divide-y divide-gray-200">
                  {property.issues.map((issue) => (
                    <li key={issue.id} className="px-4 py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <ExclamationCircleIcon className={classNames(
                            'h-6 w-6',
                            issue.priority === 'High' ? 'text-red-500' : 'text-yellow-500'
                          )} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">{issue.title}</p>
                          <p className="text-sm text-gray-500">
                            {issue.status} • Reported {new Date(issue.reported).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Tenants Table */}
            <div className="bg-white shadow-sm sm:rounded-lg border border-gray-200">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-base font-semibold text-gray-900">Current Tenants</h3>
                <p className="mt-1 text-sm text-gray-500">List of tenants and their rooms.</p>
              </div>
              <div className="border-t border-gray-200">
                <ul role="list" className="divide-y divide-gray-200">
                  {property.tenants.map((tenant) => (
                    <li key={tenant.id} className="px-4 py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <Image
                            src={tenant.image}
                            alt={tenant.name}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">{tenant.name}</p>
                          <p className="text-sm text-gray-500">{tenant.room}</p>
                          <p className="text-xs text-gray-400">Lease ends {new Date(tenant.leaseEnd).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <Link
                            href={`/residents/${tenant.id}`}
                            className="text-sm text-indigo-600 hover:text-indigo-900"
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
                          <h2 className="text-lg font-medium text-gray-900">Edit Property</h2>
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
                                value={editedProperty.name}
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
                                value={editedProperty.address}
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
                                  value={editedProperty.city}
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
                                  value={editedProperty.state}
                                  onChange={handleInputChange}
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                                />
                              </div>
                            </div>

                            <div>
                              <label htmlFor="zipCode" className="block text-sm font-medium text-gray-900">
                                Post Code
                              </label>
                              <input
                                type="text"
                                name="zipCode"
                                id="zipCode"
                                required
                                value={editedProperty.zipCode}
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
                                value={editedProperty.type}
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
                                value={editedProperty.status}
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
                                  value={editedProperty.bedrooms}
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
                                  value={editedProperty.bathrooms}
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
                                  value={editedProperty.squareFeet}
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
                                  value={editedProperty.rentAmount}
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
                                value={editedProperty.amenities}
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
                                  value={editedProperty.yearBuilt}
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
                                  value={editedProperty.parkingSpots}
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
                                value={editedProperty.description}
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
      </div>
    </SidebarLayout>
  )
}