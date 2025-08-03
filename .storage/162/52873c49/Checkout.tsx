import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

import { Product } from '@/lib/types';
import { getCart, getProducts, clearCart, getPriceForUser, getCurrentUser } from '@/lib/storage';
import { TransactionForm } from '@/components/transactions/transaction-form';
import { UserLayout } from '@/components/layout/user-layout';

export default function CheckoutPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<{ productId: string; quantity: number }[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const currentUser = getCurrentUser();
  const userType = currentUser?.type || 'regular';
  
  // Load cart data
  useEffect(() => {
    const cart = getCart();
    setCartItems(cart);
    setProducts(getProducts());
    
    if (cart.length === 0) {
      toast({
        title: 'Empty cart',
        description: 'Your cart is empty. Add some products first.',
      });
      navigate('/');
    }
  }, [navigate, toast]);
  
  // Format price to currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };
  
  // Get product by ID
  const getProduct = (productId: string): Product | undefined => {
    return products.find(product => product.id === productId);
  };
  
  // Calculate total price
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const product = getProduct(item.productId);
      if (!product) return total;
      
      const price = getPriceForUser(product, userType);
      return total + (price * item.quantity);
    }, 0);
  };
  
  // Handle successful checkout
  const handleCheckoutSuccess = () => {
    clearCart();
    toast({
      title: 'Order placed successfully',
      description: 'Your order has been placed and is awaiting confirmation.'
    });
    navigate('/orders');
  };
  
  return (
    <UserLayout>
      <div className="container max-w-4xl py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">
            <TransactionForm 
              type="out" 
              onSuccess={handleCheckoutSuccess}
              onCancel={() => navigate('/')}
            />
          </div>
          
          <div className="lg:col-span-5">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>
                  {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map(item => {
                  const product = getProduct(item.productId);
                  if (!product) return null;
                  
                  return (
                    <div key={product.id} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center">
                          <ShoppingBag className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Qty: {item.quantity} × {formatPrice(getPriceForUser(product, userType))}
                          </p>
                        </div>
                      </div>
                      <div className="font-medium">
                        {formatPrice(getPriceForUser(product, userType) * item.quantity)}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                <div className="font-medium">Total</div>
                <div className="font-bold text-lg">{formatPrice(calculateTotal())}</div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}