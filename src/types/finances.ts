export interface Expense {
  id: string;
  date: string;
  expense_type: string;
  category: string;
  description: string;
  amount: number;
}

export interface Income {
  id: string;
  date: string;
  income_type: string;
  category: string;
  description: string;
  amount: number;
}

export interface FinancialMetrics {
  id: string;
  property_id: string;
  period_start: string;
  period_end: string;
  total_income: number;
  total_expenses: number;
  net_profit: number;
  roi_percentage?: number;
  yield_percentage?: number;
  occupancy_rate?: number;
  maintenance_cost_ratio?: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface ServiceCharge {
  id: string;
  date: string;
  type: string;
  description: string;
  status: string;
  amount: number;
}

export interface Invoice {
  id: string;
  date: string;
  invoice_number: string;
  description: string;
  status: string;
  amount: number;
}

export interface PropertyFinancialPerformance {
  id: string;
  property_code: string;
  address: string;
  total_units: number;
  monthly_revenue: number;
  monthly_expenses: number;
  noi: number;
  cap_rate: number;
}

export interface FinancialData {
  expenses: Array<{
    id: string;
    date: string;
    expense_type: string;
    category: string;
    description: string;
    amount: number;
  }>;
  income: Array<{
    id: string;
    date: string;
    income_type: string;
    category: string;
    description: string;
    amount: number;
  }>;
  service_charges: Array<{
    id: string;
    date: string;
    type: string;
    description: string;
    status: string;
    amount: number;
  }>;
  invoices: Array<{
    id: string;
    date: string;
    invoice_number: string;
    description: string;
    status: string;
    amount: number;
  }>;
  total_income: number;
  total_expenses: number;
  net_profit: number;
  metrics: {
    roi: number;
    yield: number;
    occupancy_rate: number;
  };
  property_performance: PropertyFinancialPerformance[];
} 