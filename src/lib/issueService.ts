import { supabase } from './supabase';
import { getCurrentUserId } from './auth-provider';

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

// Get all issues for a user
export const getUserIssues = async (userId?: string): Promise<IIssue[]> => {
  try {
    // Get the current user ID if not provided
    const effectiveUserId = userId || await getCurrentUserId();
    
    if (!effectiveUserId) {
      console.error('No user ID provided and not authenticated');
      return [];
    }

    console.log('Fetching issues for user:', effectiveUserId);

    // First get all properties for this user
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('property_code')
      .eq('user_id', effectiveUserId);
    
    if (propertiesError) {
      console.error('Error fetching properties:', propertiesError);
      throw propertiesError;
    }
    
    if (!properties || properties.length === 0) {
      console.log('No properties found for user');
      return [];
    }
    
    // Get property codes as an array
    const propertyCodes = properties.map(p => p.property_code);
    
    // Now get all issues for these properties
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .in('property_id', propertyCodes);
    
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
    
    // First determine if we're looking at a UUID or a property_code
    let isUUID = false;
    try {
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      isUUID = uuidPattern.test(propertyId);
    } catch (e) {
      // Not a UUID
      isUUID = false;
    }
    
    let effectivePropertyId = propertyId;
    
    // If this is a property_code, we need to get the UUID first
    if (!isUUID) {
      console.log('Property ID is a property_code, fetching UUID');
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('id')
        .eq('property_code', propertyId)
        .single();
      
      if (propertyError) {
        console.error('Error fetching property:', propertyError);
        throw propertyError;
      }
      
      if (!property) {
        console.error('Property not found');
        return [];
      }
      
      effectivePropertyId = property.id;
    }
    
    // Now get all issues for this property using the UUID
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .eq('property_id', effectivePropertyId);
    
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

// Create sample issues in IIssue format for development
const getSampleIssuesAsIIssue = (propertyId: string): IIssue[] => {
  const now = new Date().toISOString();
  return [
    {
      id: "1254",
      title: "Water leak in bathroom ceiling",
      description: "Water dripping from the bathroom ceiling, possibly from upstairs plumbing.",
      property_id: propertyId,
      status: "Todo",
      priority: "High",
      type: "Bug",
      reported_date: now,
      created_at: now,
      updated_at: now,
      is_emergency: true
    },
    {
      id: "1253", 
      title: "Broken heating system",
      description: "Heating not working throughout the property. Thermostat shows error code E4.",
      property_id: propertyId,
      status: "In Progress",
      priority: "High",
      type: "Bug",
      reported_date: now,
      created_at: now,
      updated_at: now,
      is_emergency: false
    },
    {
      id: "1252",
      title: "Mailbox key replacement",
      description: "Tenant lost mailbox key and needs a replacement.",
      property_id: propertyId,
      status: "Todo",
      priority: "Low",
      type: "Feature",
      reported_date: now,
      created_at: now,
      updated_at: now,
      is_emergency: false
    }
  ];
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
    // Check if property_id is a UUID and convert to property_code if needed
    if (issue.property_id) {
      const propertyId = issue.property_id;
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isUUID = uuidPattern.test(propertyId);
      
      if (isUUID) {
        console.log('Property ID is a UUID, fetching property_code for creating issue');
        const { data: property, error: propertyError } = await supabase
          .from('properties')
          .select('property_code')
          .eq('id', propertyId)
          .single();
        
        if (propertyError) {
          console.error('Error fetching property:', propertyError);
          throw propertyError;
        }
        
        if (property && property.property_code) {
          issue.property_id = property.property_code;
          console.log('Using property_code for issue creation:', issue.property_id);
        }
      }
    }
    
    // Set reported_date if not provided
    if (!issue.reported_date) {
      issue.reported_date = new Date().toISOString();
    }
    
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

// Convert a database issue to the UI format
const convertToUIIssue = (issue: any, properties?: any[]) => {
  // If properties are provided, try to find the matching property and use its address
  let propertyDisplay = issue.property_id;
  if (properties && properties.length > 0) {
    const matchingProperty = properties.find(p => p.id === issue.property_id);
    if (matchingProperty) {
      propertyDisplay = matchingProperty.address;
    }
  }
  
  return {
    id: issue.id,
    title: issue.title,
    type: issue.type,
    status: issue.status,
    priority: issue.priority,
    property: propertyDisplay,
    reported: new Date(issue.reported_date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }),
    assignedTo: issue.assigned_to,
    description: issue.description,
    is_emergency: issue.is_emergency
  };
};

// Get all issues for the issues page
export const getAllIssues = async (): Promise<any[]> => {
  try {
    console.log('Fetching all issues - start');
    
    // Try to get the current user first
    const userId = await getCurrentUserId();
    console.log('Current user ID:', userId);
    
    // If we're in development mode and no user is found, return sample data
    if (process.env.NODE_ENV === 'development') {
      console.log('Running in development mode');
      if (!userId) {
        console.log('No authenticated user found in development mode, returning sample data');
        return getSampleIssues();
      }
      console.log('User found in development mode, attempting to fetch real data');
    }
    
    // If we have a user, get their properties first
    if (userId) {
      console.log('Fetching properties for user:', userId);
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('id, address, city, postcode, property_code')
        .eq('user_id', userId);
      
      if (propertiesError) {
        console.error('Error fetching properties:', propertiesError);
        throw propertiesError;
      }
      
      console.log('Found properties:', properties);
      
      if (!properties || properties.length === 0) {
        console.log('No properties found for user');
        if (process.env.NODE_ENV === 'development') {
          console.log('Development mode: returning sample data due to no properties');
          return getSampleIssues();
        }
        return [];
      }
      
      // Get property IDs as an array
      const propertyIds = properties.map(p => p.id);
      console.log('Property IDs:', propertyIds);
      
      // Now get all issues for these properties
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .in('property_id', propertyIds)
        .order('reported_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching all issues:', error);
        throw error;
      }
      
      console.log('Found issues:', data);
      
      // Convert to the format used in the UI
      return (data || []).map(issue => convertToUIIssue(issue, properties));
    }
    
    // If no user and not in development mode, return empty array
    console.log('No authenticated user found in production mode');
    return [];
  } catch (error) {
    console.error('Error fetching all issues:', error);
    // Only return sample data in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('Error in development mode, returning sample data');
      return getSampleIssues();
    }
    return [];
  }
};

// Get recent issues for the dashboard
export const getRecentIssues = async (limit: number = 5): Promise<any[]> => {
  try {
    console.log('Fetching recent issues, limit:', limit);
    
    // Try to get the current user first
    const userId = await getCurrentUserId();
    
    // If we're in development mode and no user is found, return sample data
    if (process.env.NODE_ENV === 'development' && !userId) {
      console.log('No authenticated user found in development mode, returning sample data');
      const sampleIssues = getSampleIssues();
      return sampleIssues.slice(0, limit);
    }
    
    // If we have a user, get their properties first
    if (userId) {
      console.log('Fetching properties for user:', userId);
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('id, address, city, postcode, property_code')
        .eq('user_id', userId);
      
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
      console.log('Property IDs:', propertyIds);
      
      // Now get all issues for these properties
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .in('property_id', propertyIds)
        .order('reported_date', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('Error fetching recent issues:', error);
        throw error;
      }
      
      // Convert to the format used in the UI, passing the properties for address lookup
      return (data || []).map(issue => convertToUIIssue(issue, properties));
    }
    
    // If no user and not in development mode, return empty array
    console.log('No authenticated user found in production mode');
    return [];
  } catch (error) {
    console.error('Error fetching recent issues:', error);
    // Only return sample data in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('Error in development mode, returning sample data');
      const sampleIssues = getSampleIssues();
      return sampleIssues.slice(0, limit);
    }
    return [];
  }
};

// Sample issues data for development and fallback
const getSampleIssues = () => {
  return [
    {
      id: "1254",
      title: "Water leak in bathroom ceiling",
      type: "Bug",
      status: "Todo",
      priority: "High",
      property: "Sunset Apartments Room 204",
      reported: "Mar 8, 2024",
      assignedTo: "JS",
      description: "Water dripping from the bathroom ceiling, possibly from upstairs plumbing.",
      is_emergency: true
    },
    {
      id: "1253", 
      title: "Broken heating system",
      type: "Bug",
      status: "In Progress",
      priority: "High",
      property: "Oakwood Heights Room 103",
      reported: "Mar 7, 2024",
      assignedTo: "RW",
      description: "Heating not working throughout the property. Thermostat shows error code E4.",
      is_emergency: false
    },
    {
      id: "1252",
      title: "Mailbox key replacement",
      type: "Feature",
      status: "Todo",
      priority: "Low",
      property: "Sunset Apartments Room 112",
      reported: "Mar 6, 2024",
      assignedTo: "",
      description: "Tenant lost mailbox key and needs a replacement.",
      is_emergency: false
    },
    {
      id: "1251",
      title: "Noisy neighbors complaint",
      type: "Bug",
      status: "Todo",
      priority: "Medium",
      property: "Parkview Residences Room 305",
      reported: "Mar 5, 2024",
      assignedTo: "SJ",
      description: "Tenant in unit 305 complaining about excessive noise from unit 306 during night hours.",
      is_emergency: false
    },
    {
      id: "1250",
      title: "Parking spot dispute",
      type: "Documentation",
      status: "Done",
      priority: "Medium",
      property: "Oakwood Heights Room 210",
      reported: "Mar 4, 2024",
      assignedTo: "MA",
      description: "Tenant claims another resident is using their assigned parking spot regularly.",
      is_emergency: false
    }
  ];
}; 