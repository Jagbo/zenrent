'use client'

import { useState, useEffect } from 'react'
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
  ArrowUpIcon,
  CheckIcon,
  MapPinIcon,
  EllipsisVerticalIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowDownIcon,
  ChevronDownIcon
} from '@heroicons/react/24/solid'
import { CheckIcon as CheckIcon20, HandThumbUpIcon, UserIcon } from '@heroicons/react/20/solid'
import { TrendingUp, TrendingDown } from "lucide-react"
import {
  Area, 
  AreaChart, 
  Bar, 
  BarChart, 
  Line, 
  LineChart, 
  ResponsiveContainer,
  CartesianGrid,
  Tooltip, 
  XAxis, 
  YAxis 
} from 'recharts'
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SidebarContent } from '../components/sidebar-content'
import { IssueDrawer } from "../components/IssueDrawer"
import { IssueFormDrawer } from '../components/IssueFormDrawer'
import { getRecentIssues, createIssue } from '../../lib/issueService'
import { getDashboardStats } from '../../lib/dashboardService'
import { supabase } from '../../lib/supabase'

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

// Timeline data for recent updates
const timeline = [
  {
    id: 1,
    content: 'Property inspection completed by',
    target: 'Sarah Johnson',
    href: '#',
    date: 'Sep 20',
    datetime: '2023-09-20',
    icon: UserIcon,
    iconBackground: 'bg-gray-400',
  },
  {
    id: 2,
    content: 'Rent payment received from',
    target: 'Michael Davis',
    href: '#',
    date: 'Sep 22',
    datetime: '2023-09-22',
    icon: HandThumbUpIcon,
    iconBackground: 'bg-blue-500',
  },
  {
    id: 3,
    content: 'Maintenance request resolved by',
    target: 'Robert Wilson',
    href: '#',
    date: 'Sep 28',
    datetime: '2023-09-28',
    icon: CheckIcon20,
    iconBackground: 'bg-green-500',
  },
  {
    id: 4,
    content: 'New tenant lease signed by',
    target: 'Jennifer Adams',
    href: '#',
    date: 'Sep 30',
    datetime: '2023-09-30',
    icon: HandThumbUpIcon,
    iconBackground: 'bg-blue-500',
  },
  {
    id: 5,
    content: 'Annual property assessment by',
    target: 'Thomas Baker',
    href: '#',
    date: 'Oct 4',
    datetime: '2023-10-04',
    icon: CheckIcon20,
    iconBackground: 'bg-green-500',
  },
]

// Utility function for combining class names
function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

// Chart data for different tabs
const overviewData = {
  issues: [
    { month: "January", value: 18 },
    { month: "February", value: 20 },
    { month: "March", value: 22 },
    { month: "April", value: 20 },
    { month: "May", value: 23 },
    { month: "June", value: 24 }
  ],
  profitMargin: [
    { month: "January", value: 68 },
    { month: "February", value: 70 },
    { month: "March", value: 69 },
    { month: "April", value: 71 },
    { month: "May", value: 72 },
    { month: "June", value: 72 }
  ],
  occupancy: [
    { month: "January", value: 89 },
    { month: "February", value: 91 },
    { month: "March", value: 92 },
    { month: "April", value: 92 },
    { month: "May", value: 93 },
    { month: "June", value: 94 }
  ]
}

const financeData = {
  income: [
    { month: "January", desktop: 120000, mobile: 25000 },
    { month: "February", desktop: 125000, mobile: 28000 },
    { month: "March", desktop: 128000, mobile: 30000 },
    { month: "April", desktop: 130000, mobile: 35000 },
    { month: "May", desktop: 140000, mobile: 38000 },
    { month: "June", desktop: 145800, mobile: 40000 }
  ],
  expenses: [
    { month: "January", desktop: 38000, mobile: 12000 },
    { month: "February", desktop: 37500, mobile: 14000 },
    { month: "March", desktop: 39800, mobile: 15000 },
    { month: "April", desktop: 38400, mobile: 16000 },
    { month: "May", desktop: 40100, mobile: 18000 },
    { month: "June", desktop: 41300, mobile: 20000 }
  ],
  arrears: [
    { month: "January", value: 9800 },
    { month: "February", value: 10200 },
    { month: "March", value: 11500 },
    { month: "April", value: 12000 },
    { month: "May", value: 11800 },
    { month: "June", value: 12400 }
  ]
}

const issuesData = {
  active: [
    { month: "January", value: 28 },
    { month: "February", value: 30 },
    { month: "March", value: 32 },
    { month: "April", value: 33 },
    { month: "May", value: 34 },
    { month: "June", value: 35 }
  ],
  urgent: [
    { month: "January", value: 8 },
    { month: "February", value: 9 },
    { month: "March", value: 10 },
    { month: "April", value: 11 },
    { month: "May", value: 12 },
    { month: "June", value: 12 }
  ],
  backlog: [
    { month: "January", value: 12 },
    { month: "February", value: 14 },
    { month: "March", value: 15 },
    { month: "April", value: 16 },
    { month: "May", value: 17 },
    { month: "June", value: 18 }
  ]
}

// Chart configs
const chartConfigs = {
  // Overview tab
  issues: {
    issues: {
      label: "Issues",
      color: "#E9823F"
    }
  },
  profitMargin: {
    profit: {
      label: "Profit Margin",
      color: "#29A3BE"
    }
  },
  occupancy: {
    occupancy: {
      label: "Occupancy Rate",
      color: "#4264CB"
    }
  },
  // Finance tab
  income: {
    desktop: {
      label: "Rental Income",
      color: "#E9823F"
    },
    mobile: {
      label: "Other Income",
      color: "#E95D3F"
    }
  },
  expenses: {
    desktop: {
      label: "Operating Expenses",
      color: "#29A3BE"
    },
    mobile: {
      label: "Maintenance Costs",
      color: "#4264CB"
    }
  },
  arrears: {
    arrears: {
      label: "Arrears",
      color: "#F5A623"
    }
  },
  // Issues tab
  active: {
    active: {
      label: "Active Issues",
      color: "#E9823F"
    }
  },
  urgent: {
    urgent: {
      label: "Urgent Issues",
      color: "#E95D3F"
    }
  },
  backlog: {
    backlog: {
      label: "Backlog Issues",
      color: "#29A3BE"
    }
  }
}

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

export default function Dashboard() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [selectedTab, setSelectedTab] = useState('overview')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false)
  const [dashboardStats, setDashboardStats] = useState({
    totalProperties: 0,
    expiringContracts: 0,
    occupancyRate: 0,
    currentMonthIncome: 0,
  })

  // Update tabs to use state
  const tabs = [
    { name: 'Overview', value: 'overview', current: selectedTab === 'overview' },
    { name: 'Finance', value: 'finance', current: selectedTab === 'finance' },
    { name: 'Issues', value: 'issues', current: selectedTab === 'issues' },
  ]

  const handleTabChange = (value: string) => {
    setSelectedTab(value)
  }

  // Fetch issues and dashboard stats when component mounts
  useEffect(() => {
    const fetchIssues = async () => {
      try {
        console.log('Dashboard: Starting to fetch recent issues');
        const issues = await getRecentIssues(5);
        
        if (!issues || issues.length === 0) {
          console.log('Dashboard: No issues returned from API');
          return;
        }
        
        console.log('Dashboard: Received issues data:', issues.length, 'issues');
        console.log('Dashboard: First issue sample:', issues[0]);
        setIssues(issues);
      } catch (err) {
        console.error('Dashboard: Error fetching issues:', err);
      }
    };

    const fetchDashboardStats = async () => {
      try {
        console.log('Dashboard: Starting to fetch dashboard stats');
        
        const stats = await getDashboardStats();
        
        // Check if we got meaningful data
        const hasData = Object.values(stats).some(val => val > 0);
        if (!hasData) {
          console.warn('Dashboard: All stats are zero. Check Supabase connection and data.');
        }
        
        setDashboardStats(stats);
      } catch (err) {
        console.error('Dashboard: Error fetching dashboard stats:', err);
      }
    };

    fetchIssues();
    fetchDashboardStats();
  }, []);

  // Function to handle opening the drawer
  const openDrawer = (issue: Issue) => {
    setSelectedIssue(issue);
    setIsDrawerOpen(true);
  };

  // Function to handle form submission
  const handleIssueSubmit = async (formData: any) => {
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
        // Refresh the issues list
        const issues = await getRecentIssues(5);
        setIssues(issues);
      }
    } catch (err) {
      console.error('Error creating issue:', err);
    } finally {
      setIsFormDrawerOpen(false);
    }
  };

  // Format currency with pound sign
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <SidebarLayout
      sidebar={<SidebarContent currentPath="/dashboard" />}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <Heading level={1} className="text-4xl font-bold">Property Dashboard</Heading>
            <Text className="text-gray-500 mt-1">Welcome back! Here's an overview of your properties and recent activities.</Text>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <Link 
              href="/properties" 
              className="px-4 py-2 bg-[#D9E8FF] rounded-md text-sm font-medium text-black hover:bg-[#C8D7EE]"
            >
              View Properties
            </Link>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Properties */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-sm font-cabinet-grotesk-bold text-gray-500">Properties</h3>
            <p className="mt-2 text-4xl font-bold text-gray-900">{dashboardStats.totalProperties}</p>
          </div>
          
          {/* Contracts expiring */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-sm font-cabinet-grotesk-bold text-gray-500">Contracts expiring</h3>
            <p className="mt-2 text-4xl font-bold text-gray-900">{dashboardStats.expiringContracts}</p>
            <div className="mt-4 flex items-center text-sm text-amber-600">
              <ArrowUpIcon className="h-4 w-4 mr-1" />
              <span>Next 6 months</span>
            </div>
          </div>
          
          {/* Occupancy */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-sm font-cabinet-grotesk-bold text-gray-500">Occupancy</h3>
            <p className="mt-2 text-4xl font-bold text-gray-900">{dashboardStats.occupancyRate}%</p>
          </div>

          {/* Income */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-sm font-cabinet-grotesk-bold text-gray-500">Income</h3>
            <p className="mt-2 text-4xl font-bold text-gray-900">{formatCurrency(dashboardStats.currentMonthIncome)}</p>
            <div className="mt-4 flex items-center text-sm text-green-600">
              <ArrowUpIcon className="h-4 w-4 mr-1" />
              <span>Current month</span>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
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
                  className={classNames(
                    tab.current ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700',
                    tabIdx === 0 ? 'rounded-l-lg' : '',
                    tabIdx === tabs.length - 1 ? 'rounded-r-lg' : '',
                    'group relative min-w-0 flex-1 overflow-hidden bg-white px-4 py-4 text-center text-sm font-medium hover:bg-gray-50 focus:z-10',
                  )}
                >
                  <span>{tab.name}</span>
                  <span
                    aria-hidden="true"
                    className={classNames(
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
          <TabsContent value="overview" className="pt-6">
            {/* Dashboard Content */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Open Issues */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Open Issues</h3>
                  <p className="text-sm text-muted-foreground">Total: 24</p>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfigs.issues}>
                    <AreaChart accessibilityLayer data={overviewData.issues}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tickFormatter={(value) => value.slice(0, 3)}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent />}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        name="issues"
                        stroke="#E9823F"
                        fill="#E9823F"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
                <div className="flex-col items-start gap-2 text-sm p-6 pt-0">
                  <div className="flex gap-2 font-medium leading-none text-green-600">
                    <ArrowUpIcon className="h-4 w-4" />
                    <span>12% from last week</span>
                  </div>
                </div>
              </Card>
              
              {/* Profit Margin */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Profit Margin</h3>
                  <p className="text-sm text-muted-foreground">Current: 72%</p>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfigs.profitMargin}>
                    <BarChart accessibilityLayer data={overviewData.profitMargin}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tickFormatter={(value) => value.slice(0, 3)}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent />}
                      />
                      <Bar
                        dataKey="value"
                        name="profit"
                        fill="#29A3BE"
                        radius={4}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
                <div className="flex-col items-start gap-2 text-sm p-6 pt-0">
                  <div className="flex gap-2 font-medium leading-none text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    <span>2% from last month</span>
                  </div>
                </div>
              </Card>
              
              {/* Occupancy Rate */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Occupancy Rate</h3>
                  <p className="text-sm text-muted-foreground">Current: 94%</p>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfigs.occupancy}>
                    <LineChart accessibilityLayer data={overviewData.occupancy}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tickFormatter={(value) => value.slice(0, 3)}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent />}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        name="occupancy"
                        stroke="#4264CB"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
                <div className="flex-col items-start gap-2 text-sm p-6 pt-0">
                  <div className="flex gap-2 font-medium leading-none text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    <span>1% from last quarter</span>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="finance" className="pt-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Total Income */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Total Income</h3>
                  <p className="text-sm text-muted-foreground">January - June 2023</p>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfigs.income}>
                    <BarChart accessibilityLayer data={financeData.income}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tickFormatter={(value) => value.slice(0, 3)}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dashed" />}
                      />
                      <Bar dataKey="desktop" fill="#E9823F" radius={4} />
                      <Bar dataKey="mobile" fill="#E95D3F" radius={4} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
                <div className="flex-col items-start gap-2 text-sm p-6 pt-0">
                  <div className="flex gap-2 font-medium leading-none text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    <span>4% from last month</span>
                  </div>
                  <div className="leading-none text-muted-foreground">
                    Total current income: £145,800
                  </div>
                </div>
              </Card>
              
              {/* Total Expenditure */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Total Expenditure</h3>
                  <p className="text-sm text-muted-foreground">January - June 2023</p>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfigs.expenses}>
                    <BarChart accessibilityLayer data={financeData.expenses}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tickFormatter={(value) => value.slice(0, 3)}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dashed" />}
                      />
                      <Bar dataKey="desktop" fill="#29A3BE" radius={4} />
                      <Bar dataKey="mobile" fill="#4264CB" radius={4} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
                <div className="flex-col items-start gap-2 text-sm p-6 pt-0">
                  <div className="flex gap-2 font-medium leading-none text-red-600">
                    <TrendingUp className="h-4 w-4" />
                    <span>3% from last month</span>
                  </div>
                  <div className="leading-none text-muted-foreground">
                    Total current expenses: £41,300
                  </div>
                </div>
              </Card>
              
              {/* Rent Arrears */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Rent Arrears</h3>
                  <p className="text-sm text-muted-foreground">January - June 2023</p>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfigs.arrears}>
                    <LineChart accessibilityLayer data={financeData.arrears}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tickFormatter={(value) => value.slice(0, 3)}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent />}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        name="arrears"
                        stroke="#F5A623"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
                <div className="flex-col items-start gap-2 text-sm p-6 pt-0">
                  <div className="flex gap-2 font-medium leading-none text-red-600">
                    <TrendingUp className="h-4 w-4" />
                    <span>5% from last month</span>
                  </div>
                  <div className="leading-none text-muted-foreground">
                    Current arrears: £12,400
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="issues" className="pt-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Active Issues */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Active Issues</h3>
                  <p className="text-sm text-muted-foreground">January - June 2023</p>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfigs.active}>
                    <LineChart accessibilityLayer data={issuesData.active}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tickFormatter={(value) => value.slice(0, 3)}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent />}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        name="active"
                        stroke="var(--color-active)"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
                <div className="flex-col items-start gap-2 text-sm p-6 pt-0">
                  <div className="flex gap-2 font-medium leading-none text-red-600">
                    <TrendingUp className="h-4 w-4" />
                    <span>3% from last week</span>
                  </div>
                  <div className="leading-none text-muted-foreground">
                    Current active issues: 35
                  </div>
                </div>
              </Card>
              
              {/* Urgent Issues */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Urgent Issues</h3>
                  <p className="text-sm text-muted-foreground">January - June 2023</p>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfigs.urgent}>
                    <BarChart accessibilityLayer data={issuesData.urgent}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tickFormatter={(value) => value.slice(0, 3)}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent />}
                      />
                      <Bar
                        dataKey="value"
                        name="urgent"
                        fill="var(--color-urgent)"
                        radius={4}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
                <div className="flex-col items-start gap-2 text-sm p-6 pt-0">
                  <div className="flex gap-2 font-medium leading-none text-gray-600">
                    <span>No change from last week</span>
                  </div>
                  <div className="leading-none text-muted-foreground">
                    Current urgent issues: 12
                  </div>
                </div>
              </Card>
              
              {/* Backlog Issues */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Backlog Issues</h3>
                  <p className="text-sm text-muted-foreground">January - June 2023</p>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfigs.backlog}>
                    <LineChart accessibilityLayer data={issuesData.backlog}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tickFormatter={(value) => value.slice(0, 3)}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent />}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        name="backlog"
                        stroke="var(--color-backlog)"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
                <div className="flex-col items-start gap-2 text-sm p-6 pt-0">
                  <div className="flex gap-2 font-medium leading-none text-red-600">
                    <TrendingUp className="h-4 w-4" />
                    <span>6% from last month</span>
                  </div>
                  <div className="leading-none text-muted-foreground">
                    Current backlog issues: 18
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Open Issues Table and Recent Updates Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* Open Issues Table - 2/3 width on desktop, full width on mobile */}
          <div className="col-span-1 md:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200">
              <div>
                <h3 className="text-lg font-cabinet-grotesk-bold text-gray-900">Open Issues</h3>
                <p className="text-sm text-gray-500 mt-1">Recent maintenance requests and issues that need attention.</p>
              </div>
              <button 
                className="mt-4 sm:mt-0 px-4 py-2 bg-[#D9E8FF] rounded-md text-sm font-medium text-black hover:bg-[#C8D7EE]"
                onClick={() => setIsFormDrawerOpen(true)}
              >
                Add issue
              </button>
            </div>
            
            <div className="overflow-x-auto">
              {issues.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No issues found</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {issues.map((issue) => (
                      <tr 
                        key={issue.id}
                        onClick={() => openDrawer(issue)}
                        className="cursor-pointer hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{issue.title}</td>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200">
              <Link href="/issues" className="text-sm text-gray-900 hover:text-indigo-900">View all issues →</Link>
            </div>
          </div>
          
          {/* Recent Updates - 1/3 width on desktop, full width on mobile */}
          <div className="col-span-1 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-cabinet-grotesk-bold text-gray-900">Recent Updates</h3>
              <p className="text-sm text-gray-500 mt-1">Latest activities across your properties.</p>
            </div>
            
            <div className="px-6 py-4">
              <div className="flow-root">
                <ul role="list" className="-mb-8">
                  {timeline.map((event, eventIdx) => (
                    <li key={event.id}>
                      <div className="relative pb-8">
                        {eventIdx !== timeline.length - 1 ? (
                          <span aria-hidden="true" className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span
                              className={classNames(
                                event.iconBackground,
                                'flex size-8 items-center justify-center rounded-full ring-8 ring-white',
                              )}
                            >
                              <event.icon aria-hidden="true" className="size-5 text-white" />
                            </span>
                          </div>
                          <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                            <div>
                              <p className="text-sm text-gray-500">
                                {event.content}{' '}
                                <a href={event.href} className="font-medium text-gray-900">
                                  {event.target}
                                </a>
                              </p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              <time dateTime={event.datetime}>{event.date}</time>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* 3x1 Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow-sm border border-gray-200">
            <div className="px-4 py-5 sm:p-6">{/* Card 1 Content goes here */}</div>
            <div className="px-4 py-4 sm:px-6">
              {/* Card 1 Footer content goes here */}
              <span className="text-sm text-gray-500">Card 1 Footer</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow-sm border border-gray-200">
            <div className="px-4 py-5 sm:p-6">{/* Card 2 Content goes here */}</div>
            <div className="px-4 py-4 sm:px-6">
              {/* Card 2 Footer content goes here */}
              <span className="text-sm text-gray-500">Card 2 Footer</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow-sm border border-gray-200">
            <div className="px-4 py-5 sm:p-6">{/* Card 3 Content goes here */}</div>
            <div className="px-4 py-4 sm:px-6">
              {/* Card 3 Footer content goes here */}
              <span className="text-sm text-gray-500">Card 3 Footer</span>
            </div>
          </div>
        </div>
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
        onSubmit={handleIssueSubmit}
        title="Report New Issue"
      />
    </SidebarLayout>
  )
} 