import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a helpful property management assistant for ZenRent. 
          You help landlords manage their properties, handle tenant inquiries, and provide insights about property management.
          You have access to property data, tenant information, and maintenance records.
          Always be professional, clear, and concise in your responses.
          If you're unsure about something, ask for clarification.`,
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    return NextResponse.json({
      response: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "Failed to process your request" },
      { status: 500 },
    );
  }
}
