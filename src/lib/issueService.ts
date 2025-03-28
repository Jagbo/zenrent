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
    
    // In development mode, return sample data directly
    if (process.env.NODE_ENV === 'development') {
      console.log('In development mode, returning sample data directly for property:', propertyId);
      
      // Get sample property code/name from the propertyId
      let propertyName = 'Unknown Property';
      let propertyCode = '';
      
      // Extract property name from UUID or use property_code directly
      if (propertyId.includes('-')) {
        // It's a UUID, get corresponding property_code
        if (propertyId === 'bd8e3211-2403-47ac-9947-7a4842c5a4e3') {
          propertyName = '15 Crescent Road';
          propertyCode = 'prop_15_crescent_road';
        } else if (propertyId === 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8') {
          propertyName = '42 Harley Street';
          propertyCode = 'prop_42_harley_street';
        } else if (propertyId === '7a2e1487-f17b-4ceb-b6d1-56934589025b') {
          propertyName = '8 Victoria Gardens';
          propertyCode = 'prop_8_victoria_gardens';
        }
      } else {
        // It's already a property_code
        propertyCode = propertyId;
        propertyName = propertyId.replace('prop_', '').split('_').map(
          word => word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
      }
      
      console.log(`Using property name: ${propertyName}, code: ${propertyCode}`);
      
      // Generate sample issues for this property
      const now = new Date().toISOString();
      
      // Return different issues based on the property
      if (propertyCode === 'prop_15_crescent_road') {
        return [
          {
            id: "b7f456e8-240c-48d8-b9b4-26f22254f91b",
            title: "Water leak in bathroom ceiling",
            description: "Water dripping from the bathroom ceiling, possibly from upstairs plumbing.",
            property_id: propertyCode,
            status: "Todo",
            priority: "High",
            type: "Bug",
            reported_date: now,
            created_at: now,
            updated_at: now,
            is_emergency: true
          },
          {
            id: "89799523-7143-4ac0-ade5-72c897e126d2",
            title: "Mailbox key replacement",
            description: "Tenant lost mailbox key and needs a replacement.",
            property_id: propertyCode,
            status: "Todo",
            priority: "Low",
            type: "Feature",
            reported_date: now,
            created_at: now,
            updated_at: now,
            is_emergency: false
          }
        ];
      } else if (propertyCode === 'prop_42_harley_street') {
        return [
          {
            id: "e934d52a-45aa-441c-8c78-725dfceb2468",
            title: "Broken heating system",
            description: "Heating not working throughout the property. Thermostat shows error code E4.",
            property_id: propertyCode,
            status: "In Progress",
            priority: "High",
            type: "Bug",
            reported_date: now,
            created_at: now,
            updated_at: now,
            is_emergency: false
          },
          {
            id: "bffbeca2-3d5b-44ac-a1fd-3a23a263a853",
            title: "Parking spot dispute",
            description: "Tenant claims another resident is using their assigned parking spot regularly.",
            property_id: propertyCode,
            status: "Done",
            priority: "Medium",
            type: "Documentation",
            reported_date: now,
            created_at: now,
            updated_at: now,
            is_emergency: false
          }
        ];
      } else if (propertyCode === 'prop_8_victoria_gardens') {
        return [
          {
            id: "a3aa8cc2-12da-4ad5-a0f1-fbafc0480c6b",
            title: "Noisy neighbors complaint",
            description: "Tenant in unit 305 complaining about excessive noise from unit 306 during night hours.",
            property_id: propertyCode,
            status: "Todo",
            priority: "Medium",
            type: "Bug",
            reported_date: now,
            created_at: now,
            updated_at: now,
            is_emergency: false
          }
        ];
      }
      
      // Default sample issues if property not matched
      return getSampleIssuesAsIIssue(propertyCode);
    }
    
    // First determine if we're looking at a UUID or a property_code
    let isUUID = false;
    try {
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      isUUID = uuidPattern.test(propertyId);
    } catch (e) {
      // Not a UUID
      isUUID = false;
    }
    
    let propertyCode = propertyId;
    
    // If this is a UUID, we need to get the property_code first
    if (isUUID) {
      console.log('Property ID is a UUID, fetching property_code');
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
        propertyCode = property.property_code;
        console.log('Using property_code:', propertyCode);
      }
    }
    
    // Now fetch issues with the property_code
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .eq('property_id', propertyCode)
      .order('reported_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching property issues:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error(`Error fetching issues for property ${propertyId}:`, error);
    // Return sample data for development if we can't connect to the database
    if (process.env.NODE_ENV === 'development') {
      return getSampleIssuesAsIIssue(propertyId);
    }
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

// Converts a database issue to the format used in UI components
export const convertToUIIssue = (dbIssue: IIssue): any => {
  // Extract property name from property_id if possible
  let propertyText = dbIssue.property_id;
  
  // If property_id is in format "prop_X_Y_Z", convert to readable format
  if (propertyText && propertyText.startsWith('prop_')) {
    propertyText = propertyText
      .replace('prop_', '')
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  return {
    id: dbIssue.id,
    title: dbIssue.title,
    type: dbIssue.type,
    status: dbIssue.status,
    priority: dbIssue.priority,
    property: propertyText, // Now provides a more readable property name
    reported: new Date(dbIssue.reported_date).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}),
    assignedTo: dbIssue.assigned_to || '',
    description: dbIssue.description || '',
    is_emergency: dbIssue.is_emergency
  };
};

// Get all issues for the issues page
export const getAllIssues = async (): Promise<any[]> => {
  try {
    console.log('Fetching all issues');
    
    // In development mode, skip Supabase and return sample data directly for testing
    if (process.env.NODE_ENV === 'development') {
      console.log('In development mode, returning sample data directly');
      
      // Create sample issues with current timestamp
      const now = new Date().toISOString();
      return [
        {
          id: "b7f456e8-240c-48d8-b9b4-26f22254f91b",
          title: "Water leak in bathroom ceiling",
          description: "Water dripping from the bathroom ceiling, possibly from upstairs plumbing.",
          status: "Todo",
          priority: "High",
          type: "Bug",
          property: "15 Crescent Road",
          reported: new Date(now).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}),
          assignedTo: "Unassigned",
          is_emergency: true
        },
        {
          id: "e934d52a-45aa-441c-8c78-725dfceb2468", 
          title: "Broken heating system",
          description: "Heating not working throughout the property. Thermostat shows error code E4.",
          status: "In Progress",
          priority: "High",
          type: "Bug",
          property: "42 Harley Street",
          reported: new Date(now).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}),
          assignedTo: "John Smith",
          is_emergency: false
        },
        {
          id: "89799523-7143-4ac0-ade5-72c897e126d2",
          title: "Mailbox key replacement",
          description: "Tenant lost mailbox key and needs a replacement.",
          status: "Todo",
          priority: "Low",
          type: "Feature",
          property: "15 Crescent Road",
          reported: new Date(now).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}),
          assignedTo: "Unassigned",
          is_emergency: false
        },
        {
          id: "a3aa8cc2-12da-4ad5-a0f1-fbafc0480c6b",
          title: "Noisy neighbors complaint",
          description: "Tenant in unit 305 complaining about excessive noise from unit 306 during night hours.",
          status: "Todo",
          priority: "Medium",
          type: "Bug",
          property: "8 Victoria Gardens",
          reported: new Date(now).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}),
          assignedTo: "Unassigned",
          is_emergency: false
        },
        {
          id: "bffbeca2-3d5b-44ac-a1fd-3a23a263a853",
          title: "Parking spot dispute",
          description: "Tenant claims another resident is using their assigned parking spot regularly.",
          status: "Done",
          priority: "Medium",
          type: "Documentation",
          property: "42 Harley Street",
          reported: new Date(now).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}),
          assignedTo: "Jane Doe",
          is_emergency: false
        }
      ];
    }
    
    // For production, respect RLS
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .order('reported_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching all issues:', error);
      throw error;
    }
    
    // If we get 0 results due to RLS, but we know issues exist, log it
    if (!data || data.length === 0) {
      console.log('No issues found, possibly due to RLS. This may be normal if the user has no issues.');
    }
    
    // Convert to the format used in the UI
    return (data || []).map(convertToUIIssue);
  } catch (error) {
    console.error('Error fetching all issues:', error);
    // Return sample data for development if we can't connect to the database
    if (process.env.NODE_ENV === 'development') {
      return getSampleIssues();
    }
    return [];
  }
};

// Get recent issues for the dashboard
export const getRecentIssues = async (limit: number = 5): Promise<any[]> => {
  try {
    console.log('Fetching recent issues, limit:', limit);
    
    // In development mode, skip Supabase and return sample data directly for testing
    if (process.env.NODE_ENV === 'development') {
      console.log('In development mode, returning sample data directly');
      
      // Create sample issues with current timestamp
      const now = new Date().toISOString();
      const sampleIssues = [
        {
          id: "b7f456e8-240c-48d8-b9b4-26f22254f91b",
          title: "Water leak in bathroom ceiling",
          description: "Water dripping from the bathroom ceiling, possibly from upstairs plumbing.",
          status: "Todo",
          priority: "High",
          type: "Bug",
          property: "15 Crescent Road",
          reported: new Date(now).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}),
          assignedTo: "Unassigned",
          is_emergency: true
        },
        {
          id: "e934d52a-45aa-441c-8c78-725dfceb2468", 
          title: "Broken heating system",
          description: "Heating not working throughout the property. Thermostat shows error code E4.",
          status: "In Progress",
          priority: "High",
          type: "Bug",
          property: "42 Harley Street",
          reported: new Date(now).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}),
          assignedTo: "John Smith",
          is_emergency: false
        },
        {
          id: "89799523-7143-4ac0-ade5-72c897e126d2",
          title: "Mailbox key replacement",
          description: "Tenant lost mailbox key and needs a replacement.",
          status: "Todo",
          priority: "Low",
          type: "Feature",
          property: "15 Crescent Road",
          reported: new Date(now).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}),
          assignedTo: "Unassigned",
          is_emergency: false
        },
        {
          id: "a3aa8cc2-12da-4ad5-a0f1-fbafc0480c6b",
          title: "Noisy neighbors complaint",
          description: "Tenant in unit 305 complaining about excessive noise from unit 306 during night hours.",
          status: "Todo",
          priority: "Medium",
          type: "Bug",
          property: "8 Victoria Gardens",
          reported: new Date(now).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}),
          assignedTo: "Unassigned",
          is_emergency: false
        },
        {
          id: "bffbeca2-3d5b-44ac-a1fd-3a23a263a853",
          title: "Parking spot dispute",
          description: "Tenant claims another resident is using their assigned parking spot regularly.",
          status: "Done",
          priority: "Medium",
          type: "Documentation",
          property: "42 Harley Street",
          reported: new Date(now).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}),
          assignedTo: "Jane Doe",
          is_emergency: false
        }
      ];
      return sampleIssues.slice(0, limit);
    }
    
    // For production, respect RLS
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .order('reported_date', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching recent issues:', error);
      throw error;
    }
    
    // If we get 0 results due to RLS, but we know issues exist, log it
    if (!data || data.length === 0) {
      console.log('No recent issues found, possibly due to RLS. This may be normal if the user has no issues.');
    }
    
    // Convert to the format used in the UI
    return (data || []).map(convertToUIIssue);
  } catch (error) {
    console.error('Error fetching recent issues:', error);
    // Return sample data for development if we can't connect to the database
    if (process.env.NODE_ENV === 'development') {
      return getSampleIssues().slice(0, limit);
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