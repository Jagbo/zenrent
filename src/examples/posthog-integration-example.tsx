"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePostHog } from "@/hooks/usePostHog";
import { ANALYTICS_EVENTS, PropertyEventProperties, createEventProperties } from "@/lib/analytics/events";
import { supabase } from "@/lib/supabase";

export default function AddPropertyPageWithAnalytics() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [propertyName, setPropertyName] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [bedrooms, setBedrooms] = useState<number | string>("");
  const [rentAmount, setRentAmount] = useState<number | string>("");
  
  // Initialize PostHog with user ID
  const { trackEvent, identifyUser } = usePostHog(userId || undefined);

  // Track when user starts creating a property
  useEffect(() => {
    if (userId) {
      trackEvent({
        event: ANALYTICS_EVENTS.PROPERTY_VIEWED,
        properties: createEventProperties({
          page: 'add_property',
          action: 'form_opened',
        }),
      });
    }
  }, [userId, trackEvent]);

  // Identify user when they're loaded
  useEffect(() => {
    async function getUser() {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError || !userData?.user) {
          router.push("/sign-up");
          return;
        }

        const user = userData.user;
        setUserId(user.id);

        // Identify user in PostHog with their properties
        await identifyUser({
          email: user.email,
          user_type: 'landlord',
          signup_date: user.created_at,
          last_login: new Date().toISOString(),
        });

      } catch (error) {
        console.error("Error in getUser:", error);
        router.push("/sign-up");
      }
    }
    getUser();
  }, [router, identifyUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) return;

    try {
      // Track property creation attempt
      await trackEvent({
        event: ANALYTICS_EVENTS.PROPERTY_CREATED,
        properties: createEventProperties({
          property_type: propertyType,
          bedrooms: Number(bedrooms) || 0,
          rent_amount: Number(rentAmount) || 0,
          has_property_name: !!propertyName,
          form_completion_time: Date.now(), // You could track how long it took
        } as PropertyEventProperties),
      });

      // Your existing property creation logic here...
      const propertyData = {
        user_id: userId,
        property_name: propertyName,
        property_type: propertyType,
        number_of_bedrooms: Number(bedrooms) || 0,
        rent_amount: Number(rentAmount) || 0,
        // ... other fields
      };

      const { data, error } = await supabase
        .from("properties")
        .insert([propertyData])
        .select()
        .single();

      if (error) throw error;

      // Track successful property creation
      await trackEvent({
        event: ANALYTICS_EVENTS.PROPERTY_CREATED,
        properties: createEventProperties({
          property_id: data.id,
          property_type: propertyType,
          bedrooms: Number(bedrooms) || 0,
          rent_amount: Number(rentAmount) || 0,
          success: true,
        } as PropertyEventProperties),
      });

      // Update user properties with new property count
      const { data: userProperties } = await supabase
        .from("properties")
        .select("id")
        .eq("user_id", userId);

      await identifyUser({
        properties_count: userProperties?.length || 1,
        last_property_created: new Date().toISOString(),
      });

      router.push("/onboarding/tenant/import-options");

    } catch (error) {
      console.error("Error creating property:", error);
      
      // Track failed property creation
      await trackEvent({
        event: ANALYTICS_EVENTS.PROPERTY_CREATED,
        properties: createEventProperties({
          property_type: propertyType,
          success: false,
          error_message: error instanceof Error ? error.message : 'Unknown error',
        }),
      });
    }
  };

  const handlePropertyTypeChange = async (newType: string) => {
    setPropertyType(newType);
    
    // Track property type selection
    await trackEvent({
      event: ANALYTICS_EVENTS.FEATURE_USED,
      properties: createEventProperties({
        feature: 'property_type_selector',
        property_type: newType,
        page: 'add_property',
      }),
    });
  };

  const handleFormFieldChange = async (field: string, value: any) => {
    // Track form field interactions for UX insights
    await trackEvent({
      event: ANALYTICS_EVENTS.FEATURE_USED,
      properties: createEventProperties({
        feature: 'form_field_interaction',
        field_name: field,
        page: 'add_property',
        has_value: !!value,
      }),
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Add Property</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Property Name
          </label>
          <input
            type="text"
            value={propertyName}
            onChange={(e) => {
              setPropertyName(e.target.value);
              handleFormFieldChange('property_name', e.target.value);
            }}
            className="w-full p-3 border rounded-lg"
            placeholder="Enter property name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Property Type
          </label>
          <select
            value={propertyType}
            onChange={(e) => handlePropertyTypeChange(e.target.value)}
            className="w-full p-3 border rounded-lg"
          >
            <option value="">Select property type</option>
            <option value="apartment">Apartment</option>
            <option value="house">House</option>
            <option value="commercial">Commercial</option>
            <option value="hmo">HMO</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Number of Bedrooms
          </label>
          <input
            type="number"
            value={bedrooms}
            onChange={(e) => {
              setBedrooms(e.target.value);
              handleFormFieldChange('bedrooms', e.target.value);
            }}
            className="w-full p-3 border rounded-lg"
            placeholder="Enter number of bedrooms"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Monthly Rent Amount (£)
          </label>
          <input
            type="number"
            value={rentAmount}
            onChange={(e) => {
              setRentAmount(e.target.value);
              handleFormFieldChange('rent_amount', e.target.value);
            }}
            className="w-full p-3 border rounded-lg"
            placeholder="Enter monthly rent amount"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Property
        </button>
      </form>
    </div>
  );
}

// Example: How to track WhatsApp events
export function WhatsAppIntegrationExample() {
  const [userId, setUserId] = useState<string | null>(null);
  const { trackEvent } = usePostHog(userId || undefined);

  const handleWhatsAppConnect = async () => {
    try {
      // Your WhatsApp connection logic here...
      
      await trackEvent({
        event: ANALYTICS_EVENTS.WHATSAPP_CONNECTED,
        properties: createEventProperties({
          connection_method: 'embedded_signup',
          phone_number_verified: true,
        }),
      });
    } catch (error) {
      await trackEvent({
        event: ANALYTICS_EVENTS.WHATSAPP_CONNECTED,
        properties: createEventProperties({
          success: false,
          error_message: error instanceof Error ? error.message : 'Unknown error',
        }),
      });
    }
  };

  const handleSendMessage = async (tenantId: string, messageType: string) => {
    await trackEvent({
      event: ANALYTICS_EVENTS.WHATSAPP_MESSAGE_SENT,
      properties: createEventProperties({
        tenant_id: tenantId,
        message_type: messageType,
        platform: 'whatsapp',
      }),
    });
  };

  return (
    <div>
      <button onClick={handleWhatsAppConnect}>
        Connect WhatsApp
      </button>
      <button onClick={() => handleSendMessage('tenant-123', 'text')}>
        Send Message
      </button>
    </div>
  );
}

// Example: How to track financial events
export function FinancialEventExample() {
  const [userId, setUserId] = useState<string | null>(null);
  const { trackEvent } = usePostHog(userId || undefined);

  const handleBankAccountConnect = async (bankName: string) => {
    await trackEvent({
      event: ANALYTICS_EVENTS.BANK_ACCOUNT_CONNECTED,
      properties: createEventProperties({
        bank_name: bankName,
        connection_method: 'plaid',
      }),
    });
  };

  const handleTransactionCategorized = async (amount: number, category: string) => {
    await trackEvent({
      event: ANALYTICS_EVENTS.TRANSACTION_CATEGORIZED,
      properties: createEventProperties({
        amount,
        category,
        currency: 'GBP',
        categorization_method: 'manual',
      }),
    });
  };

  return null; // This is just an example
} 