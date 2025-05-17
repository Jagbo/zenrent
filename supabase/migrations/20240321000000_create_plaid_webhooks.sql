create table if not exists plaid_webhooks (
  id uuid default uuid_generate_v4() primary key,
  webhook_type text not null,
  webhook_code text not null,
  item_id text not null,
  data jsonb not null,
  created_at timestamp with time zone default now(),
  processed_at timestamp with time zone
);

-- Add RLS policies
alter table plaid_webhooks enable row level security;

-- Allow insert from webhook
create policy "Allow webhook inserts"
  on plaid_webhooks for insert
  with check (true);

-- Allow read access to authenticated users
create policy "Allow read access to authenticated users"
  on plaid_webhooks for select
  using (true); 