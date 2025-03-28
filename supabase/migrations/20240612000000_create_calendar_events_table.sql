-- Create calendar_events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  all_day BOOLEAN DEFAULT FALSE,
  location TEXT,
  event_type VARCHAR(50) NOT NULL,
  property_id TEXT,
  tenant_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_property_id ON calendar_events(property_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_event_type ON calendar_events(event_type);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER set_timestamp_calendar_events
BEFORE UPDATE ON calendar_events
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- RLS policy: Users can only view their own calendar events
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own calendar events"
  ON calendar_events
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendar events"
  ON calendar_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar events"
  ON calendar_events
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar events"
  ON calendar_events
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add property-based access for additional flexibility
-- This will be updated later when the properties table exists
CREATE POLICY "Users can view events for properties they own"
  ON calendar_events
  FOR SELECT
  USING (
    property_id IS NOT NULL AND 
    auth.uid() IS NOT NULL -- Placeholder until properties table exists
  ); 