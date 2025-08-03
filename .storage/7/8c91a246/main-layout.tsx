import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '@/lib/storage';

interface MainLayoutProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'user';
}

export function MainLayout({ children, requiredRole }: MainLayoutProps) {
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = getCurrentUser();

    // If not logged in, redirect to login
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // If role is required and user doesn't have that role
    if (requiredRole && currentUser.role !== requiredRole) {
      // Redirect admin to admin dashboard, user to user dashboard
      if (currentUser.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/user/dashboard');
      }
    }
  }, [navigate, requiredRole]);

  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}