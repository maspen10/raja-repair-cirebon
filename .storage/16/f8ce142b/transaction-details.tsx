import { useEffect, useState } from 'react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

import { Transaction } from '@/lib/types';
import { getProducts, getUsers } from '@/lib/storage';

interface TransactionDetailsProps {
  transaction: Transaction;
  onClose: () => void;
}

export function TransactionDetails({ transaction, onClose }: TransactionDetailsProps) {
  const [productMap, setProductMap] = useState<Record<string, { name: string; price: number }>>({});
  const [userName, setUserName] = useState('');
  
  // Load product and user data
  useEffect(() => {
    const products = getProducts();
    const productLookup: Record<string, { name: string; price: number }> = {};
    
    products.forEach(product => {
      productLookup[product.id] = { 
        name: product.name,
        price: product.price
      };
    });
    setProductMap(productLookup);
    
    const users = getUsers();
    const user = users.find(u => u.id === transaction.userId);
    setUserName(user?.name || 'Unknown User');
  }, [transaction]);
  
  // Format price to currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };
  
  return (
    <Card className="border-0 shadow-none">
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Transaction ID</p>
            <p>{transaction.id}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Transaction Type</p>
            <p className="capitalize">{transaction.type === 'in' ? 'Product In' : 'Product Out'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Date</p>
            <p>{format(new Date(transaction.createdAt), 'dd MMMM yyyy, HH:mm:ss')}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <Badge variant={transaction.status === 'completed' ? 'default' : 
                          transaction.status === 'pending' ? 'outline' : 'destructive'}>
              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
            </Badge>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Recorded by</p>
            <p>{userName}</p>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-2">Items</h3>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transaction.items.map((item, index) => {
                  const productInfo = productMap[item.productId];
                  return (
                    <TableRow key={index}>
                      <TableCell>{productInfo?.name || 'Unknown Product'}</TableCell>
                      <TableCell className="text-right">{formatPrice(item.priceAtTransaction)}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {formatPrice(item.priceAtTransaction * item.quantity)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
        
        <div>
          <Separator className="my-4" />
          <div className="flex justify-between items-center font-medium">
            <span>Total Amount</span>
            <span className="text-lg">{formatPrice(transaction.totalAmount)}</span>
          </div>
          
          {transaction.notes && (
            <div className="mt-4 p-4 bg-muted rounded-md">
              <p className="text-sm font-medium">Notes</p>
              <p className="text-sm">{transaction.notes}</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={onClose}>Close</Button>
      </CardFooter>
    </Card>
  );
}