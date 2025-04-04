// OpenAI Function schema definitions for tenant data processing

// Tenant schema - the expected structure for each tenant
export const tenantSchema = {
  type: "object",
  properties: {
    firstName: {
      type: "string",
      description: "Tenant's first name",
    },
    lastName: {
      type: "string",
      description: "Tenant's last name",
    },
    phoneNumber: {
      type: "string",
      description: "Tenant's contact phone number",
    },
    email: {
      type: "string",
      format: "email",
      description: "Tenant's email address",
    },
    roomNumber: {
      type: "string",
      description: "Room number (only relevant for HMO properties)",
    },
    agreementType: {
      type: "string",
      enum: ["ast", "non-ast", "company-let", "student", "other"],
      description: "Type of tenancy agreement",
    },
    tenancyTerm: {
      type: "string",
      enum: ["fixed", "periodic"],
      description: "Term of the tenancy",
    },
    startDate: {
      type: "string",
      format: "date",
      description: "Start date of the tenancy (DD/MM/YYYY format)",
    },
    endDate: {
      type: "string",
      format: "date",
      description: "End date of the tenancy (DD/MM/YYYY format)",
    },
    hasBreakClause: {
      type: "boolean",
      description: "Whether the tenancy has a break clause",
    },
    breakClauseDetails: {
      type: "string",
      description: "Details of the break clause if applicable",
    },
    rentAmount: {
      type: "string",
      description: "Rent amount (without currency symbol)",
    },
    rentFrequency: {
      type: "string",
      enum: ["weekly", "monthly", "quarterly", "annually"],
      default: "monthly",
      description: "Frequency of rent payments",
    },
    rentDueDay: {
      type: "string",
      description: "Day of the month/week rent is due (1-31)",
    },
    paymentMethod: {
      type: "string",
      enum: [
        "bank-transfer",
        "standing-order",
        "direct-debit",
        "cash",
        "check",
      ],
      description: "Method of rent payment",
    },
    depositAmount: {
      type: "string",
      description: "Deposit amount (without currency symbol)",
    },
    depositScheme: {
      type: "string",
      enum: [
        "deposit-protection-service",
        "my-deposits",
        "tenancy-deposit-scheme",
        "other",
      ],
      description: "Deposit protection scheme used",
    },
    depositRegistrationDate: {
      type: "string",
      format: "date",
      description: "Date the deposit was registered with the scheme",
    },
    depositRegistrationRef: {
      type: "string",
      description: "Reference number for the deposit registration",
    },
  },
  required: ["firstName", "lastName", "email"],
};

// OpenAI function definition for parsing standard (non-HMO) property tenant data
export const standardPropertyFunction = {
  name: "processStandardPropertyTenants",
  description:
    "Process and structure tenant data for a standard (non-HMO) property",
  parameters: {
    type: "object",
    properties: {
      propertyId: {
        type: "string",
        description: "The ID of the property these tenants are associated with",
      },
      propertyAddress: {
        type: "string",
        description: "The address of the property",
      },
      tenancyDetails: {
        type: "object",
        description:
          "Common tenancy details that apply to all tenants in this property",
        properties: {
          agreementType: {
            type: "string",
            enum: ["ast", "non-ast", "company-let", "student", "other"],
            description: "Type of tenancy agreement",
          },
          tenancyTerm: {
            type: "string",
            enum: ["fixed", "periodic"],
            description: "Term of the tenancy",
          },
          startDate: {
            type: "string",
            format: "date",
            description: "Start date of the tenancy (DD/MM/YYYY format)",
          },
          endDate: {
            type: "string",
            format: "date",
            description: "End date of the tenancy (DD/MM/YYYY format)",
          },
          hasBreakClause: {
            type: "boolean",
            description: "Whether the tenancy has a break clause",
          },
          breakClauseDetails: {
            type: "string",
            description: "Details of the break clause if applicable",
          },
          rentAmount: {
            type: "string",
            description: "Rent amount (without currency symbol)",
          },
          rentFrequency: {
            type: "string",
            enum: ["weekly", "monthly", "quarterly", "annually"],
            default: "monthly",
            description: "Frequency of rent payments",
          },
          rentDueDay: {
            type: "string",
            description: "Day of the month/week rent is due (1-31)",
          },
          paymentMethod: {
            type: "string",
            enum: [
              "bank-transfer",
              "standing-order",
              "direct-debit",
              "cash",
              "check",
            ],
            description: "Method of rent payment",
          },
          depositAmount: {
            type: "string",
            description: "Deposit amount (without currency symbol)",
          },
          depositScheme: {
            type: "string",
            enum: [
              "deposit-protection-service",
              "my-deposits",
              "tenancy-deposit-scheme",
              "other",
            ],
            description: "Deposit protection scheme used",
          },
          depositRegistrationDate: {
            type: "string",
            format: "date",
            description: "Date the deposit was registered with the scheme",
          },
          depositRegistrationRef: {
            type: "string",
            description: "Reference number for the deposit registration",
          },
        },
        required: [
          "agreementType",
          "tenancyTerm",
          "startDate",
          "rentAmount",
          "rentFrequency",
          "rentDueDay",
        ],
      },
      tenants: {
        type: "array",
        description:
          "Array of tenants for this property (typically 1-2 tenants for standard properties)",
        items: {
          type: "object",
          properties: {
            firstName: {
              type: "string",
              description: "Tenant's first name",
            },
            lastName: {
              type: "string",
              description: "Tenant's last name",
            },
            phoneNumber: {
              type: "string",
              description: "Tenant's contact phone number",
            },
            email: {
              type: "string",
              format: "email",
              description: "Tenant's email address",
            },
          },
          required: ["firstName", "lastName", "email"],
        },
      },
    },
    required: ["propertyId", "tenancyDetails", "tenants"],
  },
};

// OpenAI function definition for parsing HMO property tenant data
export const hmoPropertyFunction = {
  name: "processHMOPropertyTenants",
  description:
    "Process and structure tenant data for an HMO property where each room has a separate tenant and potentially different tenancy details",
  parameters: {
    type: "object",
    properties: {
      propertyId: {
        type: "string",
        description:
          "The ID of the HMO property these tenants are associated with",
      },
      propertyAddress: {
        type: "string",
        description: "The address of the HMO property",
      },
      rooms: {
        type: "array",
        description:
          "Array of rooms with tenant and tenancy details specific to each room",
        items: {
          type: "object",
          properties: {
            roomNumber: {
              type: "string",
              description: "The room identifier within the HMO property",
            },
            tenant: {
              type: "object",
              description: "Details of the tenant occupying this room",
              properties: {
                firstName: {
                  type: "string",
                  description: "Tenant's first name",
                },
                lastName: {
                  type: "string",
                  description: "Tenant's last name",
                },
                phoneNumber: {
                  type: "string",
                  description: "Tenant's contact phone number",
                },
                email: {
                  type: "string",
                  format: "email",
                  description: "Tenant's email address",
                },
              },
              required: ["firstName", "lastName", "email"],
            },
            tenancyDetails: {
              type: "object",
              description: "Tenancy details specific to this room",
              properties: {
                agreementType: {
                  type: "string",
                  enum: ["ast", "non-ast", "company-let", "student", "other"],
                  description: "Type of tenancy agreement",
                },
                tenancyTerm: {
                  type: "string",
                  enum: ["fixed", "periodic"],
                  description: "Term of the tenancy",
                },
                startDate: {
                  type: "string",
                  format: "date",
                  description: "Start date of the tenancy (DD/MM/YYYY format)",
                },
                endDate: {
                  type: "string",
                  format: "date",
                  description: "End date of the tenancy (DD/MM/YYYY format)",
                },
                hasBreakClause: {
                  type: "boolean",
                  description: "Whether the tenancy has a break clause",
                },
                breakClauseDetails: {
                  type: "string",
                  description: "Details of the break clause if applicable",
                },
                rentAmount: {
                  type: "string",
                  description: "Rent amount (without currency symbol)",
                },
                rentFrequency: {
                  type: "string",
                  enum: ["weekly", "monthly", "quarterly", "annually"],
                  default: "monthly",
                  description: "Frequency of rent payments",
                },
                rentDueDay: {
                  type: "string",
                  description: "Day of the month/week rent is due (1-31)",
                },
                paymentMethod: {
                  type: "string",
                  enum: [
                    "bank-transfer",
                    "standing-order",
                    "direct-debit",
                    "cash",
                    "check",
                  ],
                  description: "Method of rent payment",
                },
                depositAmount: {
                  type: "string",
                  description: "Deposit amount (without currency symbol)",
                },
                depositScheme: {
                  type: "string",
                  enum: [
                    "deposit-protection-service",
                    "my-deposits",
                    "tenancy-deposit-scheme",
                    "other",
                  ],
                  description: "Deposit protection scheme used",
                },
                depositRegistrationDate: {
                  type: "string",
                  format: "date",
                  description:
                    "Date the deposit was registered with the scheme",
                },
                depositRegistrationRef: {
                  type: "string",
                  description: "Reference number for the deposit registration",
                },
              },
              required: [
                "agreementType",
                "tenancyTerm",
                "startDate",
                "rentAmount",
                "rentFrequency",
                "rentDueDay",
              ],
            },
          },
          required: ["roomNumber", "tenant", "tenancyDetails"],
        },
      },
    },
    required: ["propertyId", "rooms"],
  },
};
