import { createClient } from "@supabase/supabase-js";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// Calendar event types
export type EventType =
  | "inspection"
  | "payment"
  | "maintenance"
  | "meeting"
  | "showing"
  | "contract"
  | "admin";

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
    return "All day";
  }

  if (event.start_time && event.end_time) {
    return `${formatTime(event.start_time)} - ${formatTime(event.end_time)}`;
  }

  if (event.start_time) {
    return formatTime(event.start_time);
  }

  return "";
}

// Helper function to format time
function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

// Get color for event type
export function getEventColor(type: EventType): string {
  const colors = {
    inspection: "bg-purple-100 text-purple-800",
    payment: "bg-green-100 text-green-800",
    maintenance: "bg-yellow-100 text-yellow-800",
    meeting: "bg-blue-100 text-blue-800",
    showing: "bg-pink-100 text-pink-800",
    contract: "bg-[#D9E8FF]/10 text-indigo-800",
    admin: "bg-gray-100 text-gray-800",
  };
  return colors[type] || colors.admin;
}

// Fetch calendar events for the specified month
export async function fetchCalendarEvents(
  year: number,
  month: number,
): Promise<CalendarEvent[]> {
  const supabase = createClientComponentClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("No authenticated user found");
    return [];
  }

  // Call the stored function to get events for the month
  const { data, error } = await supabase.rpc("get_calendar_events_by_month", {
    p_user_id: user.id,
    p_year: year,
    p_month: month,
  });

  if (error) {
    console.error("Error fetching calendar events:", error);
    return [];
  }

  return data || [];
}

// Fetch calendar events for a specific week
export async function fetchWeekEvents(
  startDate: string,
): Promise<CalendarEvent[]> {
  const supabase = createClientComponentClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("No authenticated user found");
    return [];
  }

  const { data, error } = await supabase.rpc("get_calendar_events_by_week", {
    p_user_id: user.id,
    p_start_date: startDate,
  });

  if (error) {
    console.error("Error fetching week events:", error);
    return [];
  }

  return data || [];
}

// Fetch calendar events for a specific day
export async function fetchDayEvents(date: string): Promise<CalendarEvent[]> {
  const supabase = createClientComponentClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("No authenticated user found");
    return [];
  }

  const { data, error } = await supabase.rpc("get_calendar_events_by_day", {
    p_user_id: user.id,
    p_date: date,
  });

  if (error) {
    console.error("Error fetching day events:", error);
    return [];
  }

  return data || [];
}

// Create a new calendar event
export async function createCalendarEvent(
  event: Omit<CalendarEvent, "id">,
): Promise<CalendarEvent | null> {
  const supabase = createClientComponentClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("No authenticated user found");
    return null;
  }

  const { data, error } = await supabase
    .from("calendar_events")
    .insert({
      ...event,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating calendar event:", error);
    return null;
  }

  return data;
}

// Update an existing calendar event
export async function updateCalendarEvent(
  id: string,
  event: Partial<CalendarEvent>,
): Promise<boolean> {
  const supabase = createClientComponentClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("No authenticated user found");
    return false;
  }

  const { error } = await supabase
    .from("calendar_events")
    .update(event)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error updating calendar event:", error);
    return false;
  }

  return true;
}

// Delete a calendar event
export async function deleteCalendarEvent(id: string): Promise<boolean> {
  const supabase = createClientComponentClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("No authenticated user found");
    return false;
  }

  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting calendar event:", error);
    return false;
  }

  return true;
}
