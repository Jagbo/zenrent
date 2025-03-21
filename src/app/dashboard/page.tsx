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
  ArrowDownIcon
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
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SidebarContent } from '../components/sidebar-content'
import { IssueDetailsDrawer } from "@/components/issues/IssueDetailsDrawer"

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
      color: "hsl(var(--chart-1))"
    }
  },
  profitMargin: {
    profit: {
      label: "Profit Margin",
      color: "hsl(var(--chart-2))"
    }
  },
  occupancy: {
    occupancy: {
      label: "Occupancy Rate",
      color: "hsl(var(--chart-3))"
    }
  },
  // Finance tab
  income: {
    desktop: {
      label: "Rental Income",
      color: "hsl(var(--chart-4))"
    },
    mobile: {
      label: "Other Income",
      color: "hsl(var(--chart-5))"
    }
  },
  expenses: {
    desktop: {
      label: "Operating Expenses",
      color: "hsl(var(--chart-6))"
    },
    mobile: {
      label: "Maintenance Costs",
      color: "hsl(var(--chart-7))"
    }
  },
  arrears: {
    arrears: {
      label: "Arrears",
      color: "hsl(var(--chart-8))"
    }
  },
  // Issues tab
  active: {
    active: {
      label: "Active Issues",
      color: "hsl(var(--chart-9))"
    }
  },
  urgent: {
    urgent: {
      label: "Urgent Issues",
      color: "hsl(var(--chart-1))"
    }
  },
  backlog: {
    backlog: {
      label: "Backlog Issues",
      color: "hsl(var(--chart-2))"
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
  // Add state for selected issue and drawer open state
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Function to handle opening the drawer
  const openDrawer = (issue: Issue) => {
    setSelectedIssue(issue);
    setIsDrawerOpen(true);
  };

  // Dashboard open issues data
  const openIssues: Issue[] = [
    {
      id: "1254",
      title: "Water leak in bathroom ceiling",
      type: "Bug",
      status: "Todo",
      priority: "High",
      property: "Sunset Apartments Room 204",
      reported: "Mar 8, 2024",
      assignedTo: "JS"
    },
    {
      id: "1253", 
      title: "Broken heating system",
      type: "Bug",
      status: "In Progress",
      priority: "High",
      property: "Oakwood Heights Room 103",
      reported: "Mar 7, 2024",
      assignedTo: "RW"
    },
    {
      id: "1252",
      title: "Mailbox key replacement",
      type: "Feature",
      status: "Todo",
      priority: "Low",
      property: "Sunset Apartments Room 112",
      reported: "Mar 6, 2024",
      assignedTo: ""
    },
    {
      id: "1251",
      title: "Noisy neighbors complaint",
      type: "Bug",
      status: "Todo",
      priority: "Medium",
      property: "Parkview Residences Room 305",
      reported: "Mar 5, 2024",
      assignedTo: ""
    },
    {
      id: "1250",
      title: "Parking spot dispute",
      type: "Bug",
      status: "Todo",
      priority: "Medium",
      property: "Oakwood Heights Room 210",
      reported: "Mar 4, 2024",
      assignedTo: ""
    }
  ];

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
              className="px-4 py-2 bg-gray-900 rounded-md text-sm font-medium text-white hover:bg-gray-800"
            >
              View Properties
            </Link>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Properties */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Properties</h3>
            <p className="mt-2 text-4xl font-bold text-gray-900">12</p>
          </div>
          
          {/* Contracts expiring */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Contracts expiring</h3>
            <p className="mt-2 text-4xl font-bold text-gray-900">8</p>
            <div className="mt-4 flex items-center text-sm text-amber-600">
              <ArrowUpIcon className="h-4 w-4 mr-1" />
              <span>Next 30 days</span>
            </div>
          </div>
          
          {/* Occupancy */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Occupancy</h3>
            <p className="mt-2 text-4xl font-bold text-gray-900">94%</p>
          </div>

          {/* Income */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Income</h3>
            <p className="mt-2 text-4xl font-bold text-gray-900">£24,350</p>
            <div className="mt-4 flex items-center text-sm text-green-600">
              <ArrowUpIcon className="h-4 w-4 mr-1" />
              <span>+5% from last month</span>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="finance">Finance</TabsTrigger>
            <TabsTrigger value="issues">Issues</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="pt-6">
            {/* Dashboard Content */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Open Issues */}
              <Card>
                <CardHeader>
                  <CardTitle>Open Issues</CardTitle>
                  <CardDescription>Total: 24</CardDescription>
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
                        stroke="var(--color-issues)"
                        fill="var(--color-issues)"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
                <CardFooter className="flex-col items-start gap-2 text-sm">
                  <div className="flex gap-2 font-medium leading-none text-green-600">
                    <ArrowUpIcon className="h-4 w-4" />
                    <span>12% from last week</span>
                  </div>
                </CardFooter>
              </Card>
              
              {/* Profit Margin */}
              <Card>
                <CardHeader>
                  <CardTitle>Profit Margin</CardTitle>
                  <CardDescription>Current: 72%</CardDescription>
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
                        fill="var(--color-profit)"
                        radius={4}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
                <CardFooter className="flex-col items-start gap-2 text-sm">
                  <div className="flex gap-2 font-medium leading-none text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    <span>2% from last month</span>
                  </div>
                </CardFooter>
              </Card>
              
              {/* Occupancy Rate */}
              <Card>
                <CardHeader>
                  <CardTitle>Occupancy Rate</CardTitle>
                  <CardDescription>Current: 94%</CardDescription>
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
                        stroke="var(--color-occupancy)"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
                <CardFooter className="flex-col items-start gap-2 text-sm">
                  <div className="flex gap-2 font-medium leading-none text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    <span>1% from last quarter</span>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="finance" className="pt-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Total Income */}
              <Card>
                <CardHeader>
                  <CardTitle>Total Income</CardTitle>
                  <CardDescription>January - June 2023</CardDescription>
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
                      <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
                      <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
                <CardFooter className="flex-col items-start gap-2 text-sm">
                  <div className="flex gap-2 font-medium leading-none text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    <span>4% from last month</span>
                  </div>
                  <div className="leading-none text-muted-foreground">
                    Total current income: £145,800
                  </div>
                </CardFooter>
              </Card>
              
              {/* Total Expenditure */}
              <Card>
                <CardHeader>
                  <CardTitle>Total Expenditure</CardTitle>
                  <CardDescription>January - June 2023</CardDescription>
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
                      <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
                      <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
                <CardFooter className="flex-col items-start gap-2 text-sm">
                  <div className="flex gap-2 font-medium leading-none text-red-600">
                    <TrendingUp className="h-4 w-4" />
                    <span>3% from last month</span>
                  </div>
                  <div className="leading-none text-muted-foreground">
                    Total current expenses: £41,300
                  </div>
                </CardFooter>
              </Card>
              
              {/* Rent Arrears */}
              <Card>
                <CardHeader>
                  <CardTitle>Rent Arrears</CardTitle>
                  <CardDescription>January - June 2023</CardDescription>
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
                        stroke="var(--color-arrears)"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
                <CardFooter className="flex-col items-start gap-2 text-sm">
                  <div className="flex gap-2 font-medium leading-none text-red-600">
                    <TrendingUp className="h-4 w-4" />
                    <span>5% from last month</span>
                  </div>
                  <div className="leading-none text-muted-foreground">
                    Current arrears: £12,400
                  </div>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="issues" className="pt-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Active Issues */}
              <Card>
                <CardHeader>
                  <CardTitle>Active Issues</CardTitle>
                  <CardDescription>January - June 2023</CardDescription>
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
                <CardFooter className="flex-col items-start gap-2 text-sm">
                  <div className="flex gap-2 font-medium leading-none text-red-600">
                    <TrendingUp className="h-4 w-4" />
                    <span>3% from last week</span>
                  </div>
                  <div className="leading-none text-muted-foreground">
                    Current active issues: 35
                  </div>
                </CardFooter>
              </Card>
              
              {/* Urgent Issues */}
              <Card>
                <CardHeader>
                  <CardTitle>Urgent Issues</CardTitle>
                  <CardDescription>January - June 2023</CardDescription>
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
                <CardFooter className="flex-col items-start gap-2 text-sm">
                  <div className="flex gap-2 font-medium leading-none text-gray-600">
                    <span>No change from last week</span>
                  </div>
                  <div className="leading-none text-muted-foreground">
                    Current urgent issues: 12
                  </div>
                </CardFooter>
              </Card>
              
              {/* Backlog Issues */}
              <Card>
                <CardHeader>
                  <CardTitle>Backlog Issues</CardTitle>
                  <CardDescription>January - June 2023</CardDescription>
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
                <CardFooter className="flex-col items-start gap-2 text-sm">
                  <div className="flex gap-2 font-medium leading-none text-red-600">
                    <TrendingUp className="h-4 w-4" />
                    <span>6% from last month</span>
                  </div>
                  <div className="leading-none text-muted-foreground">
                    Current backlog issues: 18
                  </div>
                </CardFooter>
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
                <h3 className="text-lg font-medium text-gray-900">Open Issues</h3>
                <p className="text-sm text-gray-500 mt-1">Recent maintenance requests and issues that need attention.</p>
              </div>
              <button className="mt-4 sm:mt-0 px-4 py-2 bg-gray-900 rounded-md text-sm font-medium text-white hover:bg-gray-800">
                Add issue
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {openIssues.map((issue) => (
                    <tr 
                      key={issue.id}
                      onClick={() => openDrawer(issue)}
                      className="cursor-pointer hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{issue.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          issue.priority === "High" ? "bg-red-100 text-red-800" :
                          issue.priority === "Medium" ? "bg-blue-100 text-blue-800" :
                          "bg-green-100 text-green-800"
                        }`}>
                          {issue.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{issue.property}</td>
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
            
            <div className="px-6 py-4 border-t border-gray-200">
              <a href="/issues" className="text-sm text-indigo-600 hover:text-indigo-900">View all issues →</a>
            </div>
          </div>
          
          {/* Recent Updates - 1/3 width on desktop, full width on mobile */}
          <div className="col-span-1 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Updates</h3>
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
        
        {/* Upcoming Meetings */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Upcoming Meetings</h3>
            <p className="text-sm text-gray-500">Schedule and manage your property-related appointments.</p>
          </div>
          
          <div className="divide-y divide-gray-200">
            <div className="px-6 py-4 flex">
              <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center text-purple-500">
                <span className="text-sm font-medium">PI</span>
              </div>
              <div className="ml-4 flex-1">
                <h4 className="text-sm font-medium text-gray-900">Plumbing inspection</h4>
                <div className="mt-1 flex items-center text-sm text-gray-500">
                  <CalendarIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                  <span>January 22, 2022 at 09:00 - 10:30</span>
                </div>
                <div className="mt-1 flex items-center text-sm text-gray-500">
                  <MapPinIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                  <span>Sunset Apartments Room 204</span>
                </div>
              </div>
              <div className="ml-4">
                <button className="text-gray-400 hover:text-gray-500">
                  <EllipsisVerticalIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="px-6 py-4 flex">
              <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-500">
                <span className="text-sm font-medium">Ne</span>
              </div>
              <div className="ml-4 flex-1">
                <h4 className="text-sm font-medium text-gray-900">New tenant orientation</h4>
                <div className="mt-1 flex items-center text-sm text-gray-500">
                  <CalendarIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                  <span>January 22, 2022 at 11:00 - 12:00</span>
                </div>
                <div className="mt-1 flex items-center text-sm text-gray-500">
                  <MapPinIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                  <span>Oakwood Heights Room 103</span>
                </div>
              </div>
              <div className="ml-4">
                <button className="text-gray-400 hover:text-gray-500">
                  <EllipsisVerticalIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex">
                <button className="p-1 rounded-md text-gray-400 hover:text-gray-500">
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <button className="p-1 rounded-md text-gray-400 hover:text-gray-500">
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
              <h4 className="text-sm font-medium text-gray-900">January</h4>
              <button className="px-4 py-2 bg-blue-600 rounded-md text-sm font-medium text-white hover:bg-blue-700">
                Add event
              </button>
            </div>
          </div>
        </div>
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
    </SidebarLayout>
  )
} 