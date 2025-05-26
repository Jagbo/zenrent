/**
 * Comprehensive Tax Calculation Engine for ZenRent
 * Handles both personal (SA100/SA105) and company (CT600) tax calculations
 */

// Tax rates for 2024/25 tax year
const TAX_RATES_2024_25 = {
  personal: {
    personalAllowance: 12570,
    basicRateLimit: 50270,
    higherRateLimit: 125140,
    basicRate: 0.20,
    higherRate: 0.40,
    additionalRate: 0.45,
    dividendAllowance: 500,
    dividendBasicRate: 0.0875,
    dividendHigherRate: 0.3375,
    dividendAdditionalRate: 0.3935
  },
  nationalInsurance: {
    class4LowerLimit: 12570,
    class4UpperLimit: 50270,
    class4Rate: 0.09,
    class4AdditionalRate: 0.02
  },
  corporation: {
    smallCompaniesRate: 0.19,
    mainRate: 0.25,
    marginalReliefThreshold: 250000,
    marginalReliefUpperLimit: 1500000,
    // Capital allowances rates
    annualInvestmentAllowance: 1000000, // AIA limit for 2024/25
    mainRatePoolRate: 0.18, // Main rate pool writing down allowance
    specialRatePoolRate: 0.06, // Special rate pool writing down allowance
    firstYearAllowance: 1.0, // 100% for qualifying assets
    // R&D rates
    rdSmallCompanyRate: 2.30, // 230% deduction for small companies
    rdLargeCompanyRate: 1.30, // 130% deduction for large companies
    rdTaxCreditRate: 0.145, // 14.5% tax credit rate for loss-making companies
    // Patent box rate
    patentBoxRate: 0.10 // 10% rate for qualifying IP profits
  },
  allowances: {
    propertyIncomeAllowance: 1000,
    tradingAllowance: 1000,
    mileageRateFirst10k: 0.45,
    mileageRateOver10k: 0.25
  }
};

export interface TaxAdjustments {
  useMileageAllowance: boolean;
  mileageTotal: number;
  usePropertyIncomeAllowance: boolean;
  priorYearLosses: number;
  capitalAllowances: number;
  wearAndTearAllowance: number;
}

export interface CompanyTaxAdjustments {
  capitalAllowances: CapitalAllowances;
  rdExpenditure: RDExpenditure;
  groupRelief: GroupRelief;
  lossesCarriedForward: LossesCarriedForward;
  patentBoxProfits: number;
}

export interface CapitalAllowances {
  // Annual Investment Allowance
  aiaQualifyingExpenditure: number;
  aiaClaimedThisYear: number;
  
  // Main rate pool (18% WDA)
  mainPoolBroughtForward: number;
  mainPoolAdditions: number;
  mainPoolDisposals: number;
  
  // Special rate pool (6% WDA)
  specialPoolBroughtForward: number;
  specialPoolAdditions: number;
  specialPoolDisposals: number;
  
  // First year allowances
  fyaQualifyingExpenditure: number;
  
  // Structures and buildings allowance
  sbaQualifyingExpenditure: number;
  sbaRate: number; // Currently 3% per annum
}

export interface RDExpenditure {
  currentYearExpenditure: number;
  isSmallCompany: boolean;
  isLossMaking: boolean;
  qualifiesForTaxCredit: boolean;
}

export interface GroupRelief {
  surrenderingCompanyLosses: number;
  claimingCompanyProfit: number;
  groupReliefClaimed: number;
  isGroupCompany: boolean;
}

export interface LossesCarriedForward {
  tradingLosses: number;
  nonTradingLosses: number;
  managementExpenses: number;
  excessCapitalAllowances: number;
  usedAgainstCurrentYear: number;
}

export interface PersonalTaxCalculation {
  totalIncome: number;
  allowableExpenses: number;
  adjustments: number;
  taxableProfit: number;
  incomeTax: number;
  nationalInsurance: number;
  totalTaxDue: number;
  breakdown: {
    personalAllowanceUsed: number;
    basicRateTax: number;
    higherRateTax: number;
    additionalRateTax: number;
    class4NI: number;
  };
}

export interface CompanyTaxCalculation {
  totalProfit: number;
  allowableExpenses: number;
  adjustments: CompanyTaxAdjustments;
  taxableProfit: number;
  corporationTax: number;
  marginalRelief: number;
  rdTaxCredit: number;
  totalTaxDue: number;
  breakdown: {
    smallCompaniesRate: number;
    mainRate: number;
    effectiveRate: number;
    capitalAllowancesTotal: number;
    rdReliefTotal: number;
    groupReliefUsed: number;
    lossesUsed: number;
    patentBoxRelief: number;
  };
}

export interface PropertyIncome {
  rentIncome: number;
  premiumsOfLeaseGrant: number;
  otherPropertyIncome: number;
}

export interface PropertyExpenses {
  premisesRunningCosts: number;
  repairsAndMaintenance: number;
  financialCosts: number;
  professionalFees: number;
  costOfServices: number;
  other: number;
}

/**
 * Calculate personal tax for property income (SA105)
 */
export function calculatePersonalTax(
  income: PropertyIncome,
  expenses: PropertyExpenses,
  adjustments: TaxAdjustments
): PersonalTaxCalculation {
  const rates = TAX_RATES_2024_25;
  
  // Calculate total income
  const totalIncome = income.rentIncome + income.premiumsOfLeaseGrant + income.otherPropertyIncome;
  
  // Calculate total allowable expenses
  let totalExpenses = Object.values(expenses).reduce((sum, expense) => sum + expense, 0);
  
  // Apply adjustments
  let adjustmentTotal = 0;
  
  // Mileage allowance
  if (adjustments.useMileageAllowance && adjustments.mileageTotal > 0) {
    const first10k = Math.min(adjustments.mileageTotal, 10000);
    const over10k = Math.max(0, adjustments.mileageTotal - 10000);
    const mileageAllowance = (first10k * rates.allowances.mileageRateFirst10k) + 
                            (over10k * rates.allowances.mileageRateOver10k);
    adjustmentTotal += mileageAllowance;
  }
  
  // Capital allowances
  adjustmentTotal += adjustments.capitalAllowances;
  
  // Wear and tear allowance
  adjustmentTotal += adjustments.wearAndTearAllowance;
  
  // Calculate profit before property income allowance
  let taxableProfit = Math.max(0, totalIncome - totalExpenses - adjustmentTotal);
  
  // Apply property income allowance if beneficial
  if (adjustments.usePropertyIncomeAllowance) {
    if (totalIncome <= rates.allowances.propertyIncomeAllowance) {
      // Full allowance covers all income
      taxableProfit = 0;
    } else {
      // Use allowance if it's more beneficial than actual expenses
      const profitWithAllowance = totalIncome - rates.allowances.propertyIncomeAllowance;
      taxableProfit = Math.min(taxableProfit, profitWithAllowance);
    }
  }
  
  // Apply prior year losses
  if (adjustments.priorYearLosses > 0) {
    taxableProfit = Math.max(0, taxableProfit - adjustments.priorYearLosses);
  }
  
  // Calculate income tax
  const incomeTaxBreakdown = calculateIncomeTax(taxableProfit);
  
  // Calculate Class 4 National Insurance
  const class4NI = calculateClass4NI(taxableProfit);
  
  return {
    totalIncome,
    allowableExpenses: totalExpenses,
    adjustments: adjustmentTotal,
    taxableProfit,
    incomeTax: incomeTaxBreakdown.total,
    nationalInsurance: class4NI,
    totalTaxDue: incomeTaxBreakdown.total + class4NI,
    breakdown: {
      personalAllowanceUsed: incomeTaxBreakdown.personalAllowanceUsed,
      basicRateTax: incomeTaxBreakdown.basicRateTax,
      higherRateTax: incomeTaxBreakdown.higherRateTax,
      additionalRateTax: incomeTaxBreakdown.additionalRateTax,
      class4NI
    }
  };
}

/**
 * Calculate comprehensive corporation tax for company property income
 */
export function calculateCompanyTax(
  totalProfit: number,
  allowableExpenses: number,
  adjustments: CompanyTaxAdjustments | number = 0
): CompanyTaxCalculation {
  const rates = TAX_RATES_2024_25.corporation;
  
  // Handle legacy number parameter for backwards compatibility
  if (typeof adjustments === 'number') {
    adjustments = {
      capitalAllowances: {
        aiaQualifyingExpenditure: 0,
        aiaClaimedThisYear: 0,
        mainPoolBroughtForward: 0,
        mainPoolAdditions: 0,
        mainPoolDisposals: 0,
        specialPoolBroughtForward: 0,
        specialPoolAdditions: 0,
        specialPoolDisposals: 0,
        fyaQualifyingExpenditure: 0,
        sbaQualifyingExpenditure: 0,
        sbaRate: 0.03
      },
      rdExpenditure: {
        currentYearExpenditure: 0,
        isSmallCompany: totalProfit <= rates.marginalReliefThreshold,
        isLossMaking: false,
        qualifiesForTaxCredit: false
      },
      groupRelief: {
        surrenderingCompanyLosses: 0,
        claimingCompanyProfit: totalProfit,
        groupReliefClaimed: 0,
        isGroupCompany: false
      },
      lossesCarriedForward: {
        tradingLosses: 0,
        nonTradingLosses: 0,
        managementExpenses: 0,
        excessCapitalAllowances: 0,
        usedAgainstCurrentYear: adjustments as number
      },
      patentBoxProfits: 0
    };
  }
  
  // Calculate capital allowances
  const capitalAllowancesTotal = calculateCapitalAllowances(adjustments.capitalAllowances);
  
  // Calculate R&D relief
  const rdReliefTotal = calculateRDRelief(adjustments.rdExpenditure);
  
  // Calculate group relief
  const groupReliefUsed = calculateGroupRelief(adjustments.groupRelief);
  
  // Calculate losses carried forward usage
  const lossesUsed = calculateLossesCarriedForward(adjustments.lossesCarriedForward, totalProfit);
  
  // Calculate patent box relief
  const patentBoxRelief = calculatePatentBoxRelief(adjustments.patentBoxProfits);
  
  // Calculate taxable profit after all adjustments
  let taxableProfit = Math.max(0, 
    totalProfit 
    - allowableExpenses 
    - capitalAllowancesTotal 
    - rdReliefTotal 
    - groupReliefUsed 
    - lossesUsed
  );
  
  // Apply patent box relief (reduces effective rate on qualifying profits)
  const patentBoxTaxSaving = adjustments.patentBoxProfits * (rates.mainRate - rates.patentBoxRate);
  
  let corporationTax = 0;
  let marginalRelief = 0;
  let effectiveRate = 0;
  
  if (taxableProfit <= rates.marginalReliefThreshold) {
    // Small companies rate applies
    corporationTax = taxableProfit * rates.smallCompaniesRate;
    effectiveRate = rates.smallCompaniesRate;
  } else if (taxableProfit >= rates.marginalReliefUpperLimit) {
    // Main rate applies
    corporationTax = taxableProfit * rates.mainRate;
    effectiveRate = rates.mainRate;
  } else {
    // Marginal relief applies
    corporationTax = taxableProfit * rates.mainRate;
    
    // Calculate marginal relief using the correct UK formula: (3/200) × (Upper Limit - Taxable Profits)
    const standardFraction = 3 / 200; // 0.015
    marginalRelief = standardFraction * (rates.marginalReliefUpperLimit - taxableProfit);
    
    corporationTax -= marginalRelief;
    effectiveRate = corporationTax / taxableProfit;
  }
  
  // Apply patent box relief
  corporationTax -= patentBoxTaxSaving;
  
  // Calculate R&D tax credit for loss-making companies
  let rdTaxCredit = 0;
  if (adjustments.rdExpenditure.isLossMaking && adjustments.rdExpenditure.qualifiesForTaxCredit) {
    rdTaxCredit = adjustments.rdExpenditure.currentYearExpenditure * rates.rdTaxCreditRate;
  }
  
  const totalTaxDue = Math.max(0, corporationTax - rdTaxCredit);
  
  return {
    totalProfit,
    allowableExpenses,
    adjustments,
    taxableProfit,
    corporationTax,
    marginalRelief,
    rdTaxCredit,
    totalTaxDue,
    breakdown: {
      smallCompaniesRate: taxableProfit <= rates.marginalReliefThreshold ? corporationTax : 0,
      mainRate: taxableProfit >= rates.marginalReliefUpperLimit ? corporationTax : 0,
      effectiveRate,
      capitalAllowancesTotal,
      rdReliefTotal,
      groupReliefUsed,
      lossesUsed,
      patentBoxRelief: patentBoxTaxSaving
    }
  };
}

/**
 * Calculate capital allowances for companies
 */
export function calculateCapitalAllowances(allowances: CapitalAllowances): number {
  const rates = TAX_RATES_2024_25.corporation;
  let totalAllowances = 0;
  
  // Annual Investment Allowance (AIA) - 100% relief up to limit
  const aiaAllowance = Math.min(allowances.aiaQualifyingExpenditure, rates.annualInvestmentAllowance);
  totalAllowances += aiaAllowance;
  
  // First Year Allowances (FYA) - 100% relief for qualifying assets
  totalAllowances += allowances.fyaQualifyingExpenditure;
  
  // Main rate pool - 18% writing down allowance
  const mainPoolBalance = allowances.mainPoolBroughtForward + allowances.mainPoolAdditions - allowances.mainPoolDisposals;
  const mainPoolAllowance = Math.max(0, mainPoolBalance * rates.mainRatePoolRate);
  totalAllowances += mainPoolAllowance;
  
  // Special rate pool - 6% writing down allowance
  const specialPoolBalance = allowances.specialPoolBroughtForward + allowances.specialPoolAdditions - allowances.specialPoolDisposals;
  const specialPoolAllowance = Math.max(0, specialPoolBalance * rates.specialRatePoolRate);
  totalAllowances += specialPoolAllowance;
  
  // Structures and Buildings Allowance (SBA) - 3% per annum
  const sbaAllowance = allowances.sbaQualifyingExpenditure * allowances.sbaRate;
  totalAllowances += sbaAllowance;
  
  return Math.round(totalAllowances * 100) / 100;
}

/**
 * Calculate R&D tax relief
 */
export function calculateRDRelief(rdExpenditure: RDExpenditure): number {
  const rates = TAX_RATES_2024_25.corporation;
  
  if (rdExpenditure.currentYearExpenditure <= 0) {
    return 0;
  }
  
  let reliefRate: number;
  
  if (rdExpenditure.isSmallCompany) {
    // Small companies get 230% deduction (130% additional relief)
    reliefRate = rates.rdSmallCompanyRate - 1; // Additional relief only
  } else {
    // Large companies get 130% deduction (30% additional relief)
    reliefRate = rates.rdLargeCompanyRate - 1; // Additional relief only
  }
  
  const additionalRelief = rdExpenditure.currentYearExpenditure * reliefRate;
  
  return Math.round(additionalRelief * 100) / 100;
}

/**
 * Calculate group relief
 */
export function calculateGroupRelief(groupRelief: GroupRelief): number {
  if (!groupRelief.isGroupCompany || groupRelief.surrenderingCompanyLosses <= 0) {
    return 0;
  }
  
  // Group relief is limited to the lower of:
  // 1. Surrendering company's losses
  // 2. Claiming company's profit
  // 3. Amount actually claimed
  const maxRelief = Math.min(
    groupRelief.surrenderingCompanyLosses,
    groupRelief.claimingCompanyProfit,
    groupRelief.groupReliefClaimed
  );
  
  return Math.max(0, maxRelief);
}

/**
 * Calculate losses carried forward usage
 */
export function calculateLossesCarriedForward(losses: LossesCarriedForward, currentProfit: number): number {
  const totalLossesAvailable = 
    losses.tradingLosses + 
    losses.nonTradingLosses + 
    losses.managementExpenses + 
    losses.excessCapitalAllowances;
  
  // Losses can be used up to the amount of current year profit
  const maxUsage = Math.min(totalLossesAvailable, currentProfit);
  
  // Use the amount specified or maximum available, whichever is lower
  const lossesUsed = Math.min(losses.usedAgainstCurrentYear, maxUsage);
  
  return Math.max(0, lossesUsed);
}

/**
 * Calculate patent box relief
 */
export function calculatePatentBoxRelief(patentBoxProfits: number): number {
  const rates = TAX_RATES_2024_25.corporation;
  
  if (patentBoxProfits <= 0) {
    return 0;
  }
  
  // Patent box provides relief by taxing qualifying IP profits at 10% instead of main rate
  const reliefAmount = patentBoxProfits * (rates.mainRate - rates.patentBoxRate);
  
  return Math.round(reliefAmount * 100) / 100;
}

/**
 * Calculate income tax with detailed breakdown
 */
function calculateIncomeTax(taxableIncome: number): {
  total: number;
  personalAllowanceUsed: number;
  basicRateTax: number;
  higherRateTax: number;
  additionalRateTax: number;
} {
  const rates = TAX_RATES_2024_25.personal;
  
  if (taxableIncome <= 0) {
    return {
      total: 0,
      personalAllowanceUsed: 0,
      basicRateTax: 0,
      higherRateTax: 0,
      additionalRateTax: 0
    };
  }
  
  // Personal allowance is reduced for high earners
  let personalAllowance = rates.personalAllowance;
  if (taxableIncome > 100000) {
    const reduction = Math.floor((taxableIncome - 100000) / 2);
    personalAllowance = Math.max(0, personalAllowance - reduction);
  }
  
  const personalAllowanceUsed = Math.min(taxableIncome, personalAllowance);
  let taxableAfterAllowance = Math.max(0, taxableIncome - personalAllowance);
  
  let basicRateTax = 0;
  let higherRateTax = 0;
  let additionalRateTax = 0;
  
  // Basic rate band
  const basicRateBand = rates.basicRateLimit - personalAllowance;
  if (taxableAfterAllowance > 0) {
    const basicRateAmount = Math.min(taxableAfterAllowance, basicRateBand);
    basicRateTax = basicRateAmount * rates.basicRate;
    taxableAfterAllowance -= basicRateAmount;
  }
  
  // Higher rate band
  const higherRateBand = rates.higherRateLimit - rates.basicRateLimit;
  if (taxableAfterAllowance > 0) {
    const higherRateAmount = Math.min(taxableAfterAllowance, higherRateBand);
    higherRateTax = higherRateAmount * rates.higherRate;
    taxableAfterAllowance -= higherRateAmount;
  }
  
  // Additional rate
  if (taxableAfterAllowance > 0) {
    additionalRateTax = taxableAfterAllowance * rates.additionalRate;
  }
  
  return {
    total: Math.round((basicRateTax + higherRateTax + additionalRateTax) * 100) / 100,
    personalAllowanceUsed,
    basicRateTax: Math.round(basicRateTax * 100) / 100,
    higherRateTax: Math.round(higherRateTax * 100) / 100,
    additionalRateTax: Math.round(additionalRateTax * 100) / 100
  };
}

/**
 * Calculate Class 4 National Insurance
 */
function calculateClass4NI(profit: number): number {
  const rates = TAX_RATES_2024_25.nationalInsurance;
  
  if (profit <= rates.class4LowerLimit) {
    return 0;
  }
  
  let ni = 0;
  
  // 9% on profits between lower and upper limits
  const band1 = Math.min(profit - rates.class4LowerLimit, rates.class4UpperLimit - rates.class4LowerLimit);
  ni += band1 * rates.class4Rate;
  
  // 2% on profits above upper limit
  if (profit > rates.class4UpperLimit) {
    ni += (profit - rates.class4UpperLimit) * rates.class4AdditionalRate;
  }
  
  return Math.round(ni * 100) / 100;
}

/**
 * Calculate estimated quarterly payments
 */
export function calculateQuarterlyPayments(annualTaxDue: number): {
  quarterlyAmount: number;
  paymentDates: string[];
  totalPayments: number;
} {
  const quarterlyAmount = Math.round((annualTaxDue / 4) * 100) / 100;
  
  // UK tax payment dates (31 Jan, 31 Jul for SA, quarterly for CT)
  const currentYear = new Date().getFullYear();
  const paymentDates = [
    `${currentYear + 1}-01-31`, // Payment on account 1
    `${currentYear + 1}-07-31`, // Payment on account 2
    `${currentYear + 2}-01-31`, // Balancing payment
    `${currentYear + 2}-01-31`  // Next year's payment on account 1
  ];
  
  return {
    quarterlyAmount,
    paymentDates,
    totalPayments: quarterlyAmount * 4
  };
}

/**
 * Validate calculation inputs
 */
export function validateCalculationInputs(
  income: PropertyIncome,
  expenses: PropertyExpenses
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate income values
  if (income.rentIncome < 0) errors.push('Rent income cannot be negative');
  if (income.premiumsOfLeaseGrant < 0) errors.push('Premiums of lease grant cannot be negative');
  if (income.otherPropertyIncome < 0) errors.push('Other property income cannot be negative');
  
  // Validate expense values
  Object.entries(expenses).forEach(([key, value]) => {
    if (value < 0) {
      errors.push(`${key.replace(/([A-Z])/g, ' $1').toLowerCase()} cannot be negative`);
    }
  });
  
  // Check for reasonable values (basic sanity checks)
  const totalIncome = Object.values(income).reduce((sum, val) => sum + val, 0);
  const totalExpenses = Object.values(expenses).reduce((sum, val) => sum + val, 0);
  
  if (totalIncome > 10000000) errors.push('Income seems unusually high - please verify');
  if (totalExpenses > totalIncome * 2) errors.push('Expenses are more than double the income - please verify');
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Format calculation results for HMRC submission
 */
export function formatForHMRCSubmission(
  calculation: PersonalTaxCalculation,
  taxYear: string
): any {
  return {
    taxYear,
    ukProperty: {
      income: {
        rentIncome: Math.round(calculation.totalIncome * 100), // Convert to pence
        premiumsOfLeaseGrant: 0,
        otherPropertyIncome: 0
      },
      expenses: {
        premisesRunningCosts: Math.round(calculation.allowableExpenses * 100),
        repairsAndMaintenance: 0,
        financialCosts: 0,
        professionalFees: 0,
        costOfServices: 0,
        other: 0
      },
      adjustments: {
        privateUseAdjustment: 0,
        balancingCharge: 0,
        propertyIncomeAllowance: Math.round(calculation.adjustments * 100),
        renovationAllowanceBalancingCharge: 0,
        residentialFinanceCost: 0,
        unusedResidentialFinanceCost: 0
      }
    },
    calculation: {
      taxableProfit: Math.round(calculation.taxableProfit * 100),
      incomeTax: Math.round(calculation.incomeTax * 100),
      nationalInsurance: Math.round(calculation.nationalInsurance * 100),
      totalTaxDue: Math.round(calculation.totalTaxDue * 100)
    }
  };
}

/**
 * Format company tax calculation results for HMRC CT600 submission
 */
export function formatCompanyTaxForHMRCSubmission(
  calculation: CompanyTaxCalculation,
  taxYear: string
): any {
  return {
    taxYear,
    companyDetails: {
      totalProfit: Math.round(calculation.totalProfit * 100),
      allowableExpenses: Math.round(calculation.allowableExpenses * 100),
      taxableProfit: Math.round(calculation.taxableProfit * 100)
    },
    capitalAllowances: {
      total: Math.round(calculation.breakdown.capitalAllowancesTotal * 100)
    },
    rdRelief: {
      total: Math.round(calculation.breakdown.rdReliefTotal * 100)
    },
    groupRelief: {
      claimed: Math.round(calculation.breakdown.groupReliefUsed * 100)
    },
    lossesCarriedForward: {
      used: Math.round(calculation.breakdown.lossesUsed * 100)
    },
    patentBox: {
      relief: Math.round(calculation.breakdown.patentBoxRelief * 100)
    },
    corporationTax: {
      beforeReliefs: Math.round(calculation.corporationTax * 100),
      marginalRelief: Math.round(calculation.marginalRelief * 100),
      rdTaxCredit: Math.round(calculation.rdTaxCredit * 100),
      totalDue: Math.round(calculation.totalTaxDue * 100)
    }
  };
}

/**
 * Get current tax year based on date
 */
export function getCurrentTaxYear(): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const taxYearStart = new Date(currentYear, 3, 6); // April 6th
  
  if (now >= taxYearStart) {
    return `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
  } else {
    return `${currentYear - 1}-${currentYear.toString().slice(-2)}`;
  }
}

/**
 * Get tax year options for dropdown
 */
export function getTaxYearOptions(): { value: string; label: string }[] {
  const currentTaxYear = getCurrentTaxYear();
  const currentStartYear = parseInt(currentTaxYear.split('-')[0]);
  
  const options = [];
  
  // Include current year and previous 5 years
  for (let i = 0; i < 6; i++) {
    const startYear = currentStartYear - i;
    const endYear = startYear + 1;
    const value = `${startYear}-${endYear.toString().slice(-2)}`;
    const label = `${startYear}/${endYear.toString().slice(-2)}`;
    
    options.push({ value, label });
  }
  
  return options;
}

/**
 * Generate CT600 form data for HMRC submission
 */
export function generateCT600Form(
  calculation: CompanyTaxCalculation,
  companyDetails: {
    companyName: string;
    companyNumber: string;
    utr: string;
    vatNumber?: string;
    accountingPeriodStart: string;
    accountingPeriodEnd: string;
    registeredOffice: string;
    directors: Array<{
      name: string;
      email?: string;
      phone?: string;
      appointmentDate?: string;
    }>;
  },
  taxYear: string
): any {
  return {
    formType: 'CT600',
    taxYear,
    submissionDate: new Date().toISOString(),
    
    // Company identification
    companyDetails: {
      name: companyDetails.companyName,
      registrationNumber: companyDetails.companyNumber,
      utr: companyDetails.utr,
      vatNumber: companyDetails.vatNumber || null,
      registeredOffice: companyDetails.registeredOffice,
      accountingPeriod: {
        start: companyDetails.accountingPeriodStart,
        end: companyDetails.accountingPeriodEnd
      }
    },
    
    // Directors information
    directors: companyDetails.directors.map(director => ({
      name: director.name,
      appointmentDate: director.appointmentDate || null
    })),
    
    // Financial data (in pence for HMRC)
    financialData: {
      // Box 1 - Total turnover
      totalTurnover: Math.round(calculation.totalProfit * 100),
      
      // Box 30 - Total allowable deductions
      totalDeductions: Math.round(calculation.allowableExpenses * 100),
      
      // Box 35 - Capital allowances
      capitalAllowances: Math.round(calculation.breakdown.capitalAllowancesTotal * 100),
      
      // Box 40 - R&D expenditure relief
      rdRelief: Math.round(calculation.breakdown.rdReliefTotal * 100),
      
      // Box 45 - Group relief claimed
      groupRelief: Math.round(calculation.breakdown.groupReliefUsed * 100),
      
      // Box 50 - Losses brought forward used
      lossesUsed: Math.round(calculation.breakdown.lossesUsed * 100),
      
      // Box 55 - Patent box relief
      patentBoxRelief: Math.round(calculation.breakdown.patentBoxRelief * 100),
      
      // Box 60 - Profits chargeable to corporation tax
      taxableProfit: Math.round(calculation.taxableProfit * 100),
      
      // Box 65 - Corporation tax before reliefs
      corporationTaxBeforeReliefs: Math.round(calculation.corporationTax * 100),
      
      // Box 70 - Marginal relief
      marginalRelief: Math.round(calculation.marginalRelief * 100),
      
      // Box 75 - R&D tax credit
      rdTaxCredit: Math.round(calculation.rdTaxCredit * 100),
      
      // Box 80 - Corporation tax payable
      corporationTaxPayable: Math.round(calculation.totalTaxDue * 100)
    },
    
    // Tax calculation breakdown
    taxCalculation: {
      effectiveRate: calculation.breakdown.effectiveRate,
      isSmallCompany: calculation.taxableProfit <= TAX_RATES_2024_25.corporation.marginalReliefThreshold,
      marginalReliefApplies: calculation.taxableProfit > TAX_RATES_2024_25.corporation.marginalReliefThreshold && 
                            calculation.taxableProfit < TAX_RATES_2024_25.corporation.marginalReliefUpperLimit
    },
    
    // Detailed adjustments
    adjustments: {
      capitalAllowances: calculation.adjustments.capitalAllowances,
      rdExpenditure: calculation.adjustments.rdExpenditure,
      groupRelief: calculation.adjustments.groupRelief,
      lossesCarriedForward: calculation.adjustments.lossesCarriedForward,
      patentBoxProfits: calculation.adjustments.patentBoxProfits
    },
    
    // Payment information
    paymentInfo: {
      dueDate: calculateCorporationTaxDueDate(companyDetails.accountingPeriodEnd),
      quarterlyPayments: calculateQuarterlyPayments(calculation.totalTaxDue)
    },
    
    // Compliance flags
    compliance: {
      mtdCompliant: true,
      digitalRecordsKept: true,
      quarterlyUpdatesSubmitted: false // This would be determined by actual MTD submissions
    }
  };
}

/**
 * Calculate corporation tax due date (9 months and 1 day after accounting period end)
 */
export function calculateCorporationTaxDueDate(accountingPeriodEnd: string): string {
  const endDate = new Date(accountingPeriodEnd);
  const dueDate = new Date(endDate);
  
  // Add 9 months and 1 day
  dueDate.setMonth(dueDate.getMonth() + 9);
  dueDate.setDate(dueDate.getDate() + 1);
  
  return dueDate.toISOString().split('T')[0];
}

/**
 * Validate company tax form data
 */
export function validateCompanyTaxForm(
  companyDetails: any,
  calculation: CompanyTaxCalculation
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate company details
  if (!companyDetails.companyName?.trim()) {
    errors.push('Company name is required');
  }
  
  if (!companyDetails.companyNumber?.trim()) {
    errors.push('Company registration number is required');
  } else if (!/^\d{8}$/.test(companyDetails.companyNumber.replace(/\s/g, ''))) {
    errors.push('Company registration number must be 8 digits');
  }
  
  if (!companyDetails.utr?.trim()) {
    errors.push('Corporation Tax UTR is required');
  } else if (!/^\d{10}$/.test(companyDetails.utr.replace(/\s/g, ''))) {
    errors.push('Corporation Tax UTR must be 10 digits');
  }
  
  if (!companyDetails.accountingPeriodStart) {
    errors.push('Accounting period start date is required');
  }
  
  if (!companyDetails.accountingPeriodEnd) {
    errors.push('Accounting period end date is required');
  }
  
  // Validate accounting period
  if (companyDetails.accountingPeriodStart && companyDetails.accountingPeriodEnd) {
    const startDate = new Date(companyDetails.accountingPeriodStart);
    const endDate = new Date(companyDetails.accountingPeriodEnd);
    
    if (endDate <= startDate) {
      errors.push('Accounting period end must be after start date');
    }
    
    const periodLength = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    if (periodLength > 366) {
      errors.push('Accounting period cannot exceed 12 months');
    }
  }
  
  // Validate directors
  if (!companyDetails.directors || companyDetails.directors.length === 0) {
    errors.push('At least one director is required');
  } else {
    const hasValidDirector = companyDetails.directors.some((d: any) => d.name?.trim());
    if (!hasValidDirector) {
      errors.push('At least one director must have a name');
    }
  }
  
  // Validate VAT number if provided
  if (companyDetails.vatNumber && !/^GB\d{9}$/.test(companyDetails.vatNumber.replace(/\s/g, ''))) {
    errors.push('VAT number must be in format GB followed by 9 digits');
  }
  
  // Validate calculation data
  if (calculation.totalProfit < 0) {
    errors.push('Total profit cannot be negative');
  }
  
  if (calculation.allowableExpenses < 0) {
    errors.push('Allowable expenses cannot be negative');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Generate company tax summary report
 */
export function generateCompanyTaxSummary(
  calculation: CompanyTaxCalculation,
  companyDetails: any,
  taxYear: string
): any {
  return {
    reportType: 'Company Tax Summary',
    taxYear,
    generatedDate: new Date().toISOString(),
    
    company: {
      name: companyDetails.companyName,
      registrationNumber: companyDetails.companyNumber,
      utr: companyDetails.utr,
      accountingPeriod: `${companyDetails.accountingPeriodStart} to ${companyDetails.accountingPeriodEnd}`
    },
    
    financialSummary: {
      totalProfit: calculation.totalProfit,
      allowableExpenses: calculation.allowableExpenses,
      taxableProfit: calculation.taxableProfit,
      corporationTax: calculation.corporationTax,
      totalTaxDue: calculation.totalTaxDue,
      effectiveRate: `${(calculation.breakdown.effectiveRate * 100).toFixed(2)}%`
    },
    
    reliefs: {
      capitalAllowances: calculation.breakdown.capitalAllowancesTotal,
      rdRelief: calculation.breakdown.rdReliefTotal,
      groupRelief: calculation.breakdown.groupReliefUsed,
      lossesUsed: calculation.breakdown.lossesUsed,
      patentBoxRelief: calculation.breakdown.patentBoxRelief,
      marginalRelief: calculation.marginalRelief
    },
    
    paymentSchedule: {
      dueDate: calculateCorporationTaxDueDate(companyDetails.accountingPeriodEnd),
      quarterlyPayments: calculateQuarterlyPayments(calculation.totalTaxDue)
    },
    
    nextSteps: [
      'Review all figures for accuracy',
      'Ensure all supporting documentation is available',
      'Submit CT600 form to HMRC before the due date',
      'Make payment by the due date to avoid penalties',
      'Keep records for at least 6 years'
    ]
  };
} 