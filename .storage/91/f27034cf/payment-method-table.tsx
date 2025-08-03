import { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PaymentMethod } from '@/lib/types';
import { getPaymentMethods, deletePaymentMethod } from '@/lib/storage';
import { PaymentMethodForm } from './payment-method-form';

export function PaymentMethodTable() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | undefined>(undefined);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Load payment methods
  const loadPaymentMethods = () => {
    setPaymentMethods(getPaymentMethods());
  };

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  // Handle method delete
  const handleDelete = () => {
    if (selectedMethod) {
      const success = deletePaymentMethod(selectedMethod.id);
      
      if (success) {
        toast.success('Payment method deleted successfully');
        setIsDeleteDialogOpen(false);
        loadPaymentMethods();
      } else {
        toast.error('Failed to delete payment method');
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Payment Methods</h3>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Method
        </Button>
      </div>

      {paymentMethods.length === 0 ? (
        <Alert>
          <AlertTitle>No payment methods found</AlertTitle>
          <AlertDescription>
            No payment methods have been added yet. Click the "Add Method" button to create one.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Method Name</TableHead>
                <TableHead>Account Details</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentMethods.map((method) => (
                <TableRow key={method.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      {method.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    {method.accountName && method.accountNumber ? (
                      <div className="text-sm">
                        <div>{method.accountName}</div>
                        <div className="text-muted-foreground">{method.accountNumber}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{method.description || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={method.active ? "default" : "outline"}>
                      {method.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedMethod(method);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedMethod(method);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Method Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogDescription>
              Add a new payment method for customers to use.
            </DialogDescription>
          </DialogHeader>
          <PaymentMethodForm
            onSuccess={() => {
              setIsAddDialogOpen(false);
              loadPaymentMethods();
            }}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Method Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Payment Method</DialogTitle>
            <DialogDescription>
              Update the details of this payment method.
            </DialogDescription>
          </DialogHeader>
          {selectedMethod && (
            <PaymentMethodForm
              paymentMethod={selectedMethod}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                loadPaymentMethods();
              }}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the "{selectedMethod?.name}" payment method?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}