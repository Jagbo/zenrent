# HMRC MTD Technical Implementation Guide

## Critical Implementation Details

### 1. Database Schema Fixes

#### Remove tax_calculations References
```typescript
// Replace this pattern:
const calculations = await supabase
  .from('tax_calculations')
  .select('*')

// With:
const submissions = await supabase
  .from('tax_submissions')
  .select('calculation_data')
```

#### Create Missing Tables Migration
```sql
-- Company tax profiles table
CREATE TABLE company_tax_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  company_number VARCHAR(8) NOT NULL,
  company_name TEXT NOT NULL,
  accounting_period_start DATE NOT NULL,
  accounting_period_end DATE NOT NULL,
  corporation_tax_reference VARCHAR(10),
  vat_number VARCHAR(12),
  is_dormant BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, company_number)
);

-- Company tax submissions
CREATE TABLE company_tax_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_profile_id UUID NOT NULL REFERENCES company_tax_profiles(id),
  tax_year VARCHAR(9) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  ct600_data JSONB,
  ixbrl_data JSONB,
  submission_reference VARCHAR(50),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE company_tax_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_tax_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own company profiles" ON company_tax_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their company submissions" ON company_tax_submissions
  FOR ALL USING (
    company_profile_id IN (
      SELECT id FROM company_tax_profiles WHERE user_id = auth.uid()
    )
  );
```

### 2. HMRC OAuth Implementation

#### Secure Token Storage
```typescript
// utils/crypto.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const algorithm = 'aes-256-gcm';
const secretKey = process.env.ENCRYPTION_KEY!; // 32 bytes key

export function encryptToken(token: string): { encrypted: string; iv: string; tag: string } {
  const iv = randomBytes(16);
  const cipher = createCipheriv(algorithm, Buffer.from(secretKey, 'hex'), iv);
  
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  };
}

export function decryptToken(encrypted: string, iv: string, tag: string): string {
  const decipher = createDecipheriv(
    algorithm, 
    Buffer.from(secretKey, 'hex'), 
    Buffer.from(iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

#### Token Refresh with Retry
```typescript
// services/hmrc-auth.ts
export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const maxRetries = 3;
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(`${HMRC_API_BASE}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: process.env.HMRC_CLIENT_ID!,
          client_secret: process.env.HMRC_CLIENT_SECRET!,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      lastError = error as Error;
      
      // Exponential backoff
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  throw lastError || new Error('Token refresh failed after retries');
}
```

### 3. Form Validation Implementation

#### NI Number Validation
```typescript
// utils/validation.ts
export function validateNINumber(ni: string): boolean {
  // Remove spaces and convert to uppercase
  const cleaned = ni.replace(/\s/g, '').toUpperCase();
  
  // NI number format: 2 letters, 6 numbers, 1 letter (A, B, C, or D)
  const niRegex = /^[A-Z]{2}[0-9]{6}[A-D]$/;
  
  if (!niRegex.test(cleaned)) {
    return false;
  }
  
  // Invalid prefixes
  const invalidPrefixes = ['BG', 'GB', 'NK', 'KN', 'TN', 'NT', 'ZZ'];
  const prefix = cleaned.substring(0, 2);
  
  return !invalidPrefixes.includes(prefix);
}

export function formatNINumber(ni: string): string {
  const cleaned = ni.replace(/\s/g, '').toUpperCase();
  if (cleaned.length !== 9) return ni;
  
  return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8)}`;
}
```

#### UTR Validation
```typescript
export function validateUTR(utr: string): boolean {
  const cleaned = utr.replace(/\s/g, '');
  
  // UTR must be exactly 10 digits
  if (!/^\d{10}$/.test(cleaned)) {
    return false;
  }
  
  // Implement check digit validation (Modulus 11)
  const weights = [6, 7, 8, 9, 10, 5, 4, 3, 2];
  let sum = 0;
  
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * weights[i];
  }
  
  const remainder = sum % 11;
  const checkDigit = remainder === 0 ? 0 : 11 - remainder;
  
  return checkDigit === parseInt(cleaned[9]);
}
```

### 4. Tax Calculation Engine

#### Personal Tax Calculation
```typescript
// services/tax-calculator.ts
interface TaxCalculation {
  totalIncome: number;
  allowableExpenses: number;
  taxableProfit: number;
  incomeTax: number;
  nationalInsurance: number;
  totalTaxDue: number;
}

export function calculatePersonalTax(
  income: number,
  expenses: number,
  adjustments: TaxAdjustments
): TaxCalculation {
  // Apply adjustments
  let adjustedExpenses = expenses;
  
  if (adjustments.useMileageAllowance) {
    adjustedExpenses += adjustments.mileageTotal * 0.45; // 45p per mile
  }
  
  const taxableProfit = Math.max(0, income - adjustedExpenses);
  
  // Apply property income allowance if beneficial
  let finalTaxableProfit = taxableProfit;
  if (adjustments.usePropertyIncomeAllowance && income <= 1000) {
    finalTaxableProfit = 0;
  } else if (adjustments.usePropertyIncomeAllowance && income > 1000) {
    const withAllowance = income - 1000;
    finalTaxableProfit = Math.min(taxableProfit, withAllowance);
  }
  
  // Apply prior year losses
  if (adjustments.priorYearLosses > 0) {
    finalTaxableProfit = Math.max(0, finalTaxableProfit - adjustments.priorYearLosses);
  }
  
  // Calculate income tax (2024/25 rates)
  const incomeTax = calculateIncomeTax(finalTaxableProfit);
  
  // Calculate Class 4 NI
  const nationalInsurance = calculateClass4NI(finalTaxableProfit);
  
  return {
    totalIncome: income,
    allowableExpenses: adjustedExpenses,
    taxableProfit: finalTaxableProfit,
    incomeTax,
    nationalInsurance,
    totalTaxDue: incomeTax + nationalInsurance
  };
}

function calculateIncomeTax(taxableIncome: number): number {
  const personalAllowance = 12570;
  const basicRateLimit = 50270;
  const higherRateLimit = 125140;
  
  if (taxableIncome <= personalAllowance) return 0;
  
  let tax = 0;
  let taxable = taxableIncome - personalAllowance;
  
  // Basic rate (20%)
  const basicRateTax = Math.min(taxable, basicRateLimit - personalAllowance) * 0.20;
  tax += basicRateTax;
  taxable -= (basicRateLimit - personalAllowance);
  
  // Higher rate (40%)
  if (taxable > 0) {
    const higherRateTax = Math.min(taxable, higherRateLimit - basicRateLimit) * 0.40;
    tax += higherRateTax;
    taxable -= (higherRateLimit - basicRateLimit);
  }
  
  // Additional rate (45%)
  if (taxable > 0) {
    tax += taxable * 0.45;
  }
  
  return Math.round(tax * 100) / 100;
}

function calculateClass4NI(profit: number): number {
  const lowerLimit = 12570;
  const upperLimit = 50270;
  
  if (profit <= lowerLimit) return 0;
  
  let ni = 0;
  
  // 9% on profits between lower and upper limits
  const band1 = Math.min(profit - lowerLimit, upperLimit - lowerLimit);
  ni += band1 * 0.09;
  
  // 2% on profits above upper limit
  if (profit > upperLimit) {
    ni += (profit - upperLimit) * 0.02;
  }
  
  return Math.round(ni * 100) / 100;
}
```

### 5. HMRC API Integration

#### Submission Service
```typescript
// services/hmrc-submission.ts
export class HMRCSubmissionService {
  private async createCalculation(
    nino: string,
    taxYear: string,
    data: CalculationData
  ): Promise<string> {
    const response = await this.authenticatedRequest(
      `/individuals/calculations/${nino}/self-assessment/${taxYear}`,
      {
        method: 'POST',
        body: JSON.stringify({
          ukProperty: {
            income: {
              rentIncome: data.totalIncome,
              premiumsOfLeaseGrant: 0,
              otherPropertyIncome: 0
            },
            expenses: {
              premisesRunningCosts: data.expenses.premisesRunningCosts,
              repairsAndMaintenance: data.expenses.repairsAndMaintenance,
              financialCosts: data.expenses.financialCosts,
              professionalFees: data.expenses.professionalFees,
              other: data.expenses.other
            },
            adjustments: {
              privateUseAdjustment: 0,
              balancingCharge: 0,
              propertyIncomeAllowance: data.adjustments.propertyIncomeAllowance
            }
          }
        })
      }
    );
    
    return response.headers.get('Location') || '';
  }
  
  private async crystalliseCalculation(calculationId: string): Promise<void> {
    await this.authenticatedRequest(
      `/individuals/calculations/${calculationId}/crystallise`,
      {
        method: 'POST',
        body: JSON.stringify({
          calculationId,
          crystalliseTimestamp: new Date().toISOString()
        })
      }
    );
  }
  
  private async authenticatedRequest(
    endpoint: string,
    options: RequestInit
  ): Promise<Response> {
    const token = await this.getValidAccessToken();
    
    const response = await fetch(`${HMRC_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.hmrc.1.0+json',
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 401) {
      // Token expired, refresh and retry
      await this.refreshToken();
      return this.authenticatedRequest(endpoint, options);
    }
    
    if (!response.ok) {
      const error = await response.json();
      throw new HMRCAPIError(error.code, error.message);
    }
    
    return response;
  }
}
```

### 6. Error Recovery System

#### Auto-save Implementation
```typescript
// hooks/useAutoSave.ts
export function useAutoSave<T>(
  data: T,
  saveFunction: (data: T) => Promise<void>,
  delay: number = 3000
) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (!data) return;
      
      setIsSaving(true);
      setError(null);
      
      try {
        await saveFunction(data);
        setLastSaved(new Date());
      } catch (err) {
        setError(err as Error);
        
        // Store in localStorage as backup
        localStorage.setItem(
          `tax_draft_${new Date().toISOString()}`,
          JSON.stringify(data)
        );
      } finally {
        setIsSaving(false);
      }
    }, delay);
    
    return () => clearTimeout(timeoutId);
  }, [data, saveFunction, delay]);
  
  return { isSaving, lastSaved, error };
}
```

### 7. Security Implementation

#### Data Encryption at Rest
```typescript
// services/secure-storage.ts
export class SecureStorage {
  static async encryptSensitiveData(data: any): Promise<string> {
    const jsonString = JSON.stringify(data);
    const { encrypted, iv, tag } = encryptToken(jsonString);
    
    return JSON.stringify({ encrypted, iv, tag });
  }
  
  static async decryptSensitiveData(encryptedData: string): Promise<any> {
    const { encrypted, iv, tag } = JSON.parse(encryptedData);
    const decrypted = decryptToken(encrypted, iv, tag);
    
    return JSON.parse(decrypted);
  }
  
  static async saveSensitiveField(
    table: string,
    id: string,
    field: string,
    value: string
  ): Promise<void> {
    const encrypted = await this.encryptSensitiveData(value);
    
    await supabase
      .from(table)
      .update({ [field]: encrypted })
      .eq('id', id);
  }
}
```

## Testing Strategy

### Unit Test Example
```typescript
// __tests__/tax-calculator.test.ts
describe('Tax Calculator', () => {
  it('should calculate personal tax correctly', () => {
    const result = calculatePersonalTax(50000, 10000, {
      useMileageAllowance: true,
      mileageTotal: 1000,
      usePropertyIncomeAllowance: false,
      priorYearLosses: 0
    });
    
    expect(result.taxableProfit).toBe(39550); // 50000 - 10000 - 450
    expect(result.incomeTax).toBeCloseTo(5486);
    expect(result.nationalInsurance).toBeCloseTo(2469.60);
  });
});
```

## Deployment Checklist

- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Database migrations run
- [ ] RLS policies verified
- [ ] API rate limiting configured
- [ ] Monitoring alerts set up
- [ ] Backup strategy implemented
- [ ] Security headers configured
- [ ] CORS policies set
- [ ] Error tracking enabled 