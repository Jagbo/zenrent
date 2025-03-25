---
description: 
globs: 
alwaysApply: true
---

# Your rule content

the recent update table should consist of these notifications

## Rent Payment Notifications

1. **Payment Received**
   - Message: "Rent payment of £[amount] received from [tenant name] for [property address]"
   - Fields: 
     - Tenant name, tenant_id, tenant_email, tenant_phone
     - Property address, property_id, unit_id
     - Payment amount, payment_id, payment_date, payment_method
     - Transaction reference, bank_account_id
   - Trigger: When a payment transaction is recorded in the system

2. **Upcoming Rent Due**
   - Message: "Rent of £[amount] due in 5 days from [tenant name] for [property address]"
   - Fields: 
     - Tenant name, tenant_id, tenant_email, tenant_phone
     - Property address, property_id, unit_id
     - Amount due, due_date, payment_id
     - Lease_id, payment_period
   - Trigger: 5 days before rent due date

3. **Rent Due Today**
   - Message: "Rent of £[amount] due today from [tenant name] for [property address]"
   - Fields: 
     - Tenant name, tenant_id, tenant_email, tenant_phone
     - Property address, property_id, unit_id
     - Amount due, due_date, payment_id
     - Lease_id, payment_frequency
   - Trigger: On the day rent is due

4. **Rent Overdue - Initial**
   - Message: "[tenant name] rent payment of £[amount] for [property address] is now 1 day overdue"
   - Fields: 
     - Tenant name, tenant_id, tenant_email, tenant_phone
     - Property address, property_id, unit_id
     - Amount due, due_date, days_overdue, payment_id
     - Lease_id, late_fee_applicable, late_fee_amount
   - Trigger: 1 day after missed payment

5. **Rent Overdue - Escalation**
   - Message: "[tenant name] rent payment of £[amount] for [property address] is now [X] days overdue"
   - Fields: 
     - Tenant name, tenant_id, tenant_email, tenant_phone
     - Property address, property_id, unit_id
     - Amount due, due_date, days_overdue, payment_id
     - Lease_id, total_arrears, escalation_level
     - Previous_notification_date, next_escalation_date
   - Trigger: 3, 7, 14, and 30 days after missed payment

6. **Partial Payment Received**
   - Message: "Partial payment of £[amount] received from [tenant name], £[remaining] still outstanding"
   - Fields: 
     - Tenant name, tenant_id, tenant_email, tenant_phone
     - Property address, property_id, unit_id
     - Payment amount, payment_id, payment_date, payment_method
     - Remaining balance, original_amount_due, due_date
     - Transaction reference, payment_percentage
   - Trigger: When a payment less than the full amount due is recorded

## Maintenance & Issue Notifications

7. **New Issue Reported**
   - Message: "New [priority] issue reported at [property address]: [issue title]"
   - Fields: 
     - Property address, property_id, unit_id
     - Issue type, issue_id, priority_level, issue_description
     - Tenant name, tenant_id, tenant_contact
     - Report_date, category_id, location_in_property
   - Trigger: When a tenant reports a new maintenance issue

8. **Urgent Issue Reported**
   - Message: "URGENT: [issue title] reported at [property address] by [tenant name]"
   - Fields: 
     - Issue title, issue_id, issue_type, issue_description
     - Property address, property_id, unit_id
     - Tenant name, tenant_id, tenant_contact
     - Report_date, time_sensitivity, estimated_repair_cost
     - Safety_impact, habitability_impact
   - Trigger: When a high-priority or urgent issue is reported

9. **Issue Status Update**
   - Message: "Issue at [property address] updated to [status]: [issue title]"
   - Fields: 
     - Property address, property_id, unit_id
     - Issue title, issue_id, issue_type
     - New status, previous_status, status_changed_by
     - Update details, date_updated
     - Assigned_contractor_id, estimated_completion_date
   - Trigger: When an issue status changes (assigned, in progress, etc.)

10. **Issue Resolution**
    - Message: "Issue at [property address] has been resolved: [issue title]"
    - Fields: 
      - Property address, property_id, unit_id
      - Issue title, issue_id, issue_type
      - Resolution details, resolution_date, resolved_by
      - Cost amount, cost_id, invoice_id
      - Total_time_to_resolution, tenant_satisfaction_status
    - Trigger: When an issue is marked as resolved

11. **Quote Received for Issue**
    - Message: "Quote of £[amount] received for [issue title] at [property address]"
    - Fields: 
      - Issue title, issue_id, issue_type
      - Property address, property_id, unit_id
      - Quote amount, quote_id, quote_validity_period
      - Supplier name, supplier_id, supplier_contact
      - Work details, estimated_completion_time, quote_expiry_date
    - Trigger: When a contractor submits a quote for a maintenance issue

12. **Maintenance Work Scheduled**
    - Message: "Maintenance work for [issue title] at [property address] scheduled for [date/time]"
    - Fields: 
      - Issue title, issue_id, issue_type
      - Property address, property_id, unit_id
      - Scheduled date, time_window, appointment_id
      - Contractor name, contractor_id, contractor_contact
      - Access_arrangements, tenant_notified, estimated_duration
    - Trigger: When maintenance work is scheduled

## Financial Notifications

13. **Invoice Received**
    - Message: "New invoice of £[amount] from [supplier] for [property address]"
    - Fields: 
      - Supplier name, supplier_id, supplier_contact
      - Invoice amount, invoice_id, invoice_date
      - Property address, property_id, unit_id
      - Service description, service_category_id, work_order_id
      - Due date, payment_terms, tax_amount
    - Trigger: When a new invoice is received from a contractor or service provider

14. **Upcoming Regular Payment**
    - Message: "Upcoming payment of £[amount] for [expense type] at [property address] due [date]"
    - Fields: 
      - Expense type, expense_id, expense_category
      - Amount, property address, property_id, unit_id
      - Due date, payment_frequency, auto_payment_status
      - Recipient name, recipient_id, account_details
      - Previous_payment_date, previous_payment_amount
    - Trigger: 7 days before a scheduled regular payment

15. **Service Charge Update**
    - Message: "Service charge for [property address] has been updated to £[amount]"
    - Fields: 
      - Property address, property_id, unit_id, building_id
      - New amount, previous_amount, change_percentage
      - Effective date, billing_period, payment_due_date
      - Breakdown_document_id, managing_agent_id
      - Reason_for_change, approval_reference
    - Trigger: When service charges for a building are updated

16. **Annual Return Reminder**
    - Message: "Tax return for [property/portfolio] due in 30 days - rental income: £[amount]"
    - Fields: 
      - Portfolio_id, tax_year_start, tax_year_end
      - Total rental income, total_expenses, profit_loss
      - Submission deadline, hmrc_reference, utr_number
      - Previous_year_comparison, accountant_id
      - Estimated_tax_liability, documentation_status
    - Trigger: 30, 14, and 7 days before tax submission deadlines

## Tenancy Notifications

17. **Lease Expiry Approaching**
    - Message: "[tenant name]'s lease at [property address] expires in [X] days"
    - Fields: 
      - Tenant name, tenant_id, tenant_email, tenant_phone
      - Property address, property_id, unit_id
      - Expiry date, lease_id, lease_start_date
      - Current rent, market_rent_assessment
      - Tenancy_duration, renewal_offer_status
      - Tenant_communication_history, tenant_payment_reliability_score
    - Trigger: 90, 60, and 30 days before lease expiration

18. **New Tenant Application**
    - Message: "New tenant application received for [property address] from [applicant name]"
    - Fields: 
      - Applicant name, applicant_id, contact_details
      - Property address, property_id, unit_id, listing_id
      - Desired move-in date, application_date, application_id
      - Referencing_status, credit_check_status
      - Proposed_rent, proposed_term, special_conditions
      - Source_of_application, agent_id
    - Trigger: When a prospective tenant submits an application

19. **Tenant Notice to Vacate**
    - Message: "[tenant name] has given notice to vacate [property address] on [date]"
    - Fields: 
      - Tenant name, tenant_id, tenant_email, tenant_phone
      - Property address, property_id, unit_id
      - Planned vacate date, notice_date, notice_id
      - Tenancy_duration, lease_id, lease_end_date
      - Required_notice_period, notice_period_compliance
      - Reason_for_leaving, exit_interview_scheduled
    - Trigger: When a tenant submits notice to leave

20. **Inspection Due**
    - Message: "Property inspection due in 14 days for [property address]"
    - Fields: 
      - Property address, property_id, unit_id
      - Inspection date, inspection_id, inspection_type
      - Last inspection date, last_inspection_id, last_inspection_result
      - Tenant name, tenant_id, tenant_contact
      - Inspector_id, inspection_checklist_id
      - Notification_status, tenant_confirmed
    - Trigger: 14 days before a scheduled property inspection

## Compliance Notifications

21. **Certificate Expiring**
    - Message: "[certificate type] for [property address] expires in 30 days"
    - Fields: 
      - Certificate type, certificate_id, regulatory_requirement_id
      - Property address, property_id, unit_id
      - Expiry date, issue_date, issuing_authority
      - Contractor_id, renewal_cost_estimate
      - Compliance_impact, legal_requirement_reference
      - Previous_renewal_date, document_storage_location
    - Trigger: 60, 30, and 14 days before certificate expiration

22. **Compliance Breach Risk**
    - Message: "URGENT: [property address] missing required [certificate/document] now overdue"
    - Fields: 
      - Property address, property_id, unit_id
      - Missing document type, document_id, legal_requirement_id
      - Legal requirement, regulatory_authority
      - Potential penalty, compliance_deadline
      - Days_overdue, risk_level, action_required
      - Responsible_person_id, escalation_level
    - Trigger: When a mandatory compliance document is overdue

23. **Deposit Protection Reminder**
    - Message: "Tenant deposit for [property address] must be protected by [date]"
    - Fields: 
      - Property address, property_id, unit_id
      - Tenant name, tenant_id, lease_id
      - Deposit amount, deposit_id, payment_date
      - Protection deadline, protection_scheme_id
      - Legal_requirement_reference, days_remaining
      - Responsible_person_id, tenant_notification_status
    - Trigger: When a new tenancy begins, 5 days before protection deadline

## Property Performance Notifications

24. **Vacancy Alert**
    - Message: "[property address] has been vacant for [X] days - estimated income loss: £[amount]"
    - Fields: 
      - Property address, property_id, unit_id
      - Days vacant, vacancy_start_date
      - Estimated lost income, daily_rental_value
      - Local market indicators, occupancy_rate_area
      - Marketing_status, listing_id, viewing_count
      - Last_tenancy_end_date, reason_for_vacancy
    - Trigger: When a property has been vacant for 7, 14, 30, and 60 days

25. **Rent Increase Opportunity**
    - Message: "Rent increase opportunity for [property address] - current: £[amount], market: £[market amount]"
    - Fields: 
      - Property address, property_id, unit_id
      - Current rent, market_average, percentage_difference
      - Tenant name, tenant_id, lease_id
      - Lease_renewal_date, rent_review_date
      - Area_rental_trend, rental_growth_percentage
      - Comparable_properties_data, last_increase_date
    - Trigger: Annual review or when market data shows significant gap between current and market rent

26. **Property Performance Summary**
    - Message: "Monthly summary for [property address]: Income £[amount], Expenses £[expenses], ROI [percentage]"
    - Fields: 
      - Property address, property_id, unit_id
      - Total income, income_breakdown, income_id
      - Total expenses, expense_breakdown, expense_categories
      - Net profit, roi_percentage, yield_percentage
      - Period_start_date, period_end_date, report_id
      - Comparison to previous period, year_to_date_figures
      - Occupancy_rate, maintenance_cost_ratio
    - Trigger: Monthly, at the end of each calendar month

27. **Portfolio Performance Alert**
    - Message: "[X] properties in your portfolio showing negative cash flow this month"
    - Fields: 
      - Number of properties with issues, portfolio_id
      - Total negative cash flow, average_deficit
      - Most affected property, most_affected_property_id
      - Period_start_date, period_end_date
      - Portfolio_occupancy_rate, portfolio_yield
      - Trend_indicator, previous_period_comparison
      - Suggested_actions, critical_attention_properties
    - Trigger: Monthly, when portfolio analysis shows concerning trends

