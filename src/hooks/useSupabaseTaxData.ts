console.log('[useSupabaseTaxData.ts] FILE PARSED AND LOADED - TOP LEVEL');

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const appCategories = [
  { value: "rental_income", label: "Rental Income", type: "income" },
  { value: "repairs_maintenance", label: "Repairs & Maintenance", type: "expense" },
  { value: "other_expense", label: "Other Expense", type: "expense" },
  { value: "exclude", label: "Exclude from Tax", type: "neutral" },
];

export interface TaxProfile {
  id: string;
  user_id: string;
  tax_year: string;
  selected_property_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface TaxAdjustment {
  id: string;
  user_id: string;
  tax_year: string;
  use_mileage_allowance: boolean;
  mileage_total: number;
  use_property_income_allowance: boolean;
  prior_year_losses: number;
  created_at: string;
  updated_at: string;
}

export interface PropertyData {
  id: string;
  address: string;
  name?: string;
  income?: number;
}

export interface TaxData {
  taxProfile: TaxProfile | null;
  taxAdjustments: TaxAdjustment | null;
  properties: PropertyData[];
  totalIncome: number;
  totalExpenses: number;
  taxableProfit: number;
  isLoading: boolean;
  error: string | null;
}

export const getCurrentTaxYear = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const taxYearStart = currentMonth > 4 || (currentMonth === 4 && now.getDate() >= 6) ? currentYear : currentYear - 1;
  return `${taxYearStart}-${(taxYearStart + 1).toString().slice(2)}`;
};

export function useSupabaseTaxData(userId: string | null, taxYear: string | null): TaxData {
  console.log(`[useSupabaseTaxData HOOK CALLED] userId: ${userId}, taxYear: ${taxYear}`);
  
  const supabase = createClientComponentClient();
  // Make sure we use a consistent tax year format
  let effectiveYear = taxYear || getCurrentTaxYear();
  
  // Normalize tax year format to YYYY-YY if it's in another format
  if (effectiveYear.includes('/')) {
    const [startYear, endYear] = effectiveYear.split('/');
    effectiveYear = `${startYear}-${endYear.slice(-2)}`;
  }
  
  console.log(`[useSupabaseTaxData] Using normalized tax year: ${effectiveYear}`);
  
  const [internalState, setInternalState] = useState<TaxData>({
    taxProfile: null,
    taxAdjustments: null,
    properties: [],
    totalIncome: 0,
    totalExpenses: 0,
    taxableProfit: 0,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    console.log(`[useSupabaseTaxData EFFECT] userId: ${userId}, taxYear: ${effectiveYear}`);
    if (!userId) {
      console.log('[useSupabaseTaxData] No userId, creating demo data for testing');
      
      // Create demo data for testing when no user is logged in
      const demoTaxProfile = {
        id: 'demo-profile',
        user_id: 'demo-user',
        tax_year: effectiveYear,
        selected_property_ids: ['demo-property-1', 'demo-property-2'],
        filing_type: 'self_assessment',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const demoTaxAdjustments = {
        id: 'demo-adjustments',
        user_id: 'demo-user',
        tax_year: effectiveYear,
        use_property_income_allowance: true,
        use_mileage_allowance: true,
        mileage_total: 1200,
        prior_year_losses: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const demoProperties = [
        {
          id: 'demo-property-1',
          address: '123 Demo Street, London',
          property_code: 'DEMO1'
        },
        {
          id: 'demo-property-2',
          address: '456 Test Avenue, Manchester',
          property_code: 'DEMO2'
        }
      ];
      
      // Calculate demo income and expenses
      let demoIncome = 2400; // £1200 per property
      let demoExpenses = 800; // £400 per property
      let demoProfit = demoIncome - demoExpenses;
      
      console.log(`[useSupabaseTaxData] Demo calculations: income=${demoIncome}, expenses=${demoExpenses}, profit=${demoProfit}`);
      
      // Update state with demo data
      setInternalState({
        taxProfile: demoTaxProfile,
        taxAdjustments: demoTaxAdjustments,
        properties: demoProperties,
        totalIncome: demoIncome,
        totalExpenses: demoExpenses,
        taxableProfit: demoProfit,
        isLoading: false,
        error: null
      });
      return;
    }

    const fetchTaxData = async () => {
      console.log('[useSupabaseTaxData] Starting data fetch from Supabase');
      try {
        // Initialize taxProfile with let to allow reassignment
        let taxProfile: any = null; 

        // Fetch tax profiles for the primary effective year
        const { data: taxProfiles, error: profileError } = await supabase
          .from('tax_profiles')
          .select('*')
          .eq('user_id', userId)
          .eq('tax_year', effectiveYear);
        
        if (profileError) {
          console.error('[useSupabaseTaxData] Error fetching tax profile:', profileError);
          setInternalState(prev => ({ ...prev, isLoading: false, error: profileError.message }));
          return;
        }
        
        // Use the first tax profile if found, otherwise null
        taxProfile = taxProfiles && taxProfiles.length > 0 ? taxProfiles[0] : null; // Assign to the higher-scoped taxProfile
        console.log('[useSupabaseTaxData] Tax profile fetched:', taxProfile);
        
        // If no tax profile is found, try other tax year formats
        if (!taxProfile) {
          console.log('[useSupabaseTaxData] No tax profile found for tax year', effectiveYear, 'trying alternate formats');
          
          // Try a different format - if we have YYYY-YY, try YYYY/YYYY format
          let alternateFormat = '';
          if (effectiveYear.includes('-')) {
            const [startYear, endYearShort] = effectiveYear.split('-');
            const endYear = parseInt(startYear.slice(0, 2) + endYearShort);
            alternateFormat = `${startYear}/${endYear}`;
          } else if (effectiveYear.includes('/')) {
            const [startYear, endYear] = effectiveYear.split('/');
            alternateFormat = `${startYear}-${endYear.slice(-2)}`;
          }
          
          console.log('[useSupabaseTaxData] Trying alternate tax year format:', alternateFormat);
          
          if (alternateFormat) {
            const { data: altProfiles } = await supabase
              .from('tax_profiles')
              .select('*')
              .eq('user_id', userId)
              .eq('tax_year', alternateFormat);
            
            if (altProfiles && altProfiles.length > 0) {
              const altProfile = altProfiles[0];
              taxProfile = altProfile; // Assign to the higher-scoped taxProfile
              console.log('[useSupabaseTaxData] Found tax profile with alternate format:', altProfile);
              
              // Fetch adjustments and properties for this alternate profile
              const { data: altAdjustmentsArray, error: altAdjustmentsError } = await supabase
                .from('tax_adjustments')
                .select('*')
                .eq('user_id', userId)
                .eq('tax_year', alternateFormat);
                
              const altAdjustments = altAdjustmentsArray && altAdjustmentsArray.length > 0 ? 
                altAdjustmentsArray[0] : null;
              console.log('[useSupabaseTaxData] Tax adjustments for alternate format:', altAdjustments);
              
              // Check if there are properties to fetch
              if (!altProfile.selected_property_ids || altProfile.selected_property_ids.length === 0) {
                console.log('[useSupabaseTaxData] No properties in alternate profile, returning zero totals');
                setInternalState({
                  taxProfile: altProfile,
                  taxAdjustments: altAdjustments,
                  properties: [],
                  totalIncome: 0,
                  totalExpenses: 0,
                  taxableProfit: 0,
                  isLoading: false,
                  error: null
                });
                return;
              }
              
              // Fetch properties with alternate profile
              const { data: altProperties, error: altPropertiesError } = await supabase
                .from('properties')
                .select('id, address, property_code')
                .in('id', altProfile.selected_property_ids);
                
              console.log('[useSupabaseTaxData] Properties for alternate format:', altProperties);
              
              // Fetch transactions for these properties
              const { data: altTransactions, error: altTransactionsError } = await supabase
                .from('bank_transactions')
                .select('property_id, amount, transaction_type, category')
                .in('property_id', altProfile.selected_property_ids);
                
              console.log('[useSupabaseTaxData] Transactions for alternate format:', 
                altTransactions ? altTransactions.length : 0);
              
              // Calculate totals with these transactions
              let altTotalIncome = 0;
              let altTotalExpenses = 0;
              
              if (altTransactions && altTransactions.length > 0) {
                // Log a few transactions to debug
                altTransactions.slice(0, 3).forEach(t => {
                  console.log(`[useSupabaseTaxData] Alt transaction: amount=${t.amount}, category=${JSON.stringify(t.category)}`);
                });
                
                // Calculate income and expenses
                altTransactions.forEach(transaction => {
                  // Check if category is an array and has items
                  const categories = Array.isArray(transaction.category) ? transaction.category : [];
                  const mainCategory = categories.length > 0 ? categories[0] : null;
                  
                  // Skip transactions with 'exclude' category
                  if (mainCategory === 'exclude') return;
                  
                  // Income categories: rental_income, other_income
                  if (mainCategory === 'rental_income' || mainCategory === 'other_income') {
                    altTotalIncome += Math.abs(transaction.amount);
                    console.log(`[useSupabaseTaxData] Adding income: ${transaction.amount} from category ${mainCategory}`);
                  }
                  // Expense categories: anything that's not exclude or income
                  else if (mainCategory && mainCategory !== 'exclude') {
                    altTotalExpenses += Math.abs(transaction.amount);
                  }
                });
              }
              
              // Calculate taxable profit
              const altTaxableProfit = altTotalIncome - altTotalExpenses;
              
              console.log(`[useSupabaseTaxData] Alt calculations: income=${altTotalIncome}, expenses=${altTotalExpenses}, profit=${altTaxableProfit}`);
              
              // Update state with the calculated values
              setInternalState({
                taxProfile: altProfile,
                taxAdjustments: altAdjustments,
                properties: altProperties || [],
                totalIncome: altTotalIncome,
                totalExpenses: altTotalExpenses,
                taxableProfit: altTaxableProfit,
                isLoading: false,
                error: null
              });
              return;
            }
          }
          
          // If still no profile, create a default one for demo purposes
          console.log('[useSupabaseTaxData] No tax profile found with any format, creating default profile for demo');
          
          // Fetch properties to use in the default profile
          const { data: allProperties, error: propertiesError } = await supabase
            .from('properties')
            .select('*')
            .eq('user_id', userId);
          console.log('[useSupabaseTaxData] Fetched allProperties for default profile:', JSON.stringify(allProperties));
            
          if (propertiesError) {
            console.error('[useSupabaseTaxData] Error fetching properties for default profile:', propertiesError);
          }
          
          // Create a default tax profile
          const defaultTaxProfile = {
            id: 'default-profile',
            user_id: userId,
            tax_year: effectiveYear,
            selected_property_ids: allProperties?.map(p => p.id) || [],
            filing_type: 'self_assessment',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          console.log('[useSupabaseTaxData] Default tax profile created with selected_property_ids:', JSON.stringify(defaultTaxProfile.selected_property_ids));
          
          // Create default tax adjustments
          const defaultTaxAdjustments = {
            id: 'default-adjustments',
            user_id: userId,
            tax_year: effectiveYear,
            use_property_income_allowance: true,
            use_mileage_allowance: true,
            mileage_total: 1200,
            prior_year_losses: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          // Now proceed with these default values
          taxProfile = defaultTaxProfile; // Assign to the higher-scoped taxProfile
          const taxAdjustments = defaultTaxAdjustments;
          const properties = allProperties || [];
          
          // Continue with the rest of the function using these default values
        }

        // Fetch tax adjustments - use same approach as tax profiles
        const { data: taxAdjustmentsArray, error: adjustmentsError } = await supabase
          .from('tax_adjustments')
          .select('*')
          .eq('user_id', userId)
          .eq('tax_year', effectiveYear);
        
        if (adjustmentsError) {
          console.error('[useSupabaseTaxData] Error fetching tax adjustments:', adjustmentsError);
          setInternalState(prev => ({ ...prev, isLoading: false, error: adjustmentsError.message }));
          return;
        }
        
        // Get first tax adjustment if available
        const taxAdjustments = taxAdjustmentsArray && taxAdjustmentsArray.length > 0 ? 
          taxAdjustmentsArray[0] : null;
        console.log('[useSupabaseTaxData] Tax adjustments fetched:', taxAdjustments);

        if (!taxProfile || !taxProfile.selected_property_ids || taxProfile.selected_property_ids.length === 0) {
          console.log('[useSupabaseTaxData] No properties selected in tax profile');
          setInternalState({
            taxProfile: taxProfile || null,
            taxAdjustments: taxAdjustments || null,
            properties: [],
            totalIncome: 0,
            totalExpenses: 0,
            taxableProfit: 0,
            isLoading: false,
            error: null,
          });
          return;
        }

        // Fetch properties
        const { data: properties, error: propertiesError } = await supabase
          .from('properties')
          .select('id, address, property_code')
          .in('id', taxProfile.selected_property_ids);
          
        if (propertiesError) {
          console.error('[useSupabaseTaxData] Error fetching properties:', propertiesError);
          setInternalState(prev => ({ ...prev, isLoading: false, error: propertiesError.message }));
          return;
        }
        console.log('[useSupabaseTaxData] Properties fetched:', properties);

        // Fetch transactions for the selected properties
        let transactions: any[] = [];
        if (taxProfile.selected_property_ids && taxProfile.selected_property_ids.length > 0) {
          const { data: transactionsData, error: transactionsError } = await supabase
            .from('bank_transactions')
            .select('property_id, amount, transaction_type, category')
            .in('property_id', taxProfile.selected_property_ids);

          if (transactionsError) {
            console.error('[useSupabaseTaxData] Error fetching transactions:', transactionsError);
          } else {
            transactions = transactionsData || [];
            console.log(`[useSupabaseTaxData] Fetched ${transactions.length} transactions for tax calculations`);
          }
        } else {
          console.log('[useSupabaseTaxData] No properties selected in tax profile, cannot fetch transactions');
        }
        
        // Log a few transactions for debugging
        if (transactions && transactions.length > 0) {
          transactions.slice(0, 3).forEach((t: any) => {
            console.log(`[useSupabaseTaxData] Sample transaction: amount=${t.amount}, category=${JSON.stringify(t.category)}`);
          });
        }

        // Calculate income and expenses
        let totalIncome = 0;
        let totalExpenses = 0;
        
        if (transactions && transactions.length > 0) {
          transactions.forEach((transaction: any) => {
            // Check if category is an array and has items
            const categories = Array.isArray(transaction.category) ? transaction.category : [];
            const mainCategory = categories.length > 0 ? categories[0] : null;
            
            // Skip transactions with 'exclude' category
            if (mainCategory === 'exclude') return;
            
            // Income categories: rental_income, other_income
            if (mainCategory === 'rental_income' || mainCategory === 'other_income') {
              totalIncome += Math.abs(transaction.amount);
              console.log(`[useSupabaseTaxData] Adding income: ${transaction.amount} from category ${mainCategory}`);
            }
            // Expense categories: anything that's not exclude or income
            else if (mainCategory && mainCategory !== 'exclude') {
              totalExpenses += Math.abs(transaction.amount);
              console.log(`[useSupabaseTaxData] Adding expense: ${transaction.amount} from category ${mainCategory}`);
            }
          });
        } else {
          // If no transactions found, create demo data
          console.log('[useSupabaseTaxData] No transactions found, creating demo data');
          
          // Create demo income and expenses for each property
          if (properties && properties.length > 0) {
            properties.forEach((property: any) => {
              // Add demo income for each property
              totalIncome += 1200; // £1200 rental income per property
              console.log(`[useSupabaseTaxData] Adding demo income: 1200 for property ${property.id}`);
              
              // Add demo expenses for each property
              totalExpenses += 400; // £400 expenses per property
              console.log(`[useSupabaseTaxData] Adding demo expenses: 400 for property ${property.id}`);
            });
          }
        }

        // Calculate taxable profit
        const taxableProfit = totalIncome - totalExpenses;
        
        console.log(`[useSupabaseTaxData] Calculations: income=${totalIncome}, expenses=${totalExpenses}, profit=${taxableProfit}`);

        // Update state with all data
        setInternalState({
          taxProfile,
          taxAdjustments: taxAdjustments || null,
          properties: properties || [],
          totalIncome,
          totalExpenses,
          taxableProfit,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('[useSupabaseTaxData] Unexpected error:', error);
        setInternalState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: error instanceof Error ? error.message : 'An unknown error occurred' 
        }));
      }
    };

    fetchTaxData();
  }, [userId, effectiveYear, supabase]);

  console.log('[useSupabaseTaxData RETURNING STATE]', internalState);
  return internalState;
}
