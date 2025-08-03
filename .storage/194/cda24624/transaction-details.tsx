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
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

import { Transaction, TransactionStatus } from '@/lib/types';
import { getProducts, getUsers, updateTransactionStatus, updateTransaction, getCurrentUser, getDeliveryMethods, getPaymentMethods } from '@/lib/storage';
import { Check, X, AlertTriangle, Truck, Clock, Package } from 'lucide-react';

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
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const [isReadyDialogOpen, setIsReadyDialogOpen] = useState(false);
  const [isShippingDialogOpen, setIsShippingDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; role?: string } | null>(null);
  const [deliveryMethodName, setDeliveryMethodName] = useState('');
  const [paymentMethodName, setPaymentMethodName] = useState('');
  
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
    
    // Load delivery method name
    if (transaction.deliveryMethodId) {
      const deliveryMethods = getDeliveryMethods();
      const method = deliveryMethods.find(m => m.id === transaction.deliveryMethodId);
      setDeliveryMethodName(method?.name || 'Unknown');
    }
    
    // Load payment method name
    if (transaction.paymentMethodId) {
      const paymentMethods = getPaymentMethods();
      const method = paymentMethods.find(m => m.id === transaction.paymentMethodId);
      setPaymentMethodName(method?.name || 'Unknown');
    }
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
      case 'processing': return 'info';
      case 'ready_for_pickup': return 'success';
      case 'shipping': return 'info';
      case 'pending': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };
  
  // Get formatted status text
  const getStatusText = (status: TransactionStatus) => {
    switch(status) {
      case 'completed': return 'Selesai';
      case 'payment_confirmed': return 'Pembayaran Dikonfirmasi';
      case 'processing': return 'Sedang Diproses';
      case 'ready_for_pickup': return 'Siap Diambil';
      case 'shipping': return 'Dalam Pengiriman';
      case 'pending': return 'Menunggu Pembayaran';
      case 'cancelled': return 'Dibatalkan';
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
  
  // Check if admin can process transaction
  const canProcessTransaction = () => {
    return transaction.type === 'out' && 
           transaction.status === 'payment_confirmed' && 
           currentUser?.role === 'admin';
  };
  
  // Check if admin can mark as ready for pickup
  const canMarkAsReady = () => {
    return transaction.type === 'out' && 
           transaction.status === 'processing' && 
           currentUser?.role === 'admin' &&
           deliveryMethodName.toLowerCase().includes('pick');
  };
  
  // Check if admin can mark as shipping
  const canMarkAsShipping = () => {
    return transaction.type === 'out' && 
           transaction.status === 'processing' && 
           currentUser?.role === 'admin' &&
           !deliveryMethodName.toLowerCase().includes('pick');
  };
  
  // Check if admin can complete transaction
  const canCompleteTransaction = () => {
    return transaction.type === 'out' && 
           (transaction.status === 'ready_for_pickup' || transaction.status === 'shipping') && 
           currentUser?.role === 'admin';
  };
  
  // Check if transaction can be cancelled
  const canCancelTransaction = () => {
    return (transaction.status === 'pending' || 
           transaction.status === 'payment_confirmed' ||
           transaction.status === 'processing') &&
           (currentUser?.role === 'admin' || currentUser?.id === transaction.userId);
  };
  
  // Get status icon
  const getStatusIcon = () => {
    switch(transaction.status) {
      case 'completed': return <Check className="h-4 w-4" />;
      case 'payment_confirmed': return <Check className="h-4 w-4" />;
      case 'processing': return <Clock className="h-4 w-4" />;
      case 'ready_for_pickup': return <Package className="h-4 w-4" />;
      case 'shipping': return <Truck className="h-4 w-4" />;
      case 'pending': return <AlertTriangle className="h-4 w-4" />;
      case 'cancelled': return <X className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };
  
  // Get status message
  const getStatusMessage = () => {
    switch(transaction.status) {
      case 'completed': 
        return "Transaksi ini telah selesai dengan sukses.";
      case 'payment_confirmed': 
        return "Pembayaran telah dikonfirmasi. Pesanan menunggu untuk diproses.";
      case 'processing': 
        return "Pesanan Anda sedang diproses dan disiapkan.";
      case 'ready_for_pickup': 
        return "Pesanan Anda sudah siap untuk diambil di toko kami.";
      case 'shipping': 
        return transaction.trackingNumber 
          ? `Pesanan Anda sedang dalam pengiriman. Nomor resi: ${transaction.trackingNumber}`
          : "Pesanan Anda sedang dalam pengiriman.";
      case 'pending': 
        return "Pesanan ini menunggu konfirmasi pembayaran.";
      case 'cancelled': 
        return "Pesanan ini telah dibatalkan.";
      default: 
        return "Informasi status pesanan.";
    }
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
            {transaction.type === 'out' && deliveryMethodName && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Delivery Method</p>
                <p>{deliveryMethodName}</p>
              </div>
            )}
            {transaction.type === 'out' && paymentMethodName && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
                <p>{paymentMethodName}</p>
              </div>
            )}
          </div>
          
          {transaction.type === 'out' && transaction.deliveryAddress && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Delivery Address</p>
              <p className="whitespace-pre-wrap">{transaction.deliveryAddress}</p>
            </div>
          )}
          
          {transaction.type === 'out' && transaction.paymentProof && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Bukti Pembayaran</p>
              <p className="text-sm text-blue-600 underline">{transaction.paymentProof}</p>
            </div>
          )}
          
          {transaction.type === 'out' && transaction.status === 'shipping' && transaction.trackingNumber && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nomor Resi</p>
              <p>{transaction.trackingNumber}</p>
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
          {transaction.type === 'out' && (
            <Alert>
              {getStatusIcon()}
              <AlertDescription>
                {getStatusMessage()}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          {/* Payment confirmation by user */}
          {canConfirmPayment() && (
            <Button 
              variant="default" 
              onClick={() => setIsConfirmDialogOpen(true)}
              className="flex-1 sm:flex-initial"
            >
              <Check className="mr-2 h-4 w-4" /> Confirm Payment
            </Button>
          )}
          
          {/* Processing by admin */}
          {canProcessTransaction() && (
            <Button 
              variant="default" 
              onClick={() => setIsProcessDialogOpen(true)}
              className="flex-1 sm:flex-initial"
            >
              <Clock className="mr-2 h-4 w-4" /> Process Order
            </Button>
          )}
          
          {/* Mark as ready for pickup */}
          {canMarkAsReady() && (
            <Button 
              variant="default" 
              onClick={() => setIsReadyDialogOpen(true)}
              className="flex-1 sm:flex-initial"
            >
              <Package className="mr-2 h-4 w-4" /> Ready for Pickup
            </Button>
          )}
          
          {/* Mark as shipping */}
          {canMarkAsShipping() && (
            <Button 
              variant="default" 
              onClick={() => setIsShippingDialogOpen(true)}
              className="flex-1 sm:flex-initial"
            >
              <Truck className="mr-2 h-4 w-4" /> Ship Order
            </Button>
          )}
          
          {/* Complete transaction */}
          {canCompleteTransaction() && (
            <Button 
              variant="default" 
              onClick={() => handleStatusChange('completed')}
              className="flex-1 sm:flex-initial"
            >
              <Check className="mr-2 h-4 w-4" /> Complete Order
            </Button>
          )}
          
          {/* Cancel order */}
          {canCancelTransaction() && (
            <Button 
              variant="destructive" 
              onClick={() => setIsCancelDialogOpen(true)}
              className="flex-1 sm:flex-initial"
            >
              <X className="mr-2 h-4 w-4" /> Cancel Order
            </Button>
          )}
          
          {/* Close button */}
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
      
      {/* Process Order Dialog */}
      <Dialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Order</DialogTitle>
            <DialogDescription>
              Are you ready to start processing this order? This will update the status to "Processing".
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProcessDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleStatusChange('processing')}>
              Yes, Process Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Ready for Pickup Dialog */}
      <Dialog open={isReadyDialogOpen} onOpenChange={setIsReadyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ready for Pickup</DialogTitle>
            <DialogDescription>
              Confirm that this order is prepared and ready for customer pickup.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReadyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleStatusChange('ready_for_pickup')}>
              Yes, Mark as Ready
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Shipping Dialog */}
      <Dialog open={isShippingDialogOpen} onOpenChange={setIsShippingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kirim Pesanan</DialogTitle>
            <DialogDescription>
              Konfirmasi bahwa pesanan ini telah dikirim ke pelanggan.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <form id="shipping-form" onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const trackingNumber = formData.get('tracking-number') as string;
              
              // Update transaction with tracking number
              const updatedTransaction = {
                ...transaction,
                trackingNumber,
                status: 'shipping' as TransactionStatus,
                updatedAt: new Date().toISOString()
              };
              
              updateTransaction(updatedTransaction);
              
              if (onStatusChange) {
                onStatusChange();
              }
              
              setIsShippingDialogOpen(false);
              onClose();
            }}>
              <div className="space-y-2">
                <label htmlFor="tracking-number" className="text-sm font-medium">
                  Nomor Resi Pengiriman <span className="text-destructive">*</span>
                </label>
                <Input 
                  id="tracking-number"
                  name="tracking-number"
                  placeholder="Masukkan nomor resi pengiriman"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Nomor resi ini akan ditampilkan kepada pelanggan untuk melacak pengiriman
                </p>
              </div>
            </form>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShippingDialogOpen(false)}>
              Batal
            </Button>
            <Button type="submit" form="shipping-form">
              Tandai Sebagai Dikirim
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