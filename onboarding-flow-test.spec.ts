import { test, expect } from '@playwright/test';

// Define types for tracking pages and issues
interface PageVisited {
  name: string;
  url: string;
}

interface IssueFound {
  page: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

// Test the entire onboarding flow
test('Complete onboarding flow test', async ({ page }) => {
  // Track all pages visited and issues found
  const pagesVisited: PageVisited[] = [];
  const issuesFound: IssueFound[] = [];

  const logPage = (pageName: string, url: string) => {
    pagesVisited.push({ name: pageName, url });
    console.log(`Visiting: ${pageName} (${url})`);
  };

  const logIssue = (page: string, description: string, severity: 'high' | 'medium' | 'low') => {
    issuesFound.push({ page, description, severity });
    console.log(`Issue: [${severity.toUpperCase()}] ${page} - ${description}`);
  };

  // Start with signup
  await page.goto('/sign-up');
  logPage('Sign Up', page.url());
  
  // Check if all form elements are present
  const emailInput = page.getByLabel('Email');
  const passwordInput = page.getByLabel('Password', { exact: true });
  const confirmPasswordInput = page.getByLabel('Confirm Password');
  
  if (await emailInput.isVisible())
    await emailInput.fill('test@example.com');
  else
    logIssue('Sign Up', 'Email input not found', 'high');
  
  if (await passwordInput.isVisible())
    await passwordInput.fill('Password123!');
  else
    logIssue('Sign Up', 'Password input not found', 'high');
  
  if (await confirmPasswordInput.isVisible())
    await confirmPasswordInput.fill('Password123!');
  else
    logIssue('Sign Up', 'Confirm password input not found', 'high');

  // Submit form
  await page.getByRole('button', { name: /sign up/i }).click();
  
  // Wait for navigation to the first onboarding page
  await page.waitForNavigation();
  logPage('Initial Onboarding Page', page.url());

  // Landlord Personal Profile
  // Check if we're on the personal profile page
  if (page.url().includes('/onboarding/landlord/personal-profile')) {
    logPage('Landlord Personal Profile', page.url());
    
    try {
      await page.getByLabel('First Name').fill('John');
      await page.getByLabel('Last Name').fill('Doe');
      await page.getByLabel('Phone Number').fill('07700900000');
      await page.getByRole('button', { name: /next/i, exact: false }).click();
      await page.waitForNavigation();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logIssue('Landlord Personal Profile', `Error filling form: ${errorMessage}`, 'high');
    }
  } else {
    logIssue('Navigation', 'Did not navigate to personal profile page as expected', 'high');
  }

  // Company Profile (if present)
  if (page.url().includes('/onboarding/landlord/company-profile')) {
    logPage('Landlord Company Profile', page.url());
    
    try {
      // Check if this is a radio button selection first (individual vs company)
      const individualOption = page.getByLabel(/individual/i);
      const companyOption = page.getByLabel(/company/i);
      
      if (await individualOption.isVisible() || await companyOption.isVisible()) {
        await individualOption.check();
      } else {
        // Otherwise it's a direct company profile form
        await page.getByLabel('Company Name').fill('Test Company');
        await page.getByLabel('Company Registration Number').fill('12345678');
      }
      
      await page.getByRole('button', { name: /next/i, exact: false }).click();
      await page.waitForNavigation();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logIssue('Landlord Company Profile', `Error filling form: ${errorMessage}`, 'medium');
    }
  }

  // Tax Information
  if (page.url().includes('/onboarding/landlord/tax-information')) {
    logPage('Landlord Tax Information', page.url());
    
    try {
      // Attempt to fill tax information form
      const taxRegistered = page.getByLabel(/tax registered/i);
      if (await taxRegistered.isVisible()) {
        await taxRegistered.check();
      }
      
      const taxNumberInput = page.getByLabel(/tax number/i);
      if (await taxNumberInput.isVisible()) {
        await taxNumberInput.fill('123456789');
      }
      
      await page.getByRole('button', { name: /next/i, exact: false }).click();
      await page.waitForNavigation();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logIssue('Landlord Tax Information', `Error filling form: ${errorMessage}`, 'medium');
    }
  }

  // Property Import Options
  if (page.url().includes('/onboarding/property/import-options')) {
    logPage('Property Import Options', page.url());
    
    try {
      // Select manual entry option if available
      const manualEntryOption = page.getByText(/add manually/i);
      if (await manualEntryOption.isVisible()) {
        await manualEntryOption.click();
      } else {
        // Click the next or continue button
        await page.getByRole('button', { name: /next|continue/i }).click();
      }
      await page.waitForNavigation();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logIssue('Property Import Options', `Error on page: ${errorMessage}`, 'medium');
    }
  }

  // Add Property
  if (page.url().includes('/onboarding/property/add-property')) {
    logPage('Add Property', page.url());
    
    try {
      // Fill property details form
      await page.getByLabel('Property Name').fill('Test Property');
      await page.getByLabel(/address line 1/i).fill('123 Test Street');
      await page.getByLabel(/town\/city/i).fill('Test City');
      await page.getByLabel(/postcode/i).fill('TE1 1ST');
      
      // Select property type if dropdown exists
      const propertyTypeDropdown = page.getByRole('combobox', { name: /property type/i });
      if (await propertyTypeDropdown.isVisible()) {
        await propertyTypeDropdown.selectOption({ label: 'House' });
      }
      
      await page.getByRole('button', { name: /next|save/i }).click();
      await page.waitForNavigation();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logIssue('Add Property', `Error filling property form: ${errorMessage}`, 'high');
    }
  }

  // Property Media (if present)
  if (page.url().includes('/onboarding/property/media')) {
    logPage('Property Media', page.url());
    
    try {
      // We'll skip actual file upload but check if the page works
      const skipButton = page.getByRole('button', { name: /skip|next/i });
      if (await skipButton.isVisible()) {
        await skipButton.click();
        await page.waitForNavigation();
      } else {
        logIssue('Property Media', 'No skip or next button found', 'low');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logIssue('Property Media', `Error on media page: ${errorMessage}`, 'low');
    }
  }

  // Property Compliance
  if (page.url().includes('/onboarding/property/compliance')) {
    logPage('Property Compliance', page.url());
    
    try {
      // Fill compliance details or skip
      const skipButton = page.getByRole('button', { name: /skip|next/i });
      if (await skipButton.isVisible()) {
        await skipButton.click();
        await page.waitForNavigation();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logIssue('Property Compliance', `Error on compliance page: ${errorMessage}`, 'medium');
    }
  }

  // Property Financial Details
  if (page.url().includes('/onboarding/property/financial')) {
    logPage('Property Financial Details', page.url());
    
    try {
      // Fill rent amount if field exists
      const rentAmountInput = page.getByLabel(/rent amount/i);
      if (await rentAmountInput.isVisible()) {
        await rentAmountInput.fill('1200');
      }
      
      // Fill payment frequency if dropdown exists
      const frequencyDropdown = page.getByLabel(/frequency/i);
      if (await frequencyDropdown.isVisible()) {
        await frequencyDropdown.selectOption({ label: 'Monthly' });
      }
      
      await page.getByRole('button', { name: /next|continue/i }).click();
      await page.waitForNavigation();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logIssue('Property Financial Details', `Error on financial page: ${errorMessage}`, 'medium');
    }
  }

  // Tenant Import Options
  if (page.url().includes('/onboarding/tenant/import-options')) {
    logPage('Tenant Import Options', page.url());
    
    try {
      // Select manual entry option if available
      const manualEntryOption = page.getByText(/add manually/i);
      if (await manualEntryOption.isVisible()) {
        await manualEntryOption.click();
      } else {
        // Click the next or continue button
        await page.getByRole('button', { name: /next|continue/i }).click();
      }
      await page.waitForNavigation();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logIssue('Tenant Import Options', `Error on page: ${errorMessage}`, 'medium');
    }
  }

  // Tenancy Setup
  if (page.url().includes('/onboarding/tenant/tenancy-setup')) {
    logPage('Tenancy Setup', page.url());
    
    try {
      // Fill tenant details
      await page.getByLabel('First Name').fill('Jane');
      await page.getByLabel('Last Name').fill('Smith');
      await page.getByLabel('Email').fill('tenant@example.com');
      await page.getByLabel('Phone Number').fill('07700900001');
      
      // Fill tenancy details if fields exist
      const startDateInput = page.getByLabel(/start date/i);
      if (await startDateInput.isVisible()) {
        await startDateInput.fill(new Date().toISOString().split('T')[0]); // Today's date
      }
      
      const endDateInput = page.getByLabel(/end date/i);
      if (await endDateInput.isVisible()) {
        // Set end date to one year from now
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1);
        await endDateInput.fill(endDate.toISOString().split('T')[0]);
      }
      
      await page.getByRole('button', { name: /next|save/i }).click();
      await page.waitForNavigation();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logIssue('Tenancy Setup', `Error filling tenant form: ${errorMessage}`, 'high');
    }
  }

  // Tenant Confirmation Page
  if (page.url().includes('/onboarding/tenant/confirmation')) {
    logPage('Tenant Confirmation', page.url());
    
    try {
      await page.getByRole('button', { name: /confirm|next/i }).click();
      await page.waitForNavigation();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logIssue('Tenant Confirmation', `Error on confirmation page: ${errorMessage}`, 'medium');
    }
  }

  // Setup Notifications
  if (page.url().includes('/onboarding/setup/notifications')) {
    logPage('Setup Notifications', page.url());
    
    try {
      // Enable or configure notifications
      const enableNotifications = page.getByLabel(/enable notifications/i);
      if (await enableNotifications.isVisible()) {
        await enableNotifications.check();
      }
      
      await page.getByRole('button', { name: /next|continue/i }).click();
      await page.waitForNavigation();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logIssue('Setup Notifications', `Error on notifications page: ${errorMessage}`, 'low');
    }
  }

  // Completion Page
  if (page.url().includes('/onboarding/setup/completion') || page.url().includes('/onboarding/tenant/complete')) {
    logPage('Onboarding Completion', page.url());
    
    try {
      // Check if there's a "Go to Dashboard" button
      const dashboardButton = page.getByRole('button', { name: /dashboard|done/i });
      if (await dashboardButton.isVisible()) {
        // We don't actually click it to end the test at the completion page
        console.log('Onboarding flow complete!');
      } else {
        logIssue('Onboarding Completion', 'No dashboard or completion button found', 'low');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logIssue('Onboarding Completion', `Error on completion page: ${errorMessage}`, 'medium');
    }
  } else {
    logIssue('Navigation', 'Did not reach completion page', 'high');
  }

  // Generate summary report
  console.log('\n---- ONBOARDING FLOW TEST SUMMARY ----');
  console.log(`Total pages visited: ${pagesVisited.length}`);
  console.log(`Total issues found: ${issuesFound.length}`);
  
  console.log('\nPages Visited:');
  pagesVisited.forEach((page, index) => {
    console.log(`${index+1}. ${page.name} (${page.url})`);
  });
  
  console.log('\nIssues Found:');
  issuesFound.forEach((issue, index) => {
    console.log(`${index+1}. [${issue.severity.toUpperCase()}] ${issue.page}: ${issue.description}`);
  });
}); 