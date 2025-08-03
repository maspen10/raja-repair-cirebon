import { useState } from 'react';
import { Edit, Search } from 'lucide-react';

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

import { User, UserType } from '@/lib/types';
import { updateUserType } from '@/lib/storage';

interface UserTableProps {
  users: User[];
  onUpdate: () => void;
}

export function UserTable({ users, onUpdate }: UserTableProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserTypeDialogOpen, setIsUserTypeDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<UserType>('regular');
  
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
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedUser(user);
                          setSelectedType(user.type);
                          setIsUserTypeDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit user type</span>
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
    </div>
  );
}