export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      bank_connections: {
        Row: {
          created_at: string | null
          cursor: string | null
          id: number
          plaid_access_token: string
          plaid_item_id: string
          property_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          cursor?: string | null
          id?: number
          plaid_access_token: string
          plaid_item_id: string
          property_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          cursor?: string | null
          id?: number
          plaid_access_token?: string
          plaid_item_id?: string
          property_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      bank_transactions: {
        Row: {
          amount: number
          category: string[] | null
          created_at: string | null
          date: string
          id: number
          merchant_name: string | null
          name: string | null
          pending: boolean | null
          plaid_transaction_id: string
          property_id: string
        }
        Insert: {
          amount: number
          category?: string[] | null
          created_at?: string | null
          date: string
          id?: number
          merchant_name?: string | null
          name?: string | null
          pending?: boolean | null
          plaid_transaction_id: string
          property_id: string
        }
        Update: {
          amount?: number
          category?: string[] | null
          created_at?: string | null
          date?: string
          id?: number
          merchant_name?: string | null
          name?: string | null
          pending?: boolean | null
          plaid_transaction_id?: string
          property_id?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          all_day: boolean | null
          created_at: string
          date: string
          description: string | null
          end_time: string | null
          event_type: string
          id: string
          location: string | null
          property_id: string | null
          start_time: string | null
          tenant_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          all_day?: boolean | null
          created_at?: string
          date: string
          description?: string | null
          end_time?: string | null
          event_type: string
          id?: string
          location?: string | null
          property_id?: string | null
          start_time?: string | null
          tenant_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          all_day?: boolean | null
          created_at?: string
          date?: string
          description?: string | null
          end_time?: string | null
          event_type?: string
          id?: string
          location?: string | null
          property_id?: string | null
          start_time?: string | null
          tenant_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      compliance_notifications: {
        Row: {
          action_required: string | null
          certificate_id: string | null
          certificate_type: string | null
          compliance_deadline: string | null
          compliance_impact: string | null
          contractor_id: string | null
          days_overdue: number | null
          days_remaining: number | null
          deposit_amount: number | null
          deposit_id: string | null
          document_id: string | null
          document_storage_location: string | null
          escalation_level: number | null
          expiry_date: string | null
          id: string
          issue_date: string | null
          issuing_authority: string | null
          legal_requirement: string | null
          legal_requirement_id: string | null
          legal_requirement_reference: string | null
          missing_document_type: string | null
          notification_id: string
          payment_date: string | null
          potential_penalty: string | null
          previous_renewal_date: string | null
          property_address: string | null
          property_id: string | null
          protection_deadline: string | null
          protection_scheme_id: string | null
          regulatory_authority: string | null
          regulatory_requirement_id: string | null
          renewal_cost_estimate: number | null
          responsible_person_id: string | null
          risk_level: string | null
          tenant_notification_status: string | null
          unit_id: string | null
        }
        Insert: {
          action_required?: string | null
          certificate_id?: string | null
          certificate_type?: string | null
          compliance_deadline?: string | null
          compliance_impact?: string | null
          contractor_id?: string | null
          days_overdue?: number | null
          days_remaining?: number | null
          deposit_amount?: number | null
          deposit_id?: string | null
          document_id?: string | null
          document_storage_location?: string | null
          escalation_level?: number | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_authority?: string | null
          legal_requirement?: string | null
          legal_requirement_id?: string | null
          legal_requirement_reference?: string | null
          missing_document_type?: string | null
          notification_id: string
          payment_date?: string | null
          potential_penalty?: string | null
          previous_renewal_date?: string | null
          property_address?: string | null
          property_id?: string | null
          protection_deadline?: string | null
          protection_scheme_id?: string | null
          regulatory_authority?: string | null
          regulatory_requirement_id?: string | null
          renewal_cost_estimate?: number | null
          responsible_person_id?: string | null
          risk_level?: string | null
          tenant_notification_status?: string | null
          unit_id?: string | null
        }
        Update: {
          action_required?: string | null
          certificate_id?: string | null
          certificate_type?: string | null
          compliance_deadline?: string | null
          compliance_impact?: string | null
          contractor_id?: string | null
          days_overdue?: number | null
          days_remaining?: number | null
          deposit_amount?: number | null
          deposit_id?: string | null
          document_id?: string | null
          document_storage_location?: string | null
          escalation_level?: number | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_authority?: string | null
          legal_requirement?: string | null
          legal_requirement_id?: string | null
          legal_requirement_reference?: string | null
          missing_document_type?: string | null
          notification_id?: string
          payment_date?: string | null
          potential_penalty?: string | null
          previous_renewal_date?: string | null
          property_address?: string | null
          property_id?: string | null
          protection_deadline?: string | null
          protection_scheme_id?: string | null
          regulatory_authority?: string | null
          regulatory_requirement_id?: string | null
          renewal_cost_estimate?: number | null
          responsible_person_id?: string | null
          risk_level?: string | null
          tenant_notification_status?: string | null
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_notifications_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      contractors: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          hourly_rate: number | null
          id: string
          is_preferred: boolean | null
          name: string
          notes: string | null
          phone: string | null
          specialty: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          hourly_rate?: number | null
          id?: string
          is_preferred?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          specialty?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          hourly_rate?: number | null
          id?: string
          is_preferred?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          specialty?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          date: string
          description: string | null
          expense_type: string
          id: string
          property_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          date: string
          description?: string | null
          expense_type: string
          id?: string
          property_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          date?: string
          description?: string | null
          expense_type?: string
          id?: string
          property_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "tenant_property_relationships"
            referencedColumns: ["property_id"]
          },
        ]
      }
      financial_metrics: {
        Row: {
          created_at: string | null
          id: string
          maintenance_cost_ratio: number | null
          occupancy_rate: number | null
          period_end: string
          period_start: string
          property_id: string
          roi_percentage: number | null
          updated_at: string | null
          yield_percentage: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          maintenance_cost_ratio?: number | null
          occupancy_rate?: number | null
          period_end: string
          period_start: string
          property_id: string
          roi_percentage?: number | null
          updated_at?: string | null
          yield_percentage?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          maintenance_cost_ratio?: number | null
          occupancy_rate?: number | null
          period_end?: string
          period_start?: string
          property_id?: string
          roi_percentage?: number | null
          updated_at?: string | null
          yield_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_metrics_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_metrics_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "tenant_property_relationships"
            referencedColumns: ["property_id"]
          },
        ]
      }
      financial_notifications: {
        Row: {
          account_details: string | null
          accountant_id: string | null
          approval_reference: string | null
          auto_payment_status: string | null
          billing_period: string | null
          breakdown_document_id: string | null
          building_id: string | null
          change_percentage: number | null
          documentation_status: string | null
          due_date: string | null
          effective_date: string | null
          estimated_tax_liability: number | null
          expense_category: string | null
          expense_id: string | null
          expense_type: string | null
          hmrc_reference: string | null
          id: string
          invoice_amount: number | null
          invoice_date: string | null
          invoice_id: string | null
          managing_agent_id: string | null
          new_amount: number | null
          notification_id: string
          payment_frequency: string | null
          payment_terms: string | null
          portfolio_id: string | null
          previous_amount: number | null
          previous_payment_amount: number | null
          previous_payment_date: string | null
          previous_year_comparison: string | null
          profit_loss: number | null
          property_address: string | null
          property_id: string | null
          reason_for_change: string | null
          recipient_id: string | null
          recipient_name: string | null
          service_category_id: string | null
          service_description: string | null
          submission_deadline: string | null
          supplier_contact: string | null
          supplier_id: string | null
          supplier_name: string | null
          tax_amount: number | null
          tax_year_end: string | null
          tax_year_start: string | null
          total_expenses: number | null
          total_rental_income: number | null
          unit_id: string | null
          utr_number: string | null
          work_order_id: string | null
        }
        Insert: {
          account_details?: string | null
          accountant_id?: string | null
          approval_reference?: string | null
          auto_payment_status?: string | null
          billing_period?: string | null
          breakdown_document_id?: string | null
          building_id?: string | null
          change_percentage?: number | null
          documentation_status?: string | null
          due_date?: string | null
          effective_date?: string | null
          estimated_tax_liability?: number | null
          expense_category?: string | null
          expense_id?: string | null
          expense_type?: string | null
          hmrc_reference?: string | null
          id?: string
          invoice_amount?: number | null
          invoice_date?: string | null
          invoice_id?: string | null
          managing_agent_id?: string | null
          new_amount?: number | null
          notification_id: string
          payment_frequency?: string | null
          payment_terms?: string | null
          portfolio_id?: string | null
          previous_amount?: number | null
          previous_payment_amount?: number | null
          previous_payment_date?: string | null
          previous_year_comparison?: string | null
          profit_loss?: number | null
          property_address?: string | null
          property_id?: string | null
          reason_for_change?: string | null
          recipient_id?: string | null
          recipient_name?: string | null
          service_category_id?: string | null
          service_description?: string | null
          submission_deadline?: string | null
          supplier_contact?: string | null
          supplier_id?: string | null
          supplier_name?: string | null
          tax_amount?: number | null
          tax_year_end?: string | null
          tax_year_start?: string | null
          total_expenses?: number | null
          total_rental_income?: number | null
          unit_id?: string | null
          utr_number?: string | null
          work_order_id?: string | null
        }
        Update: {
          account_details?: string | null
          accountant_id?: string | null
          approval_reference?: string | null
          auto_payment_status?: string | null
          billing_period?: string | null
          breakdown_document_id?: string | null
          building_id?: string | null
          change_percentage?: number | null
          documentation_status?: string | null
          due_date?: string | null
          effective_date?: string | null
          estimated_tax_liability?: number | null
          expense_category?: string | null
          expense_id?: string | null
          expense_type?: string | null
          hmrc_reference?: string | null
          id?: string
          invoice_amount?: number | null
          invoice_date?: string | null
          invoice_id?: string | null
          managing_agent_id?: string | null
          new_amount?: number | null
          notification_id?: string
          payment_frequency?: string | null
          payment_terms?: string | null
          portfolio_id?: string | null
          previous_amount?: number | null
          previous_payment_amount?: number | null
          previous_payment_date?: string | null
          previous_year_comparison?: string | null
          profit_loss?: number | null
          property_address?: string | null
          property_id?: string | null
          reason_for_change?: string | null
          recipient_id?: string | null
          recipient_name?: string | null
          service_category_id?: string | null
          service_description?: string | null
          submission_deadline?: string | null
          supplier_contact?: string | null
          supplier_id?: string | null
          supplier_name?: string | null
          tax_amount?: number | null
          tax_year_end?: string | null
          tax_year_start?: string | null
          total_expenses?: number | null
          total_rental_income?: number | null
          unit_id?: string | null
          utr_number?: string | null
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_notifications_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      income: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          date: string
          description: string | null
          id: string
          income_type: string
          property_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          income_type: string
          property_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          income_type?: string
          property_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "income_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "tenant_property_relationships"
            referencedColumns: ["property_id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          created_at: string | null
          date: string
          description: string | null
          id: string
          invoice_number: string
          property_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          invoice_number: string
          property_id: string
          status: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          invoice_number?: string
          property_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "tenant_property_relationships"
            referencedColumns: ["property_id"]
          },
        ]
      }
      issue_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          priority_default: string | null
          requires_approval: boolean | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          priority_default?: string | null
          requires_approval?: boolean | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          priority_default?: string | null
          requires_approval?: boolean | null
        }
        Relationships: []
      }
      issue_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          is_internal: boolean | null
          issue_id: string
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          issue_id: string
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          issue_id?: string
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issue_comments_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issue_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_comments_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_comments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_property_relationships"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "issue_comments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_media: {
        Row: {
          created_at: string
          file_name: string
          file_type: string
          file_url: string
          id: string
          issue_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_type: string
          file_url: string
          id?: string
          issue_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_type?: string
          file_url?: string
          id?: string
          issue_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issue_media_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issue_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_media_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_status_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          issue_id: string
          new_status: string
          notes: string | null
          previous_status: string | null
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          issue_id: string
          new_status: string
          notes?: string | null
          previous_status?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          issue_id?: string
          new_status?: string
          notes?: string | null
          previous_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issue_status_history_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issue_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_status_history_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      issues: {
        Row: {
          actual_cost: number | null
          assigned_to: string | null
          category_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          estimated_cost: number | null
          id: string
          is_emergency: boolean | null
          priority: string
          property_id: string
          reported_by: string | null
          reported_date: string | null
          resolution_date: string | null
          resolution_notes: string | null
          status: string
          tenant_id: string | null
          title: string
          type: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          actual_cost?: number | null
          assigned_to?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_cost?: number | null
          id?: string
          is_emergency?: boolean | null
          priority?: string
          property_id: string
          reported_by?: string | null
          reported_date?: string | null
          resolution_date?: string | null
          resolution_notes?: string | null
          status?: string
          tenant_id?: string | null
          title: string
          type?: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          actual_cost?: number | null
          assigned_to?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_cost?: number | null
          id?: string
          is_emergency?: boolean | null
          priority?: string
          property_id?: string
          reported_by?: string | null
          reported_date?: string | null
          resolution_date?: string | null
          resolution_notes?: string | null
          status?: string
          tenant_id?: string | null
          title?: string
          type?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "issues_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "issue_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_property_relationships"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "issues_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "property_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "tenant_property_relationships"
            referencedColumns: ["unit_id"]
          },
        ]
      }
      leases: {
        Row: {
          break_clause_date: string | null
          break_clause_notice_period: number | null
          created_at: string
          deposit_amount: number | null
          deposit_protected_on: string | null
          deposit_protection_id: string | null
          deposit_protection_scheme: string | null
          end_date: string
          has_break_clause: boolean | null
          id: string
          lease_document_url: string | null
          payment_method: string | null
          property_id: string
          property_unit_id: string | null
          property_uuid: string | null
          renewal_offered: boolean | null
          renewal_offered_date: string | null
          renewal_status: string | null
          rent_amount: number
          rent_due_day: number | null
          rent_frequency: string
          special_conditions: string | null
          start_date: string
          status: string
          tenant_id: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          break_clause_date?: string | null
          break_clause_notice_period?: number | null
          created_at?: string
          deposit_amount?: number | null
          deposit_protected_on?: string | null
          deposit_protection_id?: string | null
          deposit_protection_scheme?: string | null
          end_date: string
          has_break_clause?: boolean | null
          id?: string
          lease_document_url?: string | null
          payment_method?: string | null
          property_id: string
          property_unit_id?: string | null
          property_uuid?: string | null
          renewal_offered?: boolean | null
          renewal_offered_date?: string | null
          renewal_status?: string | null
          rent_amount: number
          rent_due_day?: number | null
          rent_frequency?: string
          special_conditions?: string | null
          start_date: string
          status?: string
          tenant_id: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          break_clause_date?: string | null
          break_clause_notice_period?: number | null
          created_at?: string
          deposit_amount?: number | null
          deposit_protected_on?: string | null
          deposit_protection_id?: string | null
          deposit_protection_scheme?: string | null
          end_date?: string
          has_break_clause?: boolean | null
          id?: string
          lease_document_url?: string | null
          payment_method?: string | null
          property_id?: string
          property_unit_id?: string | null
          property_uuid?: string | null
          renewal_offered?: boolean | null
          renewal_offered_date?: string | null
          renewal_status?: string | null
          rent_amount?: number
          rent_due_day?: number | null
          rent_frequency?: string
          special_conditions?: string | null
          start_date?: string
          status?: string
          tenant_id?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leases_property_unit_id_fkey"
            columns: ["property_unit_id"]
            isOneToOne: false
            referencedRelation: "property_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_property_unit_id_fkey"
            columns: ["property_unit_id"]
            isOneToOne: false
            referencedRelation: "tenant_property_relationships"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "leases_property_uuid_fkey"
            columns: ["property_uuid"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_property_uuid_fkey"
            columns: ["property_uuid"]
            isOneToOne: false
            referencedRelation: "tenant_property_relationships"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "leases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_property_relationships"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "leases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_notifications: {
        Row: {
          access_arrangements: string | null
          appointment_id: string | null
          assigned_contractor_id: string | null
          category_id: string | null
          centralized_tenant_id: string | null
          contractor_contact: string | null
          contractor_id: string | null
          contractor_name: string | null
          cost_amount: number | null
          cost_id: string | null
          date_updated: string | null
          estimated_completion_date: string | null
          estimated_completion_time: string | null
          estimated_duration: string | null
          estimated_repair_cost: number | null
          habitability_impact: string | null
          id: string
          invoice_id: string | null
          issue_description: string | null
          issue_id: string | null
          issue_title: string
          issue_type: string | null
          location_in_property: string | null
          notification_id: string
          previous_status: string | null
          priority_level: string | null
          property_address: string
          property_id: string
          quote_amount: number | null
          quote_expiry_date: string | null
          quote_id: string | null
          quote_validity_period: string | null
          report_date: string | null
          resolution_date: string | null
          resolution_details: string | null
          resolved_by: string | null
          safety_impact: string | null
          scheduled_date: string | null
          status: string | null
          status_changed_by: string | null
          supplier_contact: string | null
          supplier_id: string | null
          supplier_name: string | null
          tenant_contact: string | null
          tenant_id: string | null
          tenant_name: string | null
          tenant_notified: boolean | null
          tenant_satisfaction_status: string | null
          time_sensitivity: string | null
          time_window: string | null
          total_time_to_resolution: number | null
          unit_id: string | null
          update_details: string | null
          work_details: string | null
        }
        Insert: {
          access_arrangements?: string | null
          appointment_id?: string | null
          assigned_contractor_id?: string | null
          category_id?: string | null
          centralized_tenant_id?: string | null
          contractor_contact?: string | null
          contractor_id?: string | null
          contractor_name?: string | null
          cost_amount?: number | null
          cost_id?: string | null
          date_updated?: string | null
          estimated_completion_date?: string | null
          estimated_completion_time?: string | null
          estimated_duration?: string | null
          estimated_repair_cost?: number | null
          habitability_impact?: string | null
          id?: string
          invoice_id?: string | null
          issue_description?: string | null
          issue_id?: string | null
          issue_title: string
          issue_type?: string | null
          location_in_property?: string | null
          notification_id: string
          previous_status?: string | null
          priority_level?: string | null
          property_address: string
          property_id: string
          quote_amount?: number | null
          quote_expiry_date?: string | null
          quote_id?: string | null
          quote_validity_period?: string | null
          report_date?: string | null
          resolution_date?: string | null
          resolution_details?: string | null
          resolved_by?: string | null
          safety_impact?: string | null
          scheduled_date?: string | null
          status?: string | null
          status_changed_by?: string | null
          supplier_contact?: string | null
          supplier_id?: string | null
          supplier_name?: string | null
          tenant_contact?: string | null
          tenant_id?: string | null
          tenant_name?: string | null
          tenant_notified?: boolean | null
          tenant_satisfaction_status?: string | null
          time_sensitivity?: string | null
          time_window?: string | null
          total_time_to_resolution?: number | null
          unit_id?: string | null
          update_details?: string | null
          work_details?: string | null
        }
        Update: {
          access_arrangements?: string | null
          appointment_id?: string | null
          assigned_contractor_id?: string | null
          category_id?: string | null
          centralized_tenant_id?: string | null
          contractor_contact?: string | null
          contractor_id?: string | null
          contractor_name?: string | null
          cost_amount?: number | null
          cost_id?: string | null
          date_updated?: string | null
          estimated_completion_date?: string | null
          estimated_completion_time?: string | null
          estimated_duration?: string | null
          estimated_repair_cost?: number | null
          habitability_impact?: string | null
          id?: string
          invoice_id?: string | null
          issue_description?: string | null
          issue_id?: string | null
          issue_title?: string
          issue_type?: string | null
          location_in_property?: string | null
          notification_id?: string
          previous_status?: string | null
          priority_level?: string | null
          property_address?: string
          property_id?: string
          quote_amount?: number | null
          quote_expiry_date?: string | null
          quote_id?: string | null
          quote_validity_period?: string | null
          report_date?: string | null
          resolution_date?: string | null
          resolution_details?: string | null
          resolved_by?: string | null
          safety_impact?: string | null
          scheduled_date?: string | null
          status?: string | null
          status_changed_by?: string | null
          supplier_contact?: string | null
          supplier_id?: string | null
          supplier_name?: string | null
          tenant_contact?: string | null
          tenant_id?: string | null
          tenant_name?: string | null
          tenant_notified?: boolean | null
          tenant_satisfaction_status?: string | null
          time_sensitivity?: string | null
          time_window?: string | null
          total_time_to_resolution?: number | null
          unit_id?: string | null
          update_details?: string | null
          work_details?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_notifications_centralized_tenant_id_fkey"
            columns: ["centralized_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_property_relationships"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "maintenance_notifications_centralized_tenant_id_fkey"
            columns: ["centralized_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_notifications_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_types: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: number
          name: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: number
          name: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_archived: boolean
          is_read: boolean
          message: string
          metadata: Json | null
          notification_type_id: number
          priority: string | null
          title: string
          trigger_event_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_archived?: boolean
          is_read?: boolean
          message: string
          metadata?: Json | null
          notification_type_id: number
          priority?: string | null
          title: string
          trigger_event_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_archived?: boolean
          is_read?: boolean
          message?: string
          metadata?: Json | null
          notification_type_id?: number
          priority?: string | null
          title?: string
          trigger_event_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_notification_type_id_fkey"
            columns: ["notification_type_id"]
            isOneToOne: false
            referencedRelation: "notification_types"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string
          bathrooms: number
          bedrooms: number
          city: string
          council_tax_band: string | null
          created_at: string
          current_valuation: number | null
          description: string | null
          electrical_safety_expiry: string | null
          energy_rating: string | null
          gas_safety_expiry: string | null
          has_garden: boolean | null
          has_parking: boolean | null
          id: string
          is_furnished: boolean | null
          metadata: Json | null
          notes: string | null
          photo_url: string | null
          postcode: string
          property_code: string
          property_type: string
          purchase_date: string | null
          purchase_price: number | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          bathrooms: number
          bedrooms: number
          city: string
          council_tax_band?: string | null
          created_at?: string
          current_valuation?: number | null
          description?: string | null
          electrical_safety_expiry?: string | null
          energy_rating?: string | null
          gas_safety_expiry?: string | null
          has_garden?: boolean | null
          has_parking?: boolean | null
          id?: string
          is_furnished?: boolean | null
          metadata?: Json | null
          notes?: string | null
          photo_url?: string | null
          postcode: string
          property_code: string
          property_type: string
          purchase_date?: string | null
          purchase_price?: number | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          bathrooms?: number
          bedrooms?: number
          city?: string
          council_tax_band?: string | null
          created_at?: string
          current_valuation?: number | null
          description?: string | null
          electrical_safety_expiry?: string | null
          energy_rating?: string | null
          gas_safety_expiry?: string | null
          has_garden?: boolean | null
          has_parking?: boolean | null
          id?: string
          is_furnished?: boolean | null
          metadata?: Json | null
          notes?: string | null
          photo_url?: string | null
          postcode?: string
          property_code?: string
          property_type?: string
          purchase_date?: string | null
          purchase_price?: number | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      property_performance_notifications: {
        Row: {
          area_rental_trend: string | null
          average_deficit: number | null
          comparable_properties_data: string | null
          critical_attention_properties: Json | null
          current_rent: number | null
          daily_rental_value: number | null
          days_vacant: number | null
          estimated_lost_income: number | null
          expense_breakdown: Json | null
          expense_categories: Json | null
          id: string
          income_breakdown: Json | null
          income_id: string | null
          last_increase_date: string | null
          last_tenancy_end_date: string | null
          lease_renewal_date: string | null
          listing_id: string | null
          local_market_indicators: string | null
          maintenance_cost_ratio: number | null
          market_average: number | null
          marketing_status: string | null
          most_affected_property_id: string | null
          net_profit: number | null
          notification_id: string
          number_of_properties_with_issues: number | null
          occupancy_rate: number | null
          occupancy_rate_area: number | null
          percentage_difference: number | null
          period_end_date: string | null
          period_start_date: string | null
          portfolio_id: string | null
          portfolio_occupancy_rate: number | null
          portfolio_yield: number | null
          previous_period_comparison: string | null
          property_address: string | null
          property_id: string | null
          reason_for_vacancy: string | null
          rent_review_date: string | null
          rental_growth_percentage: number | null
          report_id: string | null
          roi_percentage: number | null
          suggested_actions: string | null
          total_expenses: number | null
          total_income: number | null
          total_negative_cash_flow: number | null
          trend_indicator: string | null
          unit_id: string | null
          vacancy_start_date: string | null
          viewing_count: number | null
          year_to_date_figures: Json | null
          yield_percentage: number | null
        }
        Insert: {
          area_rental_trend?: string | null
          average_deficit?: number | null
          comparable_properties_data?: string | null
          critical_attention_properties?: Json | null
          current_rent?: number | null
          daily_rental_value?: number | null
          days_vacant?: number | null
          estimated_lost_income?: number | null
          expense_breakdown?: Json | null
          expense_categories?: Json | null
          id?: string
          income_breakdown?: Json | null
          income_id?: string | null
          last_increase_date?: string | null
          last_tenancy_end_date?: string | null
          lease_renewal_date?: string | null
          listing_id?: string | null
          local_market_indicators?: string | null
          maintenance_cost_ratio?: number | null
          market_average?: number | null
          marketing_status?: string | null
          most_affected_property_id?: string | null
          net_profit?: number | null
          notification_id: string
          number_of_properties_with_issues?: number | null
          occupancy_rate?: number | null
          occupancy_rate_area?: number | null
          percentage_difference?: number | null
          period_end_date?: string | null
          period_start_date?: string | null
          portfolio_id?: string | null
          portfolio_occupancy_rate?: number | null
          portfolio_yield?: number | null
          previous_period_comparison?: string | null
          property_address?: string | null
          property_id?: string | null
          reason_for_vacancy?: string | null
          rent_review_date?: string | null
          rental_growth_percentage?: number | null
          report_id?: string | null
          roi_percentage?: number | null
          suggested_actions?: string | null
          total_expenses?: number | null
          total_income?: number | null
          total_negative_cash_flow?: number | null
          trend_indicator?: string | null
          unit_id?: string | null
          vacancy_start_date?: string | null
          viewing_count?: number | null
          year_to_date_figures?: Json | null
          yield_percentage?: number | null
        }
        Update: {
          area_rental_trend?: string | null
          average_deficit?: number | null
          comparable_properties_data?: string | null
          critical_attention_properties?: Json | null
          current_rent?: number | null
          daily_rental_value?: number | null
          days_vacant?: number | null
          estimated_lost_income?: number | null
          expense_breakdown?: Json | null
          expense_categories?: Json | null
          id?: string
          income_breakdown?: Json | null
          income_id?: string | null
          last_increase_date?: string | null
          last_tenancy_end_date?: string | null
          lease_renewal_date?: string | null
          listing_id?: string | null
          local_market_indicators?: string | null
          maintenance_cost_ratio?: number | null
          market_average?: number | null
          marketing_status?: string | null
          most_affected_property_id?: string | null
          net_profit?: number | null
          notification_id?: string
          number_of_properties_with_issues?: number | null
          occupancy_rate?: number | null
          occupancy_rate_area?: number | null
          percentage_difference?: number | null
          period_end_date?: string | null
          period_start_date?: string | null
          portfolio_id?: string | null
          portfolio_occupancy_rate?: number | null
          portfolio_yield?: number | null
          previous_period_comparison?: string | null
          property_address?: string | null
          property_id?: string | null
          reason_for_vacancy?: string | null
          rent_review_date?: string | null
          rental_growth_percentage?: number | null
          report_id?: string | null
          roi_percentage?: number | null
          suggested_actions?: string | null
          total_expenses?: number | null
          total_income?: number | null
          total_negative_cash_flow?: number | null
          trend_indicator?: string | null
          unit_id?: string | null
          vacancy_start_date?: string | null
          viewing_count?: number | null
          year_to_date_figures?: Json | null
          yield_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "property_performance_notifications_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      property_units: {
        Row: {
          bathrooms: number
          bedrooms: number
          created_at: string
          floor: string | null
          id: string
          is_furnished: boolean | null
          metadata: Json | null
          notes: string | null
          property_id: string
          rent_amount: number | null
          size_sqm: number | null
          status: string | null
          unit_number: string
          updated_at: string
        }
        Insert: {
          bathrooms?: number
          bedrooms?: number
          created_at?: string
          floor?: string | null
          id?: string
          is_furnished?: boolean | null
          metadata?: Json | null
          notes?: string | null
          property_id: string
          rent_amount?: number | null
          size_sqm?: number | null
          status?: string | null
          unit_number: string
          updated_at?: string
        }
        Update: {
          bathrooms?: number
          bedrooms?: number
          created_at?: string
          floor?: string | null
          id?: string
          is_furnished?: boolean | null
          metadata?: Json | null
          notes?: string | null
          property_id?: string
          rent_amount?: number | null
          size_sqm?: number | null
          status?: string | null
          unit_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "tenant_property_relationships"
            referencedColumns: ["property_id"]
          },
        ]
      }
      rent_payment_notifications: {
        Row: {
          bank_account_id: string | null
          centralized_lease_id: string | null
          centralized_tenant_id: string | null
          days_overdue: number | null
          due_date: string | null
          escalation_level: number | null
          id: string
          late_fee_amount: number | null
          late_fee_applicable: boolean | null
          lease_id: string | null
          next_escalation_date: string | null
          notification_id: string
          original_amount_due: number | null
          payment_amount: number | null
          payment_date: string | null
          payment_frequency: string | null
          payment_id: string | null
          payment_method: string | null
          payment_percentage: number | null
          payment_period: string | null
          previous_notification_date: string | null
          property_address: string
          property_id: string
          remaining_balance: number | null
          tenant_email: string | null
          tenant_id: string
          tenant_name: string
          tenant_phone: string | null
          total_arrears: number | null
          transaction_reference: string | null
          unit_id: string | null
        }
        Insert: {
          bank_account_id?: string | null
          centralized_lease_id?: string | null
          centralized_tenant_id?: string | null
          days_overdue?: number | null
          due_date?: string | null
          escalation_level?: number | null
          id?: string
          late_fee_amount?: number | null
          late_fee_applicable?: boolean | null
          lease_id?: string | null
          next_escalation_date?: string | null
          notification_id: string
          original_amount_due?: number | null
          payment_amount?: number | null
          payment_date?: string | null
          payment_frequency?: string | null
          payment_id?: string | null
          payment_method?: string | null
          payment_percentage?: number | null
          payment_period?: string | null
          previous_notification_date?: string | null
          property_address: string
          property_id: string
          remaining_balance?: number | null
          tenant_email?: string | null
          tenant_id: string
          tenant_name: string
          tenant_phone?: string | null
          total_arrears?: number | null
          transaction_reference?: string | null
          unit_id?: string | null
        }
        Update: {
          bank_account_id?: string | null
          centralized_lease_id?: string | null
          centralized_tenant_id?: string | null
          days_overdue?: number | null
          due_date?: string | null
          escalation_level?: number | null
          id?: string
          late_fee_amount?: number | null
          late_fee_applicable?: boolean | null
          lease_id?: string | null
          next_escalation_date?: string | null
          notification_id?: string
          original_amount_due?: number | null
          payment_amount?: number | null
          payment_date?: string | null
          payment_frequency?: string | null
          payment_id?: string | null
          payment_method?: string | null
          payment_percentage?: number | null
          payment_period?: string | null
          previous_notification_date?: string | null
          property_address?: string
          property_id?: string
          remaining_balance?: number | null
          tenant_email?: string | null
          tenant_id?: string
          tenant_name?: string
          tenant_phone?: string | null
          total_arrears?: number | null
          transaction_reference?: string | null
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rent_payment_notifications_centralized_lease_id_fkey"
            columns: ["centralized_lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_payment_notifications_centralized_lease_id_fkey"
            columns: ["centralized_lease_id"]
            isOneToOne: false
            referencedRelation: "tenant_property_relationships"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "rent_payment_notifications_centralized_tenant_id_fkey"
            columns: ["centralized_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_property_relationships"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "rent_payment_notifications_centralized_tenant_id_fkey"
            columns: ["centralized_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_payment_notifications_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      service_charges: {
        Row: {
          amount: number
          created_at: string | null
          date: string
          description: string | null
          id: string
          property_id: string
          status: string
          type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          property_id: string
          status: string
          type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          property_id?: string
          status?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_charges_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_charges_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "tenant_property_relationships"
            referencedColumns: ["property_id"]
          },
        ]
      }
      tenancy_notifications: {
        Row: {
          agent_id: string | null
          applicant_id: string | null
          application_date: string | null
          application_id: string | null
          centralized_lease_id: string | null
          centralized_tenant_id: string | null
          contact_details: string | null
          credit_check_status: string | null
          current_rent: number | null
          desired_move_in_date: string | null
          exit_interview_scheduled: boolean | null
          expiry_date: string | null
          id: string
          inspection_checklist_id: string | null
          inspection_date: string | null
          inspection_id: string | null
          inspection_type: string | null
          inspector_id: string | null
          last_inspection_date: string | null
          last_inspection_id: string | null
          last_inspection_result: string | null
          lease_end_date: string | null
          lease_id: string | null
          lease_start_date: string | null
          listing_id: string | null
          market_rent_assessment: number | null
          notice_date: string | null
          notice_id: string | null
          notice_period_compliance: string | null
          notification_id: string
          notification_status: string | null
          planned_vacate_date: string | null
          property_address: string | null
          property_id: string | null
          proposed_rent: number | null
          proposed_term: string | null
          reason_for_leaving: string | null
          referencing_status: string | null
          renewal_offer_status: string | null
          required_notice_period: string | null
          source_of_application: string | null
          special_conditions: string | null
          tenancy_duration: string | null
          tenant_communication_history: string | null
          tenant_confirmed: boolean | null
          tenant_email: string | null
          tenant_id: string | null
          tenant_name: string | null
          tenant_payment_reliability_score: number | null
          tenant_phone: string | null
          unit_id: string | null
        }
        Insert: {
          agent_id?: string | null
          applicant_id?: string | null
          application_date?: string | null
          application_id?: string | null
          centralized_lease_id?: string | null
          centralized_tenant_id?: string | null
          contact_details?: string | null
          credit_check_status?: string | null
          current_rent?: number | null
          desired_move_in_date?: string | null
          exit_interview_scheduled?: boolean | null
          expiry_date?: string | null
          id?: string
          inspection_checklist_id?: string | null
          inspection_date?: string | null
          inspection_id?: string | null
          inspection_type?: string | null
          inspector_id?: string | null
          last_inspection_date?: string | null
          last_inspection_id?: string | null
          last_inspection_result?: string | null
          lease_end_date?: string | null
          lease_id?: string | null
          lease_start_date?: string | null
          listing_id?: string | null
          market_rent_assessment?: number | null
          notice_date?: string | null
          notice_id?: string | null
          notice_period_compliance?: string | null
          notification_id: string
          notification_status?: string | null
          planned_vacate_date?: string | null
          property_address?: string | null
          property_id?: string | null
          proposed_rent?: number | null
          proposed_term?: string | null
          reason_for_leaving?: string | null
          referencing_status?: string | null
          renewal_offer_status?: string | null
          required_notice_period?: string | null
          source_of_application?: string | null
          special_conditions?: string | null
          tenancy_duration?: string | null
          tenant_communication_history?: string | null
          tenant_confirmed?: boolean | null
          tenant_email?: string | null
          tenant_id?: string | null
          tenant_name?: string | null
          tenant_payment_reliability_score?: number | null
          tenant_phone?: string | null
          unit_id?: string | null
        }
        Update: {
          agent_id?: string | null
          applicant_id?: string | null
          application_date?: string | null
          application_id?: string | null
          centralized_lease_id?: string | null
          centralized_tenant_id?: string | null
          contact_details?: string | null
          credit_check_status?: string | null
          current_rent?: number | null
          desired_move_in_date?: string | null
          exit_interview_scheduled?: boolean | null
          expiry_date?: string | null
          id?: string
          inspection_checklist_id?: string | null
          inspection_date?: string | null
          inspection_id?: string | null
          inspection_type?: string | null
          inspector_id?: string | null
          last_inspection_date?: string | null
          last_inspection_id?: string | null
          last_inspection_result?: string | null
          lease_end_date?: string | null
          lease_id?: string | null
          lease_start_date?: string | null
          listing_id?: string | null
          market_rent_assessment?: number | null
          notice_date?: string | null
          notice_id?: string | null
          notice_period_compliance?: string | null
          notification_id?: string
          notification_status?: string | null
          planned_vacate_date?: string | null
          property_address?: string | null
          property_id?: string | null
          proposed_rent?: number | null
          proposed_term?: string | null
          reason_for_leaving?: string | null
          referencing_status?: string | null
          renewal_offer_status?: string | null
          required_notice_period?: string | null
          source_of_application?: string | null
          special_conditions?: string | null
          tenancy_duration?: string | null
          tenant_communication_history?: string | null
          tenant_confirmed?: boolean | null
          tenant_email?: string | null
          tenant_id?: string | null
          tenant_name?: string | null
          tenant_payment_reliability_score?: number | null
          tenant_phone?: string | null
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenancy_notifications_centralized_lease_id_fkey"
            columns: ["centralized_lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenancy_notifications_centralized_lease_id_fkey"
            columns: ["centralized_lease_id"]
            isOneToOne: false
            referencedRelation: "tenant_property_relationships"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "tenancy_notifications_centralized_tenant_id_fkey"
            columns: ["centralized_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_property_relationships"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenancy_notifications_centralized_tenant_id_fkey"
            columns: ["centralized_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenancy_notifications_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_documents: {
        Row: {
          description: string | null
          document_type: string
          document_url: string
          file_name: string
          file_size: number | null
          id: string
          metadata: Json | null
          tenant_id: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          description?: string | null
          document_type: string
          document_url: string
          file_name: string
          file_size?: number | null
          id?: string
          metadata?: Json | null
          tenant_id: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          description?: string | null
          document_type?: string
          document_url?: string
          file_name?: string
          file_size?: number | null
          id?: string
          metadata?: Json | null
          tenant_id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_property_relationships"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_histories: {
        Row: {
          created_at: string
          description: string | null
          event_date: string
          event_type: string
          id: string
          metadata: Json | null
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_date?: string
          event_type: string
          id?: string
          metadata?: Json | null
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          event_date?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          tenant_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_histories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_property_relationships"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_histories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          credit_check_status: string | null
          date_of_birth: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employment_status: string | null
          id: string
          income_verification: string | null
          metadata: Json | null
          name: string
          national_insurance_number: string | null
          notes: string | null
          payment_reliability_score: number | null
          phone: string | null
          photo_url: string | null
          referencing_status: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credit_check_status?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employment_status?: string | null
          id?: string
          income_verification?: string | null
          metadata?: Json | null
          name: string
          national_insurance_number?: string | null
          notes?: string | null
          payment_reliability_score?: number | null
          phone?: string | null
          photo_url?: string | null
          referencing_status?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credit_check_status?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employment_status?: string | null
          id?: string
          income_verification?: string | null
          metadata?: Json | null
          name?: string
          national_insurance_number?: string | null
          notes?: string | null
          payment_reliability_score?: number | null
          phone?: string | null
          photo_url?: string | null
          referencing_status?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          account_type: string | null
          accounting_period: string | null
          address_line1: string | null
          address_line2: string | null
          agreed_privacy: boolean | null
          agreed_terms: boolean | null
          business_type: string | null
          company_address_line1: string | null
          company_address_line2: string | null
          company_county: string | null
          company_name: string | null
          company_postcode: string | null
          company_registration_number: string | null
          company_town_city: string | null
          county: string | null
          created_at: string | null
          date_of_birth: string | null
          directors: Json | null
          first_name: string | null
          id: string
          is_company: boolean | null
          is_non_resident_scheme: boolean | null
          is_uk_tax_resident: boolean | null
          last_name: string | null
          mtd_status: string | null
          notification_preferences: Json | null
          onboarding_completed: boolean | null
          phone: string | null
          postcode: string | null
          profile_photo_url: string | null
          property_import_method: string | null
          setup_completed: boolean | null
          tax_reference_number: string | null
          tax_status: string | null
          tenant_import_method: string | null
          title: string | null
          town_city: string | null
          updated_at: string | null
          user_id: string | null
          utr: string | null
          vat_number: string | null
        }
        Insert: {
          account_type?: string | null
          accounting_period?: string | null
          address_line1?: string | null
          address_line2?: string | null
          agreed_privacy?: boolean | null
          agreed_terms?: boolean | null
          business_type?: string | null
          company_address_line1?: string | null
          company_address_line2?: string | null
          company_county?: string | null
          company_name?: string | null
          company_postcode?: string | null
          company_registration_number?: string | null
          company_town_city?: string | null
          county?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          directors?: Json | null
          first_name?: string | null
          id?: string
          is_company?: boolean | null
          is_non_resident_scheme?: boolean | null
          is_uk_tax_resident?: boolean | null
          last_name?: string | null
          mtd_status?: string | null
          notification_preferences?: Json | null
          onboarding_completed?: boolean | null
          phone?: string | null
          postcode?: string | null
          profile_photo_url?: string | null
          property_import_method?: string | null
          setup_completed?: boolean | null
          tax_reference_number?: string | null
          tax_status?: string | null
          tenant_import_method?: string | null
          title?: string | null
          town_city?: string | null
          updated_at?: string | null
          user_id?: string | null
          utr?: string | null
          vat_number?: string | null
        }
        Update: {
          account_type?: string | null
          accounting_period?: string | null
          address_line1?: string | null
          address_line2?: string | null
          agreed_privacy?: boolean | null
          agreed_terms?: boolean | null
          business_type?: string | null
          company_address_line1?: string | null
          company_address_line2?: string | null
          company_county?: string | null
          company_name?: string | null
          company_postcode?: string | null
          company_registration_number?: string | null
          company_town_city?: string | null
          county?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          directors?: Json | null
          first_name?: string | null
          id?: string
          is_company?: boolean | null
          is_non_resident_scheme?: boolean | null
          is_uk_tax_resident?: boolean | null
          last_name?: string | null
          mtd_status?: string | null
          notification_preferences?: Json | null
          onboarding_completed?: boolean | null
          phone?: string | null
          postcode?: string | null
          profile_photo_url?: string | null
          property_import_method?: string | null
          setup_completed?: boolean | null
          tax_reference_number?: string | null
          tax_status?: string | null
          tenant_import_method?: string | null
          title?: string | null
          town_city?: string | null
          updated_at?: string | null
          user_id?: string | null
          utr?: string | null
          vat_number?: string | null
        }
        Relationships: []
      }
      work_orders: {
        Row: {
          actual_cost: number | null
          actual_hours: number | null
          completed_date: string | null
          contractor_id: string | null
          created_at: string
          description: string
          estimated_cost: number | null
          estimated_hours: number | null
          id: string
          issue_id: string
          notes: string | null
          scheduled_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          actual_cost?: number | null
          actual_hours?: number | null
          completed_date?: string | null
          contractor_id?: string | null
          created_at?: string
          description: string
          estimated_cost?: number | null
          estimated_hours?: number | null
          id?: string
          issue_id: string
          notes?: string | null
          scheduled_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          actual_cost?: number | null
          actual_hours?: number | null
          completed_date?: string | null
          contractor_id?: string | null
          created_at?: string
          description?: string
          estimated_cost?: number | null
          estimated_hours?: number | null
          id?: string
          issue_id?: string
          notes?: string | null
          scheduled_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issue_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      active_issues_by_property: {
        Row: {
          high_priority_issues: number | null
          open_issues: number | null
          property_id: string | null
          total_issues: number | null
        }
        Relationships: []
      }
      issue_details: {
        Row: {
          actual_cost: number | null
          category_name: string | null
          description: string | null
          due_date: string | null
          estimated_cost: number | null
          id: string | null
          is_emergency: boolean | null
          priority: string | null
          property_id: string | null
          reported_date: string | null
          resolution_date: string | null
          status: string | null
          tenant_email: string | null
          tenant_name: string | null
          tenant_phone: string | null
          title: string | null
          type: string | null
          unit_number: string | null
          work_order_status: string | null
        }
        Relationships: []
      }
      tenant_property_relationships: {
        Row: {
          deposit_amount: number | null
          end_date: string | null
          lease_id: string | null
          property_address: string | null
          property_code: string | null
          property_id: string | null
          rent_amount: number | null
          rent_frequency: string | null
          start_date: string | null
          tenant_email: string | null
          tenant_id: string | null
          tenant_name: string | null
          tenant_phone: string | null
          unit_id: string | null
          unit_number: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_property_occupancy_rate: {
        Args: {
          user_uuid: string
        }
        Returns: number
      }
      calculate_total_income_for_user: {
        Args: {
          user_uuid: string
          start_date: string
          end_date: string
        }
        Returns: number
      }
      check_expiring_certificates: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_upcoming_rent_dues: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      count_expiring_contracts: {
        Args: {
          user_uuid: string
          months_ahead?: number
        }
        Returns: number
      }
      create_certificate_expiry_notification: {
        Args: {
          _user_id: string
          _certificate_type: string
          _certificate_id: string
          _regulatory_requirement_id: string
          _property_id: string
          _property_address: string
          _unit_id: string
          _expiry_date: string
          _issue_date: string
          _issuing_authority: string
          _days_until_expiry: number
        }
        Returns: string
      }
      create_lease_expiry_notification: {
        Args: {
          _user_id: string
          _tenant_id: string
          _tenant_name: string
          _tenant_email: string
          _tenant_phone: string
          _property_id: string
          _property_address: string
          _unit_id: string
          _expiry_date: string
          _lease_id: string
          _lease_start_date: string
          _current_rent: number
          _market_rent_assessment: number
          _days_until_expiry: number
        }
        Returns: string
      }
      create_new_issue_notification: {
        Args: {
          _user_id: string
          _property_id: string
          _property_address: string
          _unit_id: string
          _issue_id: string
          _issue_type: string
          _issue_title: string
          _issue_description: string
          _priority_level: string
          _tenant_id: string
          _tenant_name: string
          _tenant_contact: string
          _report_date: string
          _category_id: string
          _location_in_property: string
        }
        Returns: string
      }
      create_notification: {
        Args: {
          _notification_type: string
          _user_id: string
          _title: string
          _message: string
          _priority?: string
          _trigger_event_id?: string
          _metadata?: Json
        }
        Returns: string
      }
      create_payment_received_notification: {
        Args: {
          _user_id: string
          _tenant_id: string
          _tenant_name: string
          _tenant_email: string
          _tenant_phone: string
          _property_id: string
          _property_address: string
          _unit_id: string
          _payment_amount: number
          _payment_id: string
          _payment_date: string
          _payment_method: string
          _transaction_reference: string
          _bank_account_id: string
        }
        Returns: string
      }
      create_properties_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_sample_notification: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      create_tenant_with_lease: {
        Args: {
          p_user_id: string
          p_name: string
          p_email: string
          p_phone: string
          p_property_code: string
          p_unit_id: string
          p_start_date: string
          p_end_date: string
          p_rent_amount: number
          p_rent_frequency: string
          p_rent_due_day: number
          p_payment_method: string
          p_deposit_amount: number
          p_deposit_scheme: string
          p_deposit_ref: string
          p_deposit_date: string
          p_special_conditions: string
          p_has_break_clause: boolean
          p_break_clause_date: string
          p_break_clause_notice: number
        }
        Returns: Json
      }
      create_upcoming_rent_due_notification: {
        Args: {
          _user_id: string
          _tenant_id: string
          _tenant_name: string
          _tenant_email: string
          _tenant_phone: string
          _property_id: string
          _property_address: string
          _unit_id: string
          _amount_due: number
          _due_date: string
          _payment_id: string
          _lease_id: string
          _payment_period: string
        }
        Returns: string
      }
      create_user_profiles_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_calendar_events_by_day: {
        Args: {
          p_user_id: string
          p_date: string
        }
        Returns: {
          id: string
          title: string
          date: string
          start_time: string
          end_time: string
          all_day: boolean
          location: string
          event_type: string
          property_id: string
          description: string
        }[]
      }
      get_calendar_events_by_month: {
        Args: {
          p_user_id: string
          p_year: number
          p_month: number
        }
        Returns: {
          id: string
          title: string
          date: string
          start_time: string
          end_time: string
          all_day: boolean
          location: string
          event_type: string
          property_id: string
          description: string
        }[]
      }
      get_calendar_events_by_property: {
        Args: {
          p_user_id: string
          p_property_id: string
          p_start_date?: string
          p_end_date?: string
        }
        Returns: {
          id: string
          title: string
          date: string
          start_time: string
          end_time: string
          all_day: boolean
          location: string
          event_type: string
          property_id: string
          description: string
        }[]
      }
      get_calendar_events_by_type: {
        Args: {
          p_user_id: string
          p_event_type: string
          p_start_date?: string
          p_end_date?: string
          p_limit?: number
        }
        Returns: {
          id: string
          title: string
          date: string
          start_time: string
          end_time: string
          all_day: boolean
          location: string
          event_type: string
          property_id: string
          description: string
        }[]
      }
      get_calendar_events_by_week: {
        Args: {
          p_user_id: string
          p_start_date: string
        }
        Returns: {
          id: string
          title: string
          date: string
          start_time: string
          end_time: string
          all_day: boolean
          location: string
          event_type: string
          property_id: string
          description: string
        }[]
      }
      get_dashboard_stats: {
        Args: {
          user_uuid: string
        }
        Returns: Json
      }
      get_property_issues: {
        Args: {
          prop_id: string
        }
        Returns: {
          id: string
          title: string
          status: string
          priority: string
          category: string
          reported_date: string
          tenant_name: string
          is_emergency: boolean
        }[]
      }
      get_property_tenants: {
        Args: {
          prop_uuid: string
        }
        Returns: {
          tenant_id: string
          tenant_name: string
          tenant_email: string
          tenant_phone: string
          lease_id: string
          lease_start_date: string
          lease_end_date: string
          rent_amount: number
        }[]
      }
      get_upcoming_calendar_events: {
        Args: {
          p_user_id: string
          p_days?: number
          p_limit?: number
        }
        Returns: {
          id: string
          title: string
          date: string
          start_time: string
          end_time: string
          all_day: boolean
          location: string
          event_type: string
          property_id: string
          description: string
          days_until: number
        }[]
      }
      get_user_notification_preferences: {
        Args: {
          p_user_id: string
        }
        Returns: Json
      }
      is_development_mode: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      set_app_environment: {
        Args: {
          env: string
        }
        Returns: undefined
      }
      update_user_notification_preferences: {
        Args: {
          p_user_id: string
          p_preferences: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

