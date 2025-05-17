'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ExclamationTriangleIcon, CheckCircledIcon } from '@radix-ui/react-icons';

export default function HmrcConnectionStatus() {
  const [status, setStatus] = useState<{
    isConnected: boolean;
    authUrl?: string;
    error?: string;
    loading: boolean;
  }>({
    isConnected: false,
    loading: true
  });

  const checkConnectionStatus = async () => {
    setStatus(prev => ({ ...prev, loading: true }));
    try {
      const response = await fetch('/api/hmrc/connection-status');
      
      if (!response.ok) {
        throw new Error(`Error checking connection status: ${response.status}`);
      }
      
      const data = await response.json();
      setStatus({
        isConnected: data.isConnected,
        authUrl: data.authUrl,
        loading: false
      });
    } catch (error) {
      console.error('Failed to check HMRC connection status:', error);
      setStatus({
        isConnected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false
      });
    }
  };

  const handleConnect = async () => {
    try {
      const response = await fetch('/api/hmrc/auth/initiate');
      
      if (!response.ok) {
        throw new Error(`Error initiating HMRC connection: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Redirect to HMRC authorization page
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error('No authorization URL returned');
      }
    } catch (error) {
      console.error('Failed to initiate HMRC connection:', error);
      setStatus(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to connect to HMRC'
      }));
    }
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch('/api/hmrc/auth/disconnect', {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`Error disconnecting from HMRC: ${response.status}`);
      }
      
      // Refresh connection status
      checkConnectionStatus();
    } catch (error) {
      console.error('Failed to disconnect from HMRC:', error);
      setStatus(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to disconnect from HMRC'
      }));
    }
  };

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>HMRC Connection</CardTitle>
        <CardDescription>
          Connect your account to HMRC to access Making Tax Digital (MTD) features
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {status.loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            <span className="ml-2">Checking connection status...</span>
          </div>
        ) : status.isConnected ? (
          <div className="flex items-start space-x-2">
            <CheckCircledIcon className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <h4 className="font-medium">Connected to HMRC</h4>
              <p className="text-sm text-muted-foreground">
                Your account is connected to HMRC Making Tax Digital services.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start space-x-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <h4 className="font-medium">Not connected to HMRC</h4>
              <p className="text-sm text-muted-foreground">
                Connect your account to access Making Tax Digital features and automate your tax reporting.
              </p>
            </div>
          </div>
        )}
        
        {status.error && (
          <Alert variant="destructive" className="mt-4">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{status.error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-end">
        {status.isConnected ? (
          <Button variant="outline" onClick={handleDisconnect}>
            Disconnect from HMRC
          </Button>
        ) : (
          <Button onClick={handleConnect}>
            Connect to HMRC
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
