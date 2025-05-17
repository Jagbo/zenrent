'use client'

import { useState } from 'react'
import { Radio, RadioGroup } from '@headlessui/react'
import { CheckCircleIcon } from '@heroicons/react/20/solid'
import { useRouter } from 'next/navigation'
import { SidebarLayout } from '../../../components/sidebar-layout'
import { SidebarContent } from '../../../components/sidebar-content'

const taxTypes = [
  { 
    id: 'personal', 
    title: 'Personal Tax Return', 
    description: 'For individuals who own rental properties in their own name', 
    details: 'Self Assessment Tax Return'
  },
  { 
    id: 'company', 
    title: 'Company Tax Return', 
    description: 'For properties owned through a limited company', 
    details: 'Corporation Tax Return' 
  },
]

// Tax wizard progress steps
const steps = [
  { id: "01", name: "Details", href: "/financial/tax/personal-details", status: "upcoming" },
  { id: "02", name: "Properties", href: "/financial/tax/properties", status: "upcoming" },
  { id: "03", name: "Transactions", href: "/financial/tax/transactions", status: "upcoming" },
  { id: "04", name: "Adjustments", href: "/financial/tax/adjustments", status: "upcoming" },
  { id: "05", name: "Summary", href: "/financial/tax/summary", status: "upcoming" },
  { id: "06", name: "Filing", href: "/financial/tax/filing", status: "upcoming" },
];

export default function CompanyOrPersonal() {
  const router = useRouter()
  const [selectedTaxType, setSelectedTaxType] = useState(taxTypes[0])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleContinue = () => {
    setIsSubmitting(true)
    
    // Navigate based on selection
    if (selectedTaxType.id === 'company') {
      router.push('/financial/tax/company-details')
    } else {
      router.push('/financial/tax/personal-details')
    }
  }

  return (
    <SidebarLayout 
      sidebar={<SidebarContent currentPath="/financial/tax/company-or-personal" />} 
      isOnboarding={false}
      searchValue=""
    >
      <div className="space-y-8">
        {/* Progress Bar */}
        <div className="py-0">
          <nav aria-label="Progress">
            <ol role="list"
              className="divide-y divide-gray-300 rounded-md border border-gray-300 md:flex md:divide-y-0 bg-white"
            >
              {steps.map((step, stepIdx) => (
                <li key={step.name} className="relative md:flex md:flex-1">
                  {step.status === "complete" ? (
                    <a href={step.href}
                      className="group flex w-full items-center"
                    >
                      <span className="flex items-center px-6 py-4 text-sm font-medium">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#D9E8FF] group-hover:bg-[#D9E8FF]/80">
                          <svg className="h-6 w-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                        <span className="ml-4 text-sm font-cabinet-grotesk font-bold text-gray-900">
                          {step.name}
                        </span>
                      </span>
                    </a>
                  ) : step.status === "current" ? (
                    <a href={step.href}
                      aria-current="step"
                      className="flex items-center px-6 py-4 text-sm font-medium"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-[#D9E8FF]">
                        <span className="text-gray-900">{step.id}</span>
                      </span>
                      <span className="ml-4 text-sm font-cabinet-grotesk font-bold text-gray-900">
                        {step.name}
                      </span>
                    </a>
                  ) : (
                    <a href={step.href} className="group flex items-center">
                      <span className="flex items-center px-6 py-4 text-sm font-medium">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-gray-300 group-hover:border-gray-400">
                          <span className="text-gray-500 group-hover:text-gray-900">
                            {step.id}
                          </span>
                        </span>
                        <span className="ml-4 text-sm font-cabinet-grotesk font-bold text-gray-500 group-hover:text-gray-900">
                          {step.name}
                        </span>
                      </span>
                    </a>
                  )}

                  {stepIdx !== steps.length - 1 ? (
                    <>
                      {/* Arrow separator for lg screens and up */}
                      <div aria-hidden="true"
                        className="absolute top-0 right-0 hidden h-full w-5 md:block"
                      >
                        <svg fill="none"
                          viewBox="0 0 22 80"
                          preserveAspectRatio="none"
                          className="size-full text-gray-300"
                        >
                          <path d="M0 -2L20 40L0 82"
                            stroke="currentcolor"
                            vectorEffect="non-scaling-stroke"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </>
                  ) : null}
                </li>
              ))}
            </ol>
          </nav>
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3">
          <div className="px-4 sm:px-0">
            <h2 className="text-base/7 font-cabinet-grotesk font-bold text-gray-900">
              Select Tax Return Type
            </h2>
            <p className="mt-1 text-sm/6 text-gray-600">
              Choose whether you own property as an individual (Personal Tax) or through a limited company (Company Tax).
            </p>
          </div>

          <div className="bg-white border border-gray-300 ring-1 shadow-xs ring-gray-900/5 sm:rounded-xl md:col-span-2">
            <div className="px-4 py-6 sm:p-8">
              <div className="space-y-8">
                <fieldset>
                  <legend className="text-sm/6 font-semibold text-gray-900">Choose how you own your property</legend>
                  <RadioGroup
                    value={selectedTaxType}
                    onChange={setSelectedTaxType}
                    className="mt-6 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4"
                  >
                    {taxTypes.map((taxType) => (
                      <Radio
                        key={taxType.id}
                        value={taxType}
                        aria-label={taxType.title}
                        aria-description={taxType.description}
                        className="group relative flex cursor-pointer rounded-lg border border-gray-300 bg-white p-4 shadow-xs focus:outline-hidden data-focus:border-[#D9E8FF] data-focus:ring-2 data-focus:ring-[#D9E8FF]"
                      >
                        <span className="flex flex-1">
                          <span className="flex flex-col">
                            <span className="block text-sm font-medium text-gray-900">{taxType.title}</span>
                            <span className="mt-1 flex items-center text-sm text-gray-500">{taxType.description}</span>
                            <span className="mt-6 text-sm font-medium text-gray-900">{taxType.details}</span>
                          </span>
                        </span>
                        <CheckCircleIcon aria-hidden="true" className="size-5 text-[#D9E8FF] group-not-data-checked:invisible" />
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute -inset-px rounded-lg border-2 border-transparent group-data-checked:border-[#D9E8FF] group-data-focus:border"
                        />
                      </Radio>
                    ))}
                  </RadioGroup>
                </fieldset>
              </div>
            </div>

            <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8">
              <button type="button"
                onClick={() => router.push("/financial/tax/welcome")}
                className="text-sm/6 font-semibold text-gray-900"
              >
                Back
              </button>
              <button type="button"
                onClick={handleContinue}
                className="rounded-md bg-d9e8ff px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs hover:bg-d9e8ff-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-d9e8ff disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processing..." : "Continue"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  )
} 