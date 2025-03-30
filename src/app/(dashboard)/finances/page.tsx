import { Metadata } from 'next';
import { FinancialOverview } from '@/components/finances/FinancialOverview';
import { ExpensesTable } from '@/components/finances/ExpensesTable';
import { IncomeTable } from '@/components/finances/IncomeTable';
import { InvoicesTable } from '@/components/finances/InvoicesTable';
import { ServiceChargesTable } from '@/components/finances/ServiceChargesTable';

export const metadata: Metadata = {
  title: 'Finances | ZenRent',
  description: 'Manage your property finances',
};

export default async function FinancesPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Finances</h1>
      
      {/* Financial Overview */}
      <div>
        <FinancialOverview />
      </div>

      {/* Income & Expenses */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-6">
          <h2 className="text-xl font-semibold">Income</h2>
          <IncomeTable />
        </div>
        <div className="flex flex-col gap-6">
          <h2 className="text-xl font-semibold">Expenses</h2>
          <ExpensesTable />
        </div>
      </div>

      {/* Invoices & Service Charges */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-6">
          <h2 className="text-xl font-semibold">Invoices</h2>
          <InvoicesTable />
        </div>
        <div className="flex flex-col gap-6">
          <h2 className="text-xl font-semibold">Service Charges</h2>
          <ServiceChargesTable />
        </div>
      </div>
    </div>
  );
} 