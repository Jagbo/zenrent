"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SidebarLayout } from "../../components/sidebar-layout";
import { SidebarContent } from "../../components/sidebar-content";
import { Heading } from "../../components/heading";
import { Text } from "../../components/text";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

function WhatsAppSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get the WABA ID and code from the URL parameters
  const wabaId = searchParams.get("waba_id");
  const code = searchParams.get("code");

  // Process the connection when the component mounts
  useEffect(() => {
    const processConnection = async () => {
      if (wabaId && code) {
        try {
          // Save the connection details to your backend
          const response = await fetch("/api/whatsapp/connect", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ wabaId, code }),
          });

          const data = await response.json();
          if (!data.success) {
            console.error("Failed to save WhatsApp connection");
          }
        } catch (error) {
          console.error("Error saving WhatsApp connection:", error);
        }
      }

      // Redirect back to the integrations page after a short delay
      setTimeout(() => {
        router.push("/integrations");
      }, 3000);
    };

    processConnection();
  }, [wabaId, code, router]);

  return (
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
  );
}

// Loading component
function WhatsAppSuccessLoading() {
  return (
    <div className="flex flex-col items-center justify-center h-[80vh]">
      <div className="text-center">
        <div className="animate-pulse h-12 w-12 bg-gray-200 rounded-full mx-auto mb-4"></div>
        <div className="animate-pulse h-7 w-48 bg-gray-200 rounded mx-auto mb-2"></div>
        <div className="animate-pulse h-4 w-64 bg-gray-200 rounded mx-auto"></div>
      </div>
    </div>
  );
}

export default function WhatsAppSuccess() {
  return (
    <SidebarLayout sidebar={<SidebarContent currentPath="/integrations" />}>
      <Suspense fallback={<WhatsAppSuccessLoading />}>
        <WhatsAppSuccessContent />
      </Suspense>
    </SidebarLayout>
  );
}
