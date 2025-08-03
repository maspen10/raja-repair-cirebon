import { useState, useEffect } from 'react';

import { ProductTable } from '@/components/products/product-table';
import { UserLayout } from '@/components/layout/user-layout';
import { MainLayout } from '@/components/layout/main-layout';

import { getProducts } from '@/lib/storage';

export default function UserProducts() {
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
    <MainLayout requiredRole="user">
      <UserLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Products & Price List</h1>
            <p className="text-muted-foreground mt-2">
              Check prices and availability of products
            </p>
          </div>
          
          <ProductTable 
            products={products} 
            onUpdate={refreshProducts} 
            isAdmin={false}
          />
        </div>
      </UserLayout>
    </MainLayout>
  );
}