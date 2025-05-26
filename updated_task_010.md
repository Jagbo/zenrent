# Task ID: 10
# Title: MTD-Integrated Tax Submission Wizard
# Status: in-progress
# Dependencies: 4, 5, 6, 7
# Priority: medium
# Description: Create a guided wizard interface that builds upon the existing tax flow to facilitate MTD submissions.
# Details:

1. **Build upon the existing 3-step filing process** by:
   - Maintaining the current "Connect to HMRC" step
   - Enhancing the "View Your Obligations" step with more detailed information
   - Expanding the "Submit Your Return" step into a multi-step submission wizard

2. **Implement a submission type selection** that:
   - Integrates with the existing tax year information display
   - Allows users to choose between VAT, Income Tax, or Self Assessment
   - Preserves the current tax preparation data for use in submissions

3. **Create a period selection interface** that:
   - Shows available reporting periods based on the obligations retrieved from HMRC
   - Highlights due dates and compliance requirements
   - Maintains consistency with the current UI design

4. **Develop a submission review step** that:
   - Shows a summary of the data prepared through the tax wizard
   - Validates the data against HMRC's requirements
   - Provides clear indicators of any issues that need to be addressed

5. **Implement the submission process** that:
   - Connects to HMRC using the existing OAuth connection
   - Submits the prepared data for the selected period
   - Provides real-time feedback on submission status
   - Updates the obligations list after successful submission

6. **Add draft saving functionality** that:
   - Automatically saves progress throughout the submission process
   - Allows users to resume incomplete submissions
   - Integrates with the existing tax preparation workflow

7. **Preserve the existing navigation options** including:
   - The ability to go back to the Summary page
   - The option to return to the Dashboard
   - The step-by-step navigation through the tax preparation wizard

# Test Strategy:
1. Test the submission type selection to ensure it correctly configures the wizard
2. Verify that the period selection interface correctly displays obligations from HMRC
3. Test the submission review step with various data scenarios
4. Validate the submission process with HMRC's test environment
5. Test the draft saving functionality to ensure data is preserved
6. Verify that all navigation options work correctly
7. Test the entire flow end-to-end with different tax types and periods
