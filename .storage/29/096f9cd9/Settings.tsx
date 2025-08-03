import { SettingsForm } from '@/components/settings/settings-form';
import { AdminLayout } from '@/components/layout/admin-layout';
import { MainLayout } from '@/components/layout/main-layout';

export default function AdminSettings() {
  return (
    <MainLayout requiredRole="admin">
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Application Settings</h1>
            <p className="text-muted-foreground mt-2">
              Configure store details and system preferences
            </p>
          </div>
          
          <div className="max-w-3xl">
            <SettingsForm />
          </div>
        </div>
      </AdminLayout>
    </MainLayout>
  );
}