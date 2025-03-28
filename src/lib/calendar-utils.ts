import { createClient } from '@supabase/supabase-js';

// Calendar event types
export type EventType = 'inspection' | 'payment' | 'maintenance' | 'meeting' | 'showing' | 'contract' | 'admin';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  start_time?: string | null;
  end_time?: string | null;
  all_day: boolean;
  location: string;
  event_type: EventType;
  property_id?: string | null;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Format date and time for display
export function formatEventTime(event: CalendarEvent): string {
  if (event.all_day) {
    return 'All day';
  }
  
  if (event.start_time && event.end_time) {
    return `${formatTime(event.start_time)} - ${formatTime(event.end_time)}`;
  }
  
  if (event.start_time) {
    return formatTime(event.start_time);
  }
  
  return '';
}

// Format time from 24-hour to 12-hour format
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

// Get background color based on event type
export function getEventColor(type: EventType): string {
  switch (type) {
    case 'inspection': return 'bg-blue-100 text-blue-800';
    case 'payment': return 'bg-green-100 text-green-800';
    case 'maintenance': return 'bg-purple-100 text-purple-800';
    case 'meeting': return 'bg-red-100 text-red-800';
    case 'showing': return 'bg-yellow-100 text-yellow-800';
    case 'contract': return 'bg-d9e8ff-10 text-indigo-800';
    case 'admin': return 'bg-gray-100 text-gray-800';
    default: return 'bg-blue-100 text-blue-800';
  }
}

// Sample data for development mode
const sampleEvents: CalendarEvent[] = [
  { id: '1', title: "Property Inspection", date: "2024-03-01", start_time: "10:00", end_time: "11:00", all_day: false, location: "Sunset Apartments Room 204", event_type: "inspection" },
  { id: '2', title: "Rent Due", date: "2024-03-04", all_day: true, location: "All properties", event_type: "payment" },
  { id: '3', title: "Maintenance Visit", date: "2024-03-08", start_time: "14:00", end_time: "16:00", all_day: false, location: "Oakwood Heights Room 103", event_type: "maintenance" },
  { id: '4', title: "Tenant Meeting", date: "2024-03-12", start_time: "15:00", end_time: "15:30", all_day: false, location: "Parkview Residences Room 305", event_type: "meeting" },
  { id: '5', title: "Property Showing", date: "2024-03-15", start_time: "11:00", end_time: "12:00", all_day: false, location: "Sunset Apartments Room 112", event_type: "showing" },
  { id: '6', title: "Lease Signing", date: "2024-03-18", start_time: "10:00", end_time: "11:00", all_day: false, location: "Main Office", event_type: "contract" },
  { id: '7', title: "Contractor Meeting", date: "2024-03-22", start_time: "09:00", end_time: "10:00", all_day: false, location: "Oakwood Heights", event_type: "maintenance" },
  { id: '8', title: "Monthly Report Due", date: "2024-03-31", all_day: true, location: "N/A", event_type: "admin" },
];

// Generate events for the current month for development mode
function generateCurrentMonthEvents(): CalendarEvent[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
  
  // Create a copy of the sample events
  const events = [...sampleEvents];
  
  // Update the dates to be in the current month
  return events.map((event, index) => {
    const eventDate = new Date(event.date);
    const day = eventDate.getDate();
    
    // Create a new date in the current month with the same day
    const newDate = new Date(currentYear, currentMonth - 1, day);
    
    // If the day doesn't exist in this month (e.g., Feb 30), use the last day
    if (newDate.getMonth() !== currentMonth - 1) {
      newDate.setDate(0); // Last day of previous month
    }
    
    return {
      ...event,
      id: `current-${index + 1}`,
      date: newDate.toISOString().split('T')[0],
    };
  });
}

// Fetch calendar events for the specified month
export async function fetchCalendarEvents(
  year: number, 
  month: number
): Promise<CalendarEvent[]> {
  if (process.env.NODE_ENV === 'development') {
    console.log('Returning sample calendar data for development');
    
    // If the requested month is the current month, use our current month events
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    if (year === currentYear && month === currentMonth) {
      return generateCurrentMonthEvents();
    }
    
    // Otherwise, return the sample events but with updated dates
    return sampleEvents.map((event, index) => {
      const eventDate = new Date(event.date);
      const day = eventDate.getDate();
      
      // Create a new date in the requested month
      const newDate = new Date(year, month - 1, day);
      
      // If the day doesn't exist in this month, use the last day
      if (newDate.getMonth() !== month - 1) {
        newDate.setDate(0);
      }
      
      return {
        ...event,
        id: `${year}-${month}-${index + 1}`,
        date: newDate.toISOString().split('T')[0],
      };
    });
  }
  
  // For production, connect to Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Call the stored function to get events for the month
  const { data, error } = await supabase
    .rpc('get_calendar_events_by_month', {
      p_user_id: '00000000-0000-0000-0000-000000000001', // Test user ID
      p_year: year,
      p_month: month
    });
  
  if (error) {
    console.error('Error fetching calendar events:', error);
    return [];
  }
  
  return data || [];
}

// Fetch calendar events for a specific week
export async function fetchWeekEvents(startDate: string): Promise<CalendarEvent[]> {
  if (process.env.NODE_ENV === 'development') {
    console.log('Returning sample week data for development');
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    
    // Filter our sample events for this week
    return generateCurrentMonthEvents().filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= start && eventDate < end;
    });
  }
  
  // For production
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data, error } = await supabase
    .rpc('get_calendar_events_by_week', {
      p_user_id: '00000000-0000-0000-0000-000000000001', // Test user ID
      p_start_date: startDate
    });
  
  if (error) {
    console.error('Error fetching week events:', error);
    return [];
  }
  
  return data || [];
}

// Fetch calendar events for a specific day
export async function fetchDayEvents(date: string): Promise<CalendarEvent[]> {
  if (process.env.NODE_ENV === 'development') {
    console.log('Returning sample day data for development');
    
    // Filter our sample events for this day
    return generateCurrentMonthEvents().filter(event => event.date === date);
  }
  
  // For production
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data, error } = await supabase
    .rpc('get_calendar_events_by_day', {
      p_user_id: '00000000-0000-0000-0000-000000000001', // Test user ID
      p_date: date
    });
  
  if (error) {
    console.error('Error fetching day events:', error);
    return [];
  }
  
  return data || [];
}

// Create a new calendar event
export async function createCalendarEvent(event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent | null> {
  if (process.env.NODE_ENV === 'development') {
    console.log('Creating event in development mode (simulated):', event);
    return {
      id: `dev-${Date.now()}`,
      ...event,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
  
  // For production
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data, error } = await supabase
    .from('calendar_events')
    .insert({
      ...event,
      user_id: '00000000-0000-0000-0000-000000000001' // Test user ID
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating calendar event:', error);
    return null;
  }
  
  return data;
}

// Update an existing calendar event
export async function updateCalendarEvent(id: string, event: Partial<CalendarEvent>): Promise<boolean> {
  if (process.env.NODE_ENV === 'development') {
    console.log('Updating event in development mode (simulated):', id, event);
    return true;
  }
  
  // For production
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { error } = await supabase
    .from('calendar_events')
    .update(event)
    .eq('id', id)
    .eq('user_id', '00000000-0000-0000-0000-000000000001'); // Test user ID
  
  if (error) {
    console.error('Error updating calendar event:', error);
    return false;
  }
  
  return true;
}

// Delete a calendar event
export async function deleteCalendarEvent(id: string): Promise<boolean> {
  if (process.env.NODE_ENV === 'development') {
    console.log('Deleting event in development mode (simulated):', id);
    return true;
  }
  
  // For production
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', id)
    .eq('user_id', '00000000-0000-0000-0000-000000000001'); // Test user ID
  
  if (error) {
    console.error('Error deleting calendar event:', error);
    return false;
  }
  
  return true;
} 