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

export type DeliveryMethod = 'pickup' | 'shipping';

export type TransactionStatus = 'pending' | 'payment_confirmed' | 'completed' | 'cancelled';

export interface Transaction {
  id: string;
  type: TransactionType;
  items: TransactionItem[];
  totalAmount: number;
  userId: string;
  status: TransactionStatus;
  notes?: string;
  deliveryMethod?: DeliveryMethod;
  deliveryAddress?: string;
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