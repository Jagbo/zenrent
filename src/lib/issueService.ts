import { supabase } from './supabase';

// Issue type definitions
export interface IIssue {
  id: string;
  title: string;
  description?: string;
  property_id: string;
  unit_id?: string;
  category_id?: string;
  status: 'Todo' | 'In Progress' | 'Backlog' | 'Done';
  priority: 'Low' | 'Medium' | 'High';
  type: 'Bug' | 'Documentation' | 'Feature';
  reported_by?: string;
  assigned_to?: string;
  tenant_id?: string;
  reported_date: string;
  due_date?: string;
  resolution_date?: string;
  resolution_notes?: string;
  estimated_cost?: number;
  actual_cost?: number;
  is_emergency: boolean;
  created_at: string;
  updated_at: string;
}

export interface IIssueCategory {
  id: string;
  name: string;
  description?: string;
  priority_default: 'Low' | 'Medium' | 'High';
  requires_approval: boolean;
}

export interface IIssueComment {
  id: string;
  issue_id: string;
  user_id?: string;
  tenant_id?: string;
  comment: string;
  is_internal: boolean;
  created_at: string;
}

export interface IIssueMedia {
  id: string;
  issue_id: string;
  file_url: string;
  file_type: string;
  file_name: string;
  uploaded_by?: string;
  created_at: string;
}

export interface IWorkOrder {
  id: string;
  issue_id: string;
  contractor_id?: string;
  description: string;
  estimated_hours?: number;
  estimated_cost?: number;
  actual_hours?: number;
  actual_cost?: number;
  scheduled_date?: string;
  completed_date?: string;
  status: 'Pending' | 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  notes?: string;
}

export interface IIssueWithDetails extends IIssue {
  property_name?: string;
  property_address?: string;
  unit_number?: string;
  category_name?: string;
  tenant_name?: string;
  tenant_email?: string;
  tenant_phone?: string;
  reported_by_name?: string;
  assigned_to_name?: string;
  work_order_status?: string;
  comments?: IIssueComment[];
  media?: IIssueMedia[];
  work_orders?: IWorkOrder[];
}

// Development mode test user ID
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';

// Get all issues for a user
export const getUserIssues = async (userId?: string): Promise<IIssue[]> => {
  try {
    // In development mode, use the test user ID if no user ID is provided
    const effectiveUserId = process.env.NODE_ENV === 'development' 
      ? TEST_USER_ID 
      : userId;
    
    if (!effectiveUserId) {
      console.error('No user ID provided and not in development mode');
      return [];
    }

    console.log('Fetching issues for user:', effectiveUserId);

    // First get all properties for this user
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('id')
      .eq('user_id', effectiveUserId);
    
    if (propertiesError) {
      console.error('Error fetching properties:', propertiesError);
      throw propertiesError;
    }
    
    if (!properties || properties.length === 0) {
      console.log('No properties found for user');
      return [];
    }
    
    // Get property IDs as an array
    const propertyIds = properties.map(p => p.id);
    
    // Now get all issues for these properties
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .in('property_id', propertyIds);
    
    if (error) {
      console.error('Error fetching issues:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching issues:', error);
    return [];
  }
};

// Get all issues for a property
export const getPropertyIssues = async (propertyId: string): Promise<IIssue[]> => {
  try {
    console.log('Fetching issues for property:', propertyId);
    
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .eq('property_id', propertyId)
      .order('reported_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching property issues:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error(`Error fetching issues for property ${propertyId}:`, error);
    return [];
  }
};

// Get a single issue with full details
export const getIssueDetails = async (issueId: string): Promise<IIssueWithDetails | null> => {
  try {
    console.log('Fetching issue details for:', issueId);
    
    // Get the detailed issue view
    const { data, error } = await supabase
      .from('issue_details')
      .select('*')
      .eq('id', issueId)
      .single();
    
    if (error) {
      console.error('Error fetching issue details:', error);
      throw error;
    }
    
    if (!data) {
      return null;
    }
    
    // Get comments for this issue
    const { data: comments, error: commentsError } = await supabase
      .from('issue_comments')
      .select('*')
      .eq('issue_id', issueId)
      .order('created_at', { ascending: true });
    
    if (commentsError) {
      console.error('Error fetching issue comments:', commentsError);
    }
    
    // Get media for this issue
    const { data: media, error: mediaError } = await supabase
      .from('issue_media')
      .select('*')
      .eq('issue_id', issueId)
      .order('created_at', { ascending: false });
    
    if (mediaError) {
      console.error('Error fetching issue media:', mediaError);
    }
    
    // Get work orders for this issue
    const { data: workOrders, error: workOrdersError } = await supabase
      .from('work_orders')
      .select('*')
      .eq('issue_id', issueId)
      .order('created_at', { ascending: false });
    
    if (workOrdersError) {
      console.error('Error fetching work orders:', workOrdersError);
    }
    
    return {
      ...data,
      comments: comments || [],
      media: media || [],
      work_orders: workOrders || []
    };
  } catch (error) {
    console.error(`Error fetching issue details for ${issueId}:`, error);
    return null;
  }
};

// Create a new issue
export const createIssue = async (issue: Partial<IIssue>): Promise<IIssue | null> => {
  try {
    const { data, error } = await supabase
      .from('issues')
      .insert([issue])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating issue:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error creating issue:', error);
    return null;
  }
};

// Update an existing issue
export const updateIssue = async (issueId: string, updates: Partial<IIssue>): Promise<IIssue | null> => {
  try {
    const { data, error } = await supabase
      .from('issues')
      .update(updates)
      .eq('id', issueId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating issue:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error(`Error updating issue ${issueId}:`, error);
    return null;
  }
};

// Add a comment to an issue
export const addIssueComment = async (comment: Partial<IIssueComment>): Promise<IIssueComment | null> => {
  try {
    const { data, error } = await supabase
      .from('issue_comments')
      .insert([comment])
      .select()
      .single();
    
    if (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error adding comment:', error);
    return null;
  }
};

// Upload media for an issue
export const uploadIssueMedia = async (
  issueId: string, 
  file: File, 
  userId?: string
): Promise<IIssueMedia | null> => {
  try {
    // First upload the file
    const fileName = `${issueId}/${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('issue-media')
      .upload(fileName, file);
    
    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      throw uploadError;
    }
    
    // Get the public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('issue-media')
      .getPublicUrl(fileName);
    
    // Create a record in the issue_media table
    const mediaRecord: Partial<IIssueMedia> = {
      issue_id: issueId,
      file_url: publicUrl,
      file_type: file.type,
      file_name: file.name,
      uploaded_by: userId
    };
    
    const { data: mediaData, error: mediaError } = await supabase
      .from('issue_media')
      .insert([mediaRecord])
      .select()
      .single();
    
    if (mediaError) {
      console.error('Error creating media record:', mediaError);
      throw mediaError;
    }
    
    return mediaData;
  } catch (error) {
    console.error(`Error uploading media for issue ${issueId}:`, error);
    return null;
  }
};

// Create a work order for an issue
export const createWorkOrder = async (workOrder: Partial<IWorkOrder>): Promise<IWorkOrder | null> => {
  try {
    const { data, error } = await supabase
      .from('work_orders')
      .insert([workOrder])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating work order:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error creating work order:', error);
    return null;
  }
};

// Get issue categories
export const getIssueCategories = async (): Promise<IIssueCategory[]> => {
  try {
    const { data, error } = await supabase
      .from('issue_categories')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching issue categories:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching issue categories:', error);
    return [];
  }
}; 