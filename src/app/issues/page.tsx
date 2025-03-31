'use client'

import React, { useState, useEffect } from 'react'
import { SidebarLayout } from '../components/sidebar-layout'
import { Heading } from '../components/heading'
import { Text } from '../components/text'
import { 
  Sidebar, 
  SidebarHeader, 
  SidebarBody, 
  SidebarFooter, 
  SidebarItem,
  SidebarSection,
  SidebarHeading,
  SidebarLabel
} from '../components/sidebar'
import Link from 'next/link'
import Image from 'next/image'
import { 
  HomeIcon, 
  BuildingOfficeIcon, 
  UsersIcon, 
  CalendarIcon, 
  ExclamationCircleIcon, 
  BanknotesIcon, 
  ShoppingBagIcon,
  CodeBracketIcon,
  PlusIcon,
  AdjustmentsHorizontalIcon,
  FunnelIcon,
  XMarkIcon,
  CheckIcon,
  ChevronDownIcon
} from '@heroicons/react/24/solid'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SidebarContent } from '../components/sidebar-content'
import { IssuesBoard } from "@/components/issues/IssuesBoard"
import { IssueDrawer } from "../components/IssueDrawer"
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { IssueFormDrawer } from '../components/IssueFormDrawer'
import { getAllIssues, createIssue } from '../../lib/issueService'
import { cn } from '@/lib/utils'

// Define Issue type
type Issue = {
  id: string;
  title: string;
  type: "Bug" | "Documentation" | "Feature";
  status: "Todo" | "In Progress" | "Backlog" | "Done";
  priority: "Low" | "Medium" | "High";
  property?: string;
  reported?: string;
  assignedTo?: string;
}

// Define filter options
const statusFilters = ["All", "Todo", "In Progress", "Backlog", "Done"]
const priorityFilters = ["All", "Low", "Medium", "High"]
const typeFilters = ["All", "Bug", "Documentation", "Feature"]

// Icons for navigation items
function DashboardIcon() {
  return <HomeIcon className="w-5 h-5" />
}

function PropertiesIcon() {
  return <BuildingOfficeIcon className="w-5 h-5" />
}

function ResidentsIcon() {
  return <UsersIcon className="w-5 h-5" />
}

function CalendarIconComponent() {
  return <CalendarIcon className="w-5 h-5" />
}

function IssuesIcon() {
  return <ExclamationCircleIcon className="w-5 h-5" />
}

function FinancialIcon() {
  return <BanknotesIcon className="w-5 h-5" />
}

function SuppliersIcon() {
  return <ShoppingBagIcon className="w-5 h-5" />
}

function IntegrationsIcon() {
  return <CodeBracketIcon className="w-5 h-5" />
}

export default function Issues() {
  // State for the selected issue and drawer open state
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [issuesData, setIssuesData] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newIssue, setNewIssue] = useState({
    title: '',
    description: '',
    propertyId: '',
    unitNumber: '',
    category: 'maintenance',
    priority: 'medium',
    reportedBy: '',
    assignedTo: '',
    dueDate: ''
  });

  // Filter states
  const [statusFilter, setStatusFilter] = useState("All")
  const [priorityFilter, setPriorityFilter] = useState("All")
  const [typeFilter, setTypeFilter] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilterMenu, setShowFilterMenu] = useState(false)

  // Update tabs array with current menu items
  const tabs = [
    { name: 'List', value: 'list', current: true },
    { name: 'Board', value: 'board', current: false },
  ]

  // Fetch issues from Supabase when component mounts
  useEffect(() => {
    const fetchIssues = async () => {
      try {
        console.log('Issues page: Starting to fetch issues');
        setIsLoading(true);
        
        const issues = await getAllIssues();
        console.log('Issues page: Received issues data:', issues.length, 'issues');
        
        if (issues.length === 0) {
          console.log('Issues page: No issues returned from API');
        } else {
          console.log('Issues page: First issue sample:', issues[0]);
        }
        
        setIssuesData(issues);
        setError(null);
      } catch (err) {
        console.error('Issues page: Error fetching issues:', err);
        setError('Failed to load issues. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchIssues();
  }, []);

  // Function to handle opening the drawer
  const openDrawer = (issue: Issue) => {
    setSelectedIssue(issue);
    setIsDrawerOpen(true);
  };

  // Add a function to open the form drawer
  const openFormDrawer = () => {
    setIsFormDrawerOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewIssue(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (formData: any) => {
    try {
      // Create issue in Supabase
      const issueData = {
        title: formData.title,
        description: formData.description || '',
        property_id: formData.propertyId,
        unit_id: formData.unitNumber || null,
        status: 'Todo' as const,
        priority: formData.priority as 'Low' | 'Medium' | 'High',
        type: 'Bug' as const,
        assigned_to: formData.assignedTo || null,
        due_date: formData.dueDate || null,
        is_emergency: formData.priority === 'High'
      };
      
      const newIssueResult = await createIssue(issueData);
      
      if (newIssueResult) {
        // Add the new issue to the UI state
        setIssuesData(prev => [newIssueResult, ...prev]);
      } else {
        console.error('Failed to create issue, but no error was thrown');
      }
    } catch (err) {
      console.error('Error creating issue:', err);
      // Fallback for development - create a mock issue
      if (process.env.NODE_ENV === 'development') {
        const newMockIssue: Issue = {
          id: `${Math.floor(Math.random() * 1000)}`,
          title: formData.title,
          type: "Bug" as const,
          status: "Todo" as const,
          priority: formData.priority as any,
          property: `${formData.propertyId} ${formData.unitNumber}`.trim(),
          reported: new Date().toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}),
          assignedTo: formData.assignedTo
        };
        
        setIssuesData(prev => [newMockIssue, ...prev]);
      }
    } finally {
      setIsFormDrawerOpen(false);
      
      // Reset form data
      setNewIssue({
        title: '',
        description: '',
        propertyId: '',
        unitNumber: '',
        category: 'maintenance',
        priority: 'medium',
        reportedBy: '',
        assignedTo: '',
        dueDate: ''
      });
    }
  };

  const handleIssuesUpdate = (updatedIssues: Issue[]) => {
    setIssuesData(updatedIssues);
  };

  // Function to filter issues
  const filterIssues = (issues: Issue[]): Issue[] => {
    return issues.filter(issue => {
      const matchesStatus = statusFilter === "All" || issue.status === statusFilter
      const matchesPriority = priorityFilter === "All" || issue.priority === priorityFilter
      const matchesType = typeFilter === "All" || issue.type === typeFilter
      const matchesSearch = searchQuery === "" || 
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (issue.property && issue.property.toLowerCase().includes(searchQuery.toLowerCase())) || 
        issue.id.toString().toLowerCase().includes(searchQuery.toLowerCase())
        
      return matchesStatus && matchesPriority && matchesType && matchesSearch
    })
  }

  // Filter the issues
  const filteredIssues = filterIssues(issuesData);

  // State for selected tab
  const [selectedTab, setSelectedTab] = useState('list');

  // Function to handle tab change
  const handleTabChange = (value: string) => {
    setSelectedTab(value);
  };

  return (
    <SidebarLayout
      sidebar={<SidebarContent currentPath="/issues" />}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <Heading level={1} className="text-2xl font-bold">Maintenance Issues</Heading>
            <Text className="text-gray-500 mt-1">Track and manage property maintenance requests and issues.</Text>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <div className="flex space-x-2">
              {/* Combined Filter */}
              <Menu as="div" className="relative">
                <MenuButton className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center">
                  <FunnelIcon className="h-5 w-5 mr-1" />
                  <span className="mr-1">Filters</span>
                  {(statusFilter !== "All" || priorityFilter !== "All" || typeFilter !== "All") ? (
                    <>
                      <span className="mx-1 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {[
                          statusFilter !== "All" ? 1 : 0,
                          priorityFilter !== "All" ? 1 : 0,
                          typeFilter !== "All" ? 1 : 0
                        ].reduce((a, b) => a + b, 0)}
                      </span>
                      <span className="hidden sm:inline-block ml-1 text-xs text-gray-500 truncate max-w-[100px]">
                        {[
                          statusFilter !== "All" ? statusFilter : "",
                          priorityFilter !== "All" ? priorityFilter : "",
                          typeFilter !== "All" ? typeFilter : ""
                        ].filter(Boolean).join(", ")}
                      </span>
                    </>
                  ) : null}
                </MenuButton>
                <MenuItems className="absolute right-0 z-10 mt-2 w-64 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <h3 className={`text-xs font-cabinet-grotesk-bold ${statusFilter !== "All" ? "text-blue-600" : "text-gray-500"} uppercase tracking-wider flex items-center justify-between`}>
                      Status
                      {statusFilter !== "All" && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                          {statusFilter}
                        </span>
                      )}
                    </h3>
                    <div className="mt-2 space-y-1">
                      {statusFilters.map((status) => (
                        <button
                          key={status}
                          onClick={() => setStatusFilter(status)}
                          className={`flex w-full items-center px-2 py-1 text-sm rounded-md ${
                            status === statusFilter ? 'bg-blue-50 font-medium' : 'hover:bg-gray-50'
                          }`}
                        >
                          {status === statusFilter && (
                            <CheckIcon className="mr-2 h-4 w-4 text-blue-500" />
                          )}
                          <span className={status === statusFilter ? 'text-blue-700' : 'text-gray-700'}>
                            {status}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="px-3 py-2 border-b border-gray-100">
                    <h3 className={`text-xs font-cabinet-grotesk-bold ${priorityFilter !== "All" ? "text-blue-600" : "text-gray-500"} uppercase tracking-wider flex items-center justify-between`}>
                      Priority
                      {priorityFilter !== "All" && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                          {priorityFilter}
                        </span>
                      )}
                    </h3>
                    <div className="mt-2 space-y-1">
                      {priorityFilters.map((priority) => (
                        <button
                          key={priority}
                          onClick={() => setPriorityFilter(priority)}
                          className={`flex w-full items-center px-2 py-1 text-sm rounded-md ${
                            priority === priorityFilter ? 'bg-blue-50 font-medium' : 'hover:bg-gray-50'
                          }`}
                        >
                          {priority === priorityFilter && (
                            <CheckIcon className="mr-2 h-4 w-4 text-blue-500" />
                          )}
                          <span className={priority === priorityFilter ? 'text-blue-700' : 'text-gray-700'}>
                            {priority}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="px-3 py-2">
                    <h3 className={`text-xs font-cabinet-grotesk-bold ${typeFilter !== "All" ? "text-blue-600" : "text-gray-500"} uppercase tracking-wider flex items-center justify-between`}>
                      Type
                      {typeFilter !== "All" && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                          {typeFilter}
                        </span>
                      )}
                    </h3>
                    <div className="mt-2 space-y-1">
                      {typeFilters.map((type) => (
                        <button
                          key={type}
                          onClick={() => setTypeFilter(type)}
                          className={`flex w-full items-center px-2 py-1 text-sm rounded-md ${
                            type === typeFilter ? 'bg-blue-50 font-medium' : 'hover:bg-gray-50'
                          }`}
                        >
                          {type === typeFilter && (
                            <CheckIcon className="mr-2 h-4 w-4 text-blue-500" />
                          )}
                          <span className={type === typeFilter ? 'text-blue-700' : 'text-gray-700'}>
                            {type}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {(statusFilter !== "All" || priorityFilter !== "All" || typeFilter !== "All") && (
                    <div className="px-3 py-2 border-t border-gray-100">
                      <button
                        onClick={() => {
                          setStatusFilter("All");
                          setPriorityFilter("All");
                          setTypeFilter("All");
                        }}
                        className="flex items-center justify-center w-full py-1.5 px-3 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
                      >
                        <XMarkIcon className="h-4 w-4 mr-1.5" />
                        Reset all filters
                      </button>
                    </div>
                  )}
                </MenuItems>
              </Menu>
            </div>

            <button
              onClick={openFormDrawer}
              className="px-4 py-2 bg-[#D9E8FF] rounded-md text-sm font-medium text-black hover:bg-[#C8D7EE]"
            >
              <PlusIcon className="h-5 w-5 inline-block mr-1" />
              Create Issue
            </button>
          </div>
        </div>
        
        {/* Issue Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Issues */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{issuesData.length}</p>
            </CardContent>
          </Card>
          
          {/* Open Issues */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Open Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">
                {issuesData.filter(issue => issue.status !== "Done").length}
              </p>
            </CardContent>
          </Card>
          
          {/* In Progress */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-600">
                {issuesData.filter(issue => issue.status === "In Progress").length}
              </p>
            </CardContent>
          </Card>
          
          {/* Completed */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {issuesData.filter(issue => issue.status === "Done").length}
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Issues Tabs */}
        <div>
          <div className="grid grid-cols-1 sm:hidden">
            <select
              value={selectedTab}
              onChange={(e) => handleTabChange(e.target.value)}
              aria-label="Select a tab"
              className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-2 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-[#D9E8FF]"
            >
              {tabs.map((tab) => (
                <option key={tab.name} value={tab.value}>{tab.name}</option>
              ))}
            </select>
            <ChevronDownIcon
              aria-hidden="true"
              className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end fill-gray-500"
            />
          </div>
          <div className="hidden sm:block">
            <nav aria-label="Tabs" className="isolate flex divide-x divide-gray-200 rounded-lg shadow-sm">
              {tabs.map((tab, tabIdx) => (
                <button
                  key={tab.name}
                  onClick={() => handleTabChange(tab.value)}
                  aria-current={tab.current ? 'page' : undefined}
                  className={cn(
                    tab.current ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700',
                    tabIdx === 0 ? 'rounded-l-lg' : '',
                    tabIdx === tabs.length - 1 ? 'rounded-r-lg' : '',
                    'group relative min-w-0 flex-1 overflow-hidden bg-white px-4 py-4 text-center text-sm font-medium hover:bg-gray-50 focus:z-10',
                  )}
                >
                  <span>{tab.name}</span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      tab.current ? 'bg-[#FF503E]' : 'bg-transparent',
                      'absolute inset-x-0 bottom-0 h-0.5',
                    )}
                  />
                </button>
              ))}
            </nav>
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={handleTabChange} className="w-full">
          <TabsContent value="list">
            {/* Issues Table */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-cabinet-grotesk-bold text-gray-900">All Issues</h3>
                  <p className="text-sm text-gray-500">Recent maintenance requests and issues that need attention.</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search issues..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-64 px-4 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <button 
                    className="p-2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                    aria-label="Toggle filters"
                  >
                    <AdjustmentsHorizontalIcon className="h-5 w-5" />
                  </button>
                  
                  {showFilterMenu && (
                    <div className="absolute top-16 right-6 bg-white border border-gray-200 rounded-md shadow-lg p-4 z-10 grid grid-cols-1 gap-4 w-72">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select 
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                        >
                          {statusFilters.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                        <select 
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          value={priorityFilter}
                          onChange={(e) => setPriorityFilter(e.target.value)}
                        >
                          {priorityFilters.map(priority => (
                            <option key={priority} value={priority}>{priority}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select 
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          value={typeFilter}
                          onChange={(e) => setTypeFilter(e.target.value)}
                        >
                          {typeFilters.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex justify-between mt-2">
                        <button
                          className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200"
                          onClick={() => {
                            setStatusFilter("All");
                            setPriorityFilter("All");
                            setTypeFilter("All");
                          }}
                        >
                          Reset Filters
                        </button>
                        <button
                          className="px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800"
                          onClick={() => setShowFilterMenu(false)}
                        >
                          Apply Filters
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="overflow-x-auto">
                {isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : error ? (
                  <div className="text-center py-8 text-red-500">{error}</div>
                ) : filteredIssues.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No issues found</div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredIssues.map((issue) => (
                        <tr 
                          key={issue.id}
                          onClick={() => openDrawer(issue)}
                          className="cursor-pointer hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{issue.title}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              issue.status === 'Todo' ? 'bg-yellow-100 text-yellow-800' :
                              issue.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                              issue.status === 'Done' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {issue.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              issue.priority === 'High' ? 'bg-red-100 text-red-800' :
                              issue.priority === 'Medium' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {issue.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{issue.property}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{issue.reported}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              
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
                      Showing <span className="font-medium">1</span> to <span className="font-medium">5</span> of <span className="font-medium">35</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <a href="#" className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                        <span className="sr-only">Previous</span>
                        {/* Heroicon name: chevron-left */}
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </a>
                      <a href="#" aria-current="page" className="z-10 bg-blue-50 border-blue-500 text-blue-600 relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                        1
                      </a>
                      <a href="#" className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                        2
                      </a>
                      <a href="#" className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                        3
                      </a>
                      <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                        ...
                      </span>
                      <a href="#" className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                        8
                      </a>
                      <a href="#" className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                        9
                      </a>
                      <a href="#" className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                        10
                      </a>
                      <a href="#" className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                        <span className="sr-only">Next</span>
                        {/* Heroicon name: chevron-right */}
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </a>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="board">
            <IssuesBoard 
              issues={filteredIssues} 
              onUpdateIssues={handleIssuesUpdate}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Issue Details Drawer */}
      <IssueDrawer
        issue={selectedIssue}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedIssue(null);
        }}
      />

      {/* Issue Form Drawer */}
      <IssueFormDrawer
        isOpen={isFormDrawerOpen}
        onClose={() => setIsFormDrawerOpen(false)}
        onSubmit={handleSubmit}
        title="Create New Issue"
      />
    </SidebarLayout>
  );
} 