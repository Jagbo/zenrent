# ZenRent Onboarding Flow Testing

This document outlines how to run the automated test that validates the ZenRent onboarding flow.

## Test Overview

The `onboarding-flow-test.spec.ts` file contains a comprehensive end-to-end test that:

1. Tests if all pages in the onboarding flow appear in the correct order
2. Verifies that all features and input fields work correctly
3. Provides detailed reporting on pages visited and issues found

## Expected Onboarding Flow

The test expects the following pages in this sequence:

1. **Sign Up** (`/sign-up`)
2. **Landlord Information**
   - Personal Profile (`/onboarding/landlord/personal-profile`)
   - Company Profile (`/onboarding/landlord/company-profile`) - if applicable
   - Tax Information (`/onboarding/landlord/tax-information`)
3. **Property Setup**
   - Import Options (`/onboarding/property/import-options`)
   - Add Property (`/onboarding/property/add-property`)
   - Media (`/onboarding/property/media`) - optional
   - Compliance (`/onboarding/property/compliance`)
   - Financial (`/onboarding/property/financial`)
4. **Tenant Setup**
   - Import Options (`/onboarding/tenant/import-options`)
   - Tenancy Setup (`/onboarding/tenant/tenancy-setup`)
   - Confirmation (`/onboarding/tenant/confirmation`)
5. **Finalization**
   - Notifications Setup (`/onboarding/setup/notifications`)
   - Completion (`/onboarding/setup/completion` or `/onboarding/tenant/complete`)

## Running the Test

To run the test:

1. Ensure you have Playwright installed. If not, run:
   ```bash
   npm install -D @playwright/test
   npx playwright install
   ```

2. Run the test:
   ```bash
   npx playwright test onboarding-flow-test.spec.ts
   ```

3. For headful mode (to see the browser):
   ```bash
   npx playwright test onboarding-flow-test.spec.ts --headed
   ```

4. For debugging:
   ```bash
   npx playwright test onboarding-flow-test.spec.ts --debug
   ```

## Test Output

The test produces detailed console output including:
- Pages visited in sequence
- Issues encountered (categorized by severity)
- Summary statistics (total pages, total issues)

## Interpreting Results

The test logs the following:

1. **Pages Visited**: All pages successfully navigated during the test
2. **Issues Found**: Categorized as:
   - **High**: Critical issues that prevent completion of a step
   - **Medium**: Functional issues that degrade experience but don't block progress
   - **Low**: Minor issues or warnings

## Customizing the Test

You may need to adjust the test for your specific environment:

- Update the test credentials used
- Adjust selectors if the UI has changed
- Modify the expected flow if the onboarding sequence has been updated

## Troubleshooting

If the test fails:

1. Check browser console errors
2. Verify the application is running and accessible
3. Check if elements have been renamed or restructured
4. Examine screenshots/videos in the test-results directory

## Maintenance

This test should be updated whenever the onboarding flow changes, including:
- New pages added to the flow
- Fields or form elements changing
- Navigation patterns being modified 