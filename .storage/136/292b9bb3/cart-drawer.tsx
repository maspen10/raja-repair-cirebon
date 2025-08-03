import { useState, useEffect } from 'react';
import { X, ShoppingCart, Trash2 } from 'lucide-react';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';

import { Product } from '@/lib/types';
import { getCart, getProducts, getPriceForUser, getCurrentUser } from '@/lib/storage';
import { useNavigate } from 'react-router-dom';

export function CartDrawer() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [cartItems, setCartItems] = useState<{ productId: string; quantity: number }[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<{[key: string]: number}>({});
  const currentUser = getCurrentUser();
  const userType = currentUser?.type || 'regular';
  
  // Load cart data
  useEffect(() => {
    if (isOpen) {
      const cart = getCart();
      setCartItems(cart);
      setProducts(getProducts());
      
      // Initialize quantities
      const initialQuantities: {[key: string]: number} = {};
      cart.forEach(item => {
        initialQuantities[item.productId] = item.quantity;
      });
      setQuantities(initialQuantities);
    }
  }, [isOpen]);
  
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
  
  // Update quantity in localStorage
  const updateCart = (productId: string, quantity: number) => {
    const cart = getCart();
    const itemIndex = cart.findIndex(item => item.productId === productId);
    
    if (itemIndex !== -1) {
      if (quantity <= 0) {
        // Remove item if quantity is 0 or negative
        cart.splice(itemIndex, 1);
      } else {
        // Update quantity
        cart[itemIndex].quantity = quantity;
      }
      
      localStorage.setItem('raja-repair-cart', JSON.stringify(cart));
      setCartItems([...cart]);
    }
  };
  
  // Handle quantity change
  const handleQuantityChange = (productId: string, value: string) => {
    const quantity = parseInt(value, 10);
    if (isNaN(quantity)) return;
    
    // Check stock availability
    const product = getProduct(productId);
    if (product && quantity > product.stock) {
      toast({
        variant: 'destructive',
        title: 'Insufficient stock',
        description: `Only ${product.stock} available.`
      });
      return;
    }
    
    setQuantities({
      ...quantities,
      [productId]: quantity
    });
    
    updateCart(productId, quantity);
  };
  
  // Handle removing an item from cart
  const handleRemoveItem = (productId: string) => {
    updateCart(productId, 0);
    
    toast({
      title: 'Item removed',
      description: 'Item has been removed from your cart.'
    });
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
  
  // Go to checkout
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Empty cart',
        description: 'Add some products to your cart first.'
      });
      return;
    }
    
    // Redirect to checkout page (or show transaction form)
    setIsOpen(false);
    navigate('/checkout');
  };
  
  // Get total items count
  const getTotalItemsCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-4 w-4" />
          {cartItems.length > 0 && (
            <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
              {getTotalItemsCount()}
            </Badge>
          )}
          <span className="sr-only">Open cart</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Your Shopping Cart</SheetTitle>
          <SheetDescription>
            {cartItems.length === 0 
              ? 'Your cart is empty' 
              : `You have ${getTotalItemsCount()} item${getTotalItemsCount() > 1 ? 's' : ''} in your cart`}
          </SheetDescription>
        </SheetHeader>
        
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Your cart is empty</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setIsOpen(false);
                navigate('/');
              }}
            >
              Continue Shopping
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 mt-6">
            {cartItems.map(item => {
              const product = getProduct(item.productId);
              if (!product) return null;
              
              return (
                <div key={product.id} className="flex gap-4 py-2">
                  <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">{product.code}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-medium">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatPrice(getPriceForUser(product, userType))}
                          {userType === 'vip' && product.vipPrice && (
                            <span className="line-through ml-2 opacity-70">
                              {formatPrice(product.price)}
                            </span>
                          )}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleRemoveItem(product.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                    <div className="flex items-center mt-2">
                      <Input
                        type="number"
                        min="1"
                        max={product.stock}
                        value={quantities[product.id] || item.quantity}
                        onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                        className="w-16 h-8"
                      />
                      <span className="text-xs text-muted-foreground ml-2">
                        (Stock: {product.stock})
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            
            <Separator className="my-4" />
            
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-bold">{formatPrice(calculateTotal())}</p>
              </div>
              <Button 
                onClick={handleCheckout}
                className="w-32"
              >
                Checkout
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}