import { useState, useEffect } from 'react';
import { Package, ShoppingCart, PackageOpen, Users, CreditCard, TrendingUp, TrendingDown } from 'lucide-react';

import { StatsCard } from '@/components/dashboard/stats-card';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { LowStockAlert } from '@/components/dashboard/low-stock-alert';
import { AdminLayout } from '@/components/layout/admin-layout';
import { MainLayout } from '@/components/layout/main-layout';

import { getProducts, getTransactions, getUsers } from '@/lib/storage';

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [outTransactions, setOutTransactions] = useState([]);
  const [inTransactions, setInTransactions] = useState([]);
  const [users, setUsers] = useState([]);
  const [revenue, setRevenue] = useState(0);
  const [expenses, setExpenses] = useState(0);
  
  useEffect(() => {
    // Load data
    const allProducts = getProducts();
    const allTransactions = getTransactions();
    const allUsers = getUsers();
    
    // Filter transactions by type
    const outTrans = allTransactions.filter(t => t.type === 'out');
    const inTrans = allTransactions.filter(t => t.type === 'in');
    
    // Calculate revenue and expenses
    const totalRevenue = outTrans.reduce((sum, t) => sum + t.totalAmount, 0);
    const totalExpenses = inTrans.reduce((sum, t) => sum + t.totalAmount, 0);
    
    setProducts(allProducts);
    setTransactions(allTransactions);
    setOutTransactions(outTrans);
    setInTransactions(inTrans);
    setUsers(allUsers);
    setRevenue(totalRevenue);
    setExpenses(totalExpenses);
  }, []);
  
  return (
    <MainLayout requiredRole="admin">
      <AdminLayout>
        <div className="space-y-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard 
              title="Total Products" 
              value={products.length}
              icon={<Package className="h-5 w-5" />} 
            />
            <StatsCard 
              title="Users" 
              value={users.length}
              icon={<Users className="h-5 w-5" />} 
            />
            <StatsCard 
              title="Revenue" 
              value={new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
              }).format(revenue)}
              icon={<TrendingUp className="h-5 w-5" />} 
            />
            <StatsCard 
              title="Expenses" 
              value={new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
              }).format(expenses)}
              icon={<TrendingDown className="h-5 w-5" />} 
            />
          </div>
          
          {/* Second Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LowStockAlert products={products} threshold={5} />
            <RecentTransactions transactions={transactions} />
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatsCard 
              title="Outgoing Transactions" 
              value={outTransactions.length}
              icon={<ShoppingCart className="h-5 w-5" />} 
            />
            <StatsCard 
              title="Incoming Transactions" 
              value={inTransactions.length}
              icon={<PackageOpen className="h-5 w-5" />} 
            />
          </div>
        </div>
      </AdminLayout>
    </MainLayout>
  );
}