BEGIN;

-- Create tables first
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id),
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    expense_type VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS income (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id),
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    income_type VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS financial_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id),
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    roi_percentage DECIMAL(5,2),
    yield_percentage DECIMAL(5,2),
    occupancy_rate DECIMAL(5,2),
    maintenance_cost_ratio DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_charges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id),
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    type VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id),
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    invoice_number VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX expenses_property_id_idx ON expenses(property_id);
CREATE INDEX expenses_date_idx ON expenses(date);
CREATE INDEX income_property_id_idx ON income(property_id);
CREATE INDEX income_date_idx ON income(date);
CREATE INDEX financial_metrics_property_id_idx ON financial_metrics(property_id);
CREATE INDEX service_charges_property_id_idx ON service_charges(property_id);
CREATE INDEX invoices_property_id_idx ON invoices(property_id);

-- Enable RLS on all tables
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE income ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own expenses" ON expenses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id = expenses.property_id
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view their own income" ON income
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id = income.property_id
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view their own financial metrics" ON financial_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id = financial_metrics.property_id
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view their own service charges" ON service_charges
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id = service_charges.property_id
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view their own invoices" ON invoices
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id = invoices.property_id
            AND p.user_id = auth.uid()
        )
    );

-- Migrate data from bank_transactions to expenses and income
INSERT INTO expenses (property_id, date, expense_type, category, description, amount)
SELECT 
    p.id as property_id,
    bt.date::timestamp with time zone,
    bt.category[2] as expense_type,
    bt.category[1] as category,
    bt.name as description,
    ABS(bt.amount) as amount
FROM bank_transactions bt
JOIN properties p ON bt.property_id = p.property_code
WHERE bt.amount < 0;

INSERT INTO income (property_id, date, income_type, category, description, amount)
SELECT 
    p.id as property_id,
    bt.date::timestamp with time zone,
    bt.category[2] as income_type,
    bt.category[1] as category,
    bt.name as description,
    bt.amount as amount
FROM bank_transactions bt
JOIN properties p ON bt.property_id = p.property_code
WHERE bt.amount > 0;

-- Calculate and insert financial metrics for each property
INSERT INTO financial_metrics (
    property_id,
    period_start,
    period_end,
    roi_percentage,
    yield_percentage,
    occupancy_rate
)
SELECT 
    p.id as property_id,
    date_trunc('month', CURRENT_DATE - interval '1 month') as period_start,
    date_trunc('month', CURRENT_DATE) as period_end,
    -- Sample ROI calculation (customize based on your business logic)
    ROUND(((SUM(CASE WHEN i.amount > 0 THEN i.amount ELSE 0 END) - 
            SUM(CASE WHEN e.amount > 0 THEN e.amount ELSE 0 END)) / 
            NULLIF(SUM(CASE WHEN e.amount > 0 THEN e.amount ELSE 0 END), 0) * 100)::numeric, 2) as roi_percentage,
    -- Sample yield calculation
    ROUND((SUM(CASE WHEN i.amount > 0 THEN i.amount ELSE 0 END) / 100000 * 100)::numeric, 2) as yield_percentage,
    -- Sample occupancy rate (assuming 90% for now)
    90.00 as occupancy_rate
FROM properties p
LEFT JOIN income i ON i.property_id = p.id
LEFT JOIN expenses e ON e.property_id = p.id
WHERE p.user_id = '53156529-1adc-44f4-805b-19a3b35a3bb3'
GROUP BY p.id;

-- Update the user ID in the sample data
UPDATE properties 
SET user_id = 'b85371f5-2ec6-4ceb-9526-51a60d19fcc2'
WHERE user_id = '53156529-1adc-44f4-805b-19a3b35a3bb3';

-- Insert sample data for expenses
INSERT INTO expenses (property_id, date, expense_type, category, description, amount)
SELECT 
  p.id,
  NOW() - INTERVAL '1 month',
  'maintenance',
  'repairs',
  'Boiler repair',
  250.00
FROM properties p
WHERE p.user_id = 'b85371f5-2ec6-4ceb-9526-51a60d19fcc2'
LIMIT 1;

-- Insert sample data for income
INSERT INTO income (property_id, date, income_type, category, description, amount)
SELECT 
  p.id,
  NOW() - INTERVAL '1 month',
  'rent',
  'monthly',
  'Monthly rent payment',
  1000.00
FROM properties p
WHERE p.user_id = 'b85371f5-2ec6-4ceb-9526-51a60d19fcc2'
LIMIT 1;

-- Insert sample financial metrics
INSERT INTO financial_metrics (
  property_id,
  period_start,
  period_end,
  roi_percentage,
  yield_percentage,
  occupancy_rate
)
SELECT 
  p.id,
  DATE_TRUNC('month', NOW() - INTERVAL '1 month'),
  DATE_TRUNC('month', NOW()),
  5.2,
  4.8,
  100.0
FROM properties p
WHERE p.user_id = 'b85371f5-2ec6-4ceb-9526-51a60d19fcc2'
LIMIT 1;

COMMIT; 