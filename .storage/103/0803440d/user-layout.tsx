import { ReactNode, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  ClipboardList, 
  LogOut,
  Menu,
  X,
  User
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { clearCurrentUser, getSettings } from '@/lib/storage';
import { cn } from '@/lib/utils';

interface UserLayoutProps {
  children: ReactNode;
}

export function UserLayout({ children }: UserLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const settings = getSettings();

  const menuItems = [
    { name: 'Dashboard', path: '/user/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { name: 'Products', path: '/user/products', icon: <Package className="h-5 w-5" /> },
    { name: 'Order', path: '/user/order', icon: <ShoppingCart className="h-5 w-5" /> },
    { name: 'Transaction History', path: '/user/history', icon: <ClipboardList className="h-5 w-5" /> },
    { name: 'My Profile', path: '/user/profile', icon: <User className="h-5 w-5" /> },
  ];

  const handleLogout = () => {
    clearCurrentUser();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar for larger screens */}
      <aside className="hidden lg:flex w-64 flex-col bg-muted fixed inset-y-0">
        <div className="px-4 py-6 border-b">
          <h2 className="text-xl font-bold truncate">{settings.storeName}</h2>
          <p className="text-sm text-muted-foreground">User Portal</p>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center px-4 py-2 rounded-md text-sm transition-colors",
                location.pathname === item.path
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              )}
            >
              {item.icon}
              <span className="ml-3">{item.name}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-start" 
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" /> Log Out
          </Button>
        </div>
      </aside>

      {/* Mobile menu */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden fixed top-4 left-4 z-10">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="lg:hidden p-0">
          <div className="px-4 py-6 border-b">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold truncate">{settings.storeName}</h2>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">User Portal</p>
          </div>
          <nav className="flex-1 px-2 py-4 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center px-4 py-2 rounded-md text-sm transition-colors",
                  location.pathname === item.path
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                )}
                onClick={() => setOpen(false)}
              >
                {item.icon}
                <span className="ml-3">{item.name}</span>
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t">
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-start" 
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" /> Log Out
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <main className="lg:ml-64 flex-1 overflow-auto">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}