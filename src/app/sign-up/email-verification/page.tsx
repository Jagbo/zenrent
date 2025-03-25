"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EmailVerification() {
  const router = useRouter();
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Handle verification code input
  const handleCodeChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newCode = [...verificationCode];
      newCode[index] = value;
      setVerificationCode(newCode);
      
      // Auto-focus next input if value is entered
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  // Handle keydown for backspace to go to previous input
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = verificationCode.join('');
    if (code.length === 6) {
      // Here you would verify the code with your API
      // For now, we'll just simulate success
      alert('Email verified successfully!');
      // Redirect to account creation page
      router.push('/sign-up/account-creation');
    } else {
      alert('Please enter the complete 6-digit verification code');
    }
  };

  // Handle resend code
  const handleResendCode = () => {
    if (canResend) {
      // Reset the countdown
      setTimeLeft(60);
      setCanResend(false);
      
      // Here you would trigger the API to resend the code
      alert('Verification code resent!');
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
    <>
      {/*
        This example requires updating your template:

        ```
        <html class="h-full bg-gray-50">
        <body class="h-full">
        ```
      */}
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
            <div className="text-center mb-6">
              <p className="text-sm/6 text-gray-600">We've sent a verification code to</p>
              <p className="text-base/6 font-medium text-gray-900 mt-1">j********@example.com</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="verification-code" className="block text-sm/6 font-medium text-gray-900">
                  Verification code
                </label>
                <div className="mt-2 flex justify-center gap-2">
                  {/* 6-digit verification code inputs */}
                  {verificationCode.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        inputRefs.current[i] = el;
                      }}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      className="w-12 h-12 text-center text-lg font-medium border border-gray-300 rounded-md bg-white px-3 py-1.5 text-gray-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                    />
                  ))}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Verify
                </button>
              </div>
            </form>

            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm/6">
                <a href="/sign-up" className="font-semibold text-indigo-600 hover:text-indigo-500">
                  Change email
                </a>
              </div>
              <div className="text-sm/6">
                <button 
                  onClick={handleResendCode}
                  disabled={!canResend}
                  className={`font-semibold ${canResend ? 'text-indigo-600 hover:text-indigo-500' : 'text-gray-400'}`}
                >
                  Resend code {!canResend && <span className="text-gray-500">({timeLeft}s)</span>}
                </button>
              </div>
            </div>

            <div className="mt-8 border-t border-gray-200 pt-6">
              <p className="text-sm text-gray-500 text-center">
                Need help? <a href="#" className="font-semibold text-indigo-600 hover:text-indigo-500">Contact support</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 