-- Create WhatsApp accounts table
CREATE TABLE IF NOT EXISTS whatsapp_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  waba_id TEXT NOT NULL,
  phone_number_id TEXT,
  phone_number TEXT,
  business_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  connected_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB,
  UNIQUE(user_id, waba_id)
);

-- Create WhatsApp messages table
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  waba_id TEXT NOT NULL,
  phone_number_id TEXT NOT NULL,
  from_phone TEXT NOT NULL,
  to_phone TEXT,
  message_id TEXT NOT NULL,
  message_type TEXT NOT NULL,
  message_content TEXT NOT NULL,
  media_url TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  direction TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unknown',
  context_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB
);

-- Create index on message_id for faster lookups during webhook updates
CREATE INDEX IF NOT EXISTS whatsapp_messages_message_id_idx ON whatsapp_messages(message_id);

-- Create index on user_id, from_phone for faster conversation lookups
CREATE INDEX IF NOT EXISTS whatsapp_messages_user_conversation_idx ON whatsapp_messages(user_id, from_phone);

-- Create RLS policies for whatsapp_accounts
ALTER TABLE whatsapp_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own WhatsApp accounts"
  ON whatsapp_accounts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own WhatsApp accounts"
  ON whatsapp_accounts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own WhatsApp accounts"
  ON whatsapp_accounts FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own WhatsApp accounts"
  ON whatsapp_accounts FOR DELETE
  USING (user_id = auth.uid());

-- Create RLS policies for whatsapp_messages
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own WhatsApp messages"
  ON whatsapp_messages FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own WhatsApp messages"
  ON whatsapp_messages FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own WhatsApp messages"
  ON whatsapp_messages FOR UPDATE
  USING (user_id = auth.uid());

-- Create function to update the updated_at field
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to update the updated_at field
CREATE TRIGGER update_whatsapp_accounts_updated_at
BEFORE UPDATE ON whatsapp_accounts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_messages_updated_at
BEFORE UPDATE ON whatsapp_messages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 