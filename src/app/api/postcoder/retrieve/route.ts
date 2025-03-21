import { NextResponse } from 'next/server';

const POSTCODER_API_KEY = process.env.POSTCODER_API_KEY;
const POSTCODER_BASE_URL = 'https://ws.postcoder.com/pcw';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ success: false, error: 'ID parameter is required' }, { status: 400 });
  }

  if (!POSTCODER_API_KEY) {
    return NextResponse.json({ success: false, error: 'Postcoder API key is not configured' }, { status: 500 });
  }

  try {
    const response = await fetch(
      `${POSTCODER_BASE_URL}/address/uk/retrieve?query=${encodeURIComponent(id)}&apikey=${POSTCODER_API_KEY}&format=json`
    );

    if (!response.ok) {
      throw new Error(`Postcoder API error: ${response.statusText}`);
    }

    const [address] = await response.json();
    return NextResponse.json({ success: true, address });
  } catch (error) {
    console.error('Error fetching address details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch address details' },
      { status: 500 }
    );
  }
} 