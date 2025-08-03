// Type definitions for Raja Repair Cirebon website

// User types
export type UserRole = 'admin' | 'user';
export type UserType = 'regular' | 'vip';

export interface User {
  id: string;
  username: string;
  password: string; // In a real application, this would be hashed
  role: UserRole;
  type: UserType; // Regular or VIP user
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  csCode?: string; // Customer service code, only editable by admin
  createdAt: string;
}

// Product category types
export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Product types
export type ProductCategoryType = 'sparepart' | 'tool' | 'accessory' | 'electronic' | 'other';

export interface Product {
  id: string;
  code: string;
  name: string;
  categoryId: string; // Reference to ProductCategory
  price: number;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

// Transaction types
export type TransactionType = 'in' | 'out';

export interface TransactionItem {
  productId: string;
  quantity: number;
  priceAtTransaction: number;
}

export interface DeliveryMethod {
  id: string;
  name: string;
  description?: string;
  cost: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TransactionStatus = 
  'pending' | 
  'payment_confirmed' | 
  'processing' |
  'ready_for_pickup' |
  'shipping' |
  'completed' | 
  'cancelled';

export interface PaymentMethod {
  id: string;
  name: string;
  accountNumber?: string;
  accountName?: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  items: TransactionItem[];
  totalAmount: number;
  userId: string;
  status: TransactionStatus;
  notes?: string;
  deliveryMethodId?: string;
  deliveryAddress?: string;
  paymentMethodId?: string;
  paymentProof?: string; // URL to payment proof image
  createdAt: string;
  updatedAt: string;
}

// Application settings
export interface AppSettings {
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  storeLogo?: string;
  storeEmail?: string;
  taxRate?: number;
}