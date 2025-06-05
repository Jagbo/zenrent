"use client";

import { useState, useEffect } from "react";
import { SidebarLayout } from "../components/sidebar-layout";
import { Heading } from "../components/heading";
import { Text } from "../components/text";
import Link from "next/link";
import {
  BuildingOfficeIcon,
  CalendarIcon,
  ExclamationCircleIcon,
  BanknotesIcon,
  ShoppingBagIcon,
  ArrowUpIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/solid";
import {
  CheckIcon as CheckIcon20,
  UserIcon,
} from "@heroicons/react/20/solid";
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
} from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { IssueDrawer } from "../components/IssueDrawer";
import { IssueFormDrawer } from "../components/IssueFormDrawer";
import { getRecentIssues, createIssue } from "../../lib/issueService";
import { getDashboardStats, getDashboardChartData } from "../../lib/dashboardService";
import { getRecentNotifications, Notification, BaseNotification, markNotificationAsRead, markAllNotificationsAsRead } from "../../lib/notificationService";
import { supabase } from "../../lib/supabase";


// Utility function for combining class names
function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

// Chart configs
const chartConfigs = {
  // Overview tab
  issues: {
    issues: {
      label: "Issues",
      color: "#E9823F",
    },
  },
  profitMargin: {
    profit: {
      label: "Profit Margin",
      color: "#29A3BE",
    },
  },
  occupancy: {
    occupancy: {
      label: "Occupancy Rate",
      color: "#4264CB",
    },
  },
  // Finance tab
  income: {
    desktop: {
      label: "Rental Income",
      color: "#E9823F",
    },
    mobile: {
      label: "Other Income",
      color: "#E95D3F",
    },
  },
  expenses: {
    desktop: {
      label: "Operating Expenses",
      color: "#29A3BE",
    },
    mobile: {
      label: "Maintenance Costs",
      color: "#4264CB",
    },
  },
  arrears: {
    arrears: {
      label: "Arrears",
      color: "#F5A623",
    },
  },
  // Issues tab
  active: {
    active: {
      label: "Active Issues",
      color: "#E9823F",
    },
  },
  urgent: {
    urgent: {
      label: "Urgent Issues",
      color: "#E95D3F",
    },
  },
  backlog: {
    backlog: {
      label: "Backlog Issues",
      color: "#29A3BE",
    },
  },
};

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
};

// Add chart data type
interface ChartDataItem {
  month: string;
  value: number;
}

interface ChartData {
  issues: ChartDataItem[];
  income: ChartDataItem[];
  expenses: ChartDataItem[];
  profitMargin: ChartDataItem[];
  occupancy: ChartDataItem[];
  arrears: ChartDataItem[];
  urgent?: ChartDataItem[];
  backlog?: ChartDataItem[];
}

// After the Notification interface, add these new interfaces
interface RentPaymentDetails {
  tenant_name?: string;
  property_address?: string;
  payment_amount?: number;
  due_date?: string;
  days_overdue?: number;
  remaining_balance?: number;
}

interface MaintenanceDetails {
  issue_title?: string;
  property_address?: string;
  tenant_name?: string;
  status?: string;
  priority_level?: string;
  quote_amount?: number;
  scheduled_date?: string;
}

interface TenancyDetails {
  tenant_name?: string;
  property_address?: string;
  expiry_date?: string;
  notice_date?: string;
  inspection_date?: string;
}

interface ComplianceDetails {
  certificate_type?: string;
  property_address?: string;
  expiry_date?: string;
  missing_document_type?: string;
  compliance_deadline?: string;
  days_overdue?: number;
}

interface FinancialDetails {
  invoice_amount?: number;
  supplier_name?: string;
  property_address?: string;
  due_date?: string;
  expense_type?: string;
  new_amount?: number;
  previous_amount?: number;
  tax_year_end?: string;
  total_rental_income?: number;
}

interface PropertyPerformanceDetails {
  property_address?: string;
  days_vacant?: number;
  estimated_lost_income?: number;
  total_income?: number;
  total_expenses?: number;
}

interface RentPaymentNotification extends BaseNotification {
  rent_payment_notification?: RentPaymentDetails[];
}

interface MaintenanceNotification extends BaseNotification {
  maintenance_notification?: MaintenanceDetails[];
}

interface TenancyNotification extends BaseNotification {
  tenancy_notification?: TenancyDetails[];
}

interface ComplianceNotification extends BaseNotification {
  compliance_notification?: ComplianceDetails[];
}

interface FinancialNotification extends BaseNotification {
  financial_notification?: FinancialDetails[];
}

interface PropertyPerformanceNotification extends BaseNotification {
  property_performance_notification?: PropertyPerformanceDetails[];
}

export default function Dashboard() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalProperties: 0,
    expiringContracts: 0,
    occupancyRate: 0,
    currentMonthIncome: 0,
  });
  const [chartData, setChartData] = useState<ChartData>({
    issues: [],
    income: [],
    expenses: [],
    profitMargin: [],
    occupancy: [],
    arrears: [],
    urgent: [],
    backlog: []
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const tabs = [
    { name: "Overview", value: "overview", current: selectedTab === "overview" },
    { name: "Finance", value: "finance", current: selectedTab === "finance" },
    { name: "Issues", value: "issues", current: selectedTab === "issues" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          fetchIssues(),
          fetchDashboardStats(),
          fetchNotifications(),
          fetchChartData()
        ]);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchData();
  }, []);

  const handleTabChange = (value: string) => {
    setSelectedTab(value);
  };

  // Fetch issues from Supabase
  const fetchIssues = async () => {
    try {
      const issues = await getRecentIssues(5);
      setIssues(issues);
    } catch (error) {
      console.error("Error fetching issues:", error);
    }
  };

  // Fetch dashboard stats from Supabase
  const fetchDashboardStats = async () => {
    try {
      const stats = await getDashboardStats();
      setDashboardStats(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  // Fetch notifications from Supabase
  const fetchNotifications = async (limit = 5) => {
    try {
      const notifications = await getRecentNotifications(limit);
      setNotifications(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // Fetch chart data from Supabase
  const fetchChartData = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        console.error("User not authenticated");
        return;
      }
      
      const data = await getDashboardChartData(userData.user.id);
      
      // Get proper last 6 months in chronological order and filter data
      const sortedData: ChartData = {
        issues: getLastSixMonthsChronologically(data.issues),
        income: getLastSixMonthsChronologically(data.income),
        expenses: getLastSixMonthsChronologically(data.expenses),
        profitMargin: getLastSixMonthsChronologically(data.profitMargin),
        occupancy: getLastSixMonthsChronologically(data.occupancy),
        arrears: getLastSixMonthsChronologically(data.arrears),
        urgent: [], // Will be populated below
        backlog: [] // Will be populated below
      };
      
      // Add urgent and backlog issues with the same data for now
      sortedData.urgent = [...sortedData.issues];
      sortedData.backlog = [...sortedData.issues];
      
      setChartData(sortedData);
    } catch (error) {
      console.error("Error fetching chart data:", error);
    }
  };
  
  // Get the last six months in chronological order and filter data accordingly
  const getLastSixMonthsChronologically = (data: ChartDataItem[] = []): ChartDataItem[] => {
    // 1) Full calendar order with abbreviated month names
    const monthOrder = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    
    // Map from full month names to abbreviated ones
    const fullToAbbr: {[key: string]: string} = {
      "January": "Jan", "February": "Feb", "March": "Mar", "April": "Apr", 
      "May": "May", "June": "Jun", "July": "Jul", "August": "Aug", 
      "September": "Sep", "October": "Oct", "November": "Nov", "December": "Dec"
    };
    
    // 2) Figure out the current month index (0-based)
    const now = new Date();
    const currentMonth = now.getMonth(); // 0 for Jan, ..., 11 for Dec
    
    // 3) Build an array of the last six month labels in chronological order
    const lastSixMonths: string[] = [];
    for (let i = 5; i >= 0; i--) {
      // Calculate month index counting back from current month
      // Add 12 before modulo to handle negative numbers properly
      const monthIndex = (currentMonth - i + 12) % 12;
      lastSixMonths.push(monthOrder[monthIndex]);
    }
    
    // Convert data items to abbreviated month names
    const processedData = data.map(d => ({
      ...d,
      month: fullToAbbr[d.month] || d.month, // Convert to abbreviated month name
    }));
    
    // Create a result array with all six months, using 0 for missing months
    const result: ChartDataItem[] = [];
    
    // Add each month in chronological order
    for (const month of lastSixMonths) {
      // Find data for this month, or use 0
      const monthData = processedData.find(d => d.month === month);
      result.push({
        month,
        value: monthData ? monthData.value : 0
      });
    }
    
    return result;
  };
  


  // Load more notifications
  const loadMoreNotifications = async () => {
    try {
      // Fetch more notifications (e.g., 10 instead of default 5)
      const moreNotifications = await getRecentNotifications(10);
      setNotifications(moreNotifications);
    } catch (error) {
      console.error("Error loading more notifications:", error);
    }
  };

  // Calculate current totals for display
  const getCurrentTotals = () => {
    // Get the last month's data for each chart
    const currentIssues = chartData.issues?.length > 0 ? 
      Number(chartData.issues[chartData.issues.length - 1]?.value) || 0 : 0;
      
    const currentIncome = chartData.income?.length > 0 ? 
      Number(chartData.income[chartData.income.length - 1]?.value) || 0 : 0;
      
    const currentExpenses = chartData.expenses?.length > 0 ? 
      Number(chartData.expenses[chartData.expenses.length - 1]?.value) || 0 : 0;
      
    const currentProfitMargin = chartData.profitMargin?.length > 0 ? 
      Number(chartData.profitMargin[chartData.profitMargin.length - 1]?.value) || 0 : 0;
      
    const currentOccupancy = chartData.occupancy?.length > 0 ? 
      Number(chartData.occupancy[chartData.occupancy.length - 1]?.value) || 0 : 0;
      
    const currentArrears = chartData.arrears?.length > 0 ? 
      Number(chartData.arrears[chartData.arrears.length - 1]?.value) || 0 : 0;
      
    return {
      currentIssues,
      currentIncome,
      currentExpenses,
      currentProfitMargin,
      currentOccupancy,
      currentArrears
    };
  };

  // Calculate percentage change for each chart
  const getPercentageChanges = () => {
    // A function to calculate percentage change between two values
    const calculateChange = (data: ChartDataItem[]) => {
      if (!data || data.length < 2) return 0;
      const current = Number(data[data.length - 1]?.value) || 0;
      const previous = Number(data[data.length - 2]?.value) || 0;
      
      if (previous === 0) return current > 0 ? 100 : 0;
      const change = Math.round(((current - previous) / previous) * 100);
      return isNaN(change) ? 0 : change;
    };
    
    return {
      issuesChange: calculateChange(chartData.issues),
      incomeChange: calculateChange(chartData.income),
      expensesChange: calculateChange(chartData.expenses),
      profitMarginChange: calculateChange(chartData.profitMargin),
      occupancyChange: calculateChange(chartData.occupancy),
      arrearsChange: calculateChange(chartData.arrears)
    };
  };

  const { 
    currentIssues, 
    currentIncome, 
    currentExpenses, 
    currentProfitMargin, 
    currentOccupancy, 
    currentArrears 
  } = getCurrentTotals();
  
  const { 
    issuesChange, 
    incomeChange, 
    expensesChange, 
    profitMarginChange,
    occupancyChange, 
    arrearsChange 
  } = getPercentageChanges();

  // Function to handle opening the drawer
  const openDrawer = (issue: Issue) => {
    setSelectedIssue(issue);
    setIsDrawerOpen(true);
  };

  // Function to handle form submission
  const handleIssueSubmit = async (formData: {
    title: string;
    description?: string;
    propertyId: string;
    unitNumber?: string;
    priority: "Low" | "Medium" | "High";
    assignedTo?: string;
    dueDate?: string;
  }) => {
    try {
      // Validate required fields
      if (!formData.title || !formData.propertyId) {
        console.error("Missing required fields for issue creation");
        return;
      }

      // Create issue in Supabase
      const issueData = {
        title: formData.title,
        description: formData.description || "",
        property_id: formData.propertyId,
        unit_id: formData.unitNumber || null,
        status: "Todo" as const,
        priority: formData.priority as "Low" | "Medium" | "High",
        type: "Bug" as const,
        assigned_to: formData.assignedTo || null,
        due_date: formData.dueDate || null,
        is_emergency: formData.priority === "High",
      };

      const newIssueResult = await createIssue(issueData);

      if (newIssueResult) {
        // Refresh the issues list
        try {
          const issues = await getRecentIssues(5);
          setIssues(issues);
        } catch (refreshError) {
          console.error("Error refreshing issues list:", refreshError);
        }
      }
    } catch (err) {
      console.error("Error creating issue:", err);
    } finally {
      setIsFormDrawerOpen(false);
    }
  };

  // Format currency with pound sign
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Helper function to get notification icon based on category or type
  const getNotificationIcon = (notification: Notification) => {
    const category = notification.notification_type?.category || '';
    const type = notification.notification_type?.name || '';
    
    if (category === 'rent_payment') {
      if (type.includes('overdue')) {
        return { Icon: ExclamationCircleIcon, iconBackground: 'bg-red-500' };
      } else if (type.includes('due') || type.includes('upcoming')) {
        return { Icon: CalendarIcon, iconBackground: 'bg-amber-500' };
      } else if (type.includes('partial')) {
        return { Icon: BanknotesIcon, iconBackground: 'bg-yellow-500' };
      } else {
        return { Icon: BanknotesIcon, iconBackground: 'bg-green-500' };
      }
    } else if (category === 'maintenance') {
      if (type.includes('urgent')) {
        return { Icon: ExclamationCircleIcon, iconBackground: 'bg-red-500' };
      } else if (type.includes('quote')) {
        return { Icon: ShoppingBagIcon, iconBackground: 'bg-purple-500' };
      } else if (type.includes('scheduled')) {
        return { Icon: CalendarIcon, iconBackground: 'bg-blue-500' };
      } else if (type.includes('resolved')) {
        return { Icon: CheckIcon20, iconBackground: 'bg-green-500' };
      } else {
        return { Icon: ExclamationCircleIcon, iconBackground: 'bg-amber-500' };
      }
    } else if (category === 'tenancy') {
      if (type.includes('expiry') || type.includes('expiring')) {
        return { Icon: CalendarIcon, iconBackground: 'bg-amber-500' };
      } else if (type.includes('notice')) {
        return { Icon: UserIcon, iconBackground: 'bg-red-500' };
      } else if (type.includes('inspection')) {
        return { Icon: CheckIcon20, iconBackground: 'bg-blue-500' };
      } else if (type.includes('application')) {
        return { Icon: UserIcon, iconBackground: 'bg-green-500' };
      } else {
        return { Icon: UserIcon, iconBackground: 'bg-purple-500' };
      }
    } else if (category === 'compliance') {
      if (type.includes('breach') || type.includes('overdue') || type.includes('missing')) {
        return { Icon: ExclamationCircleIcon, iconBackground: 'bg-red-500' };
      } else if (type.includes('expiring')) {
        return { Icon: ExclamationCircleIcon, iconBackground: 'bg-amber-500' };
      } else if (type.includes('deposit')) {
        return { Icon: BanknotesIcon, iconBackground: 'bg-blue-500' };
      } else {
        return { Icon: ExclamationCircleIcon, iconBackground: 'bg-amber-500' };
      }
    } else if (category === 'financial') {
      if (type.includes('invoice')) {
        return { Icon: BanknotesIcon, iconBackground: 'bg-purple-500' };
      } else if (type.includes('service_charge')) {
        return { Icon: BuildingOfficeIcon, iconBackground: 'bg-blue-500' };
      } else if (type.includes('tax')) {
        return { Icon: ExclamationCircleIcon, iconBackground: 'bg-amber-500' };
      } else if (type.includes('payment')) {
        return { Icon: BanknotesIcon, iconBackground: 'bg-emerald-500' };
      } else {
        return { Icon: BanknotesIcon, iconBackground: 'bg-emerald-500' };
      }
    } else if (category === 'property_performance') {
      if (type.includes('vacancy')) {
        return { Icon: BuildingOfficeIcon, iconBackground: 'bg-red-500' };
      } else if (type.includes('rent_increase')) {
        return { Icon: ArrowUpIcon, iconBackground: 'bg-green-500' };
      } else if (type.includes('summary')) {
        return { Icon: BuildingOfficeIcon, iconBackground: 'bg-blue-500' };
      } else if (type.includes('portfolio')) {
        return { Icon: BuildingOfficeIcon, iconBackground: 'bg-purple-500' };
      } else {
        return { Icon: BuildingOfficeIcon, iconBackground: 'bg-gray-500' };
      }
    }
    
    // Default icon
    return { Icon: UserIcon, iconBackground: 'bg-gray-400' };
  };

  // Format date for notifications
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }
  };

  // Fix the getFormattedMessage function to handle type checks properly
  const getFormattedMessage = (notification: Notification) => {
    try {
      const category = notification.notification_type?.category || '';
      
      if (category === 'rent_payment') {
        const rentNotification = notification as RentPaymentNotification;
        const details = rentNotification.rent_payment_notification?.[0];
      
      if (details?.tenant_name && details?.property_address) {
        if (details.payment_amount) {
          return `Rent payment of ${formatCurrency(details.payment_amount)} received from ${details.tenant_name} for ${details.property_address}`;
        } else if (details.days_overdue) {
          return `${details.tenant_name}'s rent payment for ${details.property_address} is now ${details.days_overdue} day${details.days_overdue !== 1 ? 's' : ''} overdue`;
        } else if (details.due_date) {
          const dueDate = new Date(details.due_date);
          const today = new Date();
          const timeDiff = dueDate.getTime() - today.getTime();
          const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
          
          if (daysDiff === 0) {
            return `Rent of ${details.payment_amount ? formatCurrency(details.payment_amount) : 'payment'} due today from ${details.tenant_name} for ${details.property_address}`;
          } else if (daysDiff > 0) {
            return `Rent of ${details.payment_amount ? formatCurrency(details.payment_amount) : 'payment'} due in ${daysDiff} days from ${details.tenant_name} for ${details.property_address}`;
          }
        } else if (details.remaining_balance) {
          return `Partial payment received from ${details.tenant_name}, ${formatCurrency(details.remaining_balance)} still outstanding`;
        }
      }
    } else if (category === 'maintenance') {
      const maintenanceNotification = notification as MaintenanceNotification;
      const details = maintenanceNotification.maintenance_notification?.[0];
      
      if (details?.issue_title && details?.property_address) {
        if (details.status === 'resolved') {
          return `Issue at ${details.property_address} has been resolved: ${details.issue_title}`;
        } else if (details.status === 'in_progress') {
          return `Issue at ${details.property_address} updated to in progress: ${details.issue_title}`;
        } else if (details.quote_amount) {
          return `Quote of ${formatCurrency(details.quote_amount)} received for ${details.issue_title} at ${details.property_address}`;
        } else if (details.scheduled_date) {
          return `Maintenance work for ${details.issue_title} at ${details.property_address} scheduled for ${new Date(details.scheduled_date).toLocaleDateString('en-GB')}`;
        } else if (details.priority_level === 'high' || details.priority_level === 'urgent') {
          return `URGENT: ${details.issue_title} reported at ${details.property_address}${details.tenant_name ? ` by ${details.tenant_name}` : ''}`;
        } else {
          return `New ${details.priority_level || ''} issue reported at ${details.property_address}: ${details.issue_title}`;
        }
      }
    } else if (category === 'tenancy') {
      const tenancyNotification = notification as TenancyNotification;
      const details = tenancyNotification.tenancy_notification?.[0];
      
      if (details?.tenant_name && details?.property_address) {
        if (details.expiry_date) {
          const expiryDate = new Date(details.expiry_date);
          const today = new Date();
          const timeDiff = expiryDate.getTime() - today.getTime();
          const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
          return `${details.tenant_name}'s lease at ${details.property_address} expires in ${daysDiff} days`;
        } else if (details.notice_date) {
          return `${details.tenant_name} has given notice to vacate ${details.property_address} on ${new Date(details.notice_date).toLocaleDateString('en-GB')}`;
        } else if (details.inspection_date) {
          return `Property inspection due in 14 days for ${details.property_address}`;
        } else if (notification.notification_type?.name?.includes('application')) {
          return `New tenant application received for ${details.property_address} from ${details.tenant_name}`;
        }
      }
    } else if (category === 'compliance') {
      const complianceNotification = notification as ComplianceNotification;
      const details = complianceNotification.compliance_notification?.[0];
      
      if (details?.property_address) {
        if (details.certificate_type && details.expiry_date) {
          return `${details.certificate_type} for ${details.property_address} expires in 30 days`;
        } else if (details.missing_document_type) {
          return `URGENT: ${details.property_address} missing required ${details.missing_document_type} now overdue`;
        } else if (notification.notification_type?.name?.includes('deposit')) {
          return `Tenant deposit for ${details.property_address} must be protected by ${details.compliance_deadline ? new Date(details.compliance_deadline).toLocaleDateString('en-GB') : 'soon'}`;
        }
      }
    } else if (category === 'financial') {
      const financialNotification = notification as FinancialNotification;
      const details = financialNotification.financial_notification?.[0];
      
      if (details?.property_address) {
        if (details.invoice_amount && details.supplier_name) {
          return `New invoice of ${formatCurrency(details.invoice_amount)} from ${details.supplier_name} for ${details.property_address}`;
        } else if (details.expense_type && details.due_date) {
          return `Upcoming payment of ${details.new_amount ? formatCurrency(details.new_amount) : ''} for ${details.expense_type} at ${details.property_address} due ${new Date(details.due_date).toLocaleDateString('en-GB')}`;
        } else if (details.new_amount && details.previous_amount) {
          return `Service charge for ${details.property_address} has been updated to ${formatCurrency(details.new_amount)}`;
        } else if (details.tax_year_end) {
          return `Tax return for ${details.property_address || 'your portfolio'} due in 30 days - rental income: ${details.total_rental_income ? formatCurrency(details.total_rental_income) : ''}`;
        }
      }
    } else if (category === 'property_performance') {
      const propertyPerformanceNotification = notification as PropertyPerformanceNotification;
      const details = propertyPerformanceNotification.property_performance_notification?.[0];
      
      if (details?.property_address) {
        if (details.days_vacant && details.estimated_lost_income) {
          return `${details.property_address} has been vacant for ${details.days_vacant} days - estimated income loss: ${formatCurrency(details.estimated_lost_income)}`;
        } else if (notification.notification_type?.name?.includes('rent_increase')) {
          return `Rent increase opportunity for ${details.property_address}`;
        } else if (details.total_income && details.total_expenses) {
          const profit = details.total_income - details.total_expenses;
          const roi = details.total_income > 0 ? Math.round((profit / details.total_income) * 100) : 0;
          return `Monthly summary for ${details.property_address}: Income ${formatCurrency(details.total_income)}, Expenses ${formatCurrency(details.total_expenses)}, ROI ${roi}%`;
        }
      }
    }
    
    // Default to the standard message if no special formatting applies
    return notification.message;
  } catch (error) {
    console.error("Error formatting notification message:", error);
    return notification.message || "Notification";
  }
};

  // Mark a notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const success = await markNotificationAsRead(notificationId);
      if (success) {
        // Update local state to reflect the change
        setNotifications(
          notifications.map((notification) =>
            notification.id === notificationId
              ? { ...notification, is_read: true }
              : notification
          )
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      const success = await markAllNotificationsAsRead();
      if (success) {
        // Update local state to reflect all notifications as read
        setNotifications(
          notifications.map((notification) => ({
            ...notification,
            is_read: true,
          }))
        );
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <Heading level={1} className="text-4xl font-bold">
              Property Dashboard
            </Heading>
            <Text className="text-gray-500 mt-1">
              Welcome back! Here&apos;s an overview of your properties and recent
              activities.
            </Text>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <Link href="/properties"
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
            <h3 className="text-sm font-cabinet-grotesk-bold text-gray-500">
              Properties
            </h3>
            <p className="mt-2 text-4xl font-bold text-gray-900">
              {dashboardStats.totalProperties}
            </p>
          </div>

          {/* Contracts expiring */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-sm font-cabinet-grotesk-bold text-gray-500">
              Contracts expiring
            </h3>
            <p className="mt-2 text-4xl font-bold text-gray-900">
              {dashboardStats.expiringContracts}
            </p>
            <div className="mt-4 flex items-center text-sm text-amber-600">
              <ArrowUpIcon className="h-4 w-4 mr-1" />
              <span>Next {new Date().getMonth() < 6 ? '6' : '12'} months</span>
            </div>
          </div>

          {/* Occupancy */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-sm font-cabinet-grotesk-bold text-gray-500">
              Occupancy
            </h3>
            <p className="mt-2 text-4xl font-bold text-gray-900">
              {dashboardStats.occupancyRate}%
            </p>
          </div>

          {/* Income */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-sm font-cabinet-grotesk-bold text-gray-500">
              Income
            </h3>
            <p className="mt-2 text-4xl font-bold text-gray-900">
              {formatCurrency(dashboardStats.currentMonthIncome)}
            </p>
            <div className="mt-4 flex items-center text-sm text-green-600">
              <ArrowUpIcon className="h-4 w-4 mr-1" />
              <span>Current month</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div>
          <div className="grid grid-cols-1 sm:hidden">
            <select value={selectedTab}
              onChange={(e) => handleTabChange(e.target.value)}
              aria-label="Select a tab"
              className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-2 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-[#D9E8FF]"
            >
              {tabs.map((tab) => (
                <option key={tab.name} value={tab.value}>
                  {tab.name}
                </option>
              ))}
            </select>
            <ChevronDownIcon aria-hidden="true"
              className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end fill-gray-500"
            />
          </div>
          <div className="hidden sm:block">
            <nav aria-label="Tabs"
              className="isolate flex divide-x divide-gray-200 rounded-lg shadow-sm"
            >
              {tabs.map((tab, tabIdx) => (
                <button key={tab.name}
                  onClick={() => handleTabChange(tab.value)}
                  aria-current={tab.current ? "page" : undefined}
                  className={classNames(
                    tab.current
                      ? "text-gray-900"
                      : "text-gray-500 hover:text-gray-700",
                    tabIdx === 0 ? "rounded-l-lg" : "",
                    tabIdx === tabs.length - 1 ? "rounded-r-lg" : "",
                    "group relative min-w-0 flex-1 overflow-hidden bg-white px-4 py-4 text-center text-sm font-medium hover:bg-gray-50 focus:z-10",
                  )}
                >
                  <span>{tab.name}</span>
                  <span aria-hidden="true"
                    className={classNames(
                      tab.current ? "bg-[#FF503E]" : "bg-transparent",
                      "absolute inset-x-0 bottom-0 h-0.5",
                    )}
                  />
                </button>
              ))}
            </nav>
          </div>
        </div>

        <Tabs value={selectedTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsContent value="overview" className="pt-6">
            {/* Dashboard Content */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Total Issues */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Total Issues</h3>
                  <p className="text-sm text-muted-foreground">Total: {currentIssues}</p>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfigs.issues}>
                    <AreaChart accessibilityLayer data={chartData.issues}>
                      <CartesianGrid vertical={false} />
                      <XAxis 
                        dataKey="month"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        type="category"
                      />
                      <ChartTooltip cursor={false}
                        content={<ChartTooltipContent />}
                      />
                      <Area type="monotone"
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
                  <div className={`flex gap-2 font-medium leading-none ${
                    issuesChange > 0 ? "text-red-600" : issuesChange < 0 ? "text-green-600" : "text-gray-600"
                  }`}>
                    {issuesChange > 0 ? <TrendingUp className="h-4 w-4" /> : 
                     issuesChange < 0 ? <TrendingDown className="h-4 w-4" /> : null}
                    <span>{Math.abs(issuesChange)}% {issuesChange > 0 ? "increase" : issuesChange < 0 ? "decrease" : "no change"} from last month</span>
                  </div>
                </div>
              </Card>

              {/* Profit Margin */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Profit Margin</h3>
                  <p className="text-sm text-muted-foreground">Current: {currentProfitMargin}%</p>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfigs.profitMargin}>
                    <BarChart accessibilityLayer
                      data={chartData.profitMargin}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis 
                        dataKey="month"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        type="category"
                      />
                      <ChartTooltip cursor={false}
                        content={<ChartTooltipContent />}
                      />
                      <Bar dataKey="value"
                        name="profit"
                        fill="#29A3BE"
                        radius={4}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
                <div className="flex-col items-start gap-2 text-sm p-6 pt-0">
                  <div className={`flex gap-2 font-medium leading-none ${
                    profitMarginChange > 0 ? "text-green-600" : profitMarginChange < 0 ? "text-red-600" : "text-gray-600"
                  }`}>
                    {profitMarginChange > 0 ? <TrendingUp className="h-4 w-4" /> : 
                     profitMarginChange < 0 ? <TrendingDown className="h-4 w-4" /> : null}
                    <span>{Math.abs(profitMarginChange)}% {profitMarginChange > 0 ? "increase" : profitMarginChange < 0 ? "decrease" : "no change"} from last month</span>
                  </div>
                </div>
              </Card>

              {/* Occupancy Rate */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Occupancy Rate</h3>
                  <p className="text-sm text-muted-foreground">Current: {currentOccupancy}%</p>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfigs.occupancy}>
                    <LineChart accessibilityLayer data={chartData.occupancy}>
                      <CartesianGrid vertical={false} />
                      <XAxis 
                        dataKey="month"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        type="category"
                      />
                      <ChartTooltip cursor={false}
                        content={<ChartTooltipContent />}
                      />
                      <Line type="monotone"
                        dataKey="value"
                        name="occupancy"
                        stroke="#4264CB"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
                <div className="flex-col items-start gap-2 text-sm p-6 pt-0">
                  <div className={`flex gap-2 font-medium leading-none ${
                    occupancyChange > 0 ? "text-green-600" : occupancyChange < 0 ? "text-red-600" : "text-gray-600"
                  }`}>
                    {occupancyChange > 0 ? <TrendingUp className="h-4 w-4" /> : 
                     occupancyChange < 0 ? <TrendingDown className="h-4 w-4" /> : null}
                    <span>{Math.abs(occupancyChange)}% {occupancyChange > 0 ? "increase" : occupancyChange < 0 ? "decrease" : "no change"} from last month</span>
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
                  <p className="text-sm text-muted-foreground">
                    Last 6 months
                  </p>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfigs.income}>
                    <BarChart accessibilityLayer data={chartData.income}>
                      <CartesianGrid vertical={false} />
                      <XAxis 
                        dataKey="month"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        type="category"
                      />
                      <ChartTooltip cursor={false}
                        content={<ChartTooltipContent indicator="dashed" />}
                      />
                      <Bar dataKey="value" fill="#E9823F" radius={4} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
                <div className="flex-col items-start gap-2 text-sm p-6 pt-0">
                  <div className={`flex gap-2 font-medium leading-none ${
                    incomeChange > 0 ? "text-green-600" : incomeChange < 0 ? "text-red-600" : "text-gray-600"
                  }`}>
                    {incomeChange > 0 ? <TrendingUp className="h-4 w-4" /> : 
                     incomeChange < 0 ? <TrendingDown className="h-4 w-4" /> : null}
                    <span>{Math.abs(incomeChange)}% {incomeChange > 0 ? "increase" : incomeChange < 0 ? "decrease" : "no change"} from last month</span>
                  </div>
                  <div className="leading-none text-muted-foreground">
                    Total current income: {formatCurrency(currentIncome)}
                  </div>
                </div>
              </Card>

              {/* Total Expenditure */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Total Expenditure</h3>
                  <p className="text-sm text-muted-foreground">
                    Last 6 months
                  </p>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfigs.expenses}>
                    <BarChart accessibilityLayer data={chartData.expenses}>
                      <CartesianGrid vertical={false} />
                      <XAxis 
                        dataKey="month"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        type="category"
                      />
                      <ChartTooltip cursor={false}
                        content={<ChartTooltipContent indicator="dashed" />}
                      />
                      <Bar dataKey="value" fill="#29A3BE" radius={4} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
                <div className="flex-col items-start gap-2 text-sm p-6 pt-0">
                  <div className={`flex gap-2 font-medium leading-none ${
                    expensesChange > 0 ? "text-red-600" : expensesChange < 0 ? "text-green-600" : "text-gray-600"
                  }`}>
                    {expensesChange > 0 ? <TrendingUp className="h-4 w-4" /> : 
                     expensesChange < 0 ? <TrendingDown className="h-4 w-4" /> : null}
                    <span>{Math.abs(expensesChange)}% {expensesChange > 0 ? "increase" : expensesChange < 0 ? "decrease" : "no change"} from last month</span>
                  </div>
                  <div className="leading-none text-muted-foreground">
                    Total current expenses: {formatCurrency(currentExpenses)}
                  </div>
                </div>
              </Card>

              {/* Rent Arrears */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Rent Arrears</h3>
                  <p className="text-sm text-muted-foreground">
                    Last 6 months
                  </p>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfigs.arrears}>
                    <LineChart accessibilityLayer data={chartData.arrears}>
                      <CartesianGrid vertical={false} />
                      <XAxis 
                        dataKey="month"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        type="category"
                      />
                      <ChartTooltip cursor={false}
                        content={<ChartTooltipContent />}
                      />
                      <Line type="monotone"
                        dataKey="value"
                        name="arrears"
                        stroke="#F5A623"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
                <div className="flex-col items-start gap-2 text-sm p-6 pt-0">
                  <div className={`flex gap-2 font-medium leading-none ${
                    arrearsChange > 0 ? "text-red-600" : arrearsChange < 0 ? "text-green-600" : "text-gray-600"
                  }`}>
                    {arrearsChange > 0 ? <TrendingUp className="h-4 w-4" /> : 
                     arrearsChange < 0 ? <TrendingDown className="h-4 w-4" /> : null}
                    <span>{Math.abs(arrearsChange)}% {arrearsChange > 0 ? "increase" : arrearsChange < 0 ? "decrease" : "no change"} from last month</span>
                  </div>
                  <div className="leading-none text-muted-foreground">
                    Current arrears: {formatCurrency(currentArrears)}
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
                  <p className="text-sm text-muted-foreground">
                    Last 6 months
                  </p>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfigs.active}>
                    <LineChart accessibilityLayer data={chartData.issues}>
                      <CartesianGrid vertical={false} />
                      <XAxis 
                        dataKey="month"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        type="category"
                      />
                      <ChartTooltip cursor={false}
                        content={<ChartTooltipContent />}
                      />
                      <Line type="monotone"
                        dataKey="value"
                        name="active"
                        stroke="var(--color-active)"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
                <div className="flex-col items-start gap-2 text-sm p-6 pt-0">
                  <div className={`flex gap-2 font-medium leading-none ${
                    issuesChange > 0 ? "text-red-600" : issuesChange < 0 ? "text-green-600" : "text-gray-600"
                  }`}>
                    {issuesChange > 0 ? <TrendingUp className="h-4 w-4" /> : 
                     issuesChange < 0 ? <TrendingDown className="h-4 w-4" /> : null}
                    <span>{Math.abs(issuesChange)}% {issuesChange > 0 ? "increase" : issuesChange < 0 ? "decrease" : "no change"} from last month</span>
                  </div>
                  <div className="leading-none text-muted-foreground">
                    Current active issues: {currentIssues}
                  </div>
                </div>
              </Card>

              {/* Urgent Issues */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Urgent Issues</h3>
                  <p className="text-sm text-muted-foreground">
                    Last 6 months
                  </p>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfigs.urgent}>
                    <BarChart accessibilityLayer data={chartData.urgent}>
                      <CartesianGrid vertical={false} />
                      <XAxis 
                        dataKey="month"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        type="category"
                      />
                      <ChartTooltip cursor={false}
                        content={<ChartTooltipContent />}
                      />
                      <Bar dataKey="value"
                        name="urgent"
                        fill="var(--color-urgent)"
                        radius={4}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
                <div className="flex-col items-start gap-2 text-sm p-6 pt-0">
                  <div className={`flex gap-2 font-medium leading-none ${
                    issuesChange === 0 ? "text-gray-600" : issuesChange > 0 ? "text-red-600" : "text-green-600"
                  }`}>
                    {issuesChange > 0 ? <TrendingUp className="h-4 w-4" /> : 
                     issuesChange < 0 ? <TrendingDown className="h-4 w-4" /> : null}
                    <span>{issuesChange === 0 ? "No change" : `${Math.abs(issuesChange)}% ${issuesChange > 0 ? "increase" : "decrease"}`} from last month</span>
                  </div>
                  <div className="leading-none text-muted-foreground">
                    Current urgent issues: {currentIssues}
                  </div>
                </div>
              </Card>

              {/* Backlog Issues */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Backlog Issues</h3>
                  <p className="text-sm text-muted-foreground">
                    Last 6 months
                  </p>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfigs.backlog}>
                    <LineChart accessibilityLayer data={chartData.backlog}>
                      <CartesianGrid vertical={false} />
                      <XAxis 
                        dataKey="month"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        type="category"
                      />
                      <ChartTooltip cursor={false}
                        content={<ChartTooltipContent />}
                      />
                      <Line type="monotone"
                        dataKey="value"
                        name="backlog"
                        stroke="var(--color-backlog)"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
                <div className="flex-col items-start gap-2 text-sm p-6 pt-0">
                  <div className={`flex gap-2 font-medium leading-none ${
                    issuesChange > 0 ? "text-red-600" : issuesChange < 0 ? "text-green-600" : "text-gray-600"
                  }`}>
                    {issuesChange > 0 ? <TrendingUp className="h-4 w-4" /> : 
                     issuesChange < 0 ? <TrendingDown className="h-4 w-4" /> : null}
                    <span>{Math.abs(issuesChange)}% {issuesChange > 0 ? "increase" : issuesChange < 0 ? "decrease" : "no change"} from last month</span>
                  </div>
                  <div className="leading-none text-muted-foreground">
                    Current backlog issues: {currentIssues}
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
                <h3 className="text-lg font-cabinet-grotesk-bold text-gray-900">
                  Open Issues
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Recent maintenance requests and issues that need attention.
                </p>
              </div>
              <button className="mt-4 sm:mt-0 px-4 py-2 bg-[#D9E8FF] rounded-md text-sm font-medium text-black hover:bg-[#C8D7EE]"
                onClick={() => setIsFormDrawerOpen(true)}
              >
                Add issue
              </button>
            </div>

            <div className="overflow-x-auto">
              {issues.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No issues found
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Issue
                      </th>
                      <th scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Priority
                      </th>
                      <th scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Property
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {issues.map((issue) => (
                      <tr key={issue.id}
                        onClick={() => openDrawer(issue)}
                        className="cursor-pointer hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {issue.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              issue.priority === "High"
                                ? "bg-red-100 text-red-800"
                                : issue.priority === "Medium"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-green-100 text-green-800"
                            }`}
                          >
                            {issue.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {issue.property}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="px-6 py-4 border-t border-gray-200">
                <Link href="/issues"
                  className="text-sm text-gray-900 hover:text-indigo-900"
                >
                  View all issues →
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Updates - 1/3 width on desktop, full width on mobile */}
          <div className="col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden divide-y divide-gray-200">
            <div className="px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-cabinet-grotesk-bold text-gray-900">
                  Recent Updates
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Latest activities across your properties.
                </p>
              </div>
              {notifications.some(n => !n.is_read) && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="px-6 py-4">
              <div className="flow-root">
                <ul role="list" className="-mb-8">
                  {notifications.length === 0 ? (
                    <li className="py-4 text-center text-gray-500">
                      No recent updates
                    </li>
                  ) : (
                    notifications.map((notification, index) => {
                      const { Icon, iconBackground } = getNotificationIcon(notification);
                      return (
                        <li key={notification.id} className={`${!notification.is_read ? 'bg-blue-50 -mx-6 px-6' : ''}`}>
                          <div className="relative pb-8">
                            {index !== notifications.length - 1 ? (
                              <span
                                aria-hidden="true"
                                className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                              />
                            ) : null}
                            <div className="relative flex space-x-3">
                              <div>
                                <span
                                  className={classNames(
                                    iconBackground,
                                    "flex size-8 items-center justify-center rounded-full ring-8 ring-white"
                                  )}
                                >
                                  <Icon
                                    aria-hidden="true"
                                    className="size-5 text-white"
                                  />
                                </span>
                              </div>
                              <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                <div 
                                  onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                                  className={`${!notification.is_read ? 'cursor-pointer' : ''}`}
                                >
                                  <p className={`text-sm ${!notification.is_read ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                                    {getFormattedMessage(notification)}
                                  </p>
                                </div>
                                <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                  <time dateTime={notification.created_at}>
                                    {formatDate(notification.created_at)}
                                  </time>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })
                  )}
                </ul>
              </div>
            </div>
            <div className="px-6 py-3 bg-gray-50">
              <button 
                onClick={loadMoreNotifications}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium w-full text-center"
              >
                View All Notifications
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Issue Details Drawer */}
      <IssueDrawer issue={selectedIssue}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedIssue(null);
        }}
      />

      {/* Issue Form Drawer */}
      <IssueFormDrawer isOpen={isFormDrawerOpen}
        onClose={() => setIsFormDrawerOpen(false)}
        onSubmit={handleIssueSubmit}
        title="Report New Issue"
      />
    </SidebarLayout>
  );
}
