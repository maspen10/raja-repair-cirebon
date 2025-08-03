import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

import { Product, Transaction, TransactionItem, TransactionType } from '@/lib/types';
import { addTransaction, getProducts, generateId, getCurrentUser } from '@/lib/storage';

// Form schema for individual transaction items
const transactionItemSchema = z.object({
  productId: z.string().min(1, { message: 'Product is required' }),
  quantity: z.coerce.number().min(1, { message: 'Quantity must be at least 1' }),
});

// Main form schema
const formSchema = z.object({
  notes: z.string().optional(),
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
  
  // Load products
  useEffect(() => {
    setProducts(getProducts());
  }, []);

  // Form definition
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      notes: '',
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
        status: 'completed',
        notes: values.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      addTransaction(newTransaction);
      
      toast({
        title: 'Transaction successful',
        description: `Transaction has been recorded successfully.`,
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{type === 'in' ? 'Record Incoming Products' : 'Record Outgoing Products'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                                {product.code} - {product.name} {type === 'out' && `(Stock: ${product.stock})`}
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
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add any additional notes here" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Save Transaction'}
        </Button>
      </CardFooter>
    </Card>
  );
}