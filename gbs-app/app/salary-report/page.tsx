'use client';

import { useState, useEffect } from 'react';
import ThemeToggle from '@/components/ThemeToggle';

interface WorkerSalaryData {
  worker_id: number;
  worker_name: string;
  worker_nic: string;
  daily_rate: number;
  present_days: number;
  absent_days: number;
  half_days: number;
  total_salary: number;
}

interface SalaryReportResponse {
  message: string;
  data: WorkerSalaryData[];
  summary: {
    total_workers: number;
    total_present_days: number;
    total_absent_days: number;
    total_half_days: number;
    total_salary: number;
    month: string;
    year: string;
    project_id: string;
  };
}

export default function SalaryReportPage() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth.toString());
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [salaryData, setSalaryData] = useState<WorkerSalaryData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate month options
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate year options (current year ± 5)
  const years = Array.from({ length: 11 }, (_, i) => (currentYear - 5 + i).toString());

  useEffect(() => {
    fetchSalaryReport();
  }, [selectedMonth, selectedYear]);

  const fetchSalaryReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/reports/salary?month=${selectedMonth}&year=${selectedYear}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch salary report');
      }

      const data: SalaryReportResponse = await response.json();
      setSalaryData(data.data || []);
    } catch (err) {
      console.error('Error fetching salary report:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch salary report');
    } finally {
      setLoading(false);
    }
  };

  const totalPayout = salaryData.reduce((sum, worker) => sum + worker.total_salary, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Salary Report</h1>
            <p className="text-gray-400 mt-1">Monthly salary calculations for workers</p>
          </div>
          <ThemeToggle />
        </div>

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-6">Report Period</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Month Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {months.map((month, index) => (
                  <option key={month} value={(index + 1).toString()}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Generate Report Button */}
            <div className="flex items-end">
              <button
                onClick={fetchSalaryReport}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-blue-300 border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-2">Generating Report...</span>
                  </div>
                ) : (
                  'Generate Salary Report'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L9.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-300">{error}</span>
            </div>
          </div>
        )}

        {/* Summary Card */}
        {salaryData.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Total Payout</h2>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-400">
                  {formatCurrency(totalPayout)}
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  {months[parseInt(selectedMonth) - 1]} {selectedYear}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-300 border-t-transparent rounded-full animate-spin"></div>
              <div className="w-12 h-12 border-4 border-blue-300 border-t-transparent rounded-full animate-spin" style={{ animationDelay: '0.15s' }}></div>
              <p className="text-gray-400 text-lg">Calculating salaries...</p>
            </div>
          </div>
        )}

        {/* Salary Table */}
        {!loading && salaryData.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/20">
              <h2 className="text-xl font-semibold text-white mb-4">
                Salary Details - {months[parseInt(selectedMonth) - 1]} {selectedYear}
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Worker Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Daily Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Present Days
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Half Days
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Total Salary
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {salaryData.map((worker, index) => (
                    <tr key={worker.worker_id} className={`hover:bg-white/5 transition-colors ${index % 2 === 0 ? 'bg-slate-800/30' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          {worker.worker_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        Rs {worker.daily_rate.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {worker.present_days}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {worker.half_days}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {formatCurrency(worker.total_salary)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && salaryData.length === 0 && (
          <div className="text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-2 0v2a1 1 0 002 0h2a1 1 0 002 0v2a1 1 0 002 2 0v-2a1 1 0 002-2 0h2a1 1 0 002 2 0v-2a1 1 0 002-2 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Salary Data Available</h3>
              <p className="text-gray-400 text-lg mb-4">
                Select month and year, then click "Generate Salary Report" to view worker salary calculations.
              </p>
              <p className="text-gray-500 text-sm">
                Make sure attendance has been marked for workers in the selected period.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
