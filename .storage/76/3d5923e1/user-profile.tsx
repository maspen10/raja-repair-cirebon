import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { User } from '@/lib/types';
import { getCurrentUser, updateUser } from '@/lib/storage';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from 'lucide-react';

interface UserProfileProps {
  user: User;
  onUpdate: () => void;
}

export function UserProfile({ user, onUpdate }: UserProfileProps) {
  const [profileData, setProfileData] = useState<User>(user);
  const [isUpdating, setIsUpdating] = useState(false);
  const isAdmin = user.role === 'admin';
  
  // Reset form data when user prop changes
  useEffect(() => {
    setProfileData(user);
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    
    try {
      // Update user information
      updateUser(profileData);
      
      // If the current user is being updated, update the current user in storage
      const currentUser = getCurrentUser();
      if (currentUser && currentUser.id === profileData.id) {
        localStorage.setItem('raja-repair-current-user', JSON.stringify(profileData));
      }
      
      toast.success('Profile updated successfully');
      onUpdate();
    } catch (error) {
      toast.error('Failed to update profile');
      console.error('Error updating profile:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
        <CardDescription>
          View and edit your personal information
        </CardDescription>
      </CardHeader>
      
      <Tabs defaultValue="personal">
        <div className="px-6">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="personal" className="flex-1 sm:flex-none">Personal Info</TabsTrigger>
            <TabsTrigger value="account" className="flex-1 sm:flex-none">Account Details</TabsTrigger>
          </TabsList>
        </div>
        
        <form onSubmit={handleSubmit}>
          <TabsContent value="personal" className="p-0 pt-4">
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={profileData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={profileData.phone || ''}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  name="address"
                  placeholder="Enter your address"
                  rows={3}
                  value={profileData.address || ''}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={profileData.email || ''}
                  onChange={handleChange}
                />
              </div>
              
              {/* CS Code (view-only for users, editable for admins) */}
              <div className="space-y-2">
                <Label htmlFor="csCode" className="flex items-center gap-2">
                  Customer Code <Info className="h-4 w-4 text-muted-foreground" />
                </Label>
                <Input
                  id="csCode"
                  name="csCode"
                  value={profileData.csCode || 'Not assigned'}
                  onChange={handleChange}
                  disabled={!isAdmin}
                />
                {!isAdmin && profileData.csCode && (
                  <Alert variant="outline" className="mt-2">
                    <AlertTitle>About Customer Code</AlertTitle>
                    <AlertDescription>
                      This code is assigned by admin and used to identify you in our system. You can provide this code when contacting customer support.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </TabsContent>
          
          <TabsContent value="account" className="p-0 pt-4">
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    value={profileData.username}
                    onChange={handleChange}
                    required
                    disabled={!isAdmin}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Account Type</Label>
                  <Input
                    id="role"
                    value={profileData.role === 'admin' ? 'Administrator' : 'Regular User'}
                    disabled
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={profileData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Account Info</Label>
                <p className="text-sm text-muted-foreground">
                  Member since: {new Date(profileData.createdAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </TabsContent>
          
          <CardFooter className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <p className="text-sm text-muted-foreground order-2 sm:order-1">
              Last updated: {new Date().toLocaleString()}
            </p>
            <Button 
              type="submit" 
              className="w-full sm:w-auto order-1 sm:order-2"
              disabled={isUpdating}
            >
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </Tabs>
    </Card>
  );
}