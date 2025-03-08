'use client'

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
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/solid'
import { TrendingUp, TrendingDown } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

// Financial data
const revenueData = [
  { month: "January", income: 120000, expenses: 50000 },
  { month: "February", income: 125000, expenses: 51500 },
  { month: "March", income: 128000, expenses: 54800 },
  { month: "April", income: 130000, expenses: 53400 },
  { month: "May", income: 140000, expenses: 58100 },
  { month: "June", income: 145800, expenses: 61300 }
]

const chartConfig = {
  income: {
    label: "Income",
    color: "hsl(var(--chart-4))",
  },
  expenses: {
    label: "Expenses",
    color: "hsl(var(--chart-5))",
  }
}

export default function Financial() {
  return (
    <SidebarLayout
      navbar={
        <div className="flex items-center justify-between py-4">
          <Heading level={1} className="text-xl font-semibold">Financial</Heading>
        </div>
      }
      sidebar={
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-3 px-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Image src="/next.svg" alt="PropBot Logo" width={24} height={24} className="dark:invert" />
              </div>
              <Heading level={2} className="text-lg font-semibold">PropBot</Heading>
            </div>
          </SidebarHeader>
          <SidebarBody className="space-y-1">
            <SidebarItem href="/dashboard" className="justify-start gap-3 pl-2">
              <DashboardIcon />
              <span>Dashboard</span>
            </SidebarItem>
            <SidebarItem href="/properties" className="justify-start gap-3 pl-2">
              <PropertiesIcon />
              <span>Properties</span>
            </SidebarItem>
            <SidebarItem href="/residents" className="justify-start gap-3 pl-2">
              <ResidentsIcon />
              <span>Residents</span>
            </SidebarItem>
            <SidebarItem href="/calendar" className="justify-start gap-3 pl-2">
              <CalendarIconComponent />
              <span>Calendar</span>
            </SidebarItem>
            <SidebarItem href="/issues" className="justify-start gap-3 pl-2">
              <IssuesIcon />
              <span>Issues</span>
            </SidebarItem>
            <SidebarItem href="/financial" current className="justify-start gap-3 pl-2">
              <FinancialIcon />
              <span>Financial</span>
            </SidebarItem>
            <SidebarItem href="/suppliers" className="justify-start gap-3 pl-2">
              <SuppliersIcon />
              <span>Suppliers</span>
            </SidebarItem>
            <SidebarItem href="/integrations" className="justify-start gap-3 pl-2">
              <IntegrationsIcon />
              <span>Integrations</span>
            </SidebarItem>
          </SidebarBody>
          <SidebarFooter>
            <div className="px-2 py-2">
              <Text className="text-xs text-zinc-500">© 2024 PropBot</Text>
            </div>
          </SidebarFooter>
        </Sidebar>
      }
    >
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-700">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">Financial</span>
        </div>
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <Heading level={1} className="text-2xl font-bold">Financial Overview</Heading>
            <Text className="text-gray-500 mt-1">Monitor your property portfolio's financial performance.</Text>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
              Export
            </button>
            <button className="px-4 py-2 bg-gray-900 rounded-md text-sm font-medium text-white hover:bg-gray-800">
              Generate Report
            </button>
          </div>
        </div>
        
        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Revenue */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Total Revenue (YTD)</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">$788,800</p>
            <div className="mt-4 flex items-center text-sm text-green-600">
              <ArrowUpIcon className="h-4 w-4 mr-1" />
              <span>8.2% from last year</span>
            </div>
          </div>
          
          {/* Total Expenses */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Total Expenses (YTD)</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">$329,100</p>
            <div className="mt-4 flex items-center text-sm text-red-600">
              <ArrowUpIcon className="h-4 w-4 mr-1" />
              <span>5.4% from last year</span>
            </div>
          </div>
          
          {/* Net Operating Income */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Net Operating Income</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">$459,700</p>
            <div className="mt-4 flex items-center text-sm text-green-600">
              <ArrowUpIcon className="h-4 w-4 mr-1" />
              <span>10.3% from last year</span>
            </div>
          </div>
          
          {/* Cash on Cash Return */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Cash on Cash Return</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">7.8%</p>
            <div className="mt-4 flex items-center text-sm text-green-600">
              <ArrowUpIcon className="h-4 w-4 mr-1" />
              <span>0.6% from last year</span>
            </div>
          </div>
        </div>
        
        {/* Financial Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full grid grid-cols-6 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="expense">Expense</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="profitability">Profitability</TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            {/* Revenue vs Expenses Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue vs Expenses</CardTitle>
                <CardDescription>January - June 2024</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig}>
                  <BarChart accessibilityLayer data={revenueData}>
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
                    <Bar dataKey="income" fill="var(--color-income)" radius={4} />
                    <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
              <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 font-medium leading-none text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  <span>Revenue is trending up by 5.2% this quarter</span>
                </div>
                <div className="leading-none text-muted-foreground">
                  Expenses remain stable compared to previous months
                </div>
              </CardFooter>
            </Card>
            
            {/* Financial Data Table */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm mt-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Property Financial Performance</h3>
                <p className="text-sm text-gray-500">Revenue and expense breakdown by property.</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Units</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Revenue</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Expenses</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NOI</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cap Rate</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Sunset Apartments</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">48</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$58,400</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$22,100</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$36,300</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">8.2%</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Oakwood Heights</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">36</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$43,200</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$18,900</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$24,300</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">7.5%</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Parkview Residences</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">24</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$28,800</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$11,600</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$17,200</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">6.9%</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Royal Gardens</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">18</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$21,600</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$8,900</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$12,700</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">8.0%</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">The Metropolitan</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">12</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$16,800</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$6,600</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$10,200</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">7.8%</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="income">
            <Card>
              <CardHeader>
                <CardTitle>Income Breakdown</CardTitle>
                <CardDescription>Monthly income by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{
                  rent: {
                    label: "Rental Income",
                    color: "hsl(var(--chart-1))"
                  },
                  fees: {
                    label: "Fees & Deposits",
                    color: "hsl(var(--chart-2))"
                  },
                  other: {
                    label: "Other Income",
                    color: "hsl(var(--chart-3))"
                  }
                }}>
                  <BarChart accessibilityLayer data={[
                    { month: "January", rent: 110000, fees: 6000, other: 4000 },
                    { month: "February", rent: 115000, fees: 5500, other: 4500 },
                    { month: "March", rent: 118000, fees: 6200, other: 3800 },
                    { month: "April", rent: 120000, fees: 5800, other: 4200 },
                    { month: "May", rent: 128000, fees: 7000, other: 5000 },
                    { month: "June", rent: 133000, fees: 7500, other: 5300 }
                  ]}>
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
                    <Bar dataKey="rent" name="rent" fill="var(--color-rent)" radius={4} />
                    <Bar dataKey="fees" name="fees" fill="var(--color-fees)" radius={4} />
                    <Bar dataKey="other" name="other" fill="var(--color-other)" radius={4} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
              <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 font-medium leading-none text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  <span>Rental income increased by 4.2% in the last 6 months</span>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="expense">
            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
                <CardDescription>Monthly expenses by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{
                  maintenance: {
                    label: "Maintenance",
                    color: "hsl(var(--chart-5))"
                  },
                  utilities: {
                    label: "Utilities",
                    color: "hsl(var(--chart-6))"
                  },
                  taxes: {
                    label: "Property Taxes",
                    color: "hsl(var(--chart-7))"
                  },
                  insurance: {
                    label: "Insurance",
                    color: "hsl(var(--chart-8))"
                  }
                }}>
                  <BarChart accessibilityLayer data={[
                    { month: "January", maintenance: 15000, utilities: 10000, taxes: 8000, insurance: 5000 },
                    { month: "February", maintenance: 14500, utilities: 10000, taxes: 8000, insurance: 5000 },
                    { month: "March", maintenance: 16800, utilities: 10000, taxes: 8000, insurance: 5000 },
                    { month: "April", maintenance: 15400, utilities: 10000, taxes: 8000, insurance: 5000 },
                    { month: "May", maintenance: 17100, utilities: 10000, taxes: 8000, insurance: 5000 },
                    { month: "June", maintenance: 18300, utilities: 10000, taxes: 8000, insurance: 5000 }
                  ]}>
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
                    <Bar dataKey="maintenance" name="maintenance" fill="var(--color-maintenance)" radius={4} />
                    <Bar dataKey="utilities" name="utilities" fill="var(--color-utilities)" radius={4} />
                    <Bar dataKey="taxes" name="taxes" fill="var(--color-taxes)" radius={4} />
                    <Bar dataKey="insurance" name="insurance" fill="var(--color-insurance)" radius={4} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
              <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 font-medium leading-none text-red-600">
                  <TrendingUp className="h-4 w-4" />
                  <span>Maintenance costs increased by 22% in the last 6 months</span>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="transactions">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
                  <p className="text-sm text-gray-500">Recent financial activities across all properties.</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search transactions..."
                      className="w-64 px-4 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <button className="p-2 text-gray-500 hover:text-gray-700">
                    <ArrowDownIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Mar 8, 2024</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Income</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Monthly Rent - Unit 204</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Sunset Apartments</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">+$1,850.00</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Completed</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a href="#" className="text-blue-600 hover:text-blue-900">View</a>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Mar 7, 2024</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Expense</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Emergency Plumbing Repair</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Oakwood Heights</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">-$850.00</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Completed</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a href="#" className="text-blue-600 hover:text-blue-900">View</a>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Mar 5, 2024</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Income</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Late Fee - Unit 112</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Sunset Apartments</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">+$75.00</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Completed</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a href="#" className="text-blue-600 hover:text-blue-900">View</a>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Mar 3, 2024</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Expense</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Landscaping Services</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Royal Gardens</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">-$450.00</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a href="#" className="text-blue-600 hover:text-blue-900">View</a>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Mar 1, 2024</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Income</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Monthly Rent - Unit 305</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Parkview Residences</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">+$2,100.00</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Completed</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a href="#" className="text-blue-600 hover:text-blue-900">View</a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200">
                <button className="text-sm text-blue-600 hover:underline">View all transactions</button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="profitability">
            <Card>
              <CardHeader>
                <CardTitle>Profitability Metrics</CardTitle>
                <CardDescription>Key profitability indicators over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{
                  capRate: {
                    label: "Cap Rate (%)",
                    color: "hsl(var(--chart-1))"
                  },
                  cashOnCash: {
                    label: "Cash on Cash (%)",
                    color: "hsl(var(--chart-2))"
                  },
                  roi: {
                    label: "ROI (%)",
                    color: "hsl(var(--chart-3))"
                  }
                }}>
                  <LineChart accessibilityLayer data={[
                    { month: "January", capRate: 7.5, cashOnCash: 7.2, roi: 8.1 },
                    { month: "February", capRate: 7.5, cashOnCash: 7.4, roi: 8.3 },
                    { month: "March", capRate: 7.6, cashOnCash: 7.5, roi: 8.4 },
                    { month: "April", capRate: 7.7, cashOnCash: 7.6, roi: 8.5 },
                    { month: "May", capRate: 7.7, cashOnCash: 7.7, roi: 8.6 },
                    { month: "June", capRate: 7.8, cashOnCash: 7.8, roi: 8.7 }
                  ]}>
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
                      dataKey="capRate" 
                      name="capRate"
                      stroke="var(--color-capRate)" 
                      strokeWidth={2} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cashOnCash" 
                      name="cashOnCash"
                      stroke="var(--color-cashOnCash)" 
                      strokeWidth={2} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="roi" 
                      name="roi"
                      stroke="var(--color-roi)" 
                      strokeWidth={2} 
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
              <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 font-medium leading-none text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  <span>All profitability metrics show positive trend</span>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="properties">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Property Card 1 */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Sunset Apartments</CardTitle>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      High Performance
                    </span>
                  </div>
                  <CardDescription>48 Units • Class B</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Monthly Revenue</p>
                      <p className="text-lg font-bold text-gray-900">$58,400</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Expenses</p>
                      <p className="text-lg font-bold text-gray-900">$22,100</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">NOI</p>
                      <p className="text-lg font-bold text-gray-900">$36,300</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Cap Rate</p>
                      <p className="text-lg font-bold text-green-600">8.2%</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <a href="#" className="text-sm text-blue-600 hover:underline">View property details</a>
                </CardFooter>
              </Card>
              
              {/* Property Card 2 */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Oakwood Heights</CardTitle>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      High Performance
                    </span>
                  </div>
                  <CardDescription>36 Units • Class B</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Monthly Revenue</p>
                      <p className="text-lg font-bold text-gray-900">$43,200</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Expenses</p>
                      <p className="text-lg font-bold text-gray-900">$18,900</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">NOI</p>
                      <p className="text-lg font-bold text-gray-900">$24,300</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Cap Rate</p>
                      <p className="text-lg font-bold text-green-600">7.5%</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <a href="#" className="text-sm text-blue-600 hover:underline">View property details</a>
                </CardFooter>
              </Card>
              
              {/* Property Card 3 */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Parkview Residences</CardTitle>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Moderate Performance
                    </span>
                  </div>
                  <CardDescription>24 Units • Class A</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Monthly Revenue</p>
                      <p className="text-lg font-bold text-gray-900">$28,800</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Expenses</p>
                      <p className="text-lg font-bold text-gray-900">$11,600</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">NOI</p>
                      <p className="text-lg font-bold text-gray-900">$17,200</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Cap Rate</p>
                      <p className="text-lg font-bold text-yellow-600">6.9%</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <a href="#" className="text-sm text-blue-600 hover:underline">View property details</a>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  )
} 