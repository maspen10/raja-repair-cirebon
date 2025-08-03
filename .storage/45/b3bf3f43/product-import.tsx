import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileSpreadsheet, Download, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';

import { ProductCategory } from '@/lib/types';
import { getCategories, parseProductsFromCSV, exportProductsToCSV, addMultipleProducts } from '@/lib/storage';

const formSchema = z.object({
  csvData: z.string().min(10, { message: 'CSV data is too short' }),
});

interface ProductImportProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProductImport({ onSuccess, onCancel }: ProductImportProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [template, setTemplate] = useState('');

  // Load categories and generate template
  useEffect(() => {
    const loadedCategories = getCategories();
    setCategories(loadedCategories);

    // Create template CSV
    const csvTemplate = "Code,Name,Category,Price,Stock\nSP001,Example Sparepart,Spareparts,50000,10\nTL001,Example Tool,Tools,120000,5";
    setTemplate(csvTemplate);
  }, []);

  // Form definition
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      csvData: '',
    },
  });

  // Download CSV template
  const downloadTemplate = () => {
    const element = document.createElement('a');
    const file = new Blob([template], { type: 'text/csv' });
    element.href = URL.createObjectURL(file);
    element.download = 'products_template.csv';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Download current products as CSV
  const downloadCurrentProducts = () => {
    const csvData = exportProductsToCSV();
    
    const element = document.createElement('a');
    const file = new Blob([csvData], { type: 'text/csv' });
    element.href = URL.createObjectURL(file);
    element.download = 'current_products.csv';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast({
      title: 'Products exported',
      description: 'Your product list has been exported as a CSV file.',
    });
  };

  // Form submission
  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    try {
      // Create a mapping from category names to IDs for the parser
      const categoryNameToIdMap: {[key: string]: string} = {};
      categories.forEach(category => {
        categoryNameToIdMap[category.name] = category.id;
      });
      
      // Parse the CSV data into product objects
      const products = parseProductsFromCSV(values.csvData, categoryNameToIdMap);
      
      if (products.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Import failed',
          description: 'No valid products found in the CSV data. Check the format and try again.',
        });
        return;
      }
      
      // Add/update products
      addMultipleProducts(products);
      
      toast({
        title: 'Products imported',
        description: `Successfully imported ${products.length} products.`,
      });
      
      onSuccess();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Import failed',
        description: 'An error occurred while importing products. Please check your CSV format.',
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      form.setValue('csvData', content);
    };
    reader.readAsText(file);
  };

  return (
    <Card className="border-0 shadow-none">
      <Tabs defaultValue="paste">
        <TabsList className="grid grid-cols-2 w-full mb-4">
          <TabsTrigger value="paste">Paste Data</TabsTrigger>
          <TabsTrigger value="upload">Upload File</TabsTrigger>
        </TabsList>
        
        <TabsContent value="paste">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="csvData"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CSV Data</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Paste your CSV data here..." 
                        className="min-h-[200px] font-mono"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </TabsContent>
        
        <TabsContent value="upload">
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Upload a CSV file with your product data
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="block w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary file:text-white
                  hover:file:bg-primary/90"
              />
            </div>
            
            {form.getValues('csvData') && (
              <Alert>
                <AlertDescription>
                  File loaded successfully. Click Import to process the data.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="mt-6 border-t pt-4">
        <p className="text-sm text-muted-foreground mb-2">
          Your CSV should have the following columns: Code, Name, Category, Price, Stock
        </p>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Download Template
          </Button>
          <Button variant="outline" size="sm" onClick={downloadCurrentProducts}>
            <Download className="mr-2 h-4 w-4" /> Export Current Products
          </Button>
        </div>
      </div>
      
      <CardFooter className="flex justify-between mt-6 px-0">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
          {isLoading ? 'Importing...' : 'Import Products'}
        </Button>
      </CardFooter>
    </Card>
  );
}