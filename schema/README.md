# ZenRent Database Schema

This directory contains the database schema for the ZenRent property management system.

## Overview

The database is structured to support a comprehensive property management application with the following key modules:

- Properties management
- Tenant management
- Lease tracking
- Issue/maintenance request management
- Financial tracking

## Core Tables and Relationships

### Users and Authentication
- `users` - Property managers and administrators who use the system

### Property Management
- `properties` - Core properties table with basic details
- `property_units` - Individual units within multi-unit properties (apartments, HMOs)

### Tenant Management
- `tenants` - Information about tenants
- `leases` - Lease agreements linking tenants to properties/units

### Issues and Maintenance
- `issues` - Maintenance requests and property issues
- `issue_categories` - Categories for classifying issues
- `issue_media` - Photos and documents related to issues
- `issue_comments` - Communication thread for each issue
- `issue_status_history` - Audit trail of status changes
- `contractors` - Service providers who can resolve issues
- `work_orders` - Work assignments for resolving issues

## Key Relationships

- Properties have many Units (1:N)
- Properties have many Issues (1:N)
- Units have many Issues (1:N)
- Issues belong to a Property (N:1)
- Issues can belong to a Unit (N:1)
- Issues have many Comments (1:N)
- Issues have many Media attachments (1:N)
- Issues have many Status changes (1:N)
- Issues have many Work Orders (1:N)
- Tenants can report many Issues (1:N)
- Users can be assigned to many Issues (1:N)

## Database Views

- `active_issues_by_property` - Summary of active issues for each property
- `issue_details` - Comprehensive view of issues with related information

## Database Functions

- `get_property_issues(prop_id)` - Returns all issues for a specific property

## Entity Relationship Diagram

```
Users 1──┐
         │
         N
Properties 1─────────────────┐
          │                   │
          │                   │
          N                   N
     Property Units 1───┐    Issues 1───────┬────────┬──────┬─────┐
                        │      │            │        │      │     │
                        │      │            │        │      │     │
                        N      N            N        N      N     N
                      Issues   Work Orders  Media  Comments Status Contractors
```

## Usage Notes

The schema is designed to support:

1. Properties with multiple units (e.g., apartment buildings, HMOs)
2. Single-unit properties (houses, cottages)
3. Detailed tracking of maintenance issues
4. Connection between tenants and the issues they report
5. Full history of issue resolution including work orders
6. Media attachments for documenting issues

All tables include created_at timestamps, and most include updated_at timestamps that are automatically maintained by database triggers. 