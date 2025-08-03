import { useState, useEffect } from 'react';

import { UserTable } from '@/components/users/user-table';
import { AdminLayout } from '@/components/layout/admin-layout';
import { MainLayout } from '@/components/layout/main-layout';

import { getUsers, getCurrentUser } from '@/lib/storage';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  
  useEffect(() => {
    setUsers(getUsers());
    
    const currentUser = getCurrentUser();
    if (currentUser) {
      setCurrentUserId(currentUser.id);
    }
  }, [refreshKey]);
  
  // Function to force refresh user list
  const refreshUsers = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };
  
  return (
    <MainLayout requiredRole="admin">
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground mt-2">
              Add, edit, and manage user accounts
            </p>
          </div>
          
          <UserTable 
            users={users} 
            onUpdate={refreshUsers} 
            currentUserId={currentUserId}
          />
        </div>
      </AdminLayout>
    </MainLayout>
  );
}