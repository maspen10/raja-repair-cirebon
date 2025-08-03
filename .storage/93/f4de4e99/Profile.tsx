import { useState, useEffect } from 'react';
import { UserLayout } from '@/components/layout/user-layout';
import { UserProfile } from '@/components/users/user-profile';
import { User } from '@/lib/types';
import { getCurrentUser } from '@/lib/storage';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  
  // Load current user
  const loadUser = () => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
  };
  
  useEffect(() => {
    loadUser();
  }, []);
  
  if (!user) {
    return (
      <UserLayout>
        <div className="container mx-auto py-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription>
              You must be logged in to view your profile. Please log in and try again.
            </AlertDescription>
          </Alert>
        </div>
      </UserLayout>
    );
  }
  
  return (
    <UserLayout>
      <div className="container mx-auto py-6 space-y-6">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">
          View and manage your personal information and account details
        </p>
        
        <UserProfile user={user} onUpdate={loadUser} />
      </div>
    </UserLayout>
  );
}