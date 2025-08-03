import { useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { initializeStorage } from '@/lib/storage';

// Pages
import Login from './pages/Login';
import NotFound from './pages/NotFound';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminCategories from './pages/admin/Categories';
import AdminTransactionsIn from './pages/admin/TransactionsIn';
import AdminTransactionsOut from './pages/admin/TransactionsOut';
import AdminUsers from './pages/admin/Users';
import AdminSettings from './pages/admin/Settings';

// User Pages
import UserDashboard from './pages/user/Dashboard';
import UserProducts from './pages/user/Products';
import UserOrder from './pages/user/Order';
import UserHistory from './pages/user/History';
import UserProfile from './pages/user/Profile';

const queryClient = new QueryClient();

const App = () => {
  // Initialize storage on app load
  useEffect(() => {
    initializeStorage();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            {/* Redirect root to login */}
            <Route path="/" element={<Navigate to="/login" />} />
            
            {/* Auth */}
            <Route path="/login" element={<Login />} />
            
            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/transactions/in" element={<AdminTransactionsIn />} />
            <Route path="/admin/transactions/out" element={<AdminTransactionsOut />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            
            {/* User Routes */}
            <Route path="/user/dashboard" element={<UserDashboard />} />
            <Route path="/user/products" element={<UserProducts />} />
            <Route path="/user/order" element={<UserOrder />} />
            <Route path="/user/history" element={<UserHistory />} />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;