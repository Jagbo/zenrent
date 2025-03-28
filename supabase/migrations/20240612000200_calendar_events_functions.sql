-- Create helper functions to query calendar events for the frontend

-- Function to get calendar events for a specific month
CREATE OR REPLACE FUNCTION get_calendar_events_by_month(
  p_user_id UUID,
  p_year INT,
  p_month INT
)
RETURNS TABLE (
  id UUID,
  title VARCHAR(255),
  date DATE,
  start_time TIME,
  end_time TIME,
  all_day BOOLEAN,
  location TEXT,
  event_type VARCHAR(50),
  property_id TEXT,
  description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    e.date,
    e.start_time,
    e.end_time,
    e.all_day,
    e.location,
    e.event_type,
    e.property_id,
    e.description
  FROM 
    calendar_events e
  WHERE 
    e.user_id = p_user_id
    AND EXTRACT(YEAR FROM e.date) = p_year
    AND EXTRACT(MONTH FROM e.date) = p_month
  ORDER BY 
    e.date, COALESCE(e.start_time, '00:00:00'::TIME);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get calendar events for a specific week
CREATE OR REPLACE FUNCTION get_calendar_events_by_week(
  p_user_id UUID,
  p_start_date DATE
)
RETURNS TABLE (
  id UUID,
  title VARCHAR(255),
  date DATE,
  start_time TIME,
  end_time TIME,
  all_day BOOLEAN,
  location TEXT,
  event_type VARCHAR(50),
  property_id TEXT,
  description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    e.date,
    e.start_time,
    e.end_time,
    e.all_day,
    e.location,
    e.event_type,
    e.property_id,
    e.description
  FROM 
    calendar_events e
  WHERE 
    e.user_id = p_user_id
    AND e.date >= p_start_date
    AND e.date < (p_start_date + INTERVAL '7 days')
  ORDER BY 
    e.date, COALESCE(e.start_time, '00:00:00'::TIME);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get calendar events for a specific day
CREATE OR REPLACE FUNCTION get_calendar_events_by_day(
  p_user_id UUID,
  p_date DATE
)
RETURNS TABLE (
  id UUID,
  title VARCHAR(255),
  date DATE,
  start_time TIME,
  end_time TIME,
  all_day BOOLEAN,
  location TEXT,
  event_type VARCHAR(50),
  property_id TEXT,
  description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    e.date,
    e.start_time,
    e.end_time,
    e.all_day,
    e.location,
    e.event_type,
    e.property_id,
    e.description
  FROM 
    calendar_events e
  WHERE 
    e.user_id = p_user_id
    AND e.date = p_date
  ORDER BY 
    COALESCE(e.start_time, '00:00:00'::TIME);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get upcoming calendar events
CREATE OR REPLACE FUNCTION get_upcoming_calendar_events(
  p_user_id UUID,
  p_days INT DEFAULT 30,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title VARCHAR(255),
  date DATE,
  start_time TIME,
  end_time TIME,
  all_day BOOLEAN,
  location TEXT,
  event_type VARCHAR(50),
  property_id TEXT,
  description TEXT,
  days_until INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    e.date,
    e.start_time,
    e.end_time,
    e.all_day,
    e.location,
    e.event_type,
    e.property_id,
    e.description,
    (e.date - CURRENT_DATE)::INT AS days_until
  FROM 
    calendar_events e
  WHERE 
    e.user_id = p_user_id
    AND e.date >= CURRENT_DATE
    AND e.date <= (CURRENT_DATE + (p_days || ' days')::INTERVAL)
  ORDER BY 
    e.date, COALESCE(e.start_time, '00:00:00'::TIME)
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get calendar events by property
CREATE OR REPLACE FUNCTION get_calendar_events_by_property(
  p_user_id UUID,
  p_property_id TEXT,
  p_start_date DATE DEFAULT CURRENT_DATE,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title VARCHAR(255),
  date DATE,
  start_time TIME,
  end_time TIME,
  all_day BOOLEAN,
  location TEXT,
  event_type VARCHAR(50),
  property_id TEXT,
  description TEXT
) AS $$
BEGIN
  -- If end_date is NULL, set it to 90 days from start_date
  p_end_date := COALESCE(p_end_date, p_start_date + INTERVAL '90 days');
  
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    e.date,
    e.start_time,
    e.end_time,
    e.all_day,
    e.location,
    e.event_type,
    e.property_id,
    e.description
  FROM 
    calendar_events e
  WHERE 
    e.user_id = p_user_id
    AND e.property_id = p_property_id
    AND e.date >= p_start_date
    AND e.date <= p_end_date
  ORDER BY 
    e.date, COALESCE(e.start_time, '00:00:00'::TIME);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get events by type (e.g., all inspections or maintenance events)
CREATE OR REPLACE FUNCTION get_calendar_events_by_type(
  p_user_id UUID,
  p_event_type TEXT,
  p_start_date DATE DEFAULT CURRENT_DATE,
  p_end_date DATE DEFAULT NULL,
  p_limit INT DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  title VARCHAR(255),
  date DATE,
  start_time TIME,
  end_time TIME,
  all_day BOOLEAN,
  location TEXT,
  event_type VARCHAR(50),
  property_id TEXT,
  description TEXT
) AS $$
BEGIN
  -- If end_date is NULL, set it to 90 days from start_date
  p_end_date := COALESCE(p_end_date, p_start_date + INTERVAL '90 days');
  
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    e.date,
    e.start_time,
    e.end_time,
    e.all_day,
    e.location,
    e.event_type,
    e.property_id,
    e.description
  FROM 
    calendar_events e
  WHERE 
    e.user_id = p_user_id
    AND e.event_type = p_event_type
    AND e.date >= p_start_date
    AND e.date <= p_end_date
  ORDER BY 
    e.date, COALESCE(e.start_time, '00:00:00'::TIME)
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 