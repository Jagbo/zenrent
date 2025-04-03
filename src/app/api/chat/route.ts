import { Agent, Runner } from 'openai-agents';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const agent = new Agent({
      name: "ZenRent Assistant",
      instructions: `You are a helpful property management assistant for ZenRent. 
      You help landlords manage their properties, handle tenant inquiries, and provide insights about property management.
      You have access to property data, tenant information, and maintenance records.
      Always be professional, clear, and concise in your responses.
      If you're unsure about something, ask for clarification.`
    });

    const result = await Runner.run_sync(agent, message);

    return NextResponse.json({ response: result.final_output });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process your request' },
      { status: 500 }
    );
  }
} 