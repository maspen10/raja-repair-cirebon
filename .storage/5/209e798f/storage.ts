import { User, Product, Transaction, AppSettings } from '@/lib/types';

// Local storage keys
const STORAGE_KEYS = {
  USERS: 'raja-repair-users',
  PRODUCTS: 'raja-repair-products',
  TRANSACTIONS: 'raja-repair-transactions',
  SETTINGS: 'raja-repair-settings',
  CURRENT_USER: 'raja-repair-current-user'
};

// Default admin account
const defaultAdmin: User = {
  id: '1',
  username: 'admin',
  password: 'admin123', // In real app, this would be hashed
  role: 'admin',
  name: 'Administrator',
  email: 'admin@rajarepair.com',
  createdAt: new Date().toISOString()
};

// Default user account for testing
const defaultUser: User = {
  id: '2',
  username: 'user',
  password: 'user123', // In real app, this would be hashed
  role: 'user',
  name: 'Test User',
  email: 'user@rajarepair.com',
  createdAt: new Date().toISOString()
};

// Default settings
const defaultSettings: AppSettings = {
  storeName: 'Raja Repair Cirebon',
  storeAddress: 'Jl. Contoh No. 123, Cirebon',
  storePhone: '08123456789',
  storeEmail: 'contact@rajarepair.com'
};

// Initialize local storage with default data if empty
export function initializeStorage() {
  // Initialize users
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([defaultAdmin, defaultUser]));
  }

  // Initialize products
  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
  }

  // Initialize transactions
  if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
  }

  // Initialize settings
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
  }
}

// Generic get function for local storage
function getFromStorage<T>(key: string): T[] {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

// Generic set function for local storage
function setToStorage<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// User related functions
export function getUsers(): User[] {
  return getFromStorage<User>(STORAGE_KEYS.USERS);
}

export function addUser(user: User): void {
  const users = getUsers();
  users.push(user);
  setToStorage(STORAGE_KEYS.USERS, users);
}

export function updateUser(updatedUser: User): boolean {
  const users = getUsers();
  const index = users.findIndex(u => u.id === updatedUser.id);
  
  if (index !== -1) {
    users[index] = updatedUser;
    setToStorage(STORAGE_KEYS.USERS, users);
    return true;
  }
  return false;
}

export function deleteUser(userId: string): boolean {
  const users = getUsers();
  const filteredUsers = users.filter(u => u.id !== userId);
  
  if (filteredUsers.length !== users.length) {
    setToStorage(STORAGE_KEYS.USERS, filteredUsers);
    return true;
  }
  return false;
}

// Product related functions
export function getProducts(): Product[] {
  return getFromStorage<Product>(STORAGE_KEYS.PRODUCTS);
}

export function addProduct(product: Product): void {
  const products = getProducts();
  products.push(product);
  setToStorage(STORAGE_KEYS.PRODUCTS, products);
}

export function updateProduct(updatedProduct: Product): boolean {
  const products = getProducts();
  const index = products.findIndex(p => p.id === updatedProduct.id);
  
  if (index !== -1) {
    products[index] = updatedProduct;
    setToStorage(STORAGE_KEYS.PRODUCTS, products);
    return true;
  }
  return false;
}

export function deleteProduct(productId: string): boolean {
  const products = getProducts();
  const filteredProducts = products.filter(p => p.id !== productId);
  
  if (filteredProducts.length !== products.length) {
    setToStorage(STORAGE_KEYS.PRODUCTS, filteredProducts);
    return true;
  }
  return false;
}

// Transaction related functions
export function getTransactions(): Transaction[] {
  return getFromStorage<Transaction>(STORAGE_KEYS.TRANSACTIONS);
}

export function addTransaction(transaction: Transaction): void {
  const transactions = getTransactions();
  transactions.push(transaction);
  setToStorage(STORAGE_KEYS.TRANSACTIONS, transactions);
  
  // Update product stock based on transaction
  updateStockFromTransaction(transaction);
}

function updateStockFromTransaction(transaction: Transaction): void {
  const products = getProducts();
  
  transaction.items.forEach(item => {
    const productIndex = products.findIndex(p => p.id === item.productId);
    if (productIndex !== -1) {
      if (transaction.type === 'in') {
        products[productIndex].stock += item.quantity;
      } else if (transaction.type === 'out') {
        products[productIndex].stock -= item.quantity;
        // Ensure stock doesn't go negative
        if (products[productIndex].stock < 0) products[productIndex].stock = 0;
      }
      products[productIndex].updatedAt = new Date().toISOString();
    }
  });
  
  setToStorage(STORAGE_KEYS.PRODUCTS, products);
}

export function updateTransaction(updatedTransaction: Transaction): boolean {
  const transactions = getTransactions();
  const index = transactions.findIndex(t => t.id === updatedTransaction.id);
  
  if (index !== -1) {
    // Reverse previous transaction effects on stock
    reverseTransactionStockEffects(transactions[index]);
    
    transactions[index] = updatedTransaction;
    setToStorage(STORAGE_KEYS.TRANSACTIONS, transactions);
    
    // Apply new transaction effects on stock
    if (updatedTransaction.status === 'completed') {
      updateStockFromTransaction(updatedTransaction);
    }
    
    return true;
  }
  return false;
}

function reverseTransactionStockEffects(transaction: Transaction): void {
  if (transaction.status !== 'completed') return;
  
  const products = getProducts();
  
  transaction.items.forEach(item => {
    const productIndex = products.findIndex(p => p.id === item.productId);
    if (productIndex !== -1) {
      if (transaction.type === 'in') {
        products[productIndex].stock -= item.quantity;
        // Ensure stock doesn't go negative
        if (products[productIndex].stock < 0) products[productIndex].stock = 0;
      } else if (transaction.type === 'out') {
        products[productIndex].stock += item.quantity;
      }
      products[productIndex].updatedAt = new Date().toISOString();
    }
  });
  
  setToStorage(STORAGE_KEYS.PRODUCTS, products);
}

// Settings related functions
export function getSettings(): AppSettings {
  const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  return data ? JSON.parse(data) : defaultSettings;
}

export function updateSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

// User authentication
export function setCurrentUser(user: User): void {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
}

export function getCurrentUser(): User | null {
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return data ? JSON.parse(data) : null;
}

export function clearCurrentUser(): void {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}

// Login function
export function login(username: string, password: string): User | null {
  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    setCurrentUser(user);
    return user;
  }
  
  return null;
}

// Generate unique ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}