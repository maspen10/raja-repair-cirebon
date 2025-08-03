import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, AlertCircle, CheckCircle, Truck, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Transaction, TransactionStatus } from '@/lib/types';
import { getTransactions, getCurrentUser } from '@/lib/storage';
import { UserLayout } from '@/components/layout/user-layout';

export default function OrdersPage() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const currentUser = getCurrentUser();
  
  // Load transactions data
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    const allTransactions = getTransactions().filter(
      t => t.userId === currentUser.id && t.type === 'out'
    );
    
    setTransactions(allTransactions);
  }, [navigate, currentUser]);
  
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
          icon: <Clock className="h-4 w-4" />, 
          color: 'bg-yellow-500',
          label: 'Pending' 
        };
      case 'payment_confirmed':
        return { 
          icon: <CheckCircle className="h-4 w-4" />, 
          color: 'bg-green-500',
          label: 'Payment Confirmed' 
        };
      case 'processing':
        return { 
          icon: <Loader2 className="h-4 w-4 animate-spin" />, 
          color: 'bg-blue-500',
          label: 'Processing' 
        };
      case 'shipping':
        return { 
          icon: <Truck className="h-4 w-4" />, 
          color: 'bg-indigo-500',
          label: 'Shipping' 
        };
      case 'ready_for_pickup':
        return { 
          icon: <Package className="h-4 w-4" />, 
          color: 'bg-purple-500',
          label: 'Ready for Pickup' 
        };
      case 'completed':
        return { 
          icon: <CheckCircle className="h-4 w-4" />, 
          color: 'bg-green-700',
          label: 'Completed' 
        };
      case 'cancelled':
        return { 
          icon: <AlertCircle className="h-4 w-4" />, 
          color: 'bg-red-500',
          label: 'Cancelled' 
        };
      default:
        return { 
          icon: <Clock className="h-4 w-4" />, 
          color: 'bg-gray-500',
          label: status 
        };
    }
  };
  
  // Get filtered transactions
  const getFilteredTransactions = (filter: string) => {
    if (filter === 'all') return transactions;
    
    if (filter === 'active') {
      return transactions.filter(t => 
        ['pending', 'payment_confirmed', 'processing', 'shipping', 'ready_for_pickup'].includes(t.status)
      );
    }
    
    if (filter === 'completed') {
      return transactions.filter(t => t.status === 'completed');
    }
    
    if (filter === 'cancelled') {
      return transactions.filter(t => t.status === 'cancelled');
    }
    
    return transactions;
  };
  
  return (
    <UserLayout>
      <div className="container py-8">
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">My Orders</h2>
            <p className="text-muted-foreground">
              View and track your orders
            </p>
          </div>
          
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All Orders</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            </TabsList>
            
            {['all', 'active', 'completed', 'cancelled'].map(tabValue => (
              <TabsContent value={tabValue} key={tabValue}>
                <div className="grid gap-4 mt-4">
                  {getFilteredTransactions(tabValue).length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-10">
                        <Package className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No {tabValue !== 'all' ? tabValue : ''} orders found</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => navigate('/')}
                        >
                          Continue Shopping
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    getFilteredTransactions(tabValue).map(transaction => {
                      const statusDetails = getStatusDetails(transaction.status);
                      
                      return (
                        <Card key={transaction.id}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle>Order #{transaction.id.slice(-6)}</CardTitle>
                                <CardDescription>{formatDate(transaction.createdAt)}</CardDescription>
                              </div>
                              <Badge className={`${statusDetails.color} text-white`}>
                                <span className="flex items-center gap-1">
                                  {statusDetails.icon}
                                  {statusDetails.label}
                                </span>
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Items: {transaction.items.length}</p>
                              <p className="font-medium">Total: {formatPrice(transaction.totalAmount)}</p>
                            </div>
                          </CardContent>
                          <CardFooter className="flex justify-between border-t pt-4">
                            <Button 
                              variant="outline"
                              onClick={() => navigate(`/orders/${transaction.id}`)}
                            >
                              View Details
                            </Button>
                          </CardFooter>
                        </Card>
                      );
                    })
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </UserLayout>
  );
}