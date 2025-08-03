import { useState, useEffect } from 'react';
import { Eye, Plus, Search, Calendar } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';

import { Transaction, TransactionType } from '@/lib/types';
import { getProducts } from '@/lib/storage';
import { TransactionForm } from './transaction-form';
import { TransactionDetails } from './transaction-details';

interface TransactionTableProps {
  transactions: Transaction[];
  onUpdate: () => void;
  type: TransactionType;
  isAdmin?: boolean;
  currentUserId?: string;
}

export function TransactionTable({ transactions, onUpdate, type, isAdmin = true, currentUserId }: TransactionTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Record<string, string>>({});
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | undefined>(undefined);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Load product lookup table
  useEffect(() => {
    const allProducts = getProducts();
    const productMap: Record<string, string> = {};
    allProducts.forEach(product => {
      productMap[product.id] = product.name;
    });
    setProducts(productMap);
  }, []);

  // Filter transactions based on user role and search term
  const filteredTransactions = transactions.filter(transaction => {
    // Filter by user if not admin
    if (!isAdmin && currentUserId && transaction.userId !== currentUserId) {
      return false;
    }
    
    // Filter by type
    if (transaction.type !== type) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesId = transaction.id.toLowerCase().includes(searchLower);
      const matchesDate = format(new Date(transaction.createdAt), 'dd/MM/yyyy').includes(searchLower);
      const matchesStatus = transaction.status.toLowerCase().includes(searchLower);
      const matchesNotes = transaction.notes?.toLowerCase().includes(searchLower);
      
      // Check if any product in items matches the search
      const matchesProduct = transaction.items.some(item => {
        const productName = products[item.productId];
        return productName?.toLowerCase().includes(searchLower);
      });
      
      return matchesId || matchesDate || matchesStatus || matchesNotes || matchesProduct;
    }
    
    return true;
  });

  // Format price to currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            className="w-full sm:w-[300px] pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> 
          {type === 'in' ? 'Record Incoming Products' : 'Record Outgoing Products'}
        </Button>
      </div>

      {filteredTransactions.length === 0 ? (
        <Alert>
          <AlertTitle>No transactions found</AlertTitle>
          <AlertDescription>
            {transactions.filter(t => t.type === type).length === 0 
              ? `There are no ${type === 'in' ? 'incoming' : 'outgoing'} transactions recorded.` 
              : "No transactions match your search criteria. Try using different keywords."}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {format(new Date(transaction.createdAt), 'dd/MM/yyyy HH:mm')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={transaction.status === 'completed' ? 'default' : 
                                  transaction.status === 'pending' ? 'outline' : 'destructive'}>
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{transaction.items.length} product(s)</TableCell>
                  <TableCell className="text-right">{formatPrice(transaction.totalAmount)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedTransaction(transaction);
                        setIsViewDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Transaction Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              {type === 'in' ? 'Record Incoming Products' : 'Record Outgoing Products'}
            </DialogTitle>
          </DialogHeader>
          <TransactionForm 
            type={type}
            onSuccess={() => {
              setIsAddDialogOpen(false);
              onUpdate();
            }}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* View Transaction Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <TransactionDetails 
              transaction={selectedTransaction} 
              onClose={() => setIsViewDialogOpen(false)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}