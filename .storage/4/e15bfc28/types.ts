// Type definitions for Raja Repair Cirebon website

// User types
export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  password: string; // In a real application, this would be hashed
  role: UserRole;
  name: string;
  email?: string;
  createdAt: string;
}

// Product types
export type ProductCategory = 'sparepart' | 'tool' | 'accessory' | 'electronic' | 'other';

export interface Product {
  id: string;
  code: string;
  name: string;
  category: ProductCategory;
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

export interface Transaction {
  id: string;
  type: TransactionType;
  items: TransactionItem[];
  totalAmount: number;
  userId: string;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
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