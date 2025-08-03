import { useState, useEffect } from 'react';
import { Eye, Plus, Search, Calendar } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Transaction, TransactionType, TransactionStatus } from '@/lib/types';
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
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [products, setProducts] = useState<Record<string, string>>({});
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | undefined>(undefined);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load product lookup table
  useEffect(() => {
    const allProducts = getProducts();
    const productMap: Record<string, string> = {};
    allProducts.forEach(product => {
      productMap[product.id] = product.name;
    });
    setProducts(productMap);
  }, [refreshKey]);

  // Filter transactions based on user role, search term, and status
  const filteredTransactions = transactions.filter(transaction => {
    // Filter by user if not admin
    if (!isAdmin && currentUserId && transaction.userId !== currentUserId) {
      return false;
    }
    
    // Filter by type
    if (transaction.type !== type) {
      return false;
    }
    
    // Filter by status if selected
    if (statusFilter && transaction.status !== statusFilter) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesId = transaction.id.toLowerCase().includes(searchLower);
      const matchesDate = format(new Date(transaction.createdAt), 'dd/MM/yyyy').includes(searchLower);
      const matchesStatus = transaction.status.toLowerCase().includes(searchLower);
      const matchesNotes = transaction.notes?.toLowerCase().includes(searchLower);
      const matchesDelivery = transaction.deliveryMethod?.toLowerCase().includes(searchLower) || false;
      const matchesAddress = transaction.deliveryAddress?.toLowerCase().includes(searchLower) || false;
      
      // Check if any product in items matches the search
      const matchesProduct = transaction.items.some(item => {
        const productName = products[item.productId];
        return productName?.toLowerCase().includes(searchLower);
      });
      
      return matchesId || matchesDate || matchesStatus || matchesNotes || 
             matchesProduct || matchesDelivery || matchesAddress;
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
  
  // Get status badge variant
  const getStatusBadgeVariant = (status: TransactionStatus) => {
    switch(status) {
      case 'completed': return 'default';
      case 'payment_confirmed': return 'success';
      case 'pending': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };
  
  // Get formatted status text
  const getStatusText = (status: TransactionStatus) => {
    switch(status) {
      case 'completed': return 'Completed';
      case 'payment_confirmed': return 'Payment Confirmed';
      case 'pending': return 'Pending Payment';
      case 'cancelled': return 'Cancelled';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };
  
  // Handle transaction status change
  const handleStatusChange = () => {
    onUpdate();
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending Payment</SelectItem>
              <SelectItem value="payment_confirmed">Payment Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> 
          {type === 'in' ? 'Record Incoming Products' : 'Place Order'}
        </Button>
      </div>

      {filteredTransactions.length === 0 ? (
        <Alert>
          <AlertTitle>No transactions found</AlertTitle>
          <AlertDescription>
            {transactions.filter(t => t.type === type).length === 0 
              ? `There are no ${type === 'in' ? 'incoming' : 'outgoing'} transactions recorded.` 
              : "No transactions match your search criteria. Try using different keywords or changing the status filter."}
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
                    <Badge variant={getStatusBadgeVariant(transaction.status)}>
                      {getStatusText(transaction.status)}
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
              {type === 'in' ? 'Record Incoming Products' : 'Place an Order'}
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
              onStatusChange={handleStatusChange}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}