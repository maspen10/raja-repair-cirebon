import { useState, useEffect } from 'react';

import { TransactionTable } from '@/components/transactions/transaction-table';
import { AdminLayout } from '@/components/layout/admin-layout';
import { MainLayout } from '@/components/layout/main-layout';

import { getTransactions } from '@/lib/storage';

export default function AdminTransactionsIn() {
  const [transactions, setTransactions] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  
  useEffect(() => {
    setTransactions(getTransactions());
  }, [refreshKey]);
  
  // Function to force refresh transaction list
  const refreshTransactions = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };
  
  return (
    <MainLayout requiredRole="admin">
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Incoming Products</h1>
            <p className="text-muted-foreground mt-2">
              Manage product inventory additions
            </p>
          </div>
          
          <TransactionTable 
            transactions={transactions} 
            onUpdate={refreshTransactions} 
            type="in"
          />
        </div>
      </AdminLayout>
    </MainLayout>
  );
}