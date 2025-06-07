// ZenRent Analytics Events
// This file defines all the events we track in PostHog for consistency

export const ANALYTICS_EVENTS = {
  // User Authentication Events
  USER_SIGNED_UP: 'user_signed_up',
  USER_LOGGED_IN: 'user_logged_in',
  USER_LOGGED_OUT: 'user_logged_out',
  MFA_ENABLED: 'mfa_enabled',
  MFA_DISABLED: 'mfa_disabled',

  // Property Management Events
  PROPERTY_CREATED: 'property_created',
  PROPERTY_UPDATED: 'property_updated',
  PROPERTY_DELETED: 'property_deleted',
  PROPERTY_VIEWED: 'property_viewed',
  PROPERTY_IMPORTED: 'property_imported',

  // Tenant Management Events
  TENANT_ADDED: 'tenant_added',
  TENANT_UPDATED: 'tenant_updated',
  TENANT_REMOVED: 'tenant_removed',
  TENANT_INVITED: 'tenant_invited',
  TENANT_DOCUMENT_UPLOADED: 'tenant_document_uploaded',

  // Financial Events
  TRANSACTION_CREATED: 'transaction_created',
  TRANSACTION_CATEGORIZED: 'transaction_categorized',
  BANK_ACCOUNT_CONNECTED: 'bank_account_connected',
  BANK_ACCOUNT_DISCONNECTED: 'bank_account_disconnected',
  RENT_PAYMENT_RECEIVED: 'rent_payment_received',
  EXPENSE_RECORDED: 'expense_recorded',

  // Tax Events
  TAX_RETURN_STARTED: 'tax_return_started',
  TAX_RETURN_SUBMITTED: 'tax_return_submitted',
  TAX_DOCUMENT_GENERATED: 'tax_document_generated',
  HMRC_CONNECTED: 'hmrc_connected',
  HMRC_DISCONNECTED: 'hmrc_disconnected',

  // WhatsApp Integration Events
  WHATSAPP_CONNECTED: 'whatsapp_connected',
  WHATSAPP_MESSAGE_SENT: 'whatsapp_message_sent',
  WHATSAPP_MESSAGE_RECEIVED: 'whatsapp_message_received',
  WHATSAPP_OPT_IN_TOGGLED: 'whatsapp_opt_in_toggled',

  // Subscription Events
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_UPGRADED: 'subscription_upgraded',
  SUBSCRIPTION_DOWNGRADED: 'subscription_downgraded',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  PAYMENT_SUCCESSFUL: 'payment_successful',
  PAYMENT_FAILED: 'payment_failed',

  // Issue Management Events
  ISSUE_CREATED: 'issue_created',
  ISSUE_UPDATED: 'issue_updated',
  ISSUE_RESOLVED: 'issue_resolved',
  QUOTE_REQUESTED: 'quote_requested',
  QUOTE_ACCEPTED: 'quote_accepted',

  // Dashboard Events
  DASHBOARD_VIEWED: 'dashboard_viewed',
  REPORT_GENERATED: 'report_generated',
  EXPORT_DOWNLOADED: 'export_downloaded',

  // Onboarding Events
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_STEP_COMPLETED: 'onboarding_step_completed',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_ABANDONED: 'onboarding_abandoned',

  // Feature Usage Events
  FEATURE_USED: 'feature_used',
  HELP_ACCESSED: 'help_accessed',
  FEEDBACK_SUBMITTED: 'feedback_submitted',
} as const

export type AnalyticsEvent = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS]

// Common property interfaces for type safety
export interface UserProperties {
  email?: string
  plan?: 'free' | 'essential' | 'standard' | 'professional'
  properties_count?: number
  tenants_count?: number
  subscription_status?: string
  signup_date?: string
  last_login?: string
  user_type?: 'landlord' | 'tenant' | 'admin'
}

export interface PropertyEventProperties {
  property_id?: string
  property_type?: 'apartment' | 'house' | 'commercial' | 'hmo'
  location?: string
  rent_amount?: number
  bedrooms?: number
  bathrooms?: number
  is_hmo?: boolean
}

export interface FinancialEventProperties {
  amount?: number
  currency?: string
  category?: string
  transaction_type?: 'income' | 'expense'
  payment_method?: string
  bank_account_id?: string
}

export interface TaxEventProperties {
  tax_year?: string
  return_type?: 'personal' | 'company'
  total_income?: number
  total_expenses?: number
  tax_owed?: number
}

export interface WhatsAppEventProperties {
  phone_number_id?: string
  message_type?: 'text' | 'template' | 'media'
  tenant_id?: string
  conversation_id?: string
}

// Helper function to create consistent event properties
export function createEventProperties(
  baseProperties: Record<string, any> = {},
  additionalProperties: Record<string, any> = {}
): Record<string, any> {
  return {
    timestamp: new Date().toISOString(),
    platform: 'zenrent',
    environment: process.env.NODE_ENV || 'development',
    ...baseProperties,
    ...additionalProperties,
  }
} 