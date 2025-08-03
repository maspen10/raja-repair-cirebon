import { AdminLayout } from '@/components/layout/admin-layout';
import { DeliveryMethodTable } from '@/components/settings/delivery-method-table';
import { PaymentMethodTable } from '@/components/settings/payment-method-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SettingsPage() {
  return (
    <AdminLayout>
      <div className="container mx-auto py-6 space-y-6">
        <h1 className="text-3xl font-bold">System Settings</h1>
        
        <Tabs defaultValue="delivery">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="delivery">Delivery Methods</TabsTrigger>
            <TabsTrigger value="payment">Payment Methods</TabsTrigger>
          </TabsList>
          
          <TabsContent value="delivery" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Method Management</CardTitle>
                <CardDescription>
                  Manage delivery options available to customers when placing orders.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DeliveryMethodTable />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="payment" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment Method Management</CardTitle>
                <CardDescription>
                  Manage payment options available to customers during checkout.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PaymentMethodTable />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}