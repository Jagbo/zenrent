import { Suspense } from 'react';
import { PropertyTransactions } from '@/app/components/PropertyTransactions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { hasLinkedBankAccount } from '@/lib/plaid';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';

interface TransactionsPageProps {
  params: {
    id: string;
  };
}

export default async function TransactionsPage({ params }: TransactionsPageProps) {
  const propertyId = params.id;
  
  // Check if property exists (add your property fetch logic here)
  // const property = await getProperty(propertyId);
  // if (!property) {
  //   notFound();
  // }
  
  // Check if a bank account is linked to this property
  const hasAccount = await hasLinkedBankAccount(propertyId);
  
  if (!hasAccount) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Transactions</h1>
          <Button asChild>
            <Link href={`/properties/${propertyId}`}>
              Back to Property
            </Link>
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Connect Bank Account</CardTitle>
            <CardDescription>
              Link a bank account to view transactions for this property.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-10 space-y-4">
            <p className="text-center text-muted-foreground mb-4">
              No bank account linked to this property. Connect a bank account to automatically track income and expenses.
            </p>
            <Button asChild>
              <Link href={`/properties/${propertyId}/settings`}>
                Connect Bank Account
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Transactions</h1>
        <Button asChild>
          <Link href={`/properties/${propertyId}`}>
            Back to Property
          </Link>
        </Button>
      </div>
      
      <Suspense fallback={<TransactionsLoading />}>
        <PropertyTransactions propertyId={propertyId} />
      </Suspense>
    </div>
  );
}

function TransactionsLoading() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-full"></div>
          <div className="h-6 bg-gray-200 rounded w-full"></div>
          <div className="h-6 bg-gray-200 rounded w-full"></div>
          <div className="h-6 bg-gray-200 rounded w-full"></div>
          <div className="h-6 bg-gray-200 rounded w-full"></div>
        </div>
      </CardContent>
    </Card>
  );
} 