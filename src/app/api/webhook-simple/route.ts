import { NextRequest } from 'next/server';

// Extremely simplified webhook that only returns the challenge
export function GET(request: NextRequest) {
  const url = request.url;
  const params = new URL(url).searchParams;
  const challenge = params.get('hub.challenge');
  const token = params.get('hub.verify_token');
  
  console.log('Simple webhook test:', {
    url,
    challenge,
    token,
    token_matches: token === 'zenrent5512429'
  });
  
  // Always return the challenge parameter regardless of token
  return new Response(challenge, {
    status: 200,
    headers: { 'Content-Type': 'text/plain' }
  });
} 