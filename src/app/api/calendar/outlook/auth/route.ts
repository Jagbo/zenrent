import { NextRequest, NextResponse } from 'next/server';
import { OutlookCalendarService } from '@/lib/outlook-calendar';

export async function GET(request: NextRequest) {
  try {
    const outlookCalendar = new OutlookCalendarService();
    const authUrl = await outlookCalendar.getAuthUrl();
    
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Outlook Calendar auth error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Outlook Calendar authentication' },
      { status: 500 }
    );
  }
}