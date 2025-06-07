# ZenRent Data Retention and Disposal Policy

## 1. Policy Statement

ZenRent Ltd maintains this Data Retention and Disposal Policy to ensure compliance with applicable data protection laws, regulatory requirements, and business needs while minimizing data storage costs and security risks.

## 2. Scope

This policy applies to all data collected, processed, and stored by ZenRent, including:
- Customer personal data and financial information
- Employee records and HR data
- Business records and communications
- System logs and audit trails
- Backup and archived data

## 3. Legal Framework

This policy ensures compliance with:
- UK Data Protection Act 2018 and UK GDPR
- Financial Conduct Authority (FCA) regulations
- HMRC record-keeping requirements
- Companies House filing obligations
- Employment law requirements

## 4. Data Categories and Retention Periods

### 4.1 Customer Data

| Data Type | Retention Period | Legal Basis | Disposal Method |
|-----------|------------------|-------------|-----------------|
| **Tax Submissions & Calculations** | 7 years after submission | HMRC legal requirement | Secure deletion with verification |
| **Personal Details** | Account lifetime + 3 years | Contract/Legal obligation | Secure deletion with audit log |
| **Property Data** | Account lifetime + 5 years | Contract performance | Secure deletion |
| **Financial Transactions** | 7 years | Financial regulations | Secure deletion |
| **Communication Records** | 3 years | Legitimate interests | Secure deletion |
| **Marketing Data** | Until consent withdrawn | Consent | Immediate secure deletion |
| **Support Tickets** | 3 years | Legitimate interests | Secure deletion |
| **Bank Connection Data** | Account lifetime + 1 year | Contract performance | Secure deletion |

### 4.2 Employee Data

| Data Type | Retention Period | Legal Basis | Disposal Method |
|-----------|------------------|-------------|-----------------|
| **Employment Records** | 7 years after termination | Legal obligation | Secure deletion |
| **Payroll Records** | 7 years | HMRC requirements | Secure deletion |
| **Training Records** | 5 years after termination | Legitimate interests | Secure deletion |
| **Performance Reviews** | 3 years after termination | Legitimate interests | Secure deletion |
| **Disciplinary Records** | 5 years after termination | Legal protection | Secure deletion |

### 4.3 Business Records

| Data Type | Retention Period | Legal Basis | Disposal Method |
|-----------|------------------|-------------|-----------------|
| **Financial Accounts** | 7 years | Companies House requirement | Secure deletion |
| **Contracts** | 7 years after expiry | Legal obligation | Secure deletion |
| **Insurance Records** | Life of policy + 7 years | Legal protection | Secure deletion |
| **Audit Logs** | 3 years | Security/Compliance | Secure deletion |
| **System Backups** | 30 days rolling | Business continuity | Secure deletion |

### 4.4 Technical Data

| Data Type | Retention Period | Legal Basis | Disposal Method |
|-----------|------------------|-------------|-----------------|
| **Application Logs** | 90 days | Legitimate interests | Automated deletion |
| **Security Logs** | 3 years | Security monitoring | Secure deletion |
| **Performance Metrics** | 2 years | Service improvement | Automated deletion |
| **Error Logs** | 1 year | System maintenance | Automated deletion |
| **Webhook Logs** | 30 days | Integration monitoring | Automated deletion |

## 5. Data Disposal Procedures

### 5.1 Secure Deletion Standards

**Electronic Data:**
- Use of certified data wiping tools (NIST 800-88 guidelines)
- Multi-pass overwriting for HDDs (minimum 3 passes)
- Cryptographic erasure for SSDs and encrypted storage
- Verification of successful deletion with audit logs
- Certificate of destruction for high-sensitivity data

**Cloud Data:**
- Utilize cloud provider's secure deletion APIs
- Verify deletion across all regions and backups
- Obtain confirmation certificates from providers
- Monitor for complete removal from all systems

**Physical Media:**
- Professional destruction service for hard drives
- Degaussing for magnetic media
- Physical shredding with chain of custody
- Certificate of destruction with serial numbers

### 5.2 Automated Deletion Processes

```sql
-- Example automated deletion for expired data
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void AS $$
BEGIN
    -- Delete expired audit logs (3 years)
    DELETE FROM audit_logs 
    WHERE created_at < NOW() - INTERVAL '3 years';
    
    -- Delete old application logs (90 days)
    DELETE FROM application_logs 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Archive and delete old transactions (7 years)
    WITH archived_transactions AS (
        DELETE FROM transactions 
        WHERE created_at < NOW() - INTERVAL '7 years'
        RETURNING *
    )
    INSERT INTO archived_transactions SELECT * FROM archived_transactions;
    
    RAISE NOTICE 'Data cleanup completed at %', NOW();
END;
$$ LANGUAGE plpgsql;
```

## 6. Data Subject Rights

### 6.1 Right to Erasure (Right to be Forgotten)

**Criteria for Erasure:**
- Personal data no longer necessary for original purpose
- Consent withdrawn and no other legal basis exists
- Data processed unlawfully
- Erasure required for legal compliance
- Data relates to a child when consent was given

**Exemptions:**
- Tax data required by HMRC (7-year retention)
- Data needed for legal claims or compliance
- Public interest or scientific research purposes
- Freedom of expression considerations

### 6.2 Data Portability

When processing erasure requests:
1. Verify requestor identity using government-issued ID
2. Assess legal obligations preventing deletion
3. Execute deletion within 30 days (or explain delays)
4. Confirm deletion to data subject
5. Log all erasure activities for audit purposes

## 7. Implementation Procedures

### 7.1 Monitoring and Alerts

- Monthly automated reports on data approaching retention limits
- Quarterly reviews of retention periods and legal changes
- Annual audit of disposal procedures and documentation
- Real-time alerts for failed automated deletions

### 7.2 Documentation Requirements

**For each disposal activity, maintain:**
- Date and time of disposal
- Data categories and volumes disposed
- Method of disposal used
- Person responsible for disposal
- Verification of successful deletion
- Any exceptions or issues encountered

### 7.3 Training and Awareness

- Annual training for all staff on data retention requirements
- Specialized training for IT and security teams
- Regular updates on legal and regulatory changes
- Clear escalation procedures for complex cases

## 8. Exceptions and Approvals

### 8.1 Legal Hold Procedures

When litigation or investigation is reasonably anticipated:
1. Immediately suspend automated deletion
2. Identify and preserve relevant data
3. Document legal hold scope and duration
4. Regular review of hold necessity
5. Formal release procedures when hold lifted

### 8.2 Extended Retention Requests

Requests to retain data beyond standard periods require:
- Business justification in writing
- Legal review and approval
- Risk assessment and mitigation
- Regular review of continued necessity
- Formal approval from DPO or CISO

## 9. Compliance Monitoring

### 9.1 Key Performance Indicators

- % of data disposed within retention periods: Target 95%
- Average time to process erasure requests: Target <30 days
- Number of data retention violations: Target 0
- Backup verification success rate: Target 100%

### 9.2 Audit and Review

**Monthly Reviews:**
- Automated deletion job status and failures
- Data subject request processing times
- Storage growth and retention compliance

**Quarterly Reviews:**
- Policy effectiveness and gaps
- Regulatory requirement changes
- Technology updates affecting procedures

**Annual Reviews:**
- Complete policy review and updates
- Retention period validation
- Disposal procedure effectiveness
- Training program assessment

## 10. Contact Information

**Data Protection Officer**: dpo@zenrent.com
**IT Security Team**: security@zenrent.com
**Legal Team**: legal@zenrent.com

For data retention questions or erasure requests:
- Online form: https://zenrent.com/data-requests
- Email: privacy@zenrent.com
- Phone: +44 20 1234 5680

---

**Policy Effective Date**: January 1, 2024
**Last Review**: January 15, 2024
**Next Review**: January 15, 2025
**Policy Owner**: Data Protection Officer
**Approved By**: Board of Directors

This policy is reviewed annually or when regulatory requirements change. 