export interface Issue {
  id: string;
  title: string;
  description?: string;
  type: "Bug" | "Documentation" | "Feature";
  status: "Todo" | "In Progress" | "Backlog" | "Done";
  priority: "Low" | "Medium" | "High";
  property_id?: string;
  unit_id?: string;
  reported_date?: string;
  reported_by?: string;
  assigned_to?: string;
  due_date?: string;
  is_emergency?: boolean;
  category_id?: string;
  attachments?: string[];
}

export interface IssueCategory {
  id: string;
  name: string;
  description: string | null;
  priority_default: "Low" | "Medium" | "High";
  requires_approval: boolean;
  created_at: string;
}

export interface IssueMedia {
  id: string;
  issue_id: string;
  file_url: string;
  file_type: string;
  file_name: string;
  uploaded_by: string | null;
  created_at: string;
}

export interface IssueComment {
  id: string;
  issue_id: string;
  user_id: string | null;
  tenant_id: string | null;
  comment: string;
  is_internal: boolean;
  created_at: string;
}

export interface IssueStatusHistory {
  id: string;
  issue_id: string;
  previous_status: string | null;
  new_status: string;
  changed_by: string | null;
  changed_at: string;
  notes: string | null;
}

export interface Contractor {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  specialty: string[] | null;
  hourly_rate: number | null;
  is_preferred: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkOrder {
  id: string;
  issue_id: string;
  contractor_id: string | null;
  description: string;
  estimated_hours: number | null;
  estimated_cost: number | null;
  actual_hours: number | null;
  actual_cost: number | null;
  scheduled_date: string | null;
  completed_date: string | null;
  status: "Pending" | "Scheduled" | "In Progress" | "Completed" | "Cancelled";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface IssueWithDetails extends Issue {
  property_name?: string;
  unit_number?: string;
  category_name?: string;
  tenant_name?: string;
  tenant_email?: string;
  tenant_phone?: string;
  work_order_status?: string;
}

export interface PropertyIssuesSummary {
  property_id: string;
  total_issues: number;
  open_issues: number;
  high_priority_issues: number;
}
