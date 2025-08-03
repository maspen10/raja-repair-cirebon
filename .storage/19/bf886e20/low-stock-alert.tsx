import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from 'lucide-react';

import { Product } from '@/lib/types';

interface LowStockAlertProps {
  products: Product[];
  threshold?: number;
  limit?: number;
}

export function LowStockAlert({ products, threshold = 10, limit = 5 }: LowStockAlertProps) {
  // Get products with low stock
  const lowStockProducts = products
    .filter(product => product.stock <= threshold)
    .sort((a, b) => a.stock - b.stock) // Sort by stock level (lowest first)
    .slice(0, limit);

  // Format price to currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Low Stock Alert</CardTitle>
        <CardDescription>
          Products that need restocking (below {threshold} units)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {lowStockProducts.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Code</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lowStockProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.code}</TableCell>
                  <TableCell className="text-right">{formatPrice(product.price)}</TableCell>
                  <TableCell className="text-right">
                    <span className={`font-medium ${product.stock === 0 ? 'text-red-600' : 'text-orange-600'}`}>
                      {product.stock}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Good news!</AlertTitle>
            <AlertDescription>
              All products have sufficient stock levels.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}