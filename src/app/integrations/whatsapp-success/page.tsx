"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { SidebarLayout } from "../../components/sidebar-layout";
import { SidebarContent } from "../../components/sidebar-content";
import { Heading } from "../../components/heading";
import { Text } from "../../components/text";

export default function WhatsAppSuccessPage() {
  const [loading, setLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Fetch WhatsApp details using the correct endpoint
    fetch("/api/whatsapp/setup")
      .then((res) => res.json())
      .then((data) => {
        setLoading(false);
        if (data.success && data.phones && data.phones.data && data.phones.data.length > 0) {
          const phone = data.phones.data[0];
          setPhoneNumber(phone.display_phone_number || "");
          setBusinessName(phone.verified_name || "WhatsApp Business");
        } else {
          setError("Unable to fetch WhatsApp details");
        }
      })
      .catch((err) => {
        setLoading(false);
        setError("Failed to load WhatsApp details");
        console.error("Error fetching WhatsApp details", err);
      });
  }, []);

  return (
    <SidebarLayout sidebar={<SidebarContent currentPath="/integrations" />}>
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircleIcon className="h-12 w-12 text-green-500" />
          </div>
          <Heading level={1} className="text-2xl font-bold">
            WhatsApp Connected Successfully!
          </Heading>
          <Text className="text-gray-500 mt-2">
            Your WhatsApp Business account has been successfully connected to
            ZenRent.
          </Text>
          <Text className="text-gray-500 mt-6">
            Redirecting you back to the integrations page...
          </Text>
        </div>
      </div>
    </SidebarLayout>
  );
}
