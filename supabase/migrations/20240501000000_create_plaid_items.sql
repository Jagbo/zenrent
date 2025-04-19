-- Create plaid_items table to store Plaid connections for users
create table if not exists plaid_items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  access_token text not null,
  item_id text not null unique,
  properties jsonb, -- Store property associations
  status text not null default 'pending',
  institution_id text,
  institution_name text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add indexes for faster lookups
create index if not exists idx_plaid_items_user_id on plaid_items(user_id);
create index if not exists idx_plaid_items_item_id on plaid_items(item_id);

-- Enable Row Level Security
alter table plaid_items enable row level security;

-- Create RLS policies

-- Users can only view their own Plaid items
create policy "Users can view their own plaid items"
  on plaid_items for select
  using (auth.uid() = user_id);

-- Users can insert their own Plaid items
create policy "Users can insert their own plaid items"
  on plaid_items for insert
  with check (auth.uid() = user_id);

-- Users can update their own Plaid items
create policy "Users can update their own plaid items"
  on plaid_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete their own Plaid items
create policy "Users can delete their own plaid items"
  on plaid_items for delete
  using (auth.uid() = user_id);

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to update the updated_at timestamp
DROP TRIGGER IF EXISTS set_timestamp ON plaid_items;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON plaid_items
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp(); 