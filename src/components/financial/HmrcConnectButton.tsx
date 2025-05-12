import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, LinkIcon, Unlink } from 'lucide-react';

interface HmrcConnectButtonProps {
  isConnected: boolean;
  onConnectionChange?: (isConnected: boolean) => void;
}

export default function HmrcConnectButton({ 
  isConnected, 
  onConnectionChange 
}: HmrcConnectButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      
      // Call the API to get the authorization URL
      const response = await fetch('/api/hmrc/oauth/initiate');
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to initiate HMRC connection');
      }
      
      const { authUrl } = await response.json();
      
      // Redirect to HMRC for authorization
      window.location.href = authUrl;
      
      // No need to setLoading(false) here since we're navigating away
    } catch (error) {
      console.error('Error initiating HMRC connection:', error);
      toast.error('Failed to connect to HMRC. Please try again.');
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      
      // Call the API to disconnect from HMRC
      const response = await fetch('/api/hmrc/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to disconnect from HMRC');
      }
      
      toast.success('Successfully disconnected from HMRC');
      
      // Notify parent component of connection change
      if (onConnectionChange) {
        onConnectionChange(false);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error disconnecting from HMRC:', error);
      toast.error('Failed to disconnect from HMRC. Please try again.');
      setIsLoading(false);
    }
  };

  if (isConnected) {
    return (
      <Button
        variant="outline"
        onClick={handleDisconnect}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Unlink className="mr-2 h-4 w-4" />
        )}
        Disconnect from HMRC
      </Button>
    );
  }

  return (
    <Button
      variant="default"
      onClick={handleConnect}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <LinkIcon className="mr-2 h-4 w-4" />
      )}
      Connect to HMRC
    </Button>
  );
} 