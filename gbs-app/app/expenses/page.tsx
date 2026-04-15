'use client';

import { useState, useEffect } from 'react';
import ThemeToggle from '@/components/ThemeToggle';

interface Expense {
  id: number;
  item_name: string;
  amount: number;
  category: string;
  date: string;
  project_id: number;
  created_at: string;
  projects: {
    id: number;
    name: string;
    location: string | null;
  };
}

interface Project {
  id: number;
  name: string;
  location: string | null;
  status: string;
  created_at: string;
}

const EXPENSE_CATEGORIES = ['Material', 'Labor', 'Transport', 'Food', 'Other'];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    item_name: '',
    amount: '',
    category: 'Material',
    date: new Date().toISOString().split('T')[0],
    project_id: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchExpenses(selectedProject);
      setFormData(prev => ({ ...prev, project_id: selectedProject.toString() }));
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      setProjects(data);
      if (data.length > 0 && !selectedProject) {
        setSelectedProject(data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenses = async (projectId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/expenses?project_id=${projectId}`);
      if (!response.ok) throw new Error('Failed to fetch expenses');
      const data = await response.json();
      setExpenses(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.item_name || !formData.amount || !formData.category || !formData.date || !formData.project_id) {
      setMessage({ type: 'error', text: 'Please fill all required fields' });
      return;
    }

    try {
      setFormLoading(true);
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          project_id: parseInt(formData.project_id)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create expense');
      }

      const result = await response.json();
      setMessage({ type: 'success', text: 'Expense created successfully!' });
      
      // Reset form
      setFormData({
        item_name: '',
        amount: '',
        category: 'Material',
        date: new Date().toISOString().split('T')[0],
        project_id: selectedProject?.toString() || ''
      });

      // Refresh expenses list
      if (selectedProject) {
        fetchExpenses(selectedProject);
      }

    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to create expense' });
    } finally {
      setFormLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleDelete = async (expenseId: number) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      const response = await fetch(`/api/expenses?id=${expenseId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete expense');

      setMessage({ type: 'success', text: 'Expense deleted successfully!' });
      
      // Refresh expenses list
      if (selectedProject) {
        fetchExpenses(selectedProject);
      }

    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to delete expense' });
    } finally {
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const totalExpense = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-LK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Expenses Management</h1>
            <p className="text-gray-400 mt-1">Track and manage project expenses</p>
          </div>
          <ThemeToggle />
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-900/50 border border-green-700 text-green-300' 
              : 'bg-red-900/50 border border-red-700 text-red-300'
          }`}>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                {message.type === 'success' ? (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L9.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                )}
              </svg>
              {message.text}
            </div>
          </div>
        )}

        {/* Project Selector */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Project
          </label>
          <select
            value={selectedProject || ''}
            onChange={(e) => setSelectedProject(parseInt(e.target.value))}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} {project.location && `(${project.location})`}
              </option>
            ))}
          </select>
        </div>

        {selectedProject && (
          <>
            {/* Summary Card */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Total Expense</h3>
                  <p className="text-gray-400">For selected project</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-blue-400">{formatCurrency(totalExpense)}</p>
                  <p className="text-sm text-gray-400">{expenses.length} expenses</p>
                </div>
              </div>
            </div>

            {/* Add Expense Form */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-white mb-6">Add New Expense</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Item Name
                    </label>
                    <input
                      type="text"
                      value={formData.item_name}
                      onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Cement Bags"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Amount (LKR)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="15000.00"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      {EXPENSE_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Project
                    </label>
                    <select
                      value={formData.project_id}
                      onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select Project</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={formLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      {formLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin"></div>
                          <span className="ml-2">Adding...</span>
                        </div>
                      ) : (
                        'Add Expense'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Expenses Table */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
              <div className="p-6 border-b border-slate-700">
                <h2 className="text-xl font-semibold text-white">Expenses List</h2>
              </div>
              
              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-gray-400 mt-4">Loading expenses...</p>
                </div>
              ) : expenses.length === 0 ? (
                <div className="p-8 text-center">
                  <svg className="w-12 h-12 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-400">No expenses found for this project</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Item Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {expenses.map((expense) => (
                        <tr key={expense.id} className="hover:bg-slate-700/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                            {expense.item_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              expense.category === 'Material' ? 'bg-blue-900/50 text-blue-300' :
                              expense.category === 'Labor' ? 'bg-green-900/50 text-green-300' :
                              expense.category === 'Transport' ? 'bg-yellow-900/50 text-yellow-300' :
                              expense.category === 'Food' ? 'bg-purple-900/50 text-purple-300' :
                              'bg-gray-900/50 text-gray-300'
                            }`}>
                              {expense.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                            {formatCurrency(expense.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {formatDate(expense.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => handleDelete(expense.id)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
