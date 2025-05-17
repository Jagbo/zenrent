import { useEffect } from 'react';
import { useHmrcClientData } from '@/lib/hooks/useHmrcClientData';
import { ClientData } from '@/lib/services/hmrc/fraudPrevention/types';

/**
 * Props for the HmrcClientDataCollector component
 */
interface HmrcClientDataCollectorProps {
  onDataCollected?: (data: ClientData) => void;
}

/**
 * Component that collects client data for HMRC fraud prevention headers
 * 
 * This is an invisible component that should be mounted in the application
 * to collect the necessary client-side data for HMRC fraud prevention headers.
 * It uses the useHmrcClientData hook to gather the data and can optionally
 * call a callback when data is collected.
 */
export function HmrcClientDataCollector({ onDataCollected }: HmrcClientDataCollectorProps) {
  const { clientData, isLoading, error } = useHmrcClientData();

  useEffect(() => {
    // When client data is collected, store it in sessionStorage
    // This makes it available to API routes via cookies
    if (clientData && !isLoading) {
      // Store the data in sessionStorage
      try {
        sessionStorage.setItem('hmrc_client_data', JSON.stringify(clientData));
        
        // Call the callback if provided
        if (onDataCollected) {
          onDataCollected(clientData);
        }
        
        // Also send the data to the server to store in the session
        sendClientDataToServer(clientData);
      } catch (err) {
        console.error('Error storing HMRC client data:', err);
      }
    }
  }, [clientData, isLoading, onDataCollected]);

  // Log any errors
  useEffect(() => {
    if (error) {
      console.error('Error in HmrcClientDataCollector:', error);
    }
  }, [error]);

  // This component doesn't render anything visible
  return null;
}

/**
 * Send client data to the server to store in the session
 */
async function sendClientDataToServer(clientData: ClientData) {
  try {
    const response = await fetch('/api/hmrc/client-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(clientData),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Failed to send client data to server:', error);
  }
}
