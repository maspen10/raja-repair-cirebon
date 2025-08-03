import { useEffect, useState } from 'react';
import { User } from '@/lib/types';
import { getUsers } from '@/lib/storage';
import { UserTable } from '@/components/users/user-table';
import { AdminLayout } from '@/components/layout/admin-layout';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  
  const loadUsers = () => {
    setUsers(getUsers());
  };
  
  useEffect(() => {
    loadUsers();
  }, []);
  
  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground">
            Manage user accounts and set VIP status
          </p>
        </div>
        
        <UserTable users={users} onUpdate={loadUsers} />
      </div>
    </AdminLayout>
  );
}