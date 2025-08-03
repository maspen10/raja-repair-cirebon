import { useState, useEffect } from 'react';

import { ProductTable } from '@/components/products/product-table';
import { AdminLayout } from '@/components/layout/admin-layout';
import { MainLayout } from '@/components/layout/main-layout';

import { getProducts } from '@/lib/storage';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  
  useEffect(() => {
    setProducts(getProducts());
  }, [refreshKey]);
  
  // Function to force refresh product list
  const refreshProducts = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };
  
  return (
    <MainLayout requiredRole="admin">
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Product Management</h1>
            <p className="text-muted-foreground mt-2">
              Add, edit, and manage your inventory
            </p>
          </div>
          
          <ProductTable 
            products={products} 
            onUpdate={refreshProducts} 
          />
        </div>
      </AdminLayout>
    </MainLayout>
  );
}