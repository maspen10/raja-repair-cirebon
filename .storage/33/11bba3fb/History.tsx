import { useState, useEffect } from 'react';

import { TransactionTable } from '@/components/transactions/transaction-table';
import { UserLayout } from '@/components/layout/user-layout';
import { MainLayout } from '@/components/layout/main-layout';

import { getTransactions, getCurrentUser } from '@/lib/storage';

export default function UserHistory() {
  const [transactions, setTransactions] = useState([]);
  const [userId, setUserId] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  
  useEffect(() => {
    setTransactions(getTransactions());
    
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUserId(currentUser.id);
    }
  }, [refreshKey]);
  
  // Function to force refresh transaction list
  const refreshTransactions = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };
  
  return (
    <MainLayout requiredRole="user">
      <UserLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Transaction History</h1>
            <p className="text-muted-foreground mt-2">
              View your past orders and transactions
            </p>
          </div>
          
          <TransactionTable 
            transactions={transactions} 
            onUpdate={refreshTransactions} 
            type="out"
            isAdmin={false}
            currentUserId={userId}
          />
        </div>
      </UserLayout>
    </MainLayout>
  );
}