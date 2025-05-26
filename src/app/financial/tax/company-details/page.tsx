'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { SidebarLayout } from '../../../components/sidebar-layout';
import { SidebarContent } from '../../../components/sidebar-content';
import { Button } from '../../../components/button';
import { Input } from '../../../components/input';
import { Select } from '../../../components/select';
import { supabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth-helpers';
import { 
  validateCompanyNumber, 
  validateUTR, 
  formatUTR,
  validateVATNumber,
  formatVATNumber,
  validateCompanyTaxForm
} from '@/utils/validation';

// Tax wizard progress steps
const steps = [
  { id: "01", name: "Company Details", href: "/financial/tax/company-details", status: "current" },
  { id: "02", name: "Properties", href: "/financial/tax/properties", status: "upcoming" },
  { id: "03", name: "Transactions", href: "/financial/tax/transactions", status: "upcoming" },
  { id: "04", name: "Adjustments", href: "/financial/tax/adjustments", status: "upcoming" },
  { id: "05", name: "Summary", href: "/financial/tax/summary", status: "upcoming" },
  { id: "06", name: "Filing", href: "/financial/tax/filing", status: "upcoming" },
];

interface Director {
  id: string;
  name: string;
  email: string;
  phone: string;
  appointmentDate: string;
}

export default function CompanyDetails() {
  const router = useRouter();
  const pathname = usePathname();
  
  // Company details state
  const [companyName, setCompanyName] = useState('');
  const [companyNumber, setCompanyNumber] = useState('');
  const [utr, setUtr] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [isVatRegistered, setIsVatRegistered] = useState(false);
  const [accountingPeriodStart, setAccountingPeriodStart] = useState('');
  const [accountingPeriodEnd, setAccountingPeriodEnd] = useState('');
  const [registeredOffice, setRegisteredOffice] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [directors, setDirectors] = useState<Director[]>([
    { id: '1', name: '', email: '', phone: '', appointmentDate: '' }
  ]);
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Load user profile and existing company data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const user = await getAuthUser();
        if (!user) {
          router.push('/login');
          return;
        }
        
        setUserId(user.id);
        
        // Fetch existing company profile data
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching profile:', profileError);
        }
        
        if (profileData) {
          // Pre-fill form with existing company data
          setCompanyName(profileData.company_name || '');
          setCompanyNumber(profileData.company_registration_number || '');
          setUtr(profileData.utr || '');
          setVatNumber(profileData.vat_number || '');
          setIsVatRegistered(!!profileData.vat_number);
          setRegisteredOffice(profileData.company_address_line1 || '');
          setBusinessType(profileData.business_type || '');
          setAccountingPeriodStart(profileData.accounting_period?.split('|')[0] || '');
          setAccountingPeriodEnd(profileData.accounting_period?.split('|')[1] || '');
          
          // Parse directors from stored JSON
          if (profileData.directors) {
            try {
              const parsedDirectors = typeof profileData.directors === 'string' 
                ? JSON.parse(profileData.directors) 
                : profileData.directors;
              
              if (Array.isArray(parsedDirectors) && parsedDirectors.length > 0) {
                setDirectors(parsedDirectors.map((d: any, index: number) => ({
                  id: d.id || (index + 1).toString(),
                  name: d.name || '',
                  email: d.email || '',
                  phone: d.phone || '',
                  appointmentDate: d.appointmentDate || ''
                })));
              }
            } catch (e) {
              console.error('Error parsing directors:', e);
            }
          }
        }
        
        setProfileLoaded(true);
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile data');
        setProfileLoaded(true);
      }
    };
    
    loadProfile();
  }, [router]);

  // Add director
  const addDirector = () => {
    const newDirector: Director = {
      id: (directors.length + 1).toString(),
      name: '',
      email: '',
      phone: '',
      appointmentDate: ''
    };
    setDirectors([...directors, newDirector]);
  };

  // Remove director
  const removeDirector = (id: string) => {
    if (directors.length > 1) {
      setDirectors(directors.filter(d => d.id !== id));
    }
  };

  // Update director
  const updateDirector = (id: string, field: keyof Director, value: string) => {
    setDirectors(directors.map(d => 
      d.id === id ? { ...d, [field]: value } : d
    ));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    const formData = {
      companyName,
      companyNumber,
      utr,
      vatNumber: isVatRegistered ? vatNumber : '',
      accountingPeriodStart,
      accountingPeriodEnd
    };
    
    const validation = validateCompanyTaxForm(formData);
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setError('Please fix the validation errors below');
      return;
    }
    
    // Validate directors
    const hasEmptyDirector = directors.some(d => !d.name.trim());
    if (hasEmptyDirector) {
      setError('Please provide a name for each director');
      return;
    }
    
    if (!userId) {
      setError('User authentication error. Please try again.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setValidationErrors({});
    
    try {
      // Save company profile data
      const { error: upsertError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          company_name: companyName,
          company_registration_number: companyNumber,
          utr: formatUTR(utr),
          vat_number: isVatRegistered ? formatVATNumber(vatNumber) : null,
          business_type: businessType,
          company_address_line1: registeredOffice,
          accounting_period: `${accountingPeriodStart}|${accountingPeriodEnd}`,
          directors: JSON.stringify(directors),
          is_company: true,
          updated_at: new Date().toISOString()
        });
        
      if (upsertError) {
        throw new Error(`Failed to save company details: ${upsertError.message}`);
      }
      
      // Navigate to next step
      router.push('/financial/tax/properties');
    } catch (err) {
      console.error('Error saving company details:', err);
      setError(err instanceof Error ? err.message : 'Failed to save company details');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle save as draft
  const handleSaveAsDraft = async () => {
    if (!userId) return;
    
    try {
      await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          company_name: companyName,
          company_registration_number: companyNumber,
          utr: utr,
          vat_number: isVatRegistered ? vatNumber : null,
          business_type: businessType,
          company_address_line1: registeredOffice,
          accounting_period: accountingPeriodStart && accountingPeriodEnd ? `${accountingPeriodStart}|${accountingPeriodEnd}` : null,
          directors: directors.some(d => d.name) ? JSON.stringify(directors) : null,
          is_company: true,
          updated_at: new Date().toISOString()
        });
        
      router.push('/dashboard');
    } catch (err) {
      console.error('Error saving draft:', err);
      setError('Failed to save draft');
    }
  };

  // Show loading state if profile is not loaded yet
  if (!profileLoaded) {
    return (
      <SidebarLayout 
        isOnboarding={false}
        searchValue=""
      >
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Loading company data...</p>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout 
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
              Company Details
            </h2>
            <p className="mt-1 text-sm/6 text-gray-600">
              Please provide your company information for corporation tax filing purposes.
            </p>
          </div>

          <div className="bg-white border border-gray-300 ring-1 shadow-xs ring-gray-900/5 sm:rounded-xl md:col-span-2">
            {/* Display error message if any */}
            {error && (
              <div className="px-4 py-3 bg-red-50 border-l-4 border-red-400 text-red-700 mb-4">
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="px-4 py-6 sm:p-8">
                <div className="space-y-8">
                  {/* Company Information */}
                  <div className="border-b border-gray-900/10 pb-6">
                    <h3 className="text-base/7 font-semibold text-gray-900">Company Information</h3>
                    <p className="mt-1 text-sm/6 text-gray-600">Basic company details for tax registration.</p>
                    
                    <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                      <div className="sm:col-span-3">
                        <label htmlFor="company-name" className="block text-sm font-medium text-gray-700">
                          Company Name *
                        </label>
                        <div className="mt-1">
                                                      <Input
                              id="company-name"
                              required
                              value={companyName}
                              onChange={(e) => setCompanyName(e.target.value)}
                              className="block w-full"
                            />
                        </div>
                        {validationErrors.companyName && (
                          <p className="mt-1 text-xs text-red-600">{validationErrors.companyName}</p>
                        )}
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor="company-number" className="block text-sm font-medium text-gray-700">
                          Company Registration Number *
                        </label>
                        <div className="mt-1">
                                                      <Input
                              id="company-number"
                              required
                              value={companyNumber}
                              onChange={(e) => setCompanyNumber(e.target.value)}
                              className="block w-full"
                              placeholder="12345678"
                            />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">8-digit Companies House number</p>
                        {validationErrors.companyNumber && (
                          <p className="mt-1 text-xs text-red-600">{validationErrors.companyNumber}</p>
                        )}
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor="utr" className="block text-sm font-medium text-gray-700">
                          Corporation Tax UTR *
                        </label>
                        <div className="mt-1">
                                                      <Input
                              id="utr"
                              required
                              value={utr}
                              onChange={(e) => setUtr(e.target.value)}
                              className="block w-full"
                              placeholder="1234567890"
                            />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">10-digit Unique Taxpayer Reference</p>
                        {validationErrors.utr && (
                          <p className="mt-1 text-xs text-red-600">{validationErrors.utr}</p>
                        )}
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor="business-type" className="block text-sm font-medium text-gray-700">
                          Business Type
                        </label>
                        <div className="mt-1">
                          <select
                            id="business-type"
                            value={businessType}
                            onChange={(e) => setBusinessType(e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          >
                            <option value="">Select business type</option>
                            <option value="property_investment">Property Investment</option>
                            <option value="property_development">Property Development</option>
                            <option value="property_management">Property Management</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div className="sm:col-span-full">
                        <label htmlFor="registered-address" className="block text-sm font-medium text-gray-700">
                          Registered Office Address
                        </label>
                        <div className="mt-1">
                          <Input
                            id="registered-address"
                            value={registeredOffice}
                            onChange={(e) => setRegisteredOffice(e.target.value)}
                            className="block w-full"
                            placeholder="Full registered office address"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* VAT Registration */}
                  <div className="border-b border-gray-900/10 pb-6">
                    <h3 className="text-base/7 font-semibold text-gray-900">VAT Registration</h3>
                    <p className="mt-1 text-sm/6 text-gray-600">VAT registration details if applicable.</p>
                    
                    <div className="mt-6 space-y-4">
                      <div className="flex items-center">
                        <input
                          id="vat-registered"
                          type="checkbox"
                          checked={isVatRegistered}
                          onChange={(e) => setIsVatRegistered(e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="vat-registered" className="ml-2 block text-sm text-gray-900">
                          Company is VAT registered
                        </label>
                      </div>
                      
                      {isVatRegistered && (
                        <div className="sm:col-span-3">
                          <label htmlFor="vat-number" className="block text-sm font-medium text-gray-700">
                            VAT Registration Number *
                          </label>
                          <div className="mt-1">
                                                           <Input
                                 id="vat-number"
                                 required={isVatRegistered}
                                 value={vatNumber}
                                 onChange={(e) => setVatNumber(e.target.value)}
                                 className="block w-full"
                                 placeholder="GB123456789"
                               />
                          </div>
                          <p className="mt-1 text-xs text-gray-500">Format: GB followed by 9 digits</p>
                          {validationErrors.vatNumber && (
                            <p className="mt-1 text-xs text-red-600">{validationErrors.vatNumber}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Accounting Period */}
                  <div className="border-b border-gray-900/10 pb-6">
                    <h3 className="text-base/7 font-semibold text-gray-900">Accounting Period</h3>
                    <p className="mt-1 text-sm/6 text-gray-600">Company accounting period for this tax return.</p>
                    
                    <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                      <div>
                        <label htmlFor="accounting-period-start" className="block text-sm font-medium text-gray-700">
                          Accounting Period Start *
                        </label>
                        <div className="mt-1">
                          <Input
                            id="accounting-period-start"
                            type="date"
                            required
                            value={accountingPeriodStart}
                            onChange={(e) => setAccountingPeriodStart(e.target.value)}
                            className="block w-full"
                          />
                        </div>
                        {validationErrors.accountingPeriodStart && (
                          <p className="mt-1 text-xs text-red-600">{validationErrors.accountingPeriodStart}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="accounting-period-end" className="block text-sm font-medium text-gray-700">
                          Accounting Period End *
                        </label>
                        <div className="mt-1">
                          <Input
                            id="accounting-period-end"
                            type="date"
                            required
                            value={accountingPeriodEnd}
                            onChange={(e) => setAccountingPeriodEnd(e.target.value)}
                            className="block w-full"
                          />
                        </div>
                        {validationErrors.accountingPeriodEnd && (
                          <p className="mt-1 text-xs text-red-600">{validationErrors.accountingPeriodEnd}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Directors */}
                  <div>
                    <h3 className="text-base/7 font-semibold text-gray-900">Company Directors</h3>
                    <p className="mt-1 text-sm/6 text-gray-600">Details of company directors.</p>
                    
                    <div className="mt-6 space-y-6">
                      {directors.map((director, index) => (
                        <div key={director.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-medium text-gray-900">Director {index + 1}</h4>
                            {directors.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeDirector(director.id)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Full Name *
                              </label>
                              <div className="mt-1">
                                <Input
                                  required
                                  value={director.name}
                                  onChange={(e) => updateDirector(director.id, 'name', e.target.value)}
                                  className="block w-full"
                                  placeholder="Director's full name"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Email Address
                              </label>
                              <div className="mt-1">
                                <Input
                                  type="email"
                                  value={director.email}
                                  onChange={(e) => updateDirector(director.id, 'email', e.target.value)}
                                  className="block w-full"
                                  placeholder="director@company.com"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Phone Number
                              </label>
                              <div className="mt-1">
                                <Input
                                  type="tel"
                                  value={director.phone}
                                  onChange={(e) => updateDirector(director.id, 'phone', e.target.value)}
                                  className="block w-full"
                                  placeholder="+44 20 1234 5678"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Appointment Date
                              </label>
                              <div className="mt-1">
                                <Input
                                  type="date"
                                  value={director.appointmentDate}
                                  onChange={(e) => updateDirector(director.id, 'appointmentDate', e.target.value)}
                                  className="block w-full"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      <button
                        type="button"
                        onClick={addDirector}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Add Another Director
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8">
                <button type="button"
                  onClick={() => router.push("/financial/tax/company-or-personal")}
                  className="text-sm/6 font-semibold text-gray-900"
                  disabled={isSubmitting}
                >
                  Back
                </button>
                <button type="button"
                  onClick={handleSaveAsDraft}
                  className="text-sm/6 font-semibold text-gray-900"
                  disabled={isSubmitting}
                >
                  Save as Draft
                </button>
                <button type="submit"
                  className="rounded-md bg-d9e8ff px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs hover:bg-d9e8ff-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-d9e8ff disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Processing..." : "Continue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
} 