"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { SidebarLayout } from "../../../components/sidebar-layout";
import { SidebarContent } from "../../../components/sidebar-content";
import { Navbar, NavbarSection, NavbarItem, NavbarLabel } from "../../../components/navbar";
import { Button } from "../../../components/button";
import { usePathname } from "next/navigation";

export default function WelcomeScreen() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <SidebarLayout 
      sidebar={<SidebarContent currentPath={pathname} />} 
      isOnboarding={false}
      searchValue=""
    >
      <div className="max-w-4xl mx-auto py-2 space-y-8">
        <div className="space-y-4 text-center">
          <h1 className="text-3xl font-cabinet-grotesk font-bold text-gray-900">
            ZenRent Tax Assistant
          </h1>
          <p className="text-m text-gray-600 max-w-3xl mx-auto">
            Prepare your landlord tax return to submit to HMRC. Gather your income and expenses, apply any available tax relief and generate your self assessment or company forms.
          </p>
        </div>

        <div className="bg-white border border-gray-300 ring-1 shadow-xs ring-gray-900/5 sm:rounded-xl p-6">
          <h2 className="text-xl font-cabinet-grotesk font-bold text-gray-900 mb-4">
            
          </h2>
          <ul className="space-y-4">
            <li className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-[#D9E8FF] rounded-full flex items-center justify-center">
                <span className="text-xl font-bold">📈</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Automatic import of bank transactions
                </h3>
                <p className="text-gray-600">
                  No tedious data entry - we'll connect to your bank account securely
                  to import your rental income and expenses.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-[#D9E8FF] rounded-full flex items-center justify-center">
                <span className="text-xl font-bold">🤖</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Smart expense categorization with AI
                </h3>
                <p className="text-gray-600">
                  Our AI will automatically categorize your expenses for tax purposes,
                  saving you time and reducing errors.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-[#D9E8FF] rounded-full flex items-center justify-center">
                <span className="text-xl font-bold">✅</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Built-in checks to maximize allowable deductions
                </h3>
                <p className="text-gray-600">
                  We'll help you claim all eligible tax reliefs and deductions,
                  ensuring you don't pay more tax than necessary.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-[#D9E8FF] rounded-full flex items-center justify-center">
                <span className="text-xl font-bold">💼</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Ready-to-file tax forms generated at the end
                </h3>
                <p className="text-gray-600">
                  We'll generate your completed SA100 and SA105 forms ready for
                  submission to HMRC.
                </p>
              </div>
            </li>
          </ul>
        </div>

        <div className="flex justify-center gap-4 pt-4">
          <button 
            className="rounded-lg bg-[#D9E8FF] text-gray-900 hover:bg-[#c8d7ee] px-4 py-2 font-semibold"
            onClick={() => router.push("/financial/tax/company-or-personal")}
          >
            Get Started
          </button>
          {/* Optional link for returning users */}
          <Button outline onClick={() => router.push("/financial/tax/summary")}>
            Continue where I left off
          </Button>
        </div>
      </div>
    </SidebarLayout>
  );
} 