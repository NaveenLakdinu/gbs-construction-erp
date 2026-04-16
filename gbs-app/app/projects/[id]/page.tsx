'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, use } from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import WorkerSearchSelect from '@/components/WorkerSearchSelect';
import AddWorkerModal from '@/components/AddWorkerModal';
import { Wallet, DollarSign, TrendingUp, AlertCircle, Calendar, Receipt, Users, X } from 'lucide-react';

interface Project {
  id: number;
  name: string;
  location: string | null;
  status: string;
  budget: number;
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
  workType: string;
  note: string | null;
  worker_id: number;
  project_id: number;
  created_at: string;
}

interface WorkerTransaction {
  id: number;
  workerId: number;
  projectId: number | null;
  amount: number;
  type: string;
  date: string;
  note: string | null;
  created_at: string;
}

type TabType = 'overview' | 'attendance' | 'expenses' | 'financials';

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: projectId } = use(params);
  
  const [project, setProject] = useState<Project | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [transactions, setTransactions] = useState<WorkerTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Form states
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    item_name: '',
    amount: '',
    category: 'Materials',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch project
      const projectsResponse = await fetch('/api/projects');
      if (!projectsResponse.ok) {
        throw new Error('Failed to fetch projects');
      }
      const allProjects = await projectsResponse.json();
      const projectData = allProjects.find((p: any) => p.id === parseInt(projectId));
      
      if (!projectData) {
        throw new Error('Project not found');
      }
      setProject(projectData);

      // Fetch all data in parallel
      const [expensesResponse, workersResponse, attendanceResponse, transactionsResponse] = await Promise.all([
        fetch(`/api/expenses?project_id=${projectId}`),
        fetch(`/api/workers`), // Fetch all workers from central table
        fetch(`/api/attendance?project_id=${projectId}`),
        fetch(`/api/worker-transactions?project_id=${projectId}`)
      ]);

      if (expensesResponse.ok) {
        const expensesData = await expensesResponse.json();
        setExpenses(expensesData.data || []);
      }

      if (workersResponse.ok) {
        const workersData = await workersResponse.json();
        setWorkers(workersData || []);
      }

      if (attendanceResponse.ok) {
        const attendanceData = await attendanceResponse.json();
        setAttendance(attendanceData || []);
      }

      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        setTransactions(transactionsData || []);
      }

    } catch (err) {
      console.error('Error fetching project data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals with proper number conversion
  const totalExpensesAmount = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  
  const calculateTotalSalaryCost = () => {
    let totalSalary = 0;
    
    attendance.forEach((attendanceRecord) => {
      const worker = workers.find(w => w.id === attendanceRecord.worker_id);
      if (worker) {
        let daysWorked = 0;
        
        // Calculate based on workType
        switch (attendanceRecord.workType) {
          case 'Full':
            daysWorked = 1;
            break;
          case 'Half':
            daysWorked = 0.5;
            break;
          default:
            daysWorked = 0;
        }
        
        // Ensure daily_rate is converted to number
        totalSalary += Number(worker.daily_rate) * daysWorked;
      }
    });
    
    return totalSalary;
  };
  
  const totalSalaryCost = calculateTotalSalaryCost();
  const totalAdvances = transactions
    .filter(t => t.type === 'Advance')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalDeductions = transactions
    .filter(t => t.type === 'Deduction')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalBonuses = transactions
    .filter(t => t.type === 'Bonus')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  // Ensure all amounts are properly converted to numbers
  const validatedExpensesAmount = isNaN(totalExpensesAmount) ? 0 : totalExpensesAmount;
  const validatedSalaryCost = isNaN(totalSalaryCost) ? 0 : totalSalaryCost;
  const validatedAdvances = isNaN(totalAdvances) ? 0 : totalAdvances;
  const validatedDeductions = isNaN(totalDeductions) ? 0 : totalDeductions;
  const validatedBonuses = isNaN(totalBonuses) ? 0 : totalBonuses;
  
  // Fix totalSpent calculation - should be expenses + salary cost
  const totalSpent = validatedExpensesAmount + validatedSalaryCost;
  
  const totalBudget = project?.budget ? parseFloat(project.budget.toString()) : 0;
  const remainingBalance = totalBudget - totalSpent;
  
  // Calculate budget usage percentage
  const budgetUsagePercentage = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
  const isOverBudget = totalBudget > 0 && totalSpent > totalBudget;

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

  // Handle attendance submission
  const handleAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const attendanceData = {
      worker_id: parseInt(formData.get('worker_id') as string),
      project_id: parseInt(projectId),
      date: formData.get('date') as string,
      status: formData.get('status') as string,
      workType: formData.get('workType') as string,
      note: formData.get('note') as string
    };

    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(attendanceData),
      });

      if (response.ok) {
        // Reset form
        setAttendanceDate(new Date().toISOString().split('T')[0]);
        setSelectedWorker(null);
        const form = e.target as HTMLFormElement;
        if (form) {
          form.reset();
        }
        
        // Refresh attendance data
        const attendanceResponse = await fetch(`/api/attendance?project_id=${projectId}`);
        if (attendanceResponse.ok) {
          const attendanceData = await attendanceResponse.json();
          setAttendance(attendanceData || []);
        }
      }
    } catch (error) {
      console.error('Failed to add attendance:', error);
    }
  };

  // Handle expense submission
  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const expenseData = {
      item_name: expenseForm.item_name,
      amount: parseFloat(expenseForm.amount),
      category: expenseForm.category,
      date: expenseForm.date,
      project_id: parseInt(projectId)
    };

    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
      });

      if (response.ok) {
        // Reset form
        setExpenseForm({
          item_name: '',
          amount: '',
          category: 'Materials',
          date: new Date().toISOString().split('T')[0]
        });
        
        // Refresh expenses data
        const expensesResponse = await fetch(`/api/expenses?project_id=${projectId}`);
        if (expensesResponse.ok) {
          const expensesData = await expensesResponse.json();
          setExpenses(expensesData.data || []);
        }
      }
    } catch (error) {
      console.error('Failed to add expense:', error);
    }
  };

  const handleWorkerAdded = async (newWorker: Worker) => {
    // Refresh workers list
    try {
      const workersResponse = await fetch('/api/workers');
      if (workersResponse.ok) {
        const workersData = await workersResponse.json();
        setWorkers(workersData || []);
      }
    } catch (error) {
      console.error('Failed to refresh workers:', error);
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
              <X className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">{project.name}</h1>
              <p className="text-gray-400 mt-1">Project Command Center - {project.location || 'No location specified'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
              {project.status}
            </span>
            <ThemeToggle />
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-700 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: <Wallet className="w-4 h-4" /> },
              { id: 'attendance', label: 'Attendance', icon: <Calendar className="w-4 h-4" /> },
              { id: 'expenses', label: 'Expenses', icon: <Receipt className="w-4 h-4" /> },
              { id: 'financials', label: 'Financials', icon: <TrendingUp className="w-4 h-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Total Budget</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(totalBudget)}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-blue-400" />
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
                    <DollarSign className="w-6 h-6 text-orange-400" />
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
                  <div className={`w-12 h-12 ${remainingBalance >= 0 ? 'bg-green-600/20' : 'bg-red-600/20'} rounded-lg flex items-center justify-center`}>
                    {remainingBalance >= 0 ? (
                      <TrendingUp className="w-6 h-6 text-green-400" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-red-400" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Budget Progress Bar */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Budget Usage</h3>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${isOverBudget ? 'text-red-400' : 'text-gray-400'}`}>
                    {budgetUsagePercentage.toFixed(1)}% Used
                  </span>
                  {isOverBudget && (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  )}
                </div>
              </div>
              
              <div className="relative">
                <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                      isOverBudget 
                        ? 'bg-red-500' 
                        : budgetUsagePercentage > 80 
                          ? 'bg-yellow-500' 
                          : 'bg-green-500'
                    }`}
                    style={{ width: `${budgetUsagePercentage}%` }}
                  />
                </div>
                
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-gray-400">0%</span>
                  <span className="text-xs text-gray-400">25%</span>
                  <span className="text-xs text-gray-400">50%</span>
                  <span className="text-xs text-gray-400">75%</span>
                  <span className="text-xs text-gray-400">100%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="space-y-8">
            {/* Expense Form */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Add Expense</h3>
              <form onSubmit={handleExpenseSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Item Name</label>
                    <input
                      type="text"
                      value={expenseForm.item_name}
                      onChange={(e) => setExpenseForm({...expenseForm, item_name: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter item name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Amount (LKR)</label>
                    <input
                      type="number"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                    <select
                      value={expenseForm.category}
                      onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Materials">Materials</option>
                      <option value="Labor">Labor</option>
                      <option value="Transport">Transport</option>
                      <option value="Food">Food</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                    <input
                      type="date"
                      value={expenseForm.date}
                      onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
                  >
                    Add Expense
                  </button>
                </div>
              </form>
            </div>

            {/* Recent Expenses */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
              <div className="p-6 border-b border-slate-700">
                <h3 className="text-xl font-semibold text-white">Recent Expenses</h3>
                <p className="text-gray-400 mt-1">All expenses for this project</p>
              </div>
              
              {expenses.length === 0 ? (
                <div className="p-8 text-center">
                  <Receipt className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No expenses recorded for this project yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Item</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Amount</th>
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
          </div>
        )}

        {activeTab === 'financials' && (
          <div className="space-y-8">
            {/* Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Salary Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Days Worked:</span>
                    <span className="text-white font-medium">
                      {attendance.filter(a => a.status === 'Present').reduce((sum, a) => {
                        return sum + (a.workType === 'Full' ? 1 : 0.5);
                      }, 0)} days
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Salary Cost:</span>
                    <span className="text-white font-medium">{formatCurrency(totalSalaryCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Advances:</span>
                    <span className="text-red-400 font-medium">{formatCurrency(totalAdvances)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Deductions:</span>
                    <span className="text-red-400 font-medium">{formatCurrency(totalDeductions)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Bonuses:</span>
                    <span className="text-green-400 font-medium">{formatCurrency(totalBonuses)}</span>
                  </div>
                  <div className="border-t border-slate-600 pt-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-semibold">Balance to Pay:</span>
                      <span className={`font-bold text-lg ${
                        (totalSalaryCost - totalAdvances - totalDeductions + totalBonuses) >= 0
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}>
                        {formatCurrency(totalSalaryCost - totalAdvances - totalDeductions + totalBonuses)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Worker Balances</h3>
                <div className="space-y-3">
                  {workers.map((worker) => {
                    const workerAttendance = attendance.filter(a => a.worker_id === worker.id);
                    const workerTransactions = transactions.filter(t => t.workerId === worker.id);
                    
                    const totalDays = workerAttendance.reduce((sum, a) => {
                      return sum + (a.workType === 'Full' ? 1 : 0.5);
                    }, 0);
                    
                    const totalEarned = totalDays * Number(worker.daily_rate);
                    const totalWorkerAdvances = workerTransactions
                      .filter(t => t.type === 'Advance')
                      .reduce((sum, t) => sum + Number(t.amount), 0);
                    const totalWorkerDeductions = workerTransactions
                      .filter(t => t.type === 'Deduction')
                      .reduce((sum, t) => sum + Number(t.amount), 0);
                    const totalWorkerBonuses = workerTransactions
                      .filter(t => t.type === 'Bonus')
                      .reduce((sum, t) => sum + Number(t.amount), 0);
                    
                    const balance = totalEarned - totalWorkerAdvances - totalWorkerDeductions + totalWorkerBonuses;
                    
                    return (
                      <div key={worker.id} className="border border-slate-600 rounded p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-white font-medium">{worker.name}</p>
                            <p className="text-xs text-gray-400">{worker.nic}</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${
                              balance >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {formatCurrency(balance)}
                            </p>
                            <p className="text-xs text-gray-400">
                              Earned: {formatCurrency(totalEarned)} | 
                              Advances: {formatCurrency(totalWorkerAdvances)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="space-y-8">
            {/* Attendance Form */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Mark Attendance</h3>
              <form onSubmit={handleAttendanceSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                    <input
                      type="date"
                      name="date"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Worker</label>
                    <WorkerSearchSelect
                      workers={workers}
                      selectedWorker={selectedWorker}
                      onWorkerSelect={setSelectedWorker}
                      onAddNewWorker={() => setIsWorkerModalOpen(true)}
                    />
                    <input
                      type="hidden"
                      name="worker_id"
                      value={selectedWorker?.id || ''}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                    <select
                      name="status"
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                      <option value="Half Day">Half Day</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Work Type</label>
                    <select
                      name="workType"
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="Full">Full Day</option>
                      <option value="Half">Half Day</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Daily Note</label>
                  <input
                    type="text"
                    name="note"
                    placeholder="Add note for this attendance record..."
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
                  >
                    Mark Attendance
                  </button>
                </div>
              </form>
            </div>

            {/* Recent Attendance */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
              <div className="p-6 border-b border-slate-700">
                <h3 className="text-xl font-semibold text-white">Recent Attendance</h3>
                <p className="text-gray-400 mt-1">Attendance records for this project</p>
              </div>
              
              {attendance.length === 0 ? (
                <div className="p-8 text-center">
                  <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No attendance records for this project yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Worker</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Work Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {attendance.map((record) => (
                        <tr key={record.id} className="hover:bg-slate-700/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {formatDate(record.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                            {workers.find(w => w.id === record.worker_id)?.name || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              record.status === 'Present' ? 'bg-green-900/50 text-green-300' :
                              record.status === 'Absent' ? 'bg-red-900/50 text-red-300' :
                              'bg-yellow-900/50 text-yellow-300'
                            }`}>
                              {record.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                            {record.workType}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {record.note || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Budget Progress Bar */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Budget Usage</h3>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${isOverBudget ? 'text-red-400' : 'text-gray-400'}`}>
                {budgetUsagePercentage.toFixed(1)}% Used
              </span>
              {isOverBudget && (
                <AlertCircle className="w-4 h-4 text-red-400" />
              )}
            </div>
          </div>
          
          <div className="relative">
            <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  isOverBudget 
                    ? 'bg-red-500' 
                    : budgetUsagePercentage > 80 
                      ? 'bg-yellow-500' 
                      : 'bg-green-500'
                }`}
                style={{ width: `${budgetUsagePercentage}%` }}
              />
            </div>
            
            <div className="flex justify-between mt-2">
              <span className="text-xs text-gray-400">0%</span>
              <span className="text-xs text-gray-400">25%</span>
              <span className="text-xs text-gray-400">50%</span>
              <span className="text-xs text-gray-400">75%</span>
              <span className="text-xs text-gray-400">100%</span>
            </div>
          </div>
          
          <div className="mt-4 flex justify-between text-sm">
            <div>
              <p className="text-gray-400">Budget</p>
              <p className="text-white font-medium">{formatCurrency(totalBudget)}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400">Spent</p>
              <p className={`font-medium ${isOverBudget ? 'text-red-400' : 'text-white'}`}>
                {formatCurrency(totalSpent)}
              </p>
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

    {/* Add Worker Modal */}
    <AddWorkerModal
      isOpen={isWorkerModalOpen}
      onClose={() => setIsWorkerModalOpen(false)}
      onWorkerAdded={handleWorkerAdded}
    />
  );
}
