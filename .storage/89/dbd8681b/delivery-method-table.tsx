import { useState, useEffect } from 'react';
import { Edit, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DeliveryMethod } from '@/lib/types';
import { getDeliveryMethods, deleteDeliveryMethod } from '@/lib/storage';
import { DeliveryMethodForm } from './delivery-method-form';

export function DeliveryMethodTable() {
  const [deliveryMethods, setDeliveryMethods] = useState<DeliveryMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<DeliveryMethod | undefined>(undefined);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Load delivery methods
  const loadDeliveryMethods = () => {
    setDeliveryMethods(getDeliveryMethods());
  };

  useEffect(() => {
    loadDeliveryMethods();
  }, []);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Handle method delete
  const handleDelete = () => {
    if (selectedMethod) {
      const success = deleteDeliveryMethod(selectedMethod.id);
      
      if (success) {
        toast.success('Delivery method deleted successfully');
        setIsDeleteDialogOpen(false);
        loadDeliveryMethods();
      } else {
        toast.error('Failed to delete delivery method');
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Delivery Methods</h3>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Method
        </Button>
      </div>

      {deliveryMethods.length === 0 ? (
        <Alert>
          <AlertTitle>No delivery methods found</AlertTitle>
          <AlertDescription>
            No delivery methods have been added yet. Click the "Add Method" button to create one.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Method Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveryMethods.map((method) => (
                <TableRow key={method.id}>
                  <TableCell>{method.name}</TableCell>
                  <TableCell>{method.description || '-'}</TableCell>
                  <TableCell className="text-right">{formatCurrency(method.cost)}</TableCell>
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
            <DialogTitle>Add Delivery Method</DialogTitle>
            <DialogDescription>
              Add a new delivery method for customers to choose from.
            </DialogDescription>
          </DialogHeader>
          <DeliveryMethodForm
            onSuccess={() => {
              setIsAddDialogOpen(false);
              loadDeliveryMethods();
            }}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Method Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Delivery Method</DialogTitle>
            <DialogDescription>
              Update the details of this delivery method.
            </DialogDescription>
          </DialogHeader>
          {selectedMethod && (
            <DeliveryMethodForm
              deliveryMethod={selectedMethod}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                loadDeliveryMethods();
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
              Are you sure you want to delete the "{selectedMethod?.name}" delivery method?
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