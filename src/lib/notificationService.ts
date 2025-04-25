import { supabase } from './supabase';

// Define notification type interfaces
export interface BaseNotification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  is_archived: boolean;
  priority: string;
  created_at: string;
  notification_type: {
    name: string;
    category: string;
  };
}

export interface RentPaymentNotification extends BaseNotification {
  rent_payment_notification: Array<{
    tenant_name: string;
    property_address: string;
    payment_amount?: number;
    payment_date?: string;
    due_date?: string;
    days_overdue?: number;
  }>;
}

export interface MaintenanceNotification extends BaseNotification {
  maintenance_notification: Array<{
    issue_title: string;
    property_address: string;
    priority_level?: string;
    tenant_name?: string;
    status?: string;
  }>;
}

export interface TenancyNotification extends BaseNotification {
  tenancy_notification: Array<{
    tenant_name: string;
    property_address: string;
    expiry_date?: string;
    notice_date?: string;
    inspection_date?: string;
  }>;
}

export interface ComplianceNotification extends BaseNotification {
  compliance_notification: Array<{
    certificate_type?: string;
    property_address: string;
    expiry_date?: string;
    days_overdue?: number;
  }>;
}

export interface FinancialNotification extends BaseNotification {
  financial_notification: Array<{
    invoice_amount?: number;
    supplier_name?: string;
    property_address?: string;
    due_date?: string;
  }>;
}

export interface PropertyPerformanceNotification extends BaseNotification {
  property_performance_notification: Array<{
    property_address?: string;
    days_vacant?: number;
    estimated_lost_income?: number;
    total_income?: number;
    total_expenses?: number;
  }>;
}

export type Notification = 
  | RentPaymentNotification 
  | MaintenanceNotification 
  | TenancyNotification 
  | ComplianceNotification 
  | FinancialNotification 
  | PropertyPerformanceNotification;

// Fetch recent notifications for a user
export const getRecentNotifications = async (limit: number = 5): Promise<Notification[]> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      console.error("Error getting authenticated user:", userError);
      return [];
    }
    
    const userId = userData.user.id;
    console.log("Fetching notifications for user ID:", userId);
    
    // Get notifications with type information
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        notification_type:notification_type_id(name, category),
        rent_payment_notification:rent_payment_notifications(*),
        maintenance_notification:maintenance_notifications(*),
        tenancy_notification:tenancy_notifications(*),
        compliance_notification:compliance_notifications(*),
        financial_notification:financial_notifications(*),
        property_performance_notification:property_performance_notifications(*)
      `)
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }

    console.log("Notifications data:", data);
    
    return data as Notification[];
  } catch (error) {
    console.error("Error in getRecentNotifications:", error);
    return [];
  }
};

// Mark a notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
      
    return !error;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return false;
  }
};

// Mark a notification as archived
export const archiveNotification = async (notificationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_archived: true })
      .eq('id', notificationId);
      
    return !error;
  } catch (error) {
    console.error("Error archiving notification:", error);
    return false;
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (): Promise<boolean> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      console.error("Error getting authenticated user:", userError);
      return false;
    }
    
    const userId = userData.user.id;
    
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
      
    return !error;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return false;
  }
}; 