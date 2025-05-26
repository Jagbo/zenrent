# Task ID: 9
# Title: MTD-Integrated Tax Dashboard UI
# Status: in-progress
# Dependencies: 3, 5, 6, 7
# Priority: medium
# Description: Create a comprehensive tax dashboard UI that integrates with Making Tax Digital while preserving existing functionality.
# Details:

1. **Preserve and enhance the existing filing page structure** including:
   - The tax wizard progress steps navigation (Personal Details → Properties → Transactions → Adjustments → Summary → Filing)
   - The "Tax Filing with Making Tax Digital" header section
   - The current tax year information display
   - The 3-step filing process guide (Connect to HMRC → View Obligations → Submit Return)
   - The Help Section with MTD information, support contact, and HMRC resources

2. **Enhance the ObligationsSection component** to:
   - Maintain its current functionality showing compliance status and obligations list
   - Add filtering capabilities by tax type and status
   - Improve the visual presentation of due dates and statuses

3. **Implement a tax type selector** that:
   - Allows users to switch between different tax types (VAT, Income Tax, Self Assessment)
   - Preserves the current HMRC connection flow regardless of selected tax type
   - Filters obligations and submission options based on the selected tax type

4. **Add a submission dashboard** that:
   - Shows submission history for each tax type
   - Displays upcoming deadlines with clear status indicators
   - Provides quick access to start new submissions

5. **Implement an enhanced HMRC connection status display** that:
   - Maintains the current connection flow and status indicators
   - Provides more detailed information about the connection status
   - Handles connection errors with improved user feedback

6. **Create a responsive layout** that:
   - Works well on both desktop and mobile devices
   - Maintains the current clean, professional design aesthetic
   - Preserves all current navigation options (Back to Summary, Return to Dashboard)

# Test Strategy:
1. Verify that all existing functionality from the current filing page is preserved
2. Test the tax type selector to ensure it correctly filters obligations and options
3. Validate that the HMRC connection flow works correctly
4. Test the responsive layout on different device sizes
5. Ensure that all navigation options work as expected
6. Verify that the submission dashboard correctly displays history and deadlines
