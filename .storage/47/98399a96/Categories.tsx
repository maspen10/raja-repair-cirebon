import { useState, useEffect } from 'react';

import { CategoryTable } from '@/components/categories/category-table';
import { AdminLayout } from '@/components/layout/admin-layout';
import { MainLayout } from '@/components/layout/main-layout';

import { getCategories } from '@/lib/storage';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  
  useEffect(() => {
    setCategories(getCategories());
  }, [refreshKey]);
  
  // Function to force refresh category list
  const refreshCategories = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };
  
  return (
    <MainLayout requiredRole="admin">
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Category Management</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage product categories
            </p>
          </div>
          
          <CategoryTable 
            categories={categories} 
            onUpdate={refreshCategories} 
          />
        </div>
      </AdminLayout>
    </MainLayout>
  );
}