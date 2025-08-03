import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { DeliveryMethod } from '@/lib/types';
import { addDeliveryMethod, updateDeliveryMethod, generateId } from '@/lib/storage';

interface DeliveryMethodFormProps {
  deliveryMethod?: DeliveryMethod;
  onSuccess: () => void;
  onCancel: () => void;
}

export function DeliveryMethodForm({ deliveryMethod, onSuccess, onCancel }: DeliveryMethodFormProps) {
  const isEditing = !!deliveryMethod;
  
  const [formData, setFormData] = useState<DeliveryMethod>(
    deliveryMethod || {
      id: generateId(),
      name: '',
      description: '',
      cost: 0,
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
      [name]: name === 'cost' ? parseFloat(value) : value,
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
        updateDeliveryMethod(formData);
        toast.success('Delivery method updated');
      } else {
        addDeliveryMethod(formData);
        toast.success('Delivery method added');
      }
      onSuccess();
    } catch (error) {
      toast.error('Failed to save delivery method');
      console.error('Error saving delivery method:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Method Name</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g. Standard Delivery"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
          placeholder="Delivery details, estimated time, etc."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cost">Cost</Label>
        <Input
          id="cost"
          name="cost"
          type="number"
          min="0"
          value={formData.cost}
          onChange={handleChange}
          required
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
          {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Add'} Delivery Method
        </Button>
      </div>
    </form>
  );
}