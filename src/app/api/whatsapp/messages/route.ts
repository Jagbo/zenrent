import { NextResponse } from 'next/server';

// Mock data for demo purposes
// In a real implementation, you'd use the WhatsApp Business API
const mockMessages: Record<string, any[]> = {
  '+44 7123 456789': [
    {
      id: '1',
      from: 'business',
      text: 'Hello! How can I help you today?',
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    },
    {
      id: '2',
      from: 'user',
      text: 'I have a question about my lease renewal.',
      timestamp: new Date(Date.now() - 3500000).toISOString(),
    },
    {
      id: '3',
      from: 'business',
      text: 'Of course, I\'d be happy to discuss your lease renewal. Your current lease ends on 8/15/2024. Would you like to extend it for another year?',
      timestamp: new Date(Date.now() - 3400000).toISOString(),
    },
    {
      id: '4',
      from: 'user',
      text: 'Yes, I\'m interested in extending. Will the rent stay the same?',
      timestamp: new Date(Date.now() - 3300000).toISOString(),
    },
    {
      id: '5',
      from: 'business',
      text: 'There will be a small increase of about 3% in line with market rates. I can send you the new lease agreement for review if you\'d like.',
      timestamp: new Date(Date.now() - 3200000).toISOString(),
    },
  ],
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const phoneNumber = url.searchParams.get('phone');

  if (!phoneNumber) {
    return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
  }

  // In production, verify that the phone number belongs to a tenant
  // and that the business has permission to access this conversation

  // For demo, just return mock messages
  const messages = mockMessages[phoneNumber] || [];

  return NextResponse.json({ messages });
}

export async function POST(request: Request) {
  try {
    const { to, message } = await request.json();

    if (!to || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // In production, you'd use the WhatsApp Business API to send the message
    // For now, we'll just add it to our mock data
    
    if (!mockMessages[to]) {
      mockMessages[to] = [];
    }
    
    const newMessage = {
      id: `${mockMessages[to].length + 1}`,
      from: 'business',
      text: message,
      timestamp: new Date().toISOString(),
    };
    
    mockMessages[to].push(newMessage);

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
} 