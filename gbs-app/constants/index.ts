// Application constants

export const APP_CONFIG = {
  name: 'GBS Construction ERP',
  version: '1.0.0',
  description: 'Construction Management System',
} as const;

export const API_ENDPOINTS = {
  projects: '/api/projects',
  employees: '/api/employees',
  inventory: '/api/inventory',
  financial: '/api/financial',
  reports: '/api/reports',
  auth: '/api/auth',
} as const;

export const PROJECT_STATUSES = {
  planning: 'Planning',
  active: 'Active',
  completed: 'Completed',
  on_hold: 'On Hold',
} as const;

export const EMPLOYEE_ROLES = {
  admin: 'Administrator',
  manager: 'Project Manager',
  supervisor: 'Supervisor',
  worker: 'Worker',
} as const;

export const FINANCIAL_CATEGORIES = {
  materials: 'Materials',
  labor: 'Labor',
  equipment: 'Equipment',
  subcontractors: 'Subcontractors',
  permits: 'Permits',
  insurance: 'Insurance',
  utilities: 'Utilities',
  other: 'Other',
} as const;
