-- Create bank_connections table
CREATE TABLE IF NOT EXISTS bank_connections (
  id SERIAL PRIMARY KEY,
  property_id TEXT NOT NULL,
  plaid_access_token TEXT NOT NULL,
  plaid_item_id TEXT UNIQUE NOT NULL,
  cursor TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bank_transactions table
CREATE TABLE IF NOT EXISTS bank_transactions (
  id SERIAL PRIMARY KEY,
  property_id TEXT NOT NULL,
  plaid_transaction_id TEXT UNIQUE NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  name TEXT,
  merchant_name TEXT,
  category TEXT[],
  pending BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on plaid_transaction_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_bank_transactions_transaction_id ON bank_transactions(plaid_transaction_id);

-- Create index on property_id for filtering transactions by property
CREATE INDEX IF NOT EXISTS idx_bank_transactions_property_id ON bank_transactions(property_id);

-- Create trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON bank_connections
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp(); 