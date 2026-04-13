// Utility functions

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
  }).format(amount);
};

export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-LK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const calculateProjectProgress = (
  startDate: Date,
  endDate?: Date,
  currentDate: Date = new Date()
): number => {
  if (!endDate) return 0;
  
  const totalDays = Math.abs(endDate.getTime() - startDate.getTime());
  const elapsedDays = Math.abs(currentDate.getTime() - startDate.getTime());
  
  return Math.min(Math.round((elapsedDays / totalDays) * 100), 100);
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^(\+94|0)?[1-9]\d{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};
