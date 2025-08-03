import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { PaymentMethod } from '@/lib/types';
import { addPaymentMethod, updatePaymentMethod, generateId } from '@/lib/storage';

interface PaymentMethodFormProps {
  paymentMethod?: PaymentMethod;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PaymentMethodForm({ paymentMethod, onSuccess, onCancel }: PaymentMethodFormProps) {
  const isEditing = !!paymentMethod;
  
  const [formData, setFormData] = useState<PaymentMethod>(
    paymentMethod || {
      id: generateId(),
      name: '',
      accountNumber: '',
      accountName: '',
      description: '',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  );
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      active: checked,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isEditing) {
        updatePaymentMethod(formData);
        toast.success('Payment method updated');
      } else {
        addPaymentMethod(formData);
        toast.success('Payment method added');
      }
      onSuccess();
    } catch (error) {
      toast.error('Failed to save payment method');
      console.error('Error saving payment method:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine if it's a cash/COD payment (which doesn't need account details)
  const isCashPayment = formData.name.toLowerCase().includes('cash') || 
                        formData.name.toLowerCase().includes('cod') || 
                        formData.name.toLowerCase().includes('pick');

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Method Name</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g. Bank Transfer BCA"
          required
        />
      </div>

      {!isCashPayment && (
        <>
          <div className="space-y-2">
            <Label htmlFor="accountName">Account Name</Label>
            <Input
              id="accountName"
              name="accountName"
              value={formData.accountName || ''}
              onChange={handleChange}
              placeholder="e.g. PT Raja Repair Cirebon"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountNumber">Account Number</Label>
            <Input
              id="accountNumber"
              name="accountNumber"
              value={formData.accountNumber || ''}
              onChange={handleChange}
              placeholder="e.g. 1234567890"
            />
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
          placeholder="Payment instructions or additional details"
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="active"
          checked={formData.active}
          onCheckedChange={handleSwitchChange}
        />
        <Label htmlFor="active">Active</Label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Add'} Payment Method
        </Button>
      </div>
    </form>
  );
}