import { Client } from '@microsoft/microsoft-graph-client';
import { ConfidentialClientApplication, AuthenticationResult } from '@azure/msal-node';

const SCOPES = [
  'https://graph.microsoft.com/calendars.readwrite',
  'https://graph.microsoft.com/user.read'
];

export class OutlookCalendarService {
  private msalInstance: ConfidentialClientApplication;

  constructor() {
    this.msalInstance = new ConfidentialClientApplication({
      auth: {
        clientId: process.env.MICROSOFT_CLIENT_ID!,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
        authority: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID || 'common'}`
      }
    });
  }

  /**
   * Generate Microsoft OAuth authorization URL
   */
  async getAuthUrl(): Promise<string> {
    const authCodeUrlParameters = {
      scopes: SCOPES,
      redirectUri: process.env.MICROSOFT_REDIRECT_URI!,
    };

    return await this.msalInstance.getAuthCodeUrl(authCodeUrlParameters);
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokens(code: string): Promise<AuthenticationResult> {
    const tokenRequest = {
      code: code,
      scopes: SCOPES,
      redirectUri: process.env.MICROSOFT_REDIRECT_URI!,
    };

    return await this.msalInstance.acquireTokenByCode(tokenRequest);
  }

  /**
   * Create authenticated Graph client
   */
  createClient(accessToken: string): Client {
    return Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      }
    });
  }

  /**
   * List user's calendar events
   */
  async listEvents(accessToken: string, startDate?: Date, endDate?: Date) {
    const client = this.createClient(accessToken);
    
    let query = client
      .api('/me/events')
      .select('subject,start,end,location,attendees')
      .orderby('start/dateTime')
      .top(50);
    
    if (startDate && endDate) {
      query = query.filter(
        `start/dateTime ge '${startDate.toISOString()}' and end/dateTime le '${endDate.toISOString()}'`
      );
    }
    
    return await query.get();
  }

  /**
   * Create a new calendar event
   */
  async createEvent(accessToken: string, event: any) {
    const client = this.createClient(accessToken);
    
    return await client
      .api('/me/events')
      .post(event);
  }

  /**
   * Update an existing calendar event
   */
  async updateEvent(accessToken: string, eventId: string, updates: any) {
    const client = this.createClient(accessToken);
    
    return await client
      .api(`/me/events/${eventId}`)
      .patch(updates);
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(accessToken: string, eventId: string) {
    const client = this.createClient(accessToken);
    
    return await client
      .api(`/me/events/${eventId}`)
      .delete();
  }

  /**
   * Get calendar list
   */
  async listCalendars(accessToken: string) {
    const client = this.createClient(accessToken);
    
    return await client
      .api('/me/calendars')
      .select('name,color,isDefaultCalendar')
      .get();
  }
} 