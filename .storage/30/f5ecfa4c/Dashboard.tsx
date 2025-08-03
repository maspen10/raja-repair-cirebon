import { useState, useEffect } from 'react';
import { Package, ShoppingCart, History } from 'lucide-react';

import { StatsCard } from '@/components/dashboard/stats-card';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { UserLayout } from '@/components/layout/user-layout';
import { MainLayout } from '@/components/layout/main-layout';

import { getProducts, getTransactions, getCurrentUser } from '@/lib/storage';

export default function UserDashboard() {
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [userTransactions, setUserTransactions] = useState([]);
  const [userId, setUserId] = useState('');
  
  useEffect(() => {
    // Load data
    const allProducts = getProducts();
    const allTransactions = getTransactions();
    
    setProducts(allProducts);
    setTransactions(allTransactions);
    
    // Get current user
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUserId(currentUser.id);
      
      // Filter transactions for this user
      const userTrans = allTransactions.filter(t => t.userId === currentUser.id && t.type === 'out');
      setUserTransactions(userTrans);
    }
  }, []);
  
  return (
    <MainLayout requiredRole="user">
      <UserLayout>
        <div className="space-y-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard 
              title="Available Products" 
              value={products.filter(p => p.stock > 0).length}
              icon={<Package className="h-5 w-5" />} 
              description="Products currently in stock"
            />
            <StatsCard 
              title="My Orders" 
              value={userTransactions.length}
              icon={<ShoppingCart className="h-5 w-5" />} 
              description="Total orders you've placed"
            />
            <StatsCard 
              title="Last Order" 
              value={userTransactions.length > 0 
                ? new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                  }).format(userTransactions[0]?.totalAmount || 0)
                : '-'}
              icon={<History className="h-5 w-5" />} 
              description={userTransactions.length > 0 
                ? new Date(userTransactions[0]?.createdAt).toLocaleDateString() 
                : 'No orders yet'}
            />
          </div>
          
          {/* Recent Transactions */}
          <RecentTransactions 
            transactions={userTransactions}
          />
        </div>
      </UserLayout>
    </MainLayout>
  );
}