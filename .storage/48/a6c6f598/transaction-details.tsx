import { useEffect, useState } from 'react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

import { Transaction, TransactionStatus } from '@/lib/types';
import { getProducts, getUsers, updateTransactionStatus, getCurrentUser } from '@/lib/storage';
import { Check, X, AlertTriangle } from 'lucide-react';

interface TransactionDetailsProps {
  transaction: Transaction;
  onClose: () => void;
  onStatusChange?: () => void;
}

export function TransactionDetails({ transaction, onClose, onStatusChange }: TransactionDetailsProps) {
  const { toast } = useToast();
  const [productMap, setProductMap] = useState<Record<string, { name: string; price: number }>>({});
  const [userName, setUserName] = useState('');
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
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
    
    setCurrentUser(getCurrentUser());
  }, [transaction]);
  
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
  
  // Handle status change
  const handleStatusChange = (newStatus: TransactionStatus) => {
    const success = updateTransactionStatus(transaction.id, newStatus);
    
    if (success) {
      toast({
        title: 'Status updated',
        description: `The transaction status has been updated to ${getStatusText(newStatus).toLowerCase()}.`,
      });
      
      if (onStatusChange) {
        onStatusChange();
      }
      
      onClose();
    } else {
      toast({
        variant: 'destructive',
        title: 'Status update failed',
        description: 'Failed to update the transaction status.',
      });
    }
  };
  
  // Check if user can confirm payment
  const canConfirmPayment = () => {
    return transaction.type === 'out' && 
           transaction.status === 'pending' && 
           currentUser?.id === transaction.userId;
  };
  
  // Check if admin can complete transaction
  const canCompleteTransaction = () => {
    return transaction.type === 'out' && 
           transaction.status === 'payment_confirmed' && 
           currentUser?.role === 'admin';
  };
  
  // Check if transaction can be cancelled
  const canCancelTransaction = () => {
    return (transaction.status === 'pending' || transaction.status === 'payment_confirmed') &&
           (currentUser?.role === 'admin' || currentUser?.id === transaction.userId);
  };
  
  return (
    <>
      <Card className="border-0 shadow-none">
        <CardContent className="space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Transaction ID</p>
              <p>{transaction.id}</p>
            </div>
            <Badge variant={getStatusBadgeVariant(transaction.status)}>
              {getStatusText(transaction.status)}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Transaction Type</p>
              <p className="capitalize">{transaction.type === 'in' ? 'Product In' : 'Order'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Date</p>
              <p>{format(new Date(transaction.createdAt), 'dd MMMM yyyy, HH:mm:ss')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">User</p>
              <p>{userName}</p>
            </div>
            {transaction.type === 'out' && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Delivery Method</p>
                <p className="capitalize">{transaction.deliveryMethod === 'pickup' ? 'Pick up at store' : 'Delivery'}</p>
              </div>
            )}
          </div>
          
          {transaction.type === 'out' && transaction.deliveryMethod === 'shipping' && transaction.deliveryAddress && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Delivery Address</p>
              <p className="whitespace-pre-wrap">{transaction.deliveryAddress}</p>
            </div>
          )}
          
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
          
          {/* Status-based action alerts */}
          {transaction.type === 'out' && transaction.status === 'pending' && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This order is awaiting payment confirmation. Please confirm payment to process your order.
              </AlertDescription>
            </Alert>
          )}
          
          {transaction.type === 'out' && transaction.status === 'payment_confirmed' && (
            <Alert>
              <Check className="h-4 w-4" />
              <AlertDescription>
                Payment has been confirmed. Your order is being processed.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-between flex-wrap gap-2">
          {canConfirmPayment() && (
            <Button 
              variant="default" 
              onClick={() => setIsConfirmDialogOpen(true)}
              className="flex-1 sm:flex-initial"
            >
              <Check className="mr-2 h-4 w-4" /> Confirm Payment
            </Button>
          )}
          
          {canCompleteTransaction() && (
            <Button 
              variant="default" 
              onClick={() => handleStatusChange('completed')}
              className="flex-1 sm:flex-initial"
            >
              <Check className="mr-2 h-4 w-4" /> Complete Order
            </Button>
          )}
          
          {canCancelTransaction() && (
            <Button 
              variant="destructive" 
              onClick={() => setIsCancelDialogOpen(true)}
              className="flex-1 sm:flex-initial"
            >
              <X className="mr-2 h-4 w-4" /> Cancel Order
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1 sm:flex-initial"
          >
            Close
          </Button>
        </CardFooter>
      </Card>
      
      {/* Confirm Payment Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>
              Are you confirming that you have made the payment of {formatPrice(transaction.totalAmount)} for this order?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleStatusChange('payment_confirmed')}>
              Yes, Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Cancel Order Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
              No, Keep Order
            </Button>
            <Button variant="destructive" onClick={() => handleStatusChange('cancelled')}>
              Yes, Cancel Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}