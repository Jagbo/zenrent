import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  // Return environment variables that are safe to share
  const safeEnvVars = {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'Not set',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set',
    // Include other NEXT_PUBLIC_ or relevant variables
    nodeEnv: process.env.NODE_ENV || 'Not set',
    // Don't include any secrets or sensitive information!
  };

  return NextResponse.json(safeEnvVars);
} 