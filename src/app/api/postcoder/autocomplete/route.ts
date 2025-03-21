import { NextResponse } from 'next/server';

const POSTCODER_API_KEY = process.env.POSTCODER_API_KEY;
const POSTCODER_BASE_URL = 'https://ws.postcoder.com/pcw';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ success: false, error: 'Query parameter is required' }, { status: 400 });
  }

  if (!POSTCODER_API_KEY) {
    return NextResponse.json({ success: false, error: 'Postcoder API key is not configured' }, { status: 500 });
  }

  try {
    const response = await fetch(
      `${POSTCODER_BASE_URL}/address/uk/search?query=${encodeURIComponent(query)}&apikey=${POSTCODER_API_KEY}&lines=5&format=json`
    );

    if (!response.ok) {
      throw new Error(`Postcoder API error: ${response.statusText}`);
    }

    const addresses = await response.json();
    return NextResponse.json({ success: true, addresses });
  } catch (error) {
    console.error('Error fetching address suggestions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch address suggestions' },
      { status: 500 }
    );
  }
} 