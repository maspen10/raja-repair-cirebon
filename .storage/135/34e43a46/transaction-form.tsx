import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Plus, ShoppingCart, ImagePlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';

import { Product, Transaction, TransactionItem, TransactionType, DeliveryMethod, PaymentMethod, TransactionStatus } from '@/lib/types';
import { addTransaction, getProducts, generateId, getCurrentUser, getDeliveryMethods, getPaymentMethods, canProcessTransaction } from '@/lib/storage';

// Form schema for individual transaction items
const transactionItemSchema = z.object({
  productId: z.string().min(1, { message: 'Product is required' }),
  quantity: z.coerce.number().min(1, { message: 'Quantity must be at least 1' }),
});

// Main form schema
const formSchema = z.object({
  notes: z.string().optional(),
  deliveryMethodId: z.string().optional(),
  deliveryAddress: z.string().optional(),
  paymentMethodId: z.string().optional(),
  paymentProof: z.string().optional(),
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
  const [deliveryMethods, setDeliveryMethods] = useState<DeliveryMethod[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<{ productId: string; quantity: number }[]>([{ productId: '', quantity: 1 }]);
  const [step, setStep] = useState<'items' | 'delivery' | 'payment' | 'confirmation'>('items');
  const [totalAmount, setTotalAmount] = useState(0);
  const [deliveryCost, setDeliveryCost] = useState(0);
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  
  // Load products, delivery methods, and payment methods
  useEffect(() => {
    // For outgoing transactions, only show products with stock > 0
    if (type === 'out') {
      setProducts(getProducts().filter(p => p.stock > 0));
    } else {
      setProducts(getProducts());
    }
    
    setDeliveryMethods(getDeliveryMethods().filter(d => d.active));
    setPaymentMethods(getPaymentMethods().filter(p => p.active));
  }, [type]);

  // Form definition
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      notes: '',
      deliveryMethodId: '',
      deliveryAddress: '',
      paymentMethodId: '',
      paymentProof: '',
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
    
    // Check stock availability for outgoing transactions
    if (type === 'out') {
      const stockErrors = selectedItems.filter(item => {
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
    
    const calculatedTotal = calculateTotal(selectedItems as TransactionItem[]);
    setTotalAmount(calculatedTotal);
    setStep('delivery');
  };
  
  // Move to payment step
  const goToPaymentStep = () => {
    // For incoming transactions, skip delivery & payment steps
    if (type === 'in') {
      setStep('confirmation');
      return;
    }
    
    const deliveryMethodResult = form.trigger('deliveryMethodId');
    const deliveryAddressResult = form.getValues('deliveryMethodId') ? true : form.trigger('deliveryAddress');
    
    if (!deliveryMethodResult || !deliveryAddressResult) return;
    
    // Update delivery cost
    const selectedDeliveryMethodId = form.getValues('deliveryMethodId');
    const selectedDeliveryMethod = deliveryMethods.find(m => m.id === selectedDeliveryMethodId);
    if (selectedDeliveryMethod) {
      setDeliveryCost(selectedDeliveryMethod.cost);
    }
    
    setStep('payment');
  };
  
  // Move to confirmation step
  const goToConfirmationStep = () => {
    const paymentMethodResult = form.trigger('paymentMethodId');
    if (!paymentMethodResult) return;
    setStep('confirmation');
  };
  
  // Back to previous step
  const goBack = () => {
    if (step === 'delivery') {
      setStep('items');
    } else if (step === 'payment') {
      setStep('delivery');
    } else if (step === 'confirmation') {
      if (type === 'in') {
        setStep('items');
      } else {
        setStep('payment');
      }
    }
  };

  // File upload handler for payment proof
  const handlePaymentProofUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) return;
    
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Please select an image smaller than 5MB.',
      });
      return;
    }
    
    // Check file type (only allow images)
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please select an image file (JPEG, PNG, etc.).',
      });
      return;
    }
    
    // In a real app, we would upload the file to a server here
    // For this demo, we'll create a local URL to display the image
    const imageUrl = URL.createObjectURL(file);
    setPaymentProofUrl(imageUrl);
    form.setValue('paymentProof', `payment-proof-${Date.now()}.jpg`); // Mock filename
    
    toast({
      title: 'Payment proof uploaded',
      description: 'Your payment proof has been uploaded successfully.',
    });
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
      
      // Create transaction items with current price
      const transactionItems: TransactionItem[] = values.items.map(item => {
        const product = products.find(p => p.id === item.productId);
        return {
          productId: item.productId,
          quantity: item.quantity,
          priceAtTransaction: product?.price || 0
        };
      });
      
      // Create transaction with total including delivery cost for outgoing transactions
      const subtotal = calculateTotal(transactionItems);
      const total = type === 'out' ? subtotal + deliveryCost : subtotal;
      
      // Create transaction
      const newTransaction: Transaction = {
        id: generateId(),
        type,
        items: transactionItems,
        totalAmount: total,
        userId: currentUser.id,
        status: type === 'in' ? 'completed' : 'pending', // Incoming products are completed, orders start as pending
        notes: values.notes,
        deliveryMethodId: values.deliveryMethodId,
        deliveryAddress: values.deliveryAddress,
        paymentMethodId: values.paymentMethodId,
        paymentProof: values.paymentProof,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Validate stock for outgoing transactions
      if (type === 'out' && !canProcessTransaction(newTransaction)) {
        toast({
          variant: 'destructive',
          title: 'Insufficient stock',
          description: 'One or more products have insufficient stock.',
        });
        setIsLoading(false);
        return;
      }
      
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

  // Get delivery method name by ID
  const getDeliveryMethodName = (methodId: string): string => {
    const method = deliveryMethods.find(m => m.id === methodId);
    return method ? method.name : '';
  };

  // Get payment method name by ID
  const getPaymentMethodName = (methodId: string): string => {
    const method = paymentMethods.find(m => m.id === methodId);
    return method ? method.name : '';
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
            {/* STEP 1: Select Products */}
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
            
            {/* STEP 2: Delivery Options (outgoing only) */}
            {step === 'delivery' && type === 'out' && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="deliveryMethodId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select delivery method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {deliveryMethods.map((method) => (
                            <SelectItem key={method.id} value={method.id}>
                              {method.name} {method.cost > 0 ? `(${formatPrice(method.cost)})` : '(Free)'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {form.getValues('deliveryMethodId') && 
                          deliveryMethods.find(m => m.id === form.getValues('deliveryMethodId'))?.description
                        }
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {form.watch('deliveryMethodId') && 
                  !deliveryMethods.find(m => m.id === form.watch('deliveryMethodId'))?.name.toLowerCase().includes('pick') && (
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
            
            {/* STEP 3: Payment Options (outgoing only) */}
            {step === 'payment' && type === 'out' && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="paymentMethodId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {paymentMethods.map((method) => (
                            <SelectItem key={method.id} value={method.id}>
                              {method.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {form.watch('paymentMethodId') && (
                  <div className="border rounded-md p-4 bg-muted/50">
                    {(() => {
                      const selectedMethod = paymentMethods.find(
                        m => m.id === form.getValues('paymentMethodId')
                      );
                      
                      if (!selectedMethod) return null;
                      
                      if (selectedMethod.name.toLowerCase().includes('cash')) {
                        return (
                          <p className="text-sm">
                            Pay with cash when you pick up your order.
                          </p>
                        );
                      }
                      
                      return (
                        <div className="space-y-2 text-sm">
                          <p className="font-medium">{selectedMethod.name}</p>
                          {selectedMethod.accountName && (
                            <p>Account name: {selectedMethod.accountName}</p>
                          )}
                          {selectedMethod.accountNumber && (
                            <p>Account number: {selectedMethod.accountNumber}</p>
                          )}
                          {selectedMethod.description && (
                            <p>{selectedMethod.description}</p>
                          )}
                          <div className="pt-2">
                            <p className="font-medium">Amount to pay: {formatPrice(totalAmount + deliveryCost)}</p>
                          </div>
                          
                          {!selectedMethod.name.toLowerCase().includes('cash') && (
                            <div className="pt-3">
                              <p className="font-medium">Upload Payment Proof:</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Button 
                                  type="button" 
                                  variant="outline"
                                  onClick={handlePaymentProofUpload}
                                >
                                  <ImagePlus className="mr-2 h-4 w-4" />
                                  Upload Image
                                </Button>
                                {paymentProofUrl && (
                                  <span className="text-sm text-green-600">Payment proof uploaded</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
            
            {/* STEP 4: Confirmation */}
            {step === 'confirmation' && (
              <div className="space-y-4">
                <div className="border rounded-md p-4">
                  <h3 className="text-lg font-semibold mb-3">{type === 'in' ? 'Transaction' : 'Order'} Summary</h3>
                  
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
                    
                    {type === 'out' && deliveryCost > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Delivery Fee:</span>
                        <span>{formatPrice(deliveryCost)}</span>
                      </div>
                    )}
                    
                    <div className="pt-2 border-t flex justify-between font-bold">
                      <span>Total Amount:</span>
                      <span>{formatPrice(totalAmount + (type === 'out' ? deliveryCost : 0))}</span>
                    </div>
                  </div>
                </div>
                
                {type === 'out' && (
                  <div className="border rounded-md p-4">
                    <h3 className="text-lg font-semibold mb-3">Delivery & Payment Information</h3>
                    
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-muted-foreground text-sm">Delivery Method:</p>
                          <p className="font-medium">
                            {getDeliveryMethodName(form.getValues('deliveryMethodId') || '')}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-muted-foreground text-sm">Payment Method:</p>
                          <p className="font-medium">
                            {getPaymentMethodName(form.getValues('paymentMethodId') || '')}
                          </p>
                        </div>
                      </div>
                      
                      {form.getValues('deliveryAddress') && (
                        <div>
                          <p className="text-muted-foreground text-sm">Delivery Address:</p>
                          <p className="font-medium">{form.getValues('deliveryAddress')}</p>
                        </div>
                      )}
                      
                      {form.getValues('notes') && (
                        <div>
                          <p className="text-muted-foreground text-sm">Notes:</p>
                          <p>{form.getValues('notes')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {type === 'out' && (
                  <div className="p-4 border rounded-md bg-muted/50">
                    <p className="text-sm">
                      <span className="font-semibold">Note:</span> After placing your order, the admin will review and process it. You can check the status in your order history.
                    </p>
                  </div>
                )}
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
              {type === 'in' ? 'Review' : 'Next'}
            </Button>
          </>
        ) : step === 'delivery' ? (
          <>
            <Button variant="outline" onClick={goBack}>
              Back
            </Button>
            <Button onClick={goToPaymentStep} disabled={isLoading}>
              Next
            </Button>
          </>
        ) : step === 'payment' ? (
          <>
            <Button variant="outline" onClick={goBack}>
              Back
            </Button>
            <Button 
              onClick={goToConfirmationStep} 
              disabled={isLoading || (!paymentProofUrl && 
              paymentMethods.find(m => m.id === form.getValues('paymentMethodId'))?.name.toLowerCase().includes('transfer'))}
            >
              Review Order
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={goBack}>
              Back
            </Button>
            <Button onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
              {isLoading ? 'Processing...' : type === 'in' ? 'Record Transaction' : 'Place Order'}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}