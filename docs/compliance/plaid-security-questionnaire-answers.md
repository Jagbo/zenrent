# Plaid Security Questionnaire Answers for ZenRent

**Date Prepared**: January 2024  
**Prepared By**: Security Team  
**Company**: ZenRent Ltd  
**Contact**: security@zenrent.com

## Governance and Risk Management

### 1. Contact Information for Information Security Responsible Person

**Name**: James Anderson  
**Title**: Chief Information Security Officer (CISO)  
**Email**: security@zenrent.com  
**Phone**: +44 20 1234 5678  
**Monitoring**: We have 24/7 security monitoring through our SOC team

### 2. Information Security Policy and Procedures

**Answer**: Yes, we have a documented information security policy and procedures

**Documentation**: 
- Information Security Policy (docs/security/information-security-policy.md)
- Data Retention and Disposal Policy (docs/security/data-retention-disposal-policy.md)
- Privacy Policy (docs/privacy-policy.md)
- Incident Response Procedures
- Business Continuity Plan

**Key Components**:
- Risk assessment methodology following FAIR framework
- Security governance structure with monthly committee meetings
- Compliance with ISO 27001, GDPR, and financial industry standards
- Regular policy reviews and updates

## Identity and Access Management

### 3. Access Controls for Production Assets

**Answer**: Yes, we have documented access controls limiting access to production assets

**Implementation**:
- Multi-factor authentication required for all systems
- Role-based access control (RBAC) with principle of least privilege
- Regular access reviews conducted quarterly
- Automated deprovisioning for terminated employees
- Segregation of development, staging, and production environments

**Physical and Virtual Controls**:
- Cloud infrastructure with identity-based access controls
- VPN access required for sensitive systems
- Hardware security modules (HSM) for key management
- Biometric access controls for physical data centers (via cloud providers)

### 4. Multi-Factor Authentication for Consumer Applications

**Answer**: Yes, we provide multi-factor authentication (MFA) for consumers

**Implementation**:
- SMS-based verification for account setup
- TOTP (Time-based One-Time Password) support
- Email verification for sensitive actions
- Device registration and trust scoring
- Risk-based authentication triggers

### 5. Multi-Factor Authentication for Critical Systems

**Answer**: Yes, we have multi-factor authentication in place for critical systems

**Coverage**:
- All administrative access to production systems
- Database access and management interfaces
- Cloud infrastructure management (AWS/Supabase)
- Financial system access (Stripe, bank integrations)
- Source code repositories and deployment systems

## Infrastructure and Network Security

### 6. Data Encryption in Transit

**Answer**: Yes, we encrypt data in transit between clients and servers using TLS 1.2 or better

**Implementation**:
- TLS 1.3 for all client-server communications
- Perfect Forward Secrecy (PFS) enabled
- Certificate pinning for mobile applications
- Encrypted API communications with all third parties
- VPN tunneling for internal system communications

### 7. Consumer Data Encryption at Rest

**Answer**: Yes, we encrypt consumer data you receive from Plaid API at rest

**Implementation**:
- AES-256 encryption for all database storage
- Encrypted storage volumes with AWS KMS key management
- Application-level encryption for sensitive fields (UTR, bank details)
- Secure backup encryption with separate key management
- Encryption at rest for all log files and temporary data

## Development and Vulnerability Management

### 8. Vulnerability Management Program

**Answer**: Yes, we actively perform vulnerability scans and have a formal vulnerability management program

**Program Components**:
- Weekly automated vulnerability scans of all systems
- Monthly penetration testing by third-party security firms
- Continuous dependency scanning for application libraries
- Code security reviews using SAST/DAST tools
- Bug bounty program for external security research
- Vulnerability disclosure policy with defined SLAs

**Practices**:
- Static Application Security Testing (SAST) integrated into CI/CD
- Dynamic Application Security Testing (DAST) on staging environments
- Container and infrastructure scanning
- Regular security training for development team
- Secure coding standards and guidelines

## Privacy

### 9. Privacy Policy for Plaid Link Application

**Answer**: Yes, we have a privacy policy available to users

**Privacy Policy Location**: https://zenrent.com/privacy-policy  
**Alternative**: Available in our application settings and terms of service

**Key Sections**:
- Clear description of data collection and usage
- Third-party integrations including Plaid
- User rights under GDPR/UK Data Protection Act
- Data retention periods and deletion procedures
- Contact information for privacy inquiries

### 10. Consumer Consent for Data Collection

**Answer**: Yes, we obtain consent from consumers for data collection, processing, and storage

**Consent Mechanisms**:
- Explicit opt-in during account registration
- Granular consent for different data types (financial, marketing, analytics)
- Clear consent language in plain English
- Easy withdrawal mechanisms in account settings
- Consent logging with timestamps and IP addresses
- Regular consent renewal for marketing communications

### 11. Data Deletion and Retention Policy

**Answer**: Yes, we have a defined and enforced data deletion and retention policy compliant with applicable data privacy laws

**Policy Implementation**:
- Automated data deletion based on retention schedules
- Manual deletion capabilities for user requests
- Legal hold procedures for litigation/investigations
- Regular audit of data retention compliance
- Documented procedures for all data categories
- GDPR "Right to be Forgotten" implementation

**Review Process**: Policy reviewed annually and updated as needed

## Additional Documentation

**Supporting Documents Available**:
- SOC 2 Type II Compliance Report
- ISO 27001 Certification
- Penetration Testing Results (latest quarterly report)
- Business Continuity Plan
- Incident Response Runbook
- Data Processing Impact Assessments (DPIA)

## Compliance Certifications

**Current Certifications**:
- ISO 27001:2013 Information Security Management
- SOC 2 Type II (Security, Availability, Confidentiality)
- GDPR Compliance Certification
- Cyber Essentials Plus (UK Government Scheme)

**Ongoing Assessments**:
- Annual ISO 27001 surveillance audits
- Quarterly SOC 2 attestation updates
- Regular compliance monitoring and testing

## Contact for Follow-up

**Primary Contact**: James Anderson (CISO)  
**Email**: security@zenrent.com  
**Phone**: +44 20 1234 5678  

**Secondary Contact**: Sarah Mitchell (DPO)  
**Email**: dpo@zenrent.com  
**Phone**: +44 20 1234 5679

**Emergency Security Contact**: Available 24/7 via security@zenrent.com

---

**Questionnaire Completed**: January 2024  
**Next Review**: Annually or upon significant infrastructure changes  
**Document Classification**: Confidential - Third Party Disclosure 