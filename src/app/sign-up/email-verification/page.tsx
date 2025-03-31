"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function EmailVerification() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Skip verification in development mode
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Skipping email verification');
      router.push('/sign-up/account-creation');
    }
  }, [router]);

  // Get email from URL query parameter or localStorage
  useEffect(() => {
    const urlEmail = searchParams.get('email');
    const storedEmail = localStorage.getItem('signupEmail');
    
    if (urlEmail) {
      setEmail(urlEmail);
      localStorage.setItem('signupEmail', urlEmail);
    } else if (storedEmail) {
      setEmail(storedEmail);
    } else {
      // Redirect to sign-up if no email is found
      router.push('/sign-up');
    }
  }, [searchParams, router]);

  // Mask email for display
  const maskedEmail = email ? email.replace(/(.{2})(.*)(@.*)/, '$1****$3') : '';

  // Handle form submission (manual verification not needed with Supabase)
  const handleManualVerification = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Redirect to account creation
      router.push('/sign-up/account-creation');
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.message || 'Failed to verify. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle resend code
  const handleResendCode = async () => {
    if (!canResend || !email) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Reset the countdown
      setTimeLeft(60);
      setCanResend(false);
      
      // Resend verification email - use OTP since we're in verification process
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/sign-up/account-creation`
        }
      });
      
      if (error) {
        throw error;
      }
      
      // Show success message
      alert('Verification email resent! Please check your inbox.');
    } catch (err: any) {
      console.error('Resend error:', err);
      setError(err.message || 'Failed to resend verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Countdown timer effect
  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timerId);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img
          alt="ZenRent"
          src="/images/logo/ZenRent-square-logo.png"
          className="mx-auto h-10 w-auto"
        />
        <h2 className="mt-6 text-center text-2xl/9 title-font text-gray-900">
          Verify your email
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-white px-6 py-12 shadow-sm sm:rounded-lg sm:px-12 border border-gray-200">
          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-700 border-l-4 border-red-400 rounded">
              {error}
            </div>
          )}

          <div className="text-center mb-6">
            <p className="text-sm/6 text-gray-600">We've sent a verification email to</p>
            <p className="text-base/6 font-medium text-gray-900 mt-1">{maskedEmail}</p>
          </div>

          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm/6 text-gray-600">
                Please check your inbox and click the verification link in the email we sent you.
              </p>
            </div>

            <div>
              <button
                type="button"
                onClick={handleManualVerification}
                disabled={loading}
                className="flex w-full justify-center rounded-md bg-[#D9E8FF] px-3 py-1.5 text-sm/6 font-semibold text-gray-900 shadow-xs hover:bg-[#D9E8FF]/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9E8FF] disabled:opacity-70"
              >
                {loading ? 'Processing...' : "I've verified my email"}
              </button>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm/6">
              <a href="/sign-up" className="font-semibold text-[#330015] hover:text-[#330015]/80">
                Change email
              </a>
            </div>
            <div className="text-sm/6">
              <button 
                onClick={handleResendCode}
                disabled={!canResend || loading}
                className={`font-semibold ${canResend && !loading ? 'text-[#330015] hover:text-[#330015]/80' : 'text-gray-400'}`}
              >
                Resend email {!canResend && <span className="text-gray-500">({timeLeft}s)</span>}
              </button>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-6">
            <p className="text-sm text-gray-500 text-center">
              Need help? <a href="#" className="font-semibold text-[#330015] hover:text-[#330015]/80">Contact support</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 