'use client'

import { useState } from 'react'
import { SidebarLayout } from '../components/sidebar-layout'
import { Heading } from '../components/heading'
import { Text } from '../components/text'
import { SidebarContent } from '../components/sidebar-content'
import Link from 'next/link'
import Image from 'next/image'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { EllipsisHorizontalIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid'

// Define types for our supplier data
interface ServiceInfo {
  date: string;
  dateTime: string;
  amount: string;
  status: 'Available' | 'Busy' | 'Unavailable';
}

interface SupplierContact {
  email: string;
  phone: string;
}

interface Supplier {
  id: number;
  name: string;
  imageUrl: string;
  contact: SupplierContact;
  lastService: ServiceInfo;
  rating: string;
}

type SupplierCategory = 'Cleaner' | 'Handyman' | 'Plumbing' | 'Electrics' | 'Other';

type SupplierData = {
  [K in SupplierCategory]: Supplier[];
};

// Sample suppliers data
const statuses: Record<ServiceInfo['status'], string> = {
  Available: 'text-green-700 bg-green-50 ring-green-600/20',
  Busy: 'text-orange-700 bg-orange-50 ring-orange-600/10',
  Unavailable: 'text-red-700 bg-red-50 ring-red-600/10',
}

const suppliers: SupplierData = {
  Cleaner: [
    {
      id: 1,
      name: 'FastClean Services',
      imageUrl: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
      contact: { email: 'schedule@fastclean.com', phone: '(555) 123-4567' },
      lastService: { date: 'March 10, 2024', dateTime: '2024-03-10', amount: '£250.00', status: 'Available' },
      rating: '★★★★☆',
    },
    {
      id: 2,
      name: 'Sparkle Cleaning Co.',
      imageUrl: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
      contact: { email: 'info@sparklecleaning.com', phone: '(555) 234-5678' },
      lastService: { date: 'March 15, 2024', dateTime: '2024-03-15', amount: '£320.00', status: 'Busy' },
      rating: '★★★★★',
    },
    {
      id: 3,
      name: 'GreenClean Eco Services',
      imageUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
      contact: { email: 'contact@greenclean.com', phone: '(555) 345-6789' },
      lastService: { date: 'March 5, 2024', dateTime: '2024-03-05', amount: '£275.00', status: 'Available' },
      rating: '★★★☆☆',
    },
  ],
  Handyman: [
    {
      id: 4,
      name: 'FixIt Handyman',
      imageUrl: 'https://images.unsplash.com/photo-1529316365294-599e7f244f1c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
      contact: { email: 'service@fixithandyman.com', phone: '(555) 456-7890' },
      lastService: { date: 'March 8, 2024', dateTime: '2024-03-08', amount: '£180.00', status: 'Available' },
      rating: '★★★★☆',
    },
    {
      id: 5,
      name: 'Home Solutions',
      imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
      contact: { email: 'contact@homesolutions.com', phone: '(555) 567-8901' },
      lastService: { date: 'March 12, 2024', dateTime: '2024-03-12', amount: '£220.00', status: 'Unavailable' },
      rating: '★★★☆☆',
    },
  ],
  Plumbing: [
    {
      id: 6,
      name: 'ABC Plumbing',
      imageUrl: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
      contact: { email: 'john@abcplumbing.com', phone: '(555) 678-9012' },
      lastService: { date: 'March 3, 2024', dateTime: '2024-03-03', amount: '£420.00', status: 'Available' },
      rating: '★★★★☆',
    },
    {
      id: 7,
      name: 'Premier Plumbing',
      imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
      contact: { email: 'service@premierplumbing.com', phone: '(555) 789-0123' },
      lastService: { date: 'March 17, 2024', dateTime: '2024-03-17', amount: '£350.00', status: 'Busy' },
      rating: '★★★★★',
    },
  ],
  Electrics: [
    {
      id: 8,
      name: 'City Electric',
      imageUrl: 'https://images.unsplash.com/photo-1555963966-b7ae5252581a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
      contact: { email: 'info@cityelectric.com', phone: '(555) 890-1234' },
      lastService: { date: 'March 9, 2024', dateTime: '2024-03-09', amount: '£380.00', status: 'Available' },
      rating: '★★★★★',
    },
    {
      id: 9,
      name: 'Bright Spark Electrical',
      imageUrl: 'https://images.unsplash.com/photo-1620881058460-ede2eec3853c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
      contact: { email: 'service@brightspark.com', phone: '(555) 901-2345' },
      lastService: { date: 'March 14, 2024', dateTime: '2024-03-14', amount: '£290.00', status: 'Busy' },
      rating: '★★★★☆',
    },
  ],
  Other: [
    {
      id: 10,
      name: 'Green Landscaping',
      imageUrl: 'https://images.unsplash.com/photo-1558904541-efa5a24b0dda?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
      contact: { email: 'contact@greenlandscaping.com', phone: '(555) 012-3456' },
      lastService: { date: 'March 6, 2024', dateTime: '2024-03-06', amount: '£450.00', status: 'Available' },
      rating: '★★★☆☆',
    },
    {
      id: 11,
      name: 'Secure Locks',
      imageUrl: 'https://images.unsplash.com/photo-1580428456283-5dc0a0fde2f8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
      contact: { email: 'support@securelocks.com', phone: '(555) 123-4567' },
      lastService: { date: 'March 2, 2024', dateTime: '2024-03-02', amount: '£180.00', status: 'Available' },
      rating: '★★★★☆',
    },
  ],
}

function classNames(...classes: string[]): string {
  return classes.filter(Boolean).join(' ')
}

export default function Suppliers() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | SupplierCategory>('all')

  // Filter suppliers based on search query
  const getFilteredSuppliers = (): Supplier[] => {
    const allSuppliers = Object.entries(suppliers).flatMap(([_, list]) => list)
    
    if (activeTab !== 'all') {
      const categorySuppliers = suppliers[activeTab] || []
      return categorySuppliers.filter(supplier => 
        supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.contact.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    return allSuppliers.filter(supplier => 
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.contact.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
  }

  return (
    <SidebarLayout
      sidebar={<SidebarContent currentPath="/suppliers" />}
      searchValue={searchQuery}
      onSearchChange={handleSearchChange}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <Heading level={2} className="text-2xl font-bold text-gray-900">Suppliers</Heading>
            <Text className="text-gray-500 mt-1">Manage your property maintenance and service providers.</Text>
          </div>
        </div>
        
        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full" onValueChange={(value) => setActiveTab(value as 'all' | SupplierCategory)}>
          <TabsList className="w-full grid grid-cols-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="Cleaner">Cleaner</TabsTrigger>
            <TabsTrigger value="Handyman">Handyman</TabsTrigger>
            <TabsTrigger value="Plumbing">Plumbing</TabsTrigger>
            <TabsTrigger value="Electrics">Electrics</TabsTrigger>
            <TabsTrigger value="Other">Other</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="pt-6">
            <SupplierGrid suppliers={getFilteredSuppliers()} />
          </TabsContent>
          <TabsContent value="Cleaner" className="pt-6">
            <SupplierGrid suppliers={getFilteredSuppliers()} />
          </TabsContent>
          <TabsContent value="Handyman" className="pt-6">
            <SupplierGrid suppliers={getFilteredSuppliers()} />
          </TabsContent>
          <TabsContent value="Plumbing" className="pt-6">
            <SupplierGrid suppliers={getFilteredSuppliers()} />
          </TabsContent>
          <TabsContent value="Electrics" className="pt-6">
            <SupplierGrid suppliers={getFilteredSuppliers()} />
          </TabsContent>
          <TabsContent value="Other" className="pt-6">
            <SupplierGrid suppliers={getFilteredSuppliers()} />
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  )
}

// Grid component for displaying suppliers
function SupplierGrid({ suppliers }: { suppliers: Supplier[] }) {
  return (
    <>
      {suppliers.length === 0 ? (
        <div className="text-center py-10">
          <h3 className="mt-2 text-sm font-medium text-gray-900">No suppliers found</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
        </div>
      ) : (
        <ul role="list" className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
          {suppliers.map((supplier) => (
            <li key={supplier.id} className="overflow-hidden rounded-xl border border-gray-200">
              <div className="flex items-center gap-x-4 border-b border-gray-900/5 bg-gray-100 p-6">
                <div className="h-12 w-12 flex-none overflow-hidden rounded-lg bg-white">
                  <Image
                    alt={supplier.name}
                    src={supplier.imageUrl}
                    width={48}
                    height={48}
                    className="object-cover"
                  />
                </div>
                <div className="text-sm/6 font-medium text-gray-900">{supplier.name}</div>
                <Menu as="div" className="relative ml-auto">
                  <MenuButton className="-m-2.5 block p-2.5 text-gray-400 hover:text-gray-500">
                    <span className="sr-only">Open options</span>
                    <EllipsisHorizontalIcon aria-hidden="true" className="size-5" />
                  </MenuButton>
                  <MenuItems
                    transition
                    className="absolute right-0 z-10 mt-0.5 w-32 origin-top-right rounded-md bg-white py-2 ring-1 shadow-lg ring-gray-900/5 focus:outline-none"
                  >
                    <MenuItem>
                      <a
                        href="#"
                        className="block px-3 py-1 text-sm/6 text-gray-900 hover:bg-gray-50"
                      >
                        View<span className="sr-only">, {supplier.name}</span>
                      </a>
                    </MenuItem>
                    <MenuItem>
                      <a
                        href="#"
                        className="block px-3 py-1 text-sm/6 text-gray-900 hover:bg-gray-50"
                      >
                        Edit<span className="sr-only">, {supplier.name}</span>
                      </a>
                    </MenuItem>
                  </MenuItems>
                </Menu>
              </div>
              <dl className="-my-3 divide-y divide-gray-100 px-6 py-4 text-sm/6 bg-white">
                <div className="flex justify-between gap-x-4 py-3">
                  <dt className="text-gray-500">Contact</dt>
                  <dd className="text-gray-700">{supplier.contact.email}</dd>
                </div>
                <div className="flex justify-between gap-x-4 py-3">
                  <dt className="text-gray-500">Rating</dt>
                  <dd className="flex items-center text-gray-700">{supplier.rating}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </>
  )
} 