import { User, Product, Transaction, AppSettings, ProductCategory, TransactionStatus } from '@/lib/types';

// Local storage keys
const STORAGE_KEYS = {
  USERS: 'raja-repair-users',
  PRODUCT_CATEGORIES: 'raja-repair-categories',
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

// Default categories
const defaultCategories: ProductCategory[] = [
  {
    id: '1',
    name: 'Spareparts',
    description: 'Replacement parts for repairs',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Tools',
    description: 'Tools for repairs and maintenance',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Electronics',
    description: 'Electronic devices and components',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Accessories',
    description: 'Additional accessories for various devices',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

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

  // Initialize categories
  if (!localStorage.getItem(STORAGE_KEYS.PRODUCT_CATEGORIES)) {
    localStorage.setItem(STORAGE_KEYS.PRODUCT_CATEGORIES, JSON.stringify(defaultCategories));
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

// Product Category related functions
export function getCategories(): ProductCategory[] {
  return getFromStorage<ProductCategory>(STORAGE_KEYS.PRODUCT_CATEGORIES);
}

export function addCategory(category: ProductCategory): void {
  const categories = getCategories();
  categories.push(category);
  setToStorage(STORAGE_KEYS.PRODUCT_CATEGORIES, categories);
}

export function updateCategory(updatedCategory: ProductCategory): boolean {
  const categories = getCategories();
  const index = categories.findIndex(c => c.id === updatedCategory.id);
  
  if (index !== -1) {
    categories[index] = updatedCategory;
    setToStorage(STORAGE_KEYS.PRODUCT_CATEGORIES, categories);
    return true;
  }
  return false;
}

export function deleteCategory(categoryId: string): boolean {
  // Check if category is used by any products
  const products = getProducts();
  const categoryUsed = products.some(p => p.categoryId === categoryId);
  
  if (categoryUsed) {
    return false;
  }
  
  const categories = getCategories();
  const filteredCategories = categories.filter(c => c.id !== categoryId);
  
  if (filteredCategories.length !== categories.length) {
    setToStorage(STORAGE_KEYS.PRODUCT_CATEGORIES, filteredCategories);
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

export function addMultipleProducts(newProducts: Product[]): void {
  const products = getProducts();
  const updatedProducts = [...products];
  
  // Process each new product
  newProducts.forEach(newProduct => {
    const existingIndex = products.findIndex(p => p.code === newProduct.code);
    
    if (existingIndex !== -1) {
      // Update existing product
      updatedProducts[existingIndex] = {
        ...updatedProducts[existingIndex],
        name: newProduct.name,
        categoryId: newProduct.categoryId,
        price: newProduct.price,
        stock: newProduct.stock,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Add new product
      updatedProducts.push(newProduct);
    }
  });
  
  setToStorage(STORAGE_KEYS.PRODUCTS, updatedProducts);
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
  
  // Only update product stock if transaction status is 'completed'
  if (transaction.status === 'completed') {
    updateStockFromTransaction(transaction);
  }
}

function updateStockFromTransaction(transaction: Transaction): void {
  if (transaction.status !== 'completed') return;
  
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
    const oldTransaction = transactions[index];
    
    // If status changed from something else to 'completed', update stock
    if (oldTransaction.status !== 'completed' && updatedTransaction.status === 'completed') {
      updateStockFromTransaction(updatedTransaction);
    }
    // If status changed from 'completed' to something else, revert stock changes
    else if (oldTransaction.status === 'completed' && updatedTransaction.status !== 'completed') {
      reverseTransactionStockEffects(oldTransaction);
    }
    
    transactions[index] = updatedTransaction;
    setToStorage(STORAGE_KEYS.TRANSACTIONS, transactions);
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

export function updateTransactionStatus(transactionId: string, status: TransactionStatus): boolean {
  const transactions = getTransactions();
  const index = transactions.findIndex(t => t.id === transactionId);
  
  if (index !== -1) {
    const updatedTransaction = {
      ...transactions[index],
      status,
      updatedAt: new Date().toISOString()
    };
    
    return updateTransaction(updatedTransaction);
  }
  return false;
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

// Export products to CSV string
export function exportProductsToCSV(): string {
  const products = getProducts();
  const categories = getCategories();
  
  // Create a mapping of category IDs to names
  const categoryMap: {[key: string]: string} = {};
  categories.forEach(category => {
    categoryMap[category.id] = category.name;
  });
  
  // CSV header
  let csvContent = "Code,Name,Category,Price,Stock\n";
  
  // Add each product as a row
  products.forEach(product => {
    const categoryName = categoryMap[product.categoryId] || "Unknown";
    const row = [
      product.code,
      `"${product.name.replace(/"/g, '""')}"`, // Escape quotes in name
      `"${categoryName}"`,
      product.price,
      product.stock
    ].join(",");
    csvContent += row + "\n";
  });
  
  return csvContent;
}

// Parse CSV string to product array
export function parseProductsFromCSV(csvData: string, categoryNameToIdMap: {[key: string]: string}): Product[] {
  const lines = csvData.split("\n");
  const products: Product[] = [];
  
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Handle quoted fields properly (especially for names with commas)
    let fields: string[] = [];
    let inQuotes = false;
    let currentField = "";
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(currentField);
        currentField = "";
      } else {
        currentField += char;
      }
    }
    
    // Push the last field
    fields.push(currentField);
    
    if (fields.length >= 5) {
      const [code, name, categoryName, priceStr, stockStr] = fields;
      
      // Get category ID from name
      const categoryId = categoryNameToIdMap[categoryName.replace(/"/g, '')] || defaultCategories[0].id;
      
      const product: Product = {
        id: generateId(),
        code,
        name: name.replace(/"/g, ''), // Remove quotes
        categoryId,
        price: parseFloat(priceStr) || 0,
        stock: parseInt(stockStr) || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      products.push(product);
    }
  }
  
  return products;
}