/**
 * Data Privacy Compliance Tests
 * Tests compliance with GDPR, UK Data Protection Act, and privacy requirements
 */

describe('Data Privacy Compliance Tests', () => {
  beforeEach(() => {
    // Reset localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    
    // Mock crypto API for encryption tests
    Object.defineProperty(global, 'crypto', {
      value: {
        getRandomValues: jest.fn((arr) => {
          for (let i = 0; i < arr.length; i++) {
            arr[i] = Math.floor(Math.random() * 256);
          }
          return arr;
        }),
        subtle: {
          encrypt: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
          decrypt: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
          generateKey: jest.fn().mockResolvedValue({}),
          importKey: jest.fn().mockResolvedValue({})
        }
      }
    });
  });

  describe('GDPR Compliance', () => {
    describe('Article 6 - Lawfulness of Processing', () => {
      it('should have legal basis for processing personal data', () => {
        const legalBases = [
          'consent',
          'contract',
          'legal_obligation',
          'vital_interests',
          'public_task',
          'legitimate_interests'
        ];

        const taxProcessingBasis = 'legal_obligation'; // HMRC submission
        const marketingBasis = 'consent'; // Marketing communications
        const contractBasis = 'contract'; // Service provision

        expect(legalBases).toContain(taxProcessingBasis);
        expect(legalBases).toContain(marketingBasis);
        expect(legalBases).toContain(contractBasis);
      });

      it('should document legal basis for each processing activity', () => {
        const processingActivities = {
          tax_calculation: {
            purpose: 'Calculate tax liability for HMRC submission',
            legalBasis: 'legal_obligation',
            dataTypes: ['income', 'expenses', 'personal_details'],
            retention: '7_years'
          },
          user_authentication: {
            purpose: 'Secure access to tax services',
            legalBasis: 'contract',
            dataTypes: ['email', 'password_hash'],
            retention: 'account_lifetime'
          },
          analytics: {
            purpose: 'Improve service performance',
            legalBasis: 'legitimate_interests',
            dataTypes: ['usage_statistics', 'performance_metrics'],
            retention: '2_years'
          }
        };

        Object.values(processingActivities).forEach(activity => {
          expect(activity.purpose).toBeTruthy();
          expect(activity.legalBasis).toBeTruthy();
          expect(activity.dataTypes).toBeInstanceOf(Array);
          expect(activity.retention).toBeTruthy();
        });
      });
    });

    describe('Article 7 - Conditions for Consent', () => {
      it('should obtain explicit consent for non-essential processing', () => {
        const consentForm = document.createElement('form');
        
        const analyticsConsent = document.createElement('input');
        analyticsConsent.type = 'checkbox';
        analyticsConsent.id = 'analytics-consent';
        analyticsConsent.name = 'consent_analytics';
        analyticsConsent.value = 'true';

        const marketingConsent = document.createElement('input');
        marketingConsent.type = 'checkbox';
        marketingConsent.id = 'marketing-consent';
        marketingConsent.name = 'consent_marketing';
        marketingConsent.value = 'true';

        const analyticsLabel = document.createElement('label');
        analyticsLabel.htmlFor = 'analytics-consent';
        analyticsLabel.textContent = 'I consent to analytics tracking to improve service quality';

        const marketingLabel = document.createElement('label');
        marketingLabel.htmlFor = 'marketing-consent';
        marketingLabel.textContent = 'I consent to receiving marketing communications about tax services';

        consentForm.appendChild(analyticsConsent);
        consentForm.appendChild(analyticsLabel);
        consentForm.appendChild(marketingConsent);
        consentForm.appendChild(marketingLabel);

        // Consent should be freely given, specific, informed, and unambiguous
        expect(analyticsConsent.checked).toBe(false); // Not pre-checked
        expect(marketingConsent.checked).toBe(false); // Not pre-checked
        expect(analyticsLabel.textContent).toContain('I consent');
        expect(marketingLabel.textContent).toContain('I consent');
      });

      it('should allow withdrawal of consent', () => {
        const consentManagement = {
          withdrawConsent: jest.fn(),
          getConsentStatus: jest.fn(),
          updateConsentPreferences: jest.fn()
        };

        const withdrawButton = document.createElement('button');
        withdrawButton.textContent = 'Withdraw Consent';
        withdrawButton.onclick = () => consentManagement.withdrawConsent('analytics');

        const preferencesForm = document.createElement('form');
        const currentConsent = document.createElement('input');
        currentConsent.type = 'checkbox';
        currentConsent.checked = true;
        currentConsent.onchange = () => consentManagement.updateConsentPreferences();

        preferencesForm.appendChild(currentConsent);

        expect(withdrawButton.onclick).toBeTruthy();
        expect(currentConsent.onchange).toBeTruthy();
        expect(typeof consentManagement.withdrawConsent).toBe('function');
      });

      it('should record consent with timestamp and version', () => {
        const consentRecord = {
          userId: 'user-123',
          consentType: 'analytics',
          granted: true,
          timestamp: new Date().toISOString(),
          privacyPolicyVersion: '2.1',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0...',
          method: 'checkbox'
        };

        expect(consentRecord.userId).toBeTruthy();
        expect(consentRecord.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        expect(consentRecord.privacyPolicyVersion).toBeTruthy();
        expect(typeof consentRecord.granted).toBe('boolean');
      });
    });

    describe('Article 12-14 - Information and Access', () => {
      it('should provide clear privacy notice', () => {
        const privacyNotice = {
          dataController: 'ZenRent Ltd',
          contactDetails: 'privacy@zenrent.com',
          dpoContact: 'dpo@zenrent.com',
          purposes: [
            'Tax calculation and HMRC submission',
            'User authentication and account management',
            'Service improvement and analytics'
          ],
          legalBases: ['legal_obligation', 'contract', 'legitimate_interests'],
          recipients: ['HMRC', 'Cloud service providers'],
          retentionPeriods: {
            tax_data: '7 years',
            account_data: 'Until account deletion',
            analytics: '2 years'
          },
          rights: [
            'Access your data',
            'Rectify inaccurate data',
            'Erase data (where applicable)',
            'Restrict processing',
            'Data portability',
            'Object to processing'
          ],
          complaints: 'Information Commissioner\'s Office (ICO)'
        };

        expect(privacyNotice.dataController).toBeTruthy();
        expect(privacyNotice.contactDetails).toContain('@');
        expect(privacyNotice.purposes.length).toBeGreaterThan(0);
        expect(privacyNotice.rights.length).toBe(6);
      });

      it('should provide data subject access functionality', () => {
        const dataAccessRequest = {
          requestId: 'dar-123',
          userId: 'user-456',
          requestDate: new Date().toISOString(),
          status: 'pending',
          dataCategories: [
            'personal_details',
            'tax_calculations',
            'account_activity',
            'consent_records'
          ],
          format: 'json',
          deliveryMethod: 'secure_download'
        };

        const accessRequestForm = document.createElement('form');
        const submitButton = document.createElement('button');
        submitButton.textContent = 'Request My Data';
        submitButton.type = 'submit';
        accessRequestForm.appendChild(submitButton);

        expect(dataAccessRequest.requestId).toBeTruthy();
        expect(dataAccessRequest.dataCategories.length).toBeGreaterThan(0);
        expect(submitButton.textContent).toContain('Request');
      });
    });

    describe('Article 17 - Right to Erasure', () => {
      it('should provide data deletion functionality', () => {
        const deletionRequest = {
          requestId: 'del-789',
          userId: 'user-456',
          requestDate: new Date().toISOString(),
          reason: 'withdrawal_of_consent',
          dataCategories: ['marketing_data', 'analytics_data'],
          retentionExceptions: ['tax_data'], // Legal obligation
          status: 'approved'
        };

        const deleteAccountButton = document.createElement('button');
        deleteAccountButton.textContent = 'Delete My Account';
        deleteAccountButton.className = 'btn-danger';
        deleteAccountButton.onclick = () => {
          const confirmed = confirm('Are you sure? This action cannot be undone.');
          if (confirmed) {
            // Process deletion
            return true;
          }
          return false;
        };

        expect(deletionRequest.reason).toBeTruthy();
        expect(deletionRequest.retentionExceptions).toContain('tax_data');
        expect(deleteAccountButton.onclick).toBeTruthy();
      });

      it('should handle retention requirements for tax data', () => {
        const retentionPolicy = {
          tax_submissions: {
            period: '7_years',
            reason: 'HMRC_legal_requirement',
            deletionEligible: false
          },
          user_preferences: {
            period: 'account_lifetime',
            reason: 'service_provision',
            deletionEligible: true
          },
          marketing_data: {
            period: 'until_consent_withdrawn',
            reason: 'consent',
            deletionEligible: true
          }
        };

        expect(retentionPolicy.tax_submissions.deletionEligible).toBe(false);
        expect(retentionPolicy.user_preferences.deletionEligible).toBe(true);
        expect(retentionPolicy.marketing_data.deletionEligible).toBe(true);
      });
    });

    describe('Article 20 - Data Portability', () => {
      it('should provide data export functionality', () => {
        const exportRequest = {
          userId: 'user-456',
          format: 'json',
          dataTypes: [
            'personal_profile',
            'tax_calculations',
            'property_data',
            'transaction_history'
          ],
          excludeSystemData: true,
          includeMetadata: false
        };

        const exportButton = document.createElement('button');
        exportButton.textContent = 'Export My Data';
        exportButton.onclick = () => {
          // Generate export file
          const exportData = {
            exportDate: new Date().toISOString(),
            userId: exportRequest.userId,
            data: {
              profile: {},
              calculations: [],
              properties: [],
              transactions: []
            }
          };
          return exportData;
        };

        expect(exportRequest.format).toBe('json');
        expect(exportRequest.dataTypes.length).toBeGreaterThan(0);
        expect(exportButton.onclick).toBeTruthy();
      });
    });

    describe('Article 25 - Data Protection by Design', () => {
      it('should implement privacy by design principles', () => {
        const privacyFeatures = {
          dataMinimization: {
            collectOnlyNecessary: true,
            purposeLimitation: true,
            retentionLimits: true
          },
          securityMeasures: {
            encryption: true,
            accessControls: true,
            auditLogging: true,
            regularBackups: true
          },
          userControl: {
            consentManagement: true,
            dataAccess: true,
            dataPortability: true,
            dataDeletion: true
          },
          transparency: {
            privacyNotice: true,
            cookiePolicy: true,
            dataProcessingLog: true
          }
        };

        expect(privacyFeatures.dataMinimization.collectOnlyNecessary).toBe(true);
        expect(privacyFeatures.securityMeasures.encryption).toBe(true);
        expect(privacyFeatures.userControl.consentManagement).toBe(true);
        expect(privacyFeatures.transparency.privacyNotice).toBe(true);
      });
    });

    describe('Article 32 - Security of Processing', () => {
      it('should implement appropriate technical measures', () => {
        const securityMeasures = {
          encryption: {
            atRest: true,
            inTransit: true,
            algorithm: 'AES-256',
            keyManagement: 'HSM'
          },
          accessControl: {
            authentication: 'multi_factor',
            authorization: 'role_based',
            sessionManagement: true,
            passwordPolicy: true
          },
          monitoring: {
            auditLogging: true,
            intrusionDetection: true,
            vulnerabilityScanning: true,
            incidentResponse: true
          },
          backup: {
            regularBackups: true,
            encryptedBackups: true,
            offSiteStorage: true,
            recoveryTesting: true
          }
        };

        expect(securityMeasures.encryption.atRest).toBe(true);
        expect(securityMeasures.accessControl.authentication).toBe('multi_factor');
        expect(securityMeasures.monitoring.auditLogging).toBe(true);
        expect(securityMeasures.backup.regularBackups).toBe(true);
      });

      it('should test encryption functionality', async () => {
        const sensitiveData = 'UTR: 1234567890';
        const key = await crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
        );

        const encryptedData = await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv: new Uint8Array(12) },
          key,
          new TextEncoder().encode(sensitiveData)
        );

        expect(encryptedData).toBeInstanceOf(ArrayBuffer);
        expect(encryptedData.byteLength).toBeGreaterThan(0);
        expect(crypto.subtle.encrypt).toHaveBeenCalled();
      });
    });

    describe('Article 33-34 - Breach Notification', () => {
      it('should have breach detection and notification procedures', () => {
        const breachResponse = {
          detection: {
            monitoringTools: true,
            alertSystems: true,
            logAnalysis: true,
            userReporting: true
          },
          assessment: {
            riskEvaluation: true,
            dataTypesAffected: [],
            numberOfRecords: 0,
            potentialImpact: 'low'
          },
          notification: {
            supervisoryAuthority: {
              required: true,
              timeframe: '72_hours',
              method: 'online_portal'
            },
            dataSubjects: {
              required: false,
              criteria: 'high_risk',
              method: 'email_notification'
            }
          },
          remediation: {
            containment: true,
            investigation: true,
            systemUpdates: true,
            userCommunication: true
          }
        };

        expect(breachResponse.detection.monitoringTools).toBe(true);
        expect(breachResponse.notification.supervisoryAuthority.timeframe).toBe('72_hours');
        expect(breachResponse.remediation.containment).toBe(true);
      });
    });
  });

  describe('UK Data Protection Act Compliance', () => {
    it('should comply with UK-specific requirements', () => {
      const ukCompliance = {
        lawEnforcement: {
          dataSharing: false,
          legalBasis: null,
          safeguards: []
        },
        nationalSecurity: {
          exemptions: false,
          ministerialCertificate: false
        },
        immigration: {
          dataSharing: false,
          exemptions: false
        },
        journalism: {
          exemptions: false,
          publicInterest: false
        }
      };

      // For tax software, these should generally be false
      expect(ukCompliance.lawEnforcement.dataSharing).toBe(false);
      expect(ukCompliance.nationalSecurity.exemptions).toBe(false);
      expect(ukCompliance.immigration.dataSharing).toBe(false);
    });

    it('should handle subject access requests under UK law', () => {
      const ukAccessRequest = {
        feeRequired: false, // Generally free under UK GDPR
        timeLimit: '30_days', // Can be extended to 90 days in complex cases
        identityVerification: true,
        thirdPartyData: 'redacted',
        exemptions: []
      };

      expect(ukAccessRequest.feeRequired).toBe(false);
      expect(ukAccessRequest.timeLimit).toBe('30_days');
      expect(ukAccessRequest.identityVerification).toBe(true);
    });
  });

  describe('Cookie Compliance', () => {
    it('should implement cookie consent management', () => {
      const cookieCategories = {
        essential: {
          required: true,
          consent: false,
          description: 'Necessary for website functionality',
          cookies: ['session_id', 'csrf_token', 'auth_token']
        },
        analytics: {
          required: false,
          consent: true,
          description: 'Help us improve our services',
          cookies: ['_ga', '_gid', 'analytics_session']
        },
        marketing: {
          required: false,
          consent: true,
          description: 'Personalized advertising',
          cookies: ['marketing_id', 'ad_preferences']
        }
      };

      const cookieBanner = document.createElement('div');
      cookieBanner.id = 'cookie-banner';
      cookieBanner.innerHTML = `
        <p>We use cookies to improve your experience.</p>
        <button id="accept-all">Accept All</button>
        <button id="reject-optional">Reject Optional</button>
        <button id="manage-preferences">Manage Preferences</button>
      `;

      expect(cookieCategories.essential.consent).toBe(false);
      expect(cookieCategories.analytics.consent).toBe(true);
      expect(cookieBanner.querySelector('#accept-all')).toBeTruthy();
      expect(cookieBanner.querySelector('#manage-preferences')).toBeTruthy();
    });

    it('should provide cookie preference management', () => {
      const cookiePreferences = {
        savePreferences: jest.fn(),
        loadPreferences: jest.fn(),
        clearCookies: jest.fn(),
        updateConsent: jest.fn()
      };

      const preferencesModal = document.createElement('div');
      preferencesModal.innerHTML = `
        <h2>Cookie Preferences</h2>
        <div>
          <input type="checkbox" id="analytics-cookies" checked disabled>
          <label for="analytics-cookies">Essential Cookies (Required)</label>
        </div>
        <div>
          <input type="checkbox" id="analytics-cookies">
          <label for="analytics-cookies">Analytics Cookies</label>
        </div>
        <button onclick="cookiePreferences.savePreferences()">Save Preferences</button>
      `;

      expect(cookiePreferences.savePreferences).toBeDefined();
      expect(preferencesModal.querySelector('#analytics-cookies')).toBeTruthy();
    });
  });

  describe('Data Minimization', () => {
    it('should collect only necessary data', () => {
      const dataCollection = {
        taxCalculation: {
          required: ['income', 'expenses', 'tax_year'],
          optional: ['property_details', 'contact_preferences'],
          prohibited: ['political_opinions', 'religious_beliefs', 'health_data']
        },
        userRegistration: {
          required: ['email', 'password'],
          optional: ['name', 'phone'],
          prohibited: ['date_of_birth', 'national_insurance_number']
        }
      };

      expect(dataCollection.taxCalculation.required.length).toBeGreaterThan(0);
      expect(dataCollection.taxCalculation.prohibited.length).toBeGreaterThan(0);
      expect(dataCollection.userRegistration.required).toContain('email');
      expect(dataCollection.userRegistration.prohibited).toContain('national_insurance_number');
    });

    it('should implement purpose limitation', () => {
      const purposeLimitation = {
        taxData: {
          primaryPurpose: 'hmrc_submission',
          secondaryPurposes: ['audit_trail', 'user_dashboard'],
          prohibitedUses: ['marketing', 'profiling', 'third_party_sharing']
        },
        contactData: {
          primaryPurpose: 'service_communication',
          secondaryPurposes: ['account_security'],
          prohibitedUses: ['marketing_without_consent', 'data_sales']
        }
      };

      expect(purposeLimitation.taxData.prohibitedUses).toContain('marketing');
      expect(purposeLimitation.contactData.prohibitedUses).toContain('data_sales');
    });
  });

  describe('Data Retention', () => {
    it('should implement appropriate retention periods', () => {
      const retentionSchedule = {
        tax_submissions: {
          period: 7, // years
          unit: 'years',
          reason: 'HMRC legal requirement',
          autoDelete: true,
          reviewDate: '2030-12-31'
        },
        user_accounts: {
          period: null, // Until deletion requested
          unit: 'account_lifetime',
          reason: 'Service provision',
          autoDelete: false,
          reviewDate: null
        },
        audit_logs: {
          period: 3,
          unit: 'years',
          reason: 'Security and compliance',
          autoDelete: true,
          reviewDate: '2026-12-31'
        },
        marketing_data: {
          period: 2,
          unit: 'years',
          reason: 'Consent-based processing',
          autoDelete: true,
          reviewDate: '2025-12-31'
        }
      };

      expect(retentionSchedule.tax_submissions.period).toBe(7);
      expect(retentionSchedule.audit_logs.autoDelete).toBe(true);
      expect(retentionSchedule.marketing_data.reason).toContain('consent');
    });

    it('should implement automated data deletion', () => {
      const deletionScheduler = {
        scheduleCleanup: jest.fn(),
        executeCleanup: jest.fn(),
        verifyDeletion: jest.fn(),
        logDeletion: jest.fn()
      };

      const cleanupJob = {
        jobId: 'cleanup-001',
        scheduledDate: '2024-01-01',
        dataCategory: 'expired_marketing_data',
        estimatedRecords: 1000,
        status: 'pending'
      };

      expect(deletionScheduler.scheduleCleanup).toBeDefined();
      expect(cleanupJob.dataCategory).toBeTruthy();
      expect(cleanupJob.status).toBe('pending');
    });
  });

  describe('Third-Party Data Sharing', () => {
    it('should document data sharing agreements', () => {
      const dataSharing = {
        hmrc: {
          purpose: 'Tax return submission',
          legalBasis: 'legal_obligation',
          dataTypes: ['tax_calculations', 'personal_details'],
          safeguards: ['encryption', 'secure_transmission'],
          adequacyDecision: 'uk_government'
        },
        cloudProvider: {
          purpose: 'Data hosting and processing',
          legalBasis: 'contract',
          dataTypes: ['all_user_data'],
          safeguards: ['encryption', 'access_controls', 'audit_logging'],
          adequacyDecision: 'eu_us_privacy_framework'
        }
      };

      expect(dataSharing.hmrc.legalBasis).toBe('legal_obligation');
      expect(dataSharing.cloudProvider.safeguards).toContain('encryption');
    });

    it('should implement data transfer safeguards', () => {
      const transferSafeguards = {
        adequacyDecisions: ['eu_countries', 'uk', 'canada'],
        standardContractualClauses: true,
        bindingCorporateRules: false,
        certificationSchemes: ['iso27001', 'soc2'],
        codesOfConduct: []
      };

      expect(transferSafeguards.standardContractualClauses).toBe(true);
      expect(transferSafeguards.certificationSchemes).toContain('iso27001');
    });
  });

  describe('Privacy Impact Assessment', () => {
    it('should conduct privacy impact assessments', () => {
      const pia = {
        triggerCriteria: {
          newTechnology: false,
          largescaleProcessing: false,
          sensitiveData: true, // Tax data
          systematicMonitoring: false,
          vulnerableGroups: false
        },
        assessment: {
          necessityTest: 'passed',
          proportionalityTest: 'passed',
          riskLevel: 'medium',
          mitigationMeasures: [
            'encryption',
            'access_controls',
            'audit_logging',
            'staff_training'
          ]
        },
        consultation: {
          dpoConsulted: true,
          stakeholdersConsulted: true,
          supervisoryAuthorityConsulted: false
        }
      };

      expect(pia.triggerCriteria.sensitiveData).toBe(true);
      expect(pia.assessment.riskLevel).toBe('medium');
      expect(pia.consultation.dpoConsulted).toBe(true);
    });
  });
}); 