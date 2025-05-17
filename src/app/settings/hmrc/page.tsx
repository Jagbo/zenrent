import { Metadata } from 'next';
import HmrcConnectionStatus from '@/app/components/hmrc/connection-status';

export const metadata: Metadata = {
  title: 'HMRC Settings | ZenRent',
  description: 'Manage your HMRC Making Tax Digital connection',
};

export default function HmrcSettingsPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">HMRC Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your connection to HMRC Making Tax Digital services</p>
      </div>
      
      <div className="grid gap-6">
        <div className="mx-auto w-full max-w-2xl">
          <HmrcConnectionStatus />
        </div>
        
        <div className="mx-auto w-full max-w-2xl mt-8">
          <h2 className="text-xl font-semibold mb-4">About HMRC Integration</h2>
          <div className="prose dark:prose-invert">
            <p>
              The HMRC integration allows ZenRent to securely connect to HMRC's Making Tax Digital (MTD) 
              services on your behalf. This enables automated tax reporting and compliance features.
            </p>
            
            <h3>What data is accessed?</h3>
            <p>
              When connected, ZenRent can access:
            </p>
            <ul>
              <li>Your tax obligations and deadlines</li>
              <li>Income tax information relevant to property income</li>
              <li>Submission status for tax periods</li>
            </ul>
            
            <h3>Security & Privacy</h3>
            <p>
              Your HMRC connection is secure and private:
            </p>
            <ul>
              <li>ZenRent never stores your HMRC credentials</li>
              <li>Connection uses OAuth 2.0 - the industry standard for secure authorization</li>
              <li>You can revoke access at any time by disconnecting</li>
              <li>All data transfers are encrypted</li>
            </ul>
            
            <h3>Troubleshooting</h3>
            <p>
              If you encounter issues with your HMRC connection:
            </p>
            <ul>
              <li>Try disconnecting and reconnecting</li>
              <li>Ensure you've granted all required permissions during the HMRC authorization process</li>
              <li>Contact support if problems persist</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
