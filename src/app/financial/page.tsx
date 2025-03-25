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
  ArrowUpIcon,
  ArrowDownIcon,
  XMarkIcon,
  CloudArrowUpIcon,
  PlusIcon
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
  YAxis,
  PieChart,
  Pie,
  Legend,
  LabelList
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SidebarContent } from '../components/sidebar-content'
import { ReportGenerationDrawer } from '../components/ReportGenerationDrawer'

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
    color: "#E9823F",
  },
  expenses: {
    label: "Expenses",
    color: "#E95D3F",
  }
}

// Document types for the document table
// const documents = [
//   { id: 1, name: "Mortgage Document.pdf", type: "mortgage", uploadDate: "Jan 15, 2024", property: "Oakwood Heights", fileSize: "2.3 MB" },
//   { id: 2, name: "Home Insurance Policy.pdf", type: "insurance", uploadDate: "Feb 10, 2024", property: "Sunset Apartments", fileSize: "3.1 MB" },
//   { id: 3, name: "Energy Performance Certificate.pdf", type: "epc", uploadDate: "Nov 5, 2023", property: "Parkview Residences", fileSize: "1.5 MB" },
// ]

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

export default function Financial() {
  const [isReportDrawerOpen, setIsReportDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

  const handleViewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setIsDrawerOpen(true)
  }

  const handleReportSubmit = (reportConfig: any) => {
    // Here you would typically generate the report based on the config
    console.log('Generating report with config:', reportConfig);
    setIsReportDrawerOpen(false);
  };

  return (
    <SidebarLayout
      sidebar={<SidebarContent currentPath="/financial" />}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <Heading level={1} className="text-2xl font-bold">Financial Overview</Heading>
            <Text className="text-gray-500 mt-1">Monitor your property portfolio's financial performance.</Text>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <button 
              className="px-4 py-2 bg-[#D9E8FF] rounded-md text-sm font-medium text-black hover:bg-[#C8D7EE]"
              onClick={() => setIsReportDrawerOpen(true)}
            >
              Generate Report
            </button>
          </div>
        </div>
        
        {/* Report Generation Drawer */}
        <ReportGenerationDrawer
          isOpen={isReportDrawerOpen}
          onClose={() => setIsReportDrawerOpen(false)}
          onSubmit={handleReportSubmit}
        />
        
        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Revenue */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Total Revenue (YTD)</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">£788,800</p>
            <div className="mt-4 flex items-center text-sm text-green-600">
              <ArrowUpIcon className="h-4 w-4 mr-1" />
              <span>8.2% from last year</span>
            </div>
          </div>
          
          {/* Total Expenses */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Total Expenses (YTD)</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">£329,100</p>
            <div className="mt-4 flex items-center text-sm text-red-600">
              <ArrowUpIcon className="h-4 w-4 mr-1" />
              <span>5.4% from last year</span>
            </div>
          </div>
          
          {/* Net Operating Income */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Net Operating Income</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">£459,700</p>
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
                    <Bar dataKey="income" fill="#E9823F" radius={4} />
                    <Bar dataKey="expenses" fill="#E95D3F" radius={4} />
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
            
            {/* Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Expense Breakdown by Category */}
              <Card>
                <CardHeader>
                  <CardTitle>Expense Breakdown by Category</CardTitle>
                  <CardDescription>January - June 2024</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      maintenance: {
                        label: "Maintenance",
                        color: "#E95D3F"
                      },
                      utilities: {
                        label: "Utilities",
                        color: "#E9823F"
                      },
                      taxes: {
                        label: "Property Taxes",
                        color: "#29A3BE"
                      },
                      insurance: {
                        label: "Insurance",
                        color: "#4264CB"
                      },
                      other: {
                        label: "Other",
                        color: "#F5A623"
                      }
                    }}
                    className="mx-auto aspect-square max-h-[300px]"
                  >
                    <PieChart>
                      <Pie 
                        data={[
                          { name: "Maintenance", value: 18300, fill: "#E95D3F" },
                          { name: "Utilities", value: 10000, fill: "#E9823F" },
                          { name: "Property Taxes", value: 8000, fill: "#29A3BE" },
                          { name: "Insurance", value: 5000, fill: "#4264CB" },
                          { name: "Other", value: 20000, fill: "#F5A623" }
                        ]} 
                        dataKey="value"
                        nameKey="name"
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        wrapperStyle={{
                          paddingTop: "20px",
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "8px",
                          justifyContent: "center"
                        }}
                      />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Occupancy Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Occupancy Trend</CardTitle>
                  <CardDescription>January - June 2024</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{
                    occupancy: {
                      label: "Occupancy Rate (%)",
                      color: "#E9823F",
                    }
                  }}>
                    <LineChart
                      accessibilityLayer
                      data={[
                        { month: "January", occupancy: 89 },
                        { month: "February", occupancy: 91 },
                        { month: "March", occupancy: 92 },
                        { month: "April", occupancy: 92 },
                        { month: "May", occupancy: 93 },
                        { month: "June", occupancy: 94 }
                      ]}
                      margin={{
                        top: 20,
                        left: 12,
                        right: 12,
                      }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => value.slice(0, 3)}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="line" />}
                      />
                      <Line
                        dataKey="occupancy"
                        type="natural"
                        stroke="#E9823F"
                        strokeWidth={2}
                        dot={{
                          fill: "#E9823F",
                        }}
                        activeDot={{
                          r: 6,
                        }}
                      >
                        <LabelList
                          position="top"
                          offset={12}
                          className="fill-foreground"
                          fontSize={12}
                        />
                      </Line>
                    </LineChart>
                  </ChartContainer>
                </CardContent>
                <CardFooter className="flex-col items-start gap-2 text-sm">
                  <div className="flex gap-2 font-medium leading-none text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    <span>Occupancy trending up by 5.2% this month</span>
                  </div>
                  <div className="leading-none text-muted-foreground">
                    Showing occupancy rates for the last 6 months
                  </div>
                </CardFooter>
              </Card>
            </div>
            
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
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rooms</th>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">£58,400</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">£22,100</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">£36,300</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">8.2%</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Oakwood Heights</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">36</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">£43,200</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">£18,900</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">£24,300</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">7.5%</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Parkview Residences</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">24</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">£28,800</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">£11,600</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">£17,200</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">6.9%</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Royal Gardens</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">18</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">£21,600</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">£8,900</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">£12,700</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">8.0%</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">The Metropolitan</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">12</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">£16,800</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">£6,600</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">£10,200</td>
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
                    color: "#E9823F"
                  },
                  fees: {
                    label: "Fees & Deposits",
                    color: "#29A3BE"
                  },
                  other: {
                    label: "Other Income",
                    color: "#4264CB"
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
                    <Bar dataKey="rent" name="rent" fill="#E9823F" radius={4} />
                    <Bar dataKey="fees" name="fees" fill="#29A3BE" radius={4} />
                    <Bar dataKey="other" name="other" fill="#4264CB" radius={4} />
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
                    color: "#E95D3F"
                  },
                  utilities: {
                    label: "Utilities",
                    color: "#E9823F"
                  },
                  taxes: {
                    label: "Property Taxes",
                    color: "#29A3BE"
                  },
                  insurance: {
                    label: "Insurance",
                    color: "#4264CB"
                  },
                  other: {
                    label: "Other",
                    color: "#F5A623"
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
                    <Bar dataKey="maintenance" name="maintenance" fill="#E95D3F" radius={4} />
                    <Bar dataKey="utilities" name="utilities" fill="#E9823F" radius={4} />
                    <Bar dataKey="taxes" name="taxes" fill="#29A3BE" radius={4} />
                    <Bar dataKey="insurance" name="insurance" fill="#4264CB" radius={4} />
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
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Rent</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Monthly Rent - Room 204</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Sunset Apartments</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">+£1,850.00</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Completed</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a href="#" className="text-blue-600 hover:text-blue-900" onClick={(e) => {
                          e.preventDefault()
                          handleViewTransaction({
                            date: "Mar 8, 2024",
                            type: "Income",
                            category: "Rent",
                            description: "Monthly Rent - Room 204",
                            property: "Sunset Apartments",
                            amount: "+£1,850.00",
                            status: "Completed"
                          })
                        }}>View</a>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Mar 7, 2024</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Expense</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Maintenance</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Emergency Plumbing Repair</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Oakwood Heights</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">-£850.00</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Completed</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a href="#" className="text-blue-600 hover:text-blue-900" onClick={(e) => {
                          e.preventDefault()
                          handleViewTransaction({
                            date: "Mar 7, 2024",
                            type: "Expense",
                            category: "Maintenance",
                            description: "Emergency Plumbing Repair",
                            property: "Oakwood Heights",
                            amount: "-£850.00",
                            status: "Completed"
                          })
                        }}>View</a>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Mar 5, 2024</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Income</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Fees</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Late Fee - Room 112</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Sunset Apartments</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">+£75.00</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Completed</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a href="#" className="text-blue-600 hover:text-blue-900" onClick={(e) => {
                          e.preventDefault()
                          handleViewTransaction({
                            date: "Mar 5, 2024",
                            type: "Income",
                            category: "Fees",
                            description: "Late Fee - Room 112",
                            property: "Sunset Apartments",
                            amount: "+£75.00",
                            status: "Completed"
                          })
                        }}>View</a>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Mar 3, 2024</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Expense</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Property Care</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Landscaping Services</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Royal Gardens</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">-£450.00</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a href="#" className="text-blue-600 hover:text-blue-900" onClick={(e) => {
                          e.preventDefault()
                          handleViewTransaction({
                            date: "Mar 3, 2024",
                            type: "Expense",
                            category: "Property Care",
                            description: "Landscaping Services",
                            property: "Royal Gardens",
                            amount: "-£450.00",
                            status: "Pending"
                          })
                        }}>View</a>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Mar 1, 2024</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Income</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Rent</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Monthly Rent - Room 305</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Parkview Residences</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">+£2,100.00</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Completed</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a href="#" className="text-blue-600 hover:text-blue-900" onClick={(e) => {
                          e.preventDefault()
                          handleViewTransaction({
                            date: "Mar 1, 2024",
                            type: "Income",
                            category: "Rent",
                            description: "Monthly Rent - Room 305",
                            property: "Parkview Residences",
                            amount: "+£2,100.00",
                            status: "Completed"
                          })
                        }}>View</a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200">
                <Link href="/financial/transactions" className="text-sm text-blue-600 hover:underline">View all transactions</Link>
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
                    color: "#E9823F"
                  },
                  cashOnCash: {
                    label: "Cash on Cash (%)",
                    color: "#29A3BE"
                  },
                  roi: {
                    label: "ROI (%)",
                    color: "#4264CB"
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
                      stroke="#E9823F" 
                      strokeWidth={2} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cashOnCash" 
                      name="cashOnCash"
                      stroke="#29A3BE" 
                      strokeWidth={2} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="roi" 
                      name="roi"
                      stroke="#4264CB" 
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
                  <CardDescription>48 Rooms • Class B</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Monthly Revenue</p>
                      <p className="text-lg font-bold text-gray-900">£58,400</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Expenses</p>
                      <p className="text-lg font-bold text-gray-900">£22,100</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">NOI</p>
                      <p className="text-lg font-bold text-gray-900">£36,300</p>
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
                  <CardDescription>36 Rooms • Class B</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Monthly Revenue</p>
                      <p className="text-lg font-bold text-gray-900">£43,200</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Expenses</p>
                      <p className="text-lg font-bold text-gray-900">£18,900</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">NOI</p>
                      <p className="text-lg font-bold text-gray-900">£24,300</p>
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
                  <CardDescription>24 Rooms • Class A</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Monthly Revenue</p>
                      <p className="text-lg font-bold text-gray-900">£28,800</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Expenses</p>
                      <p className="text-lg font-bold text-gray-900">£11,600</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">NOI</p>
                      <p className="text-lg font-bold text-gray-900">£17,200</p>
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
    </SidebarLayout>
  )
} 