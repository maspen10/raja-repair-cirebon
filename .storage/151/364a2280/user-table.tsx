import { useState } from 'react';
import { Edit, Search, UserPlus, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { User, UserType, UserRole } from '@/lib/types';
import { updateUserType, updateUser, addUser } from '@/lib/storage';

interface UserTableProps {
  users: User[];
  onUpdate: () => void;
}

// User form schema
const userFormSchema = z.object({
  id: z.string().optional(),
  username: z.string().min(3, { message: "Username must be at least 3 characters." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }).optional(),
  name: z.string().min(1, { message: "Name is required." }),
  email: z.string().email({ message: "Invalid email address." }).optional().nullable(),
  role: z.enum(["user", "admin"]),
  type: z.enum(["regular", "vip"]),
  csCode: z.string().optional().nullable(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

export function UserTable({ users, onUpdate }: UserTableProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserTypeDialogOpen, setIsUserTypeDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<UserType>('regular');
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  
  // Form for add/edit user
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: '',
      name: '',
      email: '',
      role: 'user',
      type: 'regular',
      csCode: '',
    }
  });
  
  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.csCode && user.csCode.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });
  
  // Update user type
  const handleUpdateUserType = () => {
    if (selectedUser && selectedType) {
      const success = updateUserType(selectedUser.id, selectedType);
      
      if (success) {
        toast({
          title: 'User type updated',
          description: `${selectedUser.name} is now a ${selectedType === 'vip' ? 'VIP' : 'Regular'} user.`,
        });
        onUpdate();
        setIsUserTypeDialogOpen(false);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to update user type.',
        });
      }
    }
  };

  // Open add user form
  const openAddUserForm = () => {
    setFormMode('add');
    form.reset({
      username: '',
      password: '',
      name: '',
      email: '',
      role: 'user',
      type: 'regular',
      csCode: '',
    });
    setIsUserFormOpen(true);
  };

  // Open edit user form
  const openEditUserForm = (user: User) => {
    setFormMode('edit');
    form.reset({
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email || '',
      role: user.role,
      type: user.type,
      csCode: user.csCode || '',
    });
    setIsUserFormOpen(true);
  };
  
  // Submit user form
  const onSubmitUserForm = (values: UserFormValues) => {
    if (formMode === 'add') {
      // Generate a random ID for the new user
      const newUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      if (!values.password) {
        toast({
          variant: 'destructive',
          title: 'Password required',
          description: 'Please provide a password for the new user.',
        });
        return;
      }
      
      // Add new user
      const success = addUser({
        id: newUserId,
        username: values.username,
        password: values.password,
        name: values.name,
        email: values.email || null,
        role: values.role as UserRole,
        type: values.type as UserType,
        csCode: values.csCode || null,
      });
      
      if (success) {
        toast({
          title: 'User added',
          description: `${values.name} has been added successfully.`,
        });
        onUpdate();
        setIsUserFormOpen(false);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to add user. Username might already exist.',
        });
      }
    } else {
      // Edit existing user
      if (!values.id) return;
      
      // Update user
      const success = updateUser({
        id: values.id,
        username: values.username,
        password: values.password, // Will be ignored if empty
        name: values.name,
        email: values.email || null,
        role: values.role as UserRole,
        type: values.type as UserType,
        csCode: values.csCode || null,
      });
      
      if (success) {
        toast({
          title: 'User updated',
          description: `${values.name}'s information has been updated.`,
        });
        onUpdate();
        setIsUserFormOpen(false);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to update user. Username might already exist.',
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-[300px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={openAddUserForm}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {filteredUsers.length === 0 ? (
        <Alert>
          <AlertTitle>No users found</AlertTitle>
          <AlertDescription>
            No users match your search criteria. Try using different keywords.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>CS Code</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? "default" : "outline"}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.type === 'vip' ? "secondary" : "outline"} className={user.type === 'vip' ? "bg-amber-500 hover:bg-amber-500/80" : ""}>
                      {user.type === 'vip' ? 'VIP' : 'Regular'}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.email || '-'}</TableCell>
                  <TableCell>{user.csCode || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditUserForm(user)}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit user</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* User Type Update Dialog */}
      <Dialog open={isUserTypeDialogOpen} onOpenChange={setIsUserTypeDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update User Type</DialogTitle>
            <DialogDescription>
              Change user type between Regular and VIP for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <RadioGroup value={selectedType} onValueChange={(value) => setSelectedType(value as UserType)} className="gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="regular" id="regular" />
                <Label htmlFor="regular">Regular User</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="vip" id="vip" />
                <Label htmlFor="vip">VIP User</Label>
              </div>
            </RadioGroup>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserTypeDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateUserType}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit User Dialog */}
      <Dialog open={isUserFormOpen} onOpenChange={setIsUserFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{formMode === 'add' ? 'Add New User' : 'Edit User'}</DialogTitle>
            <DialogDescription>
              {formMode === 'add' 
                ? 'Fill in the details to create a new user account.' 
                : 'Update user account details.'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitUserForm)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username*</FormLabel>
                      <FormControl>
                        <Input placeholder="johndoe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{formMode === 'add' ? 'Password*' : 'Password (leave blank to keep current)'}</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="john@example.com" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="csCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CS Code</FormLabel>
                      <FormControl>
                        <Input placeholder="CS1234" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>User Role</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="user" id="role-user" />
                            <Label htmlFor="role-user">Regular User</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="admin" id="role-admin" />
                            <Label htmlFor="role-admin">Admin</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Membership Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="regular" id="type-regular" />
                            <Label htmlFor="type-regular">Regular</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="vip" id="type-vip" />
                            <Label htmlFor="type-vip">VIP</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {formMode === 'add' && (
                <Alert variant="warning">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Important</AlertTitle>
                  <AlertDescription>
                    New users will need this login information to access the system.
                  </AlertDescription>
                </Alert>
              )}
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsUserFormOpen(false)}>Cancel</Button>
                <Button type="submit">{formMode === 'add' ? 'Create User' : 'Save Changes'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}