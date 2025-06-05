'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ExclamationTriangleIcon, CheckCircledIcon } from '@radix-ui/react-icons';
import { getPlanRecommendation } from '@/lib/services/planRecommendationService';
import { useAuth } from '@/lib/auth';

export default function HmrcConnectionStatus() {
  // Check if user is on trial or if feature is available
  const [isFeatureAvailable, setIsFeatureAvailable] = useState(true);
  const [userPlan, setUserPlan] = useState('trial');
  const [isOnTrial, setIsOnTrial] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const checkFeatureAvailability = async () => {
      if (!user) return;
      
      try {
        const planRecommendation = await getPlanRecommendation(user.id);
        setUserPlan(planRecommendation.currentPlan);
        setIsOnTrial(planRecommendation.isOnTrial);
        
        // HMRC tax filing is a premium feature - not available on trial
        setIsFeatureAvailable(!planRecommendation.isOnTrial);
      } catch (error) {
        console.error('Error checking feature availability:', error);
        setIsFeatureAvailable(false);
      }
    };

    checkFeatureAvailability();
  }, [user]);

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

  // Show upgrade prompt for trial users
  if (!isFeatureAvailable) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>HMRC Tax Filing</CardTitle>
          <CardDescription>
            Premium Feature - HMRC integration requires a paid plan
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="p-4 rounded-lg border border-amber-200 bg-amber-50">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Upgrade Required
                </p>
                <p className="text-sm text-amber-700">
                  You're currently on a {isOnTrial ? 'free trial' : 'free plan'}. To access HMRC tax filing, upgrade to any paid plan.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <p className="text-sm text-gray-600">
              HMRC tax filing is included in all paid plans:
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Essential Plan - £10/month</li>
              <li>• Standard Plan - £20/month</li>
              <li>• Professional Plan - £30/month</li>
            </ul>
          </div>
        </CardContent>
        
        <CardFooter className="flex space-x-3">
          <Button 
            className="flex-1" 
            onClick={() => window.location.href = '/billing/payment'}
          >
            Upgrade Now
          </Button>
          <Button 
            variant="outline" 
            className="flex-1" 
            onClick={() => window.history.back()}
          >
            Maybe Later
          </Button>
        </CardFooter>
      </Card>
    );
  }

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
