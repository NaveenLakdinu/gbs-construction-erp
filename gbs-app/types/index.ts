// Global type definitions for GBS Construction ERP

export interface Project {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  status: 'planning' | 'active' | 'completed' | 'on_hold';
  budget: number;
  clientId: string;
  managerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'admin' | 'manager' | 'supervisor' | 'worker';
  department: string;
  salary?: number;
  hireDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  location?: string;
  supplier?: string;
  minStockLevel: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FinancialRecord {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  projectId?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}
