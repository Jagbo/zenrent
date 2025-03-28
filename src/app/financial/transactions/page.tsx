'use client'

import { useState } from 'react'
import { SidebarLayout } from '../../components/sidebar-layout'
import { SidebarContent } from '../../components/sidebar-content'
import { Heading } from '../../components/heading'
import { Text } from '../../components/text'
import { XMarkIcon, ArrowDownIcon, FunnelIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid'
import { Link } from '@/components/link'

// Transaction type definition
interface Transaction {
  date: string;
  type: string;
  category: string;
  description: string;
  property: string;
  amount: string;
  status: string;
}

// Sample transactions data
const sampleTransactions: Transaction[] = [
  {
    date: "Mar 8, 2024",
    type: "Income",
    category: "Rent",
    description: "Monthly Rent - Room 204",
    property: "Sunset Apartments",
    amount: "+£1,850.00",
    status: "Completed"
  },
  {
    date: "Mar 7, 2024",
    type: "Expense",
    category: "Maintenance",
    description: "Emergency Plumbing Repair",
    property: "Oakwood Heights",
    amount: "-£850.00",
    status: "Completed"
  },
  {
    date: "Mar 5, 2024",
    type: "Income",
    category: "Fees",
    description: "Late Fee - Room 112",
    property: "Sunset Apartments",
    amount: "+£75.00",
    status: "Completed"
  },
  {
    date: "Mar 3, 2024",
    type: "Expense",
    category: "Property Care",
    description: "Landscaping Services",
    property: "Royal Gardens",
    amount: "-£450.00",
    status: "Pending"
  },
  {
    date: "Mar 1, 2024",
    type: "Income",
    category: "Rent",
    description: "Monthly Rent - Room 305",
    property: "Parkview Residences",
    amount: "+£2,100.00",
    status: "Completed"
  },
  {
    date: "Feb 28, 2024",
    type: "Expense",
    category: "Utilities",
    description: "Electricity Bill - Common Areas",
    property: "Sunset Apartments",
    amount: "-£320.00",
    status: "Completed"
  },
  {
    date: "Feb 25, 2024",
    type: "Income",
    category: "Rent",
    description: "Monthly Rent - Room 108",
    property: "Oakwood Heights",
    amount: "+£1,650.00",
    status: "Completed"
  },
  {
    date: "Feb 20, 2024",
    type: "Expense",
    category: "Administrative",
    description: "Insurance Premium",
    property: "All Properties",
    amount: "-£1,200.00",
    status: "Completed"
  },
  {
    date: "Feb 15, 2024",
    type: "Income",
    category: "Rent",
    description: "Monthly Rent - Room 401",
    property: "Royal Gardens",
    amount: "+£1,950.00",
    status: "Completed"
  },
  {
    date: "Feb 10, 2024",
    type: "Expense",
    category: "Maintenance",
    description: "HVAC Maintenance",
    property: "Parkview Residences",
    amount: "-£550.00",
    status: "Completed"
  },
]

export default function Transactions() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [propertyFilter, setPropertyFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  const handleViewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setIsDrawerOpen(true)
  }

  const filteredTransactions = sampleTransactions.filter(transaction => {
    // Apply search term filter
    if (searchTerm && !Object.values(transaction).some(value => 
      value.toLowerCase().includes(searchTerm.toLowerCase()))) {
      return false
    }
    
    // Apply type filter
    if (typeFilter !== 'All' && transaction.type !== typeFilter) {
      return false
    }
    
    // Apply category filter
    if (categoryFilter !== 'All' && transaction.category !== categoryFilter) {
      return false
    }
    
    // Apply property filter
    if (propertyFilter !== 'All' && transaction.property !== propertyFilter) {
      return false
    }
    
    // Apply status filter
    if (statusFilter !== 'All' && transaction.status !== statusFilter) {
      return false
    }
    
    return true
  })

  // Get unique values for filters
  const types = ['All', ...new Set(sampleTransactions.map(t => t.type))]
  const categories = ['All', ...new Set(sampleTransactions.map(t => t.category))]
  const properties = ['All', ...new Set(sampleTransactions.map(t => t.property))]
  const statuses = ['All', ...new Set(sampleTransactions.map(t => t.status))]

  return (
    <SidebarLayout
      sidebar={<SidebarContent currentPath="/financial" />}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <Heading level={1} className="text-2xl font-bold">Transactions</Heading>
            <Text className="text-gray-500 mt-1">View and manage all financial transactions.</Text>
          </div>
          <div className="mt-4 md:mt-0">
            <Link href="/financial" className="inline-flex items-center px-4 py-2 border border-gray-300 bg-white rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
              Back to Financial Overview
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                className="form-select rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                {types.map(type => (
                  <option key={type} value={type}>{type} Type</option>
                ))}
              </select>
              <select
                className="form-select rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category} Category</option>
                ))}
              </select>
              <select
                className="form-select rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={propertyFilter}
                onChange={(e) => setPropertyFilter(e.target.value)}
              >
                {properties.map(property => (
                  <option key={property} value={property}>{property}</option>
                ))}
              </select>
              <select
                className="form-select rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {statuses.map(status => (
                  <option key={status} value={status}>{status} Status</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.property}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={transaction.amount.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                        {transaction.amount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a 
                        href="#" 
                        className="text-blue-600 hover:text-blue-900"
                        onClick={(e) => {
                          e.preventDefault()
                          handleViewTransaction(transaction)
                        }}
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredTransactions.length === 0 && (
            <div className="text-center py-6">
              <Text className="text-gray-500">No transactions found matching your filters.</Text>
            </div>
          )}
          
          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <a href="#" className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Previous
              </a>
              <a href="#" className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Next
              </a>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredTransactions.length}</span> of <span className="font-medium">{filteredTransactions.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <a
                    href="#"
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <span className="sr-only">Previous</span>
                    &lsaquo;
                  </a>
                  <a
                    href="#"
                    aria-current="page"
                    className="z-10 bg-[#D9E8FF]/5 border-indigo-500 text-gray-900 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                  >
                    1
                  </a>
                  <a
                    href="#"
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <span className="sr-only">Next</span>
                    &rsaquo;
                  </a>
                </nav>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Details Drawer */}
        {isDrawerOpen && selectedTransaction && (
          <div className="fixed inset-0 overflow-hidden z-50">
            <div className="absolute inset-0 overflow-hidden">
              <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setIsDrawerOpen(false)} />
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <div className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col bg-white shadow-xl">
                    <div className="flex-1 overflow-y-auto py-6">
                      <div className="px-4 sm:px-6">
                        <div className="flex items-start justify-between">
                          <h2 className="text-lg font-medium text-gray-900">Transaction Details</h2>
                          <button
                            type="button"
                            className="ml-3 flex h-7 w-7 items-center justify-center rounded-md bg-white text-gray-400 hover:text-gray-500"
                            onClick={() => setIsDrawerOpen(false)}
                          >
                            <XMarkIcon className="h-6 w-6" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-6 px-4 sm:px-6">
                        <dl className="divide-y divide-gray-200">
                          <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="text-sm font-medium text-gray-500">Date</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{selectedTransaction.date}</dd>
                          </div>
                          <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="text-sm font-medium text-gray-500">Type</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{selectedTransaction.type}</dd>
                          </div>
                          <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="text-sm font-medium text-gray-500">Category</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{selectedTransaction.category}</dd>
                          </div>
                          <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="text-sm font-medium text-gray-500">Description</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{selectedTransaction.description}</dd>
                          </div>
                          <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="text-sm font-medium text-gray-500">Property</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{selectedTransaction.property}</dd>
                          </div>
                          <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="text-sm font-medium text-gray-500">Amount</dt>
                            <dd className={`mt-1 text-sm sm:col-span-2 sm:mt-0 ${selectedTransaction.amount.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                              {selectedTransaction.amount}
                            </dd>
                          </div>
                          <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="text-sm font-medium text-gray-500">Status</dt>
                            <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                selectedTransaction.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {selectedTransaction.status}
                              </span>
                            </dd>
                          </div>
                        </dl>
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