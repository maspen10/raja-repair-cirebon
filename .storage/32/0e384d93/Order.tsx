import { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';

import { TransactionForm } from '@/components/transactions/transaction-form';
import { UserLayout } from '@/components/layout/user-layout';
import { MainLayout } from '@/components/layout/main-layout';

export default function UserOrder() {
  // Simple order form using the transaction form
  
  const refreshTransactions = () => {
    // Will be called when transaction is submitted successfully
    // In a real app, we might redirect to order confirmation or history page
  };
  
  return (
    <MainLayout requiredRole="user">
      <UserLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Place an Order</h1>
            <p className="text-muted-foreground mt-2">
              Order products from our inventory
            </p>
          </div>
          
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-6 text-primary">
              <ShoppingCart className="h-5 w-5" />
              <h2 className="text-xl font-bold">Your Order</h2>
            </div>
            
            <TransactionForm 
              type="out"
              onSuccess={refreshTransactions}
              onCancel={() => {}}
            />
          </div>
        </div>
      </UserLayout>
    </MainLayout>
  );
}