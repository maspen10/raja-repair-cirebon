import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Clock, AlertCircle, CheckCircle, Truck, Loader2, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';

import { Transaction, TransactionItem, Product, TransactionStatus } from '@/lib/types';
import { getTransactions, getCurrentUser, getProducts, getPaymentMethods, getDeliveryMethods } from '@/lib/storage';
import { UserLayout } from '@/components/layout/user-layout';

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Load transaction data
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    // Find the transaction
    const foundTransaction = getTransactions().find(t => t.id === id);
    
    if (!foundTransaction) {
      toast({
        variant: 'destructive',
        title: 'Order not found',
        description: 'The order you are looking for does not exist.'
      });
      navigate('/orders');
      return;
    }
    
    // Check if user owns this transaction or is admin
    if (foundTransaction.userId !== currentUser.id && currentUser.role !== 'admin') {
      toast({
        variant: 'destructive',
        title: 'Unauthorized',
        description: 'You do not have permission to view this order.'
      });
      navigate('/orders');
      return;
    }
    
    setTransaction(foundTransaction);
    setProducts(getProducts());
  }, [id, navigate, toast]);
  
  // Format price to currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Get status icon and color
  const getStatusDetails = (status: TransactionStatus) => {
    switch(status) {
      case 'pending':
        return { 
          icon: <Clock className="h-5 w-5" />, 
          color: 'bg-yellow-500',
          label: 'Pending' 
        };
      case 'payment_confirmed':
        return { 
          icon: <CheckCircle className="h-5 w-5" />, 
          color: 'bg-green-500',
          label: 'Payment Confirmed' 
        };
      case 'processing':
        return { 
          icon: <Loader2 className="h-5 w-5 animate-spin" />, 
          color: 'bg-blue-500',
          label: 'Processing' 
        };
      case 'shipping':
        return { 
          icon: <Truck className="h-5 w-5" />, 
          color: 'bg-indigo-500',
          label: 'Shipping' 
        };
      case 'ready_for_pickup':
        return { 
          icon: <Package className="h-5 w-5" />, 
          color: 'bg-purple-500',
          label: 'Ready for Pickup' 
        };
      case 'completed':
        return { 
          icon: <CheckCircle className="h-5 w-5" />, 
          color: 'bg-green-700',
          label: 'Completed' 
        };
      case 'cancelled':
        return { 
          icon: <AlertCircle className="h-5 w-5" />, 
          color: 'bg-red-500',
          label: 'Cancelled' 
        };
      default:
        return { 
          icon: <Clock className="h-5 w-5" />, 
          color: 'bg-gray-500',
          label: status 
        };
    }
  };
  
  // Get product by ID
  const getProduct = (productId: string): Product | undefined => {
    return products.find(product => product.id === productId);
  };
  
  // Find payment method
  const getPaymentMethodName = (paymentMethodId: string): string => {
    const paymentMethod = getPaymentMethods().find(m => m.id === paymentMethodId);
    return paymentMethod ? paymentMethod.name : 'Unknown';
  };
  
  // Find delivery method
  const getDeliveryMethodName = (deliveryMethodId: string): string => {
    const deliveryMethod = getDeliveryMethods().find(m => m.id === deliveryMethodId);
    return deliveryMethod ? deliveryMethod.name : 'Unknown';
  };
  
  // Calculate the total price of the transaction
  const calculateItemTotal = (item: TransactionItem) => {
    const product = getProduct(item.productId);
    if (!product) return 0;
    
    return item.price * item.quantity;
  };
  
  if (!transaction) {
    return (
      <UserLayout>
        <div className="container py-8 flex justify-center items-center">
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </UserLayout>
    );
  }
  
  const statusDetails = getStatusDetails(transaction.status);
  
  return (
    <UserLayout>
      <div className="container max-w-4xl py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/orders')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>
        
        <div className="grid gap-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Order #{transaction.id.slice(-6)}</h1>
              <p className="text-muted-foreground">Placed on {formatDate(transaction.createdAt)}</p>
            </div>
            <Badge className={`${statusDetails.color} text-white py-1 px-3`}>
              <span className="flex items-center gap-2">
                {statusDetails.icon}
                {statusDetails.label}
              </span>
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Items</CardTitle>
                <CardDescription>Items in your order</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {transaction.items.map((item, index) => {
                  const product = getProduct(item.productId);
                  
                  return (
                    <div key={index}>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{product?.name || 'Unknown Product'}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatPrice(item.price)} × {item.quantity}
                            </p>
                          </div>
                        </div>
                        <div className="font-medium">
                          {formatPrice(calculateItemTotal(item))}
                        </div>
                      </div>
                      
                      {index < transaction.items.length - 1 && (
                        <Separator className="my-4" />
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
            
            {/* Order Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>{formatPrice(transaction.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery Fee:</span>
                    <span>{formatPrice(transaction.deliveryCost || 0)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span>{formatPrice((transaction.totalAmount || 0) + (transaction.deliveryCost || 0))}</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payment & Delivery</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-medium">Payment Method</p>
                    <p className="text-muted-foreground">
                      {getPaymentMethodName(transaction.paymentMethodId || '')}
                    </p>
                  </div>
                  
                  <div>
                    <p className="font-medium">Delivery Method</p>
                    <p className="text-muted-foreground">
                      {getDeliveryMethodName(transaction.deliveryMethodId || '')}
                    </p>
                  </div>
                  
                  {transaction.deliveryAddress && (
                    <div>
                      <p className="font-medium">Delivery Address</p>
                      <p className="text-muted-foreground whitespace-pre-line">
                        {transaction.deliveryAddress}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {transaction.paymentProofUrl && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Payment Proof
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mt-2">
                      <img 
                        src={transaction.paymentProofUrl} 
                        alt="Payment proof" 
                        className="max-h-48 rounded-md border" 
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}