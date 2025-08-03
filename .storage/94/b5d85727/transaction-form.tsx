import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Plus, ShoppingCart } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';

import { Product, Transaction, TransactionItem, TransactionType, DeliveryMethod, TransactionStatus } from '@/lib/types';
import { addTransaction, getProducts, generateId, getCurrentUser } from '@/lib/storage';

// Form schema for individual transaction items
const transactionItemSchema = z.object({
  productId: z.string().min(1, { message: 'Product is required' }),
  quantity: z.coerce.number().min(1, { message: 'Quantity must be at least 1' }),
});

// Main form schema
const formSchema = z.object({
  notes: z.string().optional(),
  deliveryMethod: z.enum(['pickup', 'shipping']).optional(),
  deliveryAddress: z.string().optional(),
  items: z.array(transactionItemSchema).min(1, { message: 'At least one product is required' })
});

interface TransactionFormProps {
  type: TransactionType;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TransactionForm({ type, onSuccess, onCancel }: TransactionFormProps) {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<{ productId: string; quantity: number }[]>([{ productId: '', quantity: 1 }]);
  const [step, setStep] = useState<'items' | 'delivery' | 'confirmation'>('items');
  const [totalAmount, setTotalAmount] = useState(0);
  
  // Load products
  useEffect(() => {
    setProducts(getProducts().filter(p => p.stock > 0));
  }, []);

  // Form definition
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      notes: '',
      deliveryMethod: 'pickup',
      deliveryAddress: '',
      items: [{ productId: '', quantity: 1 }]
    },
  });

  // Add another product item to transaction
  const addItem = () => {
    setItems([...items, { productId: '', quantity: 1 }]);
    form.setValue('items', [...form.getValues('items'), { productId: '', quantity: 1 }]);
  };

  // Remove a product item from transaction
  const removeItem = (index: number) => {
    const updatedItems = [...items];
    updatedItems.splice(index, 1);
    setItems(updatedItems);
    
    const formItems = [...form.getValues('items')];
    formItems.splice(index, 1);
    form.setValue('items', formItems);
  };

  // Calculate total amount of transaction
  const calculateTotal = (items: TransactionItem[]): number => {
    return items.reduce((total, item) => {
      const product = products.find(p => p.id === item.productId);
      return total + (product?.price || 0) * item.quantity;
    }, 0);
  };

  // Move to delivery step
  const goToDeliveryStep = () => {
    const itemsResult = form.trigger('items');
    if (!itemsResult) return;
    
    const selectedItems = form.getValues('items');
    const calculatedTotal = calculateTotal(selectedItems as TransactionItem[]);
    setTotalAmount(calculatedTotal);
    setStep('delivery');
  };
  
  // Move to confirmation step
  const goToConfirmationStep = () => {
    const deliveryMethodResult = form.trigger('deliveryMethod');
    const deliveryAddressResult = form.getValues('deliveryMethod') === 'shipping' 
      ? form.trigger('deliveryAddress') 
      : true;
    
    if (!deliveryMethodResult || !deliveryAddressResult) return;
    setStep('confirmation');
  };
  
  // Back to previous step
  const goBack = () => {
    if (step === 'delivery') {
      setStep('items');
    } else if (step === 'confirmation') {
      setStep('delivery');
    }
  };

  // Form submission
  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    try {
      const currentUser = getCurrentUser();
      
      if (!currentUser) {
        toast({
          variant: 'destructive',
          title: 'Authentication error',
          description: 'You must be logged in to perform this action.',
        });
        return;
      }
      
      // Validate stock availability for 'out' transactions
      if (type === 'out') {
        const stockErrors = values.items.filter(item => {
          const product = products.find(p => p.id === item.productId);
          return product && product.stock < item.quantity;
        });
        
        if (stockErrors.length > 0) {
          toast({
            variant: 'destructive',
            title: 'Insufficient stock',
            description: 'One or more products have insufficient stock.',
          });
          return;
        }
      }
      
      // Create transaction items with current price
      const transactionItems: TransactionItem[] = values.items.map(item => {
        const product = products.find(p => p.id === item.productId);
        return {
          productId: item.productId,
          quantity: item.quantity,
          priceAtTransaction: product?.price || 0
        };
      });
      
      // Create transaction
      const newTransaction: Transaction = {
        id: generateId(),
        type,
        items: transactionItems,
        totalAmount: calculateTotal(transactionItems),
        userId: currentUser.id,
        status: type === 'in' ? 'completed' : 'pending', // Incoming products are completed, orders start as pending
        notes: values.notes,
        deliveryMethod: values.deliveryMethod,
        deliveryAddress: values.deliveryMethod === 'shipping' ? values.deliveryAddress : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      addTransaction(newTransaction);
      
      toast({
        title: type === 'in' ? 'Transaction successful' : 'Order placed successfully',
        description: type === 'in' 
          ? 'Products have been added to inventory.' 
          : 'Your order is pending payment confirmation.',
      });
      
      onSuccess();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to process transaction. Please try again.',
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }
  
  // Get product name by ID
  const getProductName = (productId: string): string => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : '';
  };
  
  // Format price to currency
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {type === 'in' ? 'Record Incoming Products' : 'Place an Order'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {step === 'items' && (
              <div className="space-y-4">
                {items.map((_, index) => (
                  <div key={index} className="flex items-end gap-2 p-4 border rounded-md">
                    <FormField
                      control={form.control}
                      name={`items.${index}.productId`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Product</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a product" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.code} - {product.name} (Stock: {product.stock})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem className="w-24">
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="mb-2"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={addItem} 
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Product
                </Button>
              </div>
            )}
            
            {step === 'delivery' && type === 'out' && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="deliveryMethod"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Delivery Method</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="pickup" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Pick up at store
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="shipping" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Delivery to address
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {form.watch('deliveryMethod') === 'shipping' && (
                  <FormField
                    control={form.control}
                    name="deliveryAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Address</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter your complete delivery address" 
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add any additional notes here" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            
            {step === 'confirmation' && (
              <div className="space-y-4">
                <div className="border rounded-md p-4">
                  <h3 className="text-lg font-semibold mb-3">Order Summary</h3>
                  
                  <div className="space-y-3">
                    <p className="font-medium">Selected Products:</p>
                    <ul className="space-y-2">
                      {form.getValues('items').map((item, idx) => (
                        <li key={idx} className="flex justify-between">
                          <span>
                            {getProductName(item.productId)} x {item.quantity}
                          </span>
                          <span className="font-medium">
                            {formatPrice((products.find(p => p.id === item.productId)?.price || 0) * item.quantity)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    
                    <div className="pt-2 border-t flex justify-between font-bold">
                      <span>Total Amount:</span>
                      <span>{formatPrice(totalAmount)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <h3 className="text-lg font-semibold mb-3">Delivery Information</h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Method:</span>
                      <span className="font-medium">
                        {form.getValues('deliveryMethod') === 'pickup' 
                          ? 'Pick up at store' 
                          : 'Delivery to address'
                        }
                      </span>
                    </div>
                    
                    {form.getValues('deliveryMethod') === 'shipping' && (
                      <div>
                        <span className="text-muted-foreground">Address:</span>
                        <p className="font-medium mt-1">{form.getValues('deliveryAddress')}</p>
                      </div>
                    )}
                    
                    {form.getValues('notes') && (
                      <div className="mt-2">
                        <span className="text-muted-foreground">Notes:</span>
                        <p className="mt-1">{form.getValues('notes')}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-4 border rounded-md bg-muted/50">
                  <p className="text-sm">
                    <span className="font-semibold">Note:</span> After placing your order, you'll need to confirm payment to complete the transaction. Payment details will be provided after submission.
                  </p>
                </div>
              </div>
            )}
            
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between">
        {step === 'items' ? (
          <>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={goToDeliveryStep} disabled={isLoading}>
              Next
            </Button>
          </>
        ) : step === 'delivery' ? (
          <>
            <Button variant="outline" onClick={goBack}>
              Back
            </Button>
            <Button onClick={goToConfirmationStep} disabled={isLoading}>
              Review Order
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={goBack}>
              Back
            </Button>
            <Button onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
              {isLoading ? 'Processing...' : 'Place Order'}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}