'use client'

import { useState, useEffect } from 'react'
import { SidebarLayout } from '../../components/sidebar-layout'
import { SidebarContent } from '../../components/sidebar-content'
import { Heading } from '../../components/heading'
import { Text } from '../../components/text'
import { XMarkIcon, ArrowDownIcon, FunnelIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid'
import { Link } from '@/components/link'

// Transaction type definition
interface Transaction {
  id: string;
  date: string;
  type: string;
  category: string;
  description: string;
  property: string;
  amount: number;
  status: string;
}

interface Property {
  id: string;
  address: string;
  property_code: string;
}

// Add the FinancialData interface like in the main financial page
interface FinancialData {
  expenses: any[];
  income: any[];
  transactions: Transaction[];
  total_income: number;
  total_expenses: number;
  net_profit: number;
  // Add properties field for all-properties response
  properties?: {
    property_id: string;
    property_address: string;
    property_code: string;
    transactions: Transaction[];
  }[];
}

// Helper function to get combined transactions from all properties
const getCombinedTransactions = (data: FinancialData | null): Transaction[] => {
  if (!data) return [];
  
  // If it's a single property response, transactions are already at the top level
  if (data.transactions) {
    return data.transactions;
  }
  
  // If it's an all-properties response, combine transactions from all properties
  if (data.properties) {
    console.log(`[TRANSACTIONS] Combining transactions from ${data.properties.length} properties`);
    
    // Collect all transactions from each property
    const allTransactions = data.properties.flatMap(property => {
      console.log(`[TRANSACTIONS] Property ${property.property_id}: ${property.transactions?.length || 0} transactions`);
      
      return (property.transactions || []).map((transaction: Transaction) => ({
        ...transaction,
        // Make sure property name is included
        property: transaction.property || property.property_address || 'Unknown'
      }));
    });
    
    console.log(`[TRANSACTIONS] Combined transactions: ${allTransactions.length}`);
    
    // Sort by date, most recent first
    return allTransactions.sort((a: Transaction, b: Transaction) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }
  
  return [];
};

// Get unique values for filters from real data - rename to avoid conflict with properties state variable
const getTypes = (transactions: Transaction[]) => ['All', ...new Set(transactions.map(t => t.type))];
const getCategories = (transactions: Transaction[]) => ['All', ...new Set(transactions.map(t => t.category))];
const getPropertyNames = (transactions: Transaction[]) => ['All', ...new Set(transactions.map(t => t.property))];
const getStatuses = (transactions: Transaction[]) => ['All', ...new Set(transactions.map(t => t.status))];

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | 'all'>('all');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [propertyFilter, setPropertyFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);

        // First fetch properties
        const propertiesResponse = await fetch('/api/properties');
        const propertiesData = await propertiesResponse.json();

        if (!propertiesResponse.ok) {
          throw new Error('Failed to fetch properties');
        }

        if (!Array.isArray(propertiesData) || propertiesData.length === 0) {
          throw new Error('No properties found for this user');
        }
        
        setProperties(propertiesData);

        // Get 6 months of data
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString().split('T')[0];
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        
        // Fetch financial data from the API - use all properties (omit propertyId)
        const financesEndpoint = `/api/finances?startDate=${startDate}&endDate=${endDate}`;
        console.log(`[TRANSACTIONS] Fetching data from: ${financesEndpoint}`);
        
        const response = await fetch(financesEndpoint);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch financial data');
        }

        // Get combined transactions using our helper function
        const combinedTransactions = getCombinedTransactions(data);
        
        if (!combinedTransactions || combinedTransactions.length === 0) {
          throw new Error('No transaction data available');
        }

        console.log(`[TRANSACTIONS] Successfully fetched ${combinedTransactions.length} transactions`);
        setTransactions(combinedTransactions);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // Add handler to fetch data for a specific property
  const handlePropertyChange = async (propertyId: string | 'all') => {
    try {
      setLoading(true);
      setSelectedPropertyId(propertyId);
      
      // Get date range
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString().split('T')[0];
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      
      // Build URL based on property selection
      let financesEndpoint = `/api/finances?startDate=${startDate}&endDate=${endDate}`;
      if (propertyId !== 'all') {
        financesEndpoint += `&propertyId=${propertyId}`;
      }
      
      console.log(`[TRANSACTIONS] Fetching data for property ${propertyId} from: ${financesEndpoint}`);
      
      const response = await fetch(financesEndpoint);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch financial data');
      }
      
      // Get combined transactions
      const combinedTransactions = getCombinedTransactions(data);
      
      if (!combinedTransactions || combinedTransactions.length === 0) {
        throw new Error('No transaction data available');
      }
      
      console.log(`[TRANSACTIONS] Successfully fetched ${combinedTransactions.length} transactions`);
      setTransactions(combinedTransactions);
      
      // Reset filters when property changes
      setPropertyFilter('All');
      
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDrawerOpen(true);
  }

  const filteredTransactions = transactions.filter(transaction => {
    // Apply search term filter
    if (searchTerm && !Object.values(transaction).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase()))) {
      return false;
    }
    
    // Apply type filter
    if (typeFilter !== 'All' && transaction.type !== typeFilter) {
      return false;
    }
    
    // Apply category filter
    if (categoryFilter !== 'All' && transaction.category !== categoryFilter) {
      return false;
    }
    
    // Apply property filter
    if (propertyFilter !== 'All' && transaction.property !== propertyFilter) {
      return false;
    }
    
    // Apply status filter
    if (statusFilter !== 'All' && transaction.status !== statusFilter) {
      return false;
    }
    
    return true;
  });

  // Add debug logging to see what's happening with the filters
  console.log(`[TRANSACTIONS] Filter state:`, {
    totalTransactions: transactions.length,
    filteredCount: filteredTransactions.length,
    searchTerm,
    typeFilter,
    categoryFilter,
    propertyFilter,
    statusFilter,
    uniqueProperties: [...new Set(transactions.map(t => t.property))],
    // Count transactions by property
    propertyCounts: transactions.reduce((counts, t) => {
      counts[t.property] = (counts[t.property] || 0) + 1;
      return counts;
    }, {} as Record<string, number>)
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', { 
      style: 'currency', 
      currency: 'GBP',
      signDisplay: 'always'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: 'numeric', 
        month: 'short', 
        year: 'numeric'
      });
    } catch (e) {
      return dateString; // Return original string if date is invalid
    }
  };

  // Computed filter values based on transactions
  const types = getTypes(transactions);
  const categories = getCategories(transactions);
  const propertyNames = getPropertyNames(transactions);
  const statuses = getStatuses(transactions);

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

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <XMarkIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading transactions</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters - Only show when data is loaded */}
        {!loading && !error && (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-4">
            <div className="flex flex-col space-y-4">
              {/* Property Selector */}
              <div className="flex flex-wrap gap-2 items-center">
                <div className="text-sm font-medium text-gray-700">Property:</div>
                <select
                  className="form-select rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={selectedPropertyId}
                  onChange={(e) => handlePropertyChange(e.target.value as string | 'all')}
                >
                  <option value="all">All Properties</option>
                  {properties.map(property => (
                    <option key={property.id} value={property.id}>{property.address}</option>
                  ))}
                </select>
              </div>
              
              {/* Search Bar */}
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
              
              {/* Filters */}
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
                  {propertyNames.map(propertyName => (
                    <option key={propertyName} value={propertyName}>{propertyName}</option>
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
        )}

        {/* Transactions Table */}
        {!loading && !error && (
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
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(transaction.date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.property}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(transaction.amount)}
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
            {filteredTransactions.length > 0 && (
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
            )}
          </div>
        )}

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
                            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{formatDate(selectedTransaction.date)}</dd>
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
                            <dd className={`mt-1 text-sm sm:col-span-2 sm:mt-0 ${selectedTransaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(selectedTransaction.amount)}
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
                          <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="text-sm font-medium text-gray-500">ID</dt>
                            <dd className="mt-1 text-sm text-gray-500 sm:col-span-2 sm:mt-0">{selectedTransaction.id}</dd>
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