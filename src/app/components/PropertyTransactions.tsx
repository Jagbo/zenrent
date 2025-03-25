'use client';

import { useState, useEffect } from 'react';
import { getPropertyTransactions, PlaidTransaction } from '@/lib/plaid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface PropertyTransactionsProps {
  propertyId: string;
}

export function PropertyTransactions({ propertyId }: PropertyTransactionsProps) {
  const [transactions, setTransactions] = useState<PlaidTransaction[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  
  const pageSize = 10;

  useEffect(() => {
    async function fetchTransactions() {
      setLoading(true);
      setError(null);
      
      try {
        const offset = (page - 1) * pageSize;
        
        const result = await getPropertyTransactions(propertyId, {
          limit: pageSize,
          offset,
        });
        
        setTransactions(result.transactions);
        setTotalCount(result.count);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError('Failed to load transactions. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchTransactions();
  }, [propertyId, page]);
  
  const totalPages = Math.ceil(totalCount / pageSize);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
    }).format(amount);
  };
  
  if (loading && transactions.length === 0) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-destructive">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            No transactions found for this property.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.plaid_transaction_id}>
                <TableCell>
                  {format(new Date(transaction.date), 'dd MMM yyyy')}
                </TableCell>
                <TableCell>
                  {transaction.merchant_name || transaction.name}
                  {transaction.pending && <span className="ml-2 text-xs text-muted-foreground">(Pending)</span>}
                </TableCell>
                <TableCell>
                  {transaction.category && transaction.category.length > 0 
                    ? transaction.category[0] 
                    : 'Uncategorized'}
                </TableCell>
                <TableCell className={`text-right ${transaction.amount > 0 ? 'text-destructive' : 'text-green-600'}`}>
                  {formatCurrency(transaction.amount * -1)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {totalPages > 1 && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              
              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink 
                    onClick={() => setPage(i + 1)}
                    isActive={page === i + 1}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </CardContent>
    </Card>
  );
} 