import { Resend } from 'resend';
import { supabase } from './supabase';

// Initialize Resend with API key from environment variables
const resendApiKey = process.env.NEXT_PUBLIC_RESEND_API_KEY || process.env.RESEND_API_KEY || 'test-api-key';
const resend = new Resend(resendApiKey);

/**
 * Send a password reset email via Resend
 */
export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  try {
    // In development mode, just log and return success
    if (process.env.NODE_ENV === 'development') {
      console.log(`Development mode: Would send password reset email to ${email}`);
      console.log(`Reset URL: ${resetUrl}`);
      return { success: true };
    }

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'ZenRent <noreply@zenrent.app>',
      to: email,
      subject: 'Reset your ZenRent password',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <img src="https://yourdomain.com/images/logo/zenrent-square-logo.png" alt="ZenRent" style="max-width: 120px; margin: 20px 0;" />
          <h1 style="color: #333;">Reset your password</h1>
          <p style="margin: 20px 0; font-size: 16px; color: #555;">
            We received a request to reset your password. Click the button below to create a new password.
          </p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #D9E8FF; color: #333; font-weight: bold; padding: 12px 24px; border-radius: 4px; text-decoration: none; margin: 20px 0;">
            Reset Password
          </a>
          <p style="margin: 20px 0; font-size: 14px; color: #888;">
            If you didn't request a password reset, you can safely ignore this email.
          </p>
          <p style="margin: 20px 0; font-size: 14px; color: #888;">
            This link will expire in 24 hours.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend API error:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error };
  }
}

/**
 * Use Supabase Auth to send the password reset email
 * This is an alternative to using Resend directly
 */
export async function sendSupabasePasswordResetEmail(email: string, redirectUrl: string) {
  try {
    // In development mode, just log and return success
    if (process.env.NODE_ENV === 'development') {
      console.log(`Development mode: Would send password reset email via Supabase to ${email}`);
      console.log(`Redirect URL: ${redirectUrl}`);
      return { success: true };
    }

    // Use Supabase Auth to send the password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      console.error('Supabase reset password error:', error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error };
  }
} 