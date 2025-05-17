import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  // Get all environment variables for HMRC
  const hmrcEnv = {
    HMRC_CLIENT_ID: process.env.HMRC_CLIENT_ID ? '✅ Set' : '❌ Not set',
    HMRC_CLIENT_SECRET: process.env.HMRC_CLIENT_SECRET ? '✅ Set' : '❌ Not set',
    HMRC_REDIRECT_URI: process.env.HMRC_REDIRECT_URI ? '✅ Set' : '❌ Not set',
    HMRC_AUTH_URL: process.env.HMRC_AUTH_URL ? '✅ Set' : '❌ Not set',
    HMRC_TOKEN_URL: process.env.HMRC_TOKEN_URL ? '✅ Set' : '❌ Not set',
    
    // Also check NEXT_PUBLIC variables
    NEXT_PUBLIC_HMRC_CLIENT_ID: process.env.NEXT_PUBLIC_HMRC_CLIENT_ID ? '✅ Set' : '❌ Not set',
    NEXT_PUBLIC_HMRC_REDIRECT_URI: process.env.NEXT_PUBLIC_HMRC_REDIRECT_URI ? '✅ Set' : '❌ Not set',
  };
  
  // Don't show actual values for security reasons
  return NextResponse.json({
    hmrcEnv,
    message: 'This is a test endpoint for HMRC OAuth environment variables'
  });
} 