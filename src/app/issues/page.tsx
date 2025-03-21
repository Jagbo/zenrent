'use client'

import { useState } from 'react'
import { SidebarLayout } from '../components/sidebar-layout'
import { Heading } from '../components/heading'
import { Text } from '../components/text'
import { 
  Sidebar, 
  SidebarHeader, 
  SidebarBody, 
  SidebarFooter, 
  SidebarItem 
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
  CheckIcon
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
import { IssueDetailsDrawer } from "@/components/issues/IssueDetailsDrawer"
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'

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
  const [issuesData, setIssuesData] = useState<Issue[]>([
    {
      id: "1254",
      title: "Water leak in bathroom ceiling",
      type: "Bug" as const,
      status: "Todo" as const,
      priority: "High" as const,
      property: "Sunset Apartments Room 204",
      reported: "Mar 8, 2024",
      assignedTo: "JS"
    },
    {
      id: "1253", 
      title: "Broken heating system",
      type: "Bug" as const,
      status: "In Progress" as const,
      priority: "High" as const,
      property: "Oakwood Heights Room 103",
      reported: "Mar 7, 2024",
      assignedTo: "RW"
    },
    {
      id: "1252",
      title: "Mailbox key replacement",
      type: "Feature" as const,
      status: "Todo" as const,
      priority: "Low" as const,
      property: "Sunset Apartments Room 112",
      reported: "Mar 6, 2024",
      assignedTo: ""
    },
    {
      id: "1251",
      title: "Noisy neighbors complaint",
      type: "Bug" as const,
      status: "Todo" as const,
      priority: "Medium" as const,
      property: "Parkview Residences Room 305",
      reported: "Mar 5, 2024",
      assignedTo: "SJ"
    },
    {
      id: "1250",
      title: "Parking spot dispute",
      type: "Documentation" as const,
      status: "Done" as const,
      priority: "Medium" as const,
      property: "Oakwood Heights Room 210",
      reported: "Mar 4, 2024",
      assignedTo: "MA"
    }
  ]);
  const [newIssue, setNewIssue] = useState({
    title: '',
    description: '',
    propertyId: '',
    unitNumber: '',
    category: 'maintenance',
    priority: 'medium',
    status: 'open',
    reportedBy: '',
    assignedTo: '',
    dueDate: '',
    images: [],
    estimatedCost: '',
    notes: ''
  });

  // Filter states
  const [statusFilter, setStatusFilter] = useState("All")
  const [priorityFilter, setPriorityFilter] = useState("All")
  const [typeFilter, setTypeFilter] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilterMenu, setShowFilterMenu] = useState(false)

  // Function to handle opening the drawer
  const openDrawer = (issue: Issue) => {
    setSelectedIssue(issue);
    setIsDrawerOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewIssue(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically save the issue to your backend
    console.log('New issue:', newIssue);
    setIsDrawerOpen(false);
    setNewIssue({
      title: '',
      description: '',
      propertyId: '',
      unitNumber: '',
      category: 'maintenance',
      priority: 'medium',
      status: 'open',
      reportedBy: '',
      assignedTo: '',
      dueDate: '',
      images: [],
      estimatedCost: '',
      notes: ''
    });
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
        issue.id.toLowerCase().includes(searchQuery.toLowerCase())
        
      return matchesStatus && matchesPriority && matchesType && matchesSearch
    })
  }

  // Filter the issues
  const filteredIssues = filterIssues(issuesData)

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
              {/* Status Filter */}
              <Menu as="div" className="relative">
                <MenuButton className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center">
                  <FunnelIcon className="h-5 w-5 mr-1" />
                  Status: {statusFilter}
                </MenuButton>
                <MenuItems className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  {statusFilters.map((status) => (
                    <MenuItem key={status}>
                      {({ active }) => (
                        <button
                          onClick={() => setStatusFilter(status)}
                          className={`flex w-full items-center px-4 py-2 text-sm ${
                            active ? 'bg-gray-100' : ''
                          }`}
                        >
                          {status === statusFilter && (
                            <CheckIcon className="mr-2 h-4 w-4" />
                          )}
                          <span className={status === statusFilter ? 'font-semibold' : ''}>
                            {status}
                          </span>
                        </button>
                      )}
                    </MenuItem>
                  ))}
                </MenuItems>
              </Menu>

              {/* Priority Filter */}
              <Menu as="div" className="relative">
                <MenuButton className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center">
                  <FunnelIcon className="h-5 w-5 mr-1" />
                  Priority: {priorityFilter}
                </MenuButton>
                <MenuItems className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  {priorityFilters.map((priority) => (
                    <MenuItem key={priority}>
                      {({ active }) => (
                        <button
                          onClick={() => setPriorityFilter(priority)}
                          className={`flex w-full items-center px-4 py-2 text-sm ${
                            active ? 'bg-gray-100' : ''
                          }`}
                        >
                          {priority === priorityFilter && (
                            <CheckIcon className="mr-2 h-4 w-4" />
                          )}
                          <span className={priority === priorityFilter ? 'font-semibold' : ''}>
                            {priority}
                          </span>
                        </button>
                      )}
                    </MenuItem>
                  ))}
                </MenuItems>
              </Menu>

              {/* Type Filter */}
              <Menu as="div" className="relative">
                <MenuButton className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center">
                  <FunnelIcon className="h-5 w-5 mr-1" />
                  Type: {typeFilter}
                </MenuButton>
                <MenuItems className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  {typeFilters.map((type) => (
                    <MenuItem key={type}>
                      {({ active }) => (
                        <button
                          onClick={() => setTypeFilter(type)}
                          className={`flex w-full items-center px-4 py-2 text-sm ${
                            active ? 'bg-gray-100' : ''
                          }`}
                        >
                          {type === typeFilter && (
                            <CheckIcon className="mr-2 h-4 w-4" />
                          )}
                          <span className={type === typeFilter ? 'font-semibold' : ''}>
                            {type}
                          </span>
                        </button>
                      )}
                    </MenuItem>
                  ))}
                </MenuItems>
              </Menu>
            </div>

            <button
              onClick={() => setIsDrawerOpen(true)}
              className="px-4 py-2 bg-gray-900 rounded-md text-sm font-medium text-white hover:bg-gray-800"
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
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="board">Board</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list">
            {/* Issues Table */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">All Issues</h3>
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
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredIssues.map((issue) => (
                      <tr 
                        key={issue.id}
                        onClick={() => openDrawer(issue)}
                        className="cursor-pointer hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{issue.id}</td>
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{issue.assignedTo || 'Unassigned'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            className="text-blue-600 hover:text-blue-900"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDrawer(issue);
                            }}
                          >
                            View
                          </button>
                      </td>
                    </tr>
                    ))}
                  </tbody>
                </table>
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
      <IssueDetailsDrawer
        issue={selectedIssue}
        open={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedIssue(null);
        }}
      />

      {/* Issue Form Drawer */}
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
                        <h2 className="text-lg font-medium text-gray-900">Create New Issue</h2>
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
                            <label htmlFor="title" className="block text-sm font-medium text-gray-900">
                              Issue Title
                            </label>
                            <input
                              type="text"
                              name="title"
                              id="title"
                              required
                              value={newIssue.title}
                              onChange={handleInputChange}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                              placeholder="Brief description of the issue"
                            />
                          </div>

                          <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-900">
                              Detailed Description
                            </label>
                            <textarea
                              name="description"
                              id="description"
                              rows={4}
                              required
                              value={newIssue.description}
                              onChange={handleInputChange}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                              placeholder="Provide detailed information about the issue..."
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="propertyId" className="block text-sm font-medium text-gray-900">
                                Property
                              </label>
                              <select
                                name="propertyId"
                                id="propertyId"
                                required
                                value={newIssue.propertyId}
                                onChange={handleInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                              >
                                <option value="">Select Property</option>
                                <option value="123-main">123 Main Street</option>
                                <option value="456-park">456 Park Avenue</option>
                                <option value="789-ocean">789 Ocean Drive</option>
                              </select>
                            </div>
                            <div>
                              <label htmlFor="unitNumber" className="block text-sm font-medium text-gray-900">
                                Room Number
                              </label>
                              <input
                                type="text"
                                name="unitNumber"
                                id="unitNumber"
                                required
                                value={newIssue.unitNumber}
                                onChange={handleInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="category" className="block text-sm font-medium text-gray-900">
                                Category
                              </label>
                              <select
                                name="category"
                                id="category"
                                required
                                value={newIssue.category}
                                onChange={handleInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                              >
                                <option value="maintenance">Maintenance</option>
                                <option value="plumbing">Plumbing</option>
                                <option value="electrical">Electrical</option>
                                <option value="hvac">HVAC</option>
                                <option value="appliance">Appliance</option>
                                <option value="structural">Structural</option>
                                <option value="pest">Pest Control</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                            <div>
                              <label htmlFor="priority" className="block text-sm font-medium text-gray-900">
                                Priority
                              </label>
                              <select
                                name="priority"
                                id="priority"
                                required
                                value={newIssue.priority}
                                onChange={handleInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                              >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="reportedBy" className="block text-sm font-medium text-gray-900">
                                Reported By
                              </label>
                              <input
                                type="text"
                                name="reportedBy"
                                id="reportedBy"
                                required
                                value={newIssue.reportedBy}
                                onChange={handleInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                              />
                            </div>
                            <div>
                              <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-900">
                                Assigned To
                              </label>
                              <input
                                type="text"
                                name="assignedTo"
                                id="assignedTo"
                                value={newIssue.assignedTo}
                                onChange={handleInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                              />
                            </div>
                          </div>

                          <div>
                            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-900">
                              Due Date
                            </label>
                            <input
                              type="date"
                              name="dueDate"
                              id="dueDate"
                              value={newIssue.dueDate}
                              onChange={handleInputChange}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                            />
                          </div>

                          <div>
                            <label htmlFor="estimatedCost" className="block text-sm font-medium text-gray-900">
                              Estimated Cost ($)
                            </label>
                            <input
                              type="number"
                              name="estimatedCost"
                              id="estimatedCost"
                              value={newIssue.estimatedCost}
                              onChange={handleInputChange}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                              placeholder="0.00"
                            />
                          </div>

                          <div>
                            <label htmlFor="images" className="block text-sm font-medium text-gray-900">
                              Upload Images
                            </label>
                            <input
                              type="file"
                              name="images"
                              id="images"
                              multiple
                              accept="image/*"
                              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                            />
                          </div>

                          <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-900">
                              Additional Notes
                            </label>
                            <textarea
                              name="notes"
                              id="notes"
                              rows={3}
                              value={newIssue.notes}
                              onChange={handleInputChange}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                              placeholder="Any additional information or special instructions..."
                            />
                          </div>

                          <div className="mt-5 sm:mt-6">
                            <button
                              type="submit"
                              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-900 text-base font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 sm:text-sm"
                            >
                              Create Issue
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
    </SidebarLayout>
  );
} 