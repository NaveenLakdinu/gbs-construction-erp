'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import ThemeToggle from '@/components/ThemeToggle';

interface Project {
  id: number;
  name: string;
  location: string | null;
  status: string;
  created_at: string;
}

interface Expense {
  id: number;
  item_name: string;
  amount: number;
  category: string;
  date: string;
  project_id: number;
  created_at: string;
}

interface Worker {
  id: number;
  name: string;
  nic: string;
  phone: string;
  daily_rate: number;
  project_id: number;
  created_at: string;
}

interface Attendance {
  id: number;
  date: string;
  status: string;
  worker_id: number;
  project_id: number;
  created_at: string;
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const projectId = params.id;
  
  const [project, setProject] = useState<Project | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch project details
      const projectResponse = await fetch(`/api/projects/${projectId}`);
      if (!projectResponse.ok) {
        throw new Error('Failed to fetch project details');
      }
      const projectData = await projectResponse.json();
      setProject(projectData);

      // Fetch project expenses
      const expensesResponse = await fetch(`/api/expenses?project_id=${projectId}`);
      if (!expensesResponse.ok) {
        throw new Error('Failed to fetch expenses');
      }
      const expensesData = await expensesResponse.json();
      setExpenses(expensesData.data || []);

      // Fetch workers for this project
      const workersResponse = await fetch(`/api/workers?project_id=${projectId}`);
      if (!workersResponse.ok) {
        throw new Error('Failed to fetch workers');
      }
      const workersData = await workersResponse.json();
      setWorkers(workersData || []);

      // Fetch attendance for this project
      const attendanceResponse = await fetch(`/api/attendance?project_id=${projectId}`);
      if (!attendanceResponse.ok) {
        throw new Error('Failed to fetch attendance');
      }
      const attendanceData = await attendanceResponse.json();
      setAttendance(attendanceData || []);

    } catch (err) {
      console.error('Error fetching project data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate total expenses
  const totalExpensesAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Calculate total salary costs from attendance
  const calculateTotalSalaryCost = () => {
    let totalSalary = 0;
    
    attendance.forEach((attendanceRecord) => {
      // Find the worker for this attendance record
      const worker = workers.find(w => w.id === attendanceRecord.worker_id);
      if (worker) {
        let daysWorked = 0;
        
        // Calculate days worked based on attendance status
        switch (attendanceRecord.status) {
          case 'Present':
            daysWorked = 1;
            break;
          case 'Half Day':
            daysWorked = 0.5;
            break;
          case 'Absent':
            daysWorked = 0;
            break;
          default:
            daysWorked = 0;
        }
        
        // Add to total salary
        totalSalary += worker.daily_rate * daysWorked;
      }
    });
    
    return totalSalary;
  };
  
  const totalSalaryCost = calculateTotalSalaryCost();
  const totalSpent = totalExpensesAmount + totalSalaryCost;
  const totalBudget = 1000000; // Default budget - you can make this dynamic
  const remainingBalance = totalBudget - totalSpent;

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ongoing':
        return 'bg-green-600';
      case 'Completed':
        return 'bg-blue-600';
      case 'Planning':
        return 'bg-yellow-600';
      case 'Paused':
        return 'bg-gray-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Materials':
        return 'bg-blue-900/50 text-blue-300';
      case 'Labor':
        return 'bg-green-900/50 text-green-300';
      case 'Transport':
        return 'bg-yellow-900/50 text-yellow-300';
      case 'Food':
        return 'bg-purple-900/50 text-purple-300';
      case 'Others':
        return 'bg-gray-900/50 text-gray-300';
      default:
        return 'bg-gray-900/50 text-gray-300';
    }
  };

  const handleBack = () => {
    router.push('/projects');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="ml-4 text-gray-400">Loading project data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <p className="text-red-400 mb-4">Error: {error || 'Project not found'}</p>
              <button
                onClick={handleBack}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Back to Projects
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <button
              onClick={handleBack}
              className="mr-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">{project.name}</h1>
              <p className="text-gray-400 mt-1">Project Dashboard - {project.location || 'No location specified'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
              {project.status}
            </span>
            <ThemeToggle />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Budget</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(totalBudget)}</p>
              </div>
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Spent</p>
                <p className="text-2xl font-bold text-orange-400">{formatCurrency(totalSpent)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Expenses: {formatCurrency(totalExpensesAmount)} + Salaries: {formatCurrency(totalSalaryCost)}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-600/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Remaining Balance</p>
                <p className={`text-2xl font-bold ${remainingBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(remainingBalance)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Expenses Table */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-xl font-semibold text-white">Recent Expenses</h2>
            <p className="text-gray-400 mt-1">All expenses for this project</p>
          </div>
          
          {expenses.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="w-12 h-12 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-400">No expenses recorded for this project yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {formatDate(expense.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {expense.item_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(expense.category)}`}>
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                        {formatCurrency(expense.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Project Info */}
        <div className="mt-8 bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Project Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-400 mb-2">Project Name</p>
              <p className="text-white">{project.name}</p>
            </div>
            <div>
              <p className="text-gray-400 mb-2">Location</p>
              <p className="text-white">{project.location || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-gray-400 mb-2">Status</p>
              <p className="text-white">{project.status}</p>
            </div>
            <div>
              <p className="text-gray-400 mb-2">Created Date</p>
              <p className="text-white">{formatDate(project.created_at)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
