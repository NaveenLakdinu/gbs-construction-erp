'use client';

import { useState, useEffect } from 'react';
import ThemeToggle from '@/components/ThemeToggle';

interface Project {
  id: number;
  name: string;
}

interface Worker {
  id: number;
  name: string;
  nic: string;
  phone: string;
  daily_rate: number;
  project_id: number;
}

interface AttendanceRecord {
  id: number;
  worker_id: number;
  project_id: number;
  date: string;
  status: 'Present' | 'Absent' | 'Half Day';
  workers: Worker;
}

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [attendanceData, setAttendanceData] = useState<Map<number, 'Present' | 'Absent' | 'Half Day'>>(new Map());
  const [existingAttendance, setExistingAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject && selectedDate) {
      fetchWorkers();
      fetchAttendanceData();
    } else {
      setInitialLoading(false);
    }
  }, [selectedProject, selectedDate]);

  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
        setInitialLoading(false);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      setInitialLoading(false);
    }
  };

  const fetchWorkers = async () => {
    if (!selectedProject) return;
    
    try {
      const response = await fetch(`/api/workers`);
      if (response.ok) {
        const allWorkers = await response.json();
        const projectWorkers = allWorkers.filter((worker: Worker) => 
          worker.project_id === parseInt(selectedProject)
        );
        setWorkers(projectWorkers);
        
        // Initialize attendance data for all workers
        const initialAttendance = new Map<number, 'Present' | 'Absent' | 'Half Day'>();
        projectWorkers.forEach((worker: Worker) => {
          initialAttendance.set(worker.id, 'Present');
        });
        setAttendanceData(initialAttendance);
      }
    } catch (error) {
      console.error('Failed to fetch workers:', error);
    }
  };

  const fetchExistingAttendance = async () => {
    if (!selectedProject || !selectedDate) return;
    
    try {
      setLoading(true);
      const response = await fetch(
        `/api/attendance?project_id=${selectedProject}&date=${selectedDate}`
      );
      if (response.ok) {
        const data = await response.json();
        setExistingAttendance(data);
        
        // Update attendance data with existing records
        const updatedAttendance = new Map<number, 'Present' | 'Absent' | 'Half Day'>();
        workers.forEach((worker: Worker) => {
          const existingRecord = data.find((record: AttendanceRecord) => 
            record.worker_id === worker.id
          );
          updatedAttendance.set(worker.id, existingRecord ? existingRecord.status : 'Present');
        });
        setAttendanceData(updatedAttendance);
      }
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
      setMessage({ type: 'error', text: 'Failed to fetch existing attendance' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch attendance data whenever date or project changes
  const fetchAttendanceData = async () => {
    if (!selectedProject || !selectedDate) return;
    
    try {
      setLoading(true);
      const response = await fetch(
        `/api/attendance?project_id=${selectedProject}&date=${selectedDate}`
      );
      if (response.ok) {
        const data = await response.json();
        setExistingAttendance(data);
        
        // Update attendance data with existing records
        const updatedAttendance = new Map<number, 'Present' | 'Absent' | 'Half Day'>();
        workers.forEach((worker: Worker) => {
          const existingRecord = data.find((record: AttendanceRecord) => 
            record.worker_id === worker.id
          );
          // Only set status if there's a record, otherwise leave undefined (no pre-selection)
          if (existingRecord) {
            updatedAttendance.set(worker.id, existingRecord.status);
          }
        });
        setAttendanceData(updatedAttendance);
      }
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
      setMessage({ type: 'error', text: 'Failed to fetch existing attendance' });
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = (workerId: number, status: 'Present' | 'Absent' | 'Half Day') => {
    const newAttendanceData = new Map(attendanceData);
    newAttendanceData.set(workerId, status);
    setAttendanceData(newAttendanceData);
  };

  const saveAttendance = async () => {
    if (!selectedProject || !selectedDate) {
      setMessage({ type: 'error', text: 'Please select a project and date' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const promises = Array.from(attendanceData.entries()).map(([workerId, status]) =>
        fetch('/api/attendance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            worker_id: workerId,
            project_id: parseInt(selectedProject),
            date: selectedDate,
            status: status,
          }),
        })
      );

      await Promise.all(promises);
      setMessage({ type: 'success', text: 'Attendance saved successfully!' });
      
      // Refresh existing attendance
      await fetchExistingAttendance();
    } catch (error) {
      console.error('Failed to save attendance:', error);
      setMessage({ type: 'error', text: 'Failed to save attendance' });
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: 'Present' | 'Absent' | 'Half Day', isActive: boolean) => {
    if (!isActive) {
      return 'bg-gray-700/50 hover:bg-gray-700/70 text-gray-400 border border-gray-600';
    }
    
    switch (status) {
      case 'Present':
        return 'bg-green-600 hover:bg-green-700 text-white border-2 border-green-400 shadow-lg shadow-green-600/30';
      case 'Absent':
        return 'bg-red-600 hover:bg-red-700 text-white border-2 border-red-400 shadow-lg shadow-red-600/30';
      case 'Half Day':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white border-2 border-yellow-400 shadow-lg shadow-yellow-600/30';
      default:
        return 'bg-gray-600 hover:bg-gray-700 text-white';
    }
  };

  const getStatusIcon = (status: 'Present' | 'Absent' | 'Half Day', isActive: boolean) => {
    if (!isActive) return null;
    
    switch (status) {
      case 'Present':
        return (
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'Absent':
        return (
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'Half Day':
        return (
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 12.293a1 1 0 101.414 1.414L10 12.414l1.293 1.293a1 1 0 001.414-1.414L11 10.586V7z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Calculate attendance summary from current state (same as table)
  const attendanceSummary = {
    total: workers.length,
    present: Array.from(attendanceData.values()).filter(status => status === 'Present').length,
    absent: Array.from(attendanceData.values()).filter(status => status === 'Absent').length,
    halfDay: Array.from(attendanceData.values()).filter(status => status === 'Half Day').length,
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Attendance Management</h1>
            <p className="text-gray-400 mt-1">Mark daily attendance for workers</p>
          </div>
          <ThemeToggle />
        </div>

        {/* Controls */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Project Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Project
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Save Button */}
            <div className="flex items-end">
              <button
                onClick={saveAttendance}
                disabled={saving || !selectedProject || workers.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                {saving ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
          </div>
        </div>

        {/* Attendance Summary */}
        {workers.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Attendance Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                {loading ? (
                  <div className="animate-pulse">
                    <div className="h-8 w-16 bg-gray-700 rounded mb-2"></div>
                    <div className="h-4 w-12 bg-gray-700 rounded"></div>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-white">{attendanceSummary.total}</div>
                    <div className="text-sm text-gray-400">Total Workers</div>
                  </>
                )}
              </div>
              <div className="text-center">
                {loading ? (
                  <div className="animate-pulse">
                    <div className="h-8 w-16 bg-green-700 rounded mb-2"></div>
                    <div className="h-4 w-12 bg-green-700 rounded"></div>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-green-400">{attendanceSummary.present}</div>
                    <div className="text-sm text-gray-400">Present</div>
                  </>
                )}
              </div>
              <div className="text-center">
                {loading ? (
                  <div className="animate-pulse">
                    <div className="h-8 w-16 bg-red-700 rounded mb-2"></div>
                    <div className="h-4 w-12 bg-red-700 rounded"></div>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-red-400">{attendanceSummary.absent}</div>
                    <div className="text-sm text-gray-400">Absent</div>
                  </>
                )}
              </div>
              <div className="text-center">
                {loading ? (
                  <div className="animate-pulse">
                    <div className="h-8 w-16 bg-yellow-700 rounded mb-2"></div>
                    <div className="h-4 w-12 bg-yellow-700 rounded"></div>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-yellow-400">{attendanceSummary.halfDay}</div>
                    <div className="text-sm text-gray-400">Half Day</div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Daily Exceptions */}
        {workers.length > 0 && !loading && (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Daily Exceptions</h3>
            
            {attendanceSummary.absent === 0 && attendanceSummary.halfDay === 0 ? (
              <div className="text-center py-6">
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 4a1 1 0 012 0v1a1 1 0 11-2 0V4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-400 font-medium text-lg">📝 Attendance not marked for this date yet</p>
                <p className="text-gray-500 text-sm mt-1">Click status buttons below to mark attendance</p>
              </div>
            ) : attendanceSummary.absent === 0 && attendanceSummary.halfDay === 0 ? (
              <div className="text-center py-6">
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <p className="text-green-400 font-medium text-lg">✅ All workers are present today</p>
                <p className="text-gray-400 text-sm mt-1">Great job on perfect attendance!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {workers
                  .filter(worker => {
                    const status = attendanceData.get(worker.id);
                    return status && status !== 'Present';
                  })
                  .map(worker => {
                    const status = attendanceData.get(worker.id);
                    const isAbsent = status === 'Absent';
                    const isHalfDay = status === 'Half Day';
                    
                    return (
                      <div key={worker.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                        {/* Status Indicator */}
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                          isAbsent ? 'bg-red-500' : 
                          isHalfDay ? 'bg-yellow-500' : 
                          'bg-green-500'
                        }`}></div>
                        
                        {/* Worker Name and Status */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{worker.name}</span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              isAbsent ? 'bg-red-600 text-white' : 
                              isHalfDay ? 'bg-yellow-600 text-white' : 
                              'bg-green-600 text-white'
                            }`}>
                              {status}
                            </span>
                          </div>
                        </div>
                        
                        {/* Status Icon */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isAbsent ? 'bg-red-600' : 
                          isHalfDay ? 'bg-yellow-600' : 
                          'bg-green-600'
                        }`}>
                          {isAbsent && (
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          )}
                          {isHalfDay && (
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 12.293a1 1 0 101.414 1.414L10 12.414l1.293 1.293a1 1 0 001.414-1.414L11 10.586V7z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center justify-between ${
            message.type === 'success' 
              ? 'bg-green-900/50 border border-green-700 text-green-300' 
              : 'bg-red-900/50 border border-red-700 text-red-300'
          }`}>
            <span>{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="ml-4 text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Initial Loading State */}
        {initialLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-12 h-12 border-4 border-blue-300 border-t-transparent rounded-full animate-spin" style={{ animationDelay: '0.15s' }}></div>
              </div>
              <p className="text-gray-400 text-lg">Loading attendance system...</p>
            </div>
          </div>
        )}

        {/* Data Loading State */}
        {!initialLoading && loading && (
          <div className="flex justify-center items-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400">Loading attendance data...</p>
            </div>
          </div>
        )}

        {/* Workers List */}
        {!initialLoading && !loading && workers.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/20">
              <h2 className="text-xl font-semibold text-white">
                Workers Attendance - {new Date(selectedDate).toLocaleDateString()}
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
                      NIC
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Daily Rate
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Attendance Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {workers.map((worker) => {
                    const currentStatus = attendanceData.get(worker.id);
                    const isUnmarked = currentStatus === undefined;
                    const rowColor = !isUnmarked && currentStatus === 'Present' ? 'bg-green-900/20' : 
                                   !isUnmarked && currentStatus === 'Absent' ? 'bg-red-900/20' : 
                                   !isUnmarked && currentStatus === 'Half Day' ? 'bg-yellow-900/20' : '';
                    
                    return (
                      <tr key={worker.id} className={`hover:bg-white/5 transition-colors ${rowColor}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          <div className="flex items-center gap-2">
                            {!isUnmarked && currentStatus && (
                              <div className={`w-2 h-2 rounded-full ${
                                currentStatus === 'Present' ? 'bg-green-400' :
                                currentStatus === 'Absent' ? 'bg-red-400' :
                                'bg-yellow-400'
                              }`}></div>
                            )}
                            {worker.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {worker.nic}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {worker.phone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          Rs {Number(worker.daily_rate).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex justify-center gap-2">
                            {(['Present', 'Absent', 'Half Day'] as const).map((status) => {
                            const isActive = currentStatus === status;
                            const isUnmarked = currentStatus === undefined;
                            return (
                              <button
                                key={status}
                                onClick={() => handleAttendanceChange(worker.id, status)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 transform hover:scale-105 flex items-center ${
                                  isUnmarked ? 'bg-gray-700/50 hover:bg-gray-700/70 text-gray-400 border border-gray-600' : getStatusColor(status, isActive)
                                }`}
                              >
                                {getStatusIcon(status, isActive && !isUnmarked)}
                                {status}
                              </button>
                            );
                          })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!initialLoading && !loading && selectedProject && workers.length === 0 && (
          <div className="text-center py-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl">
            <p className="text-gray-400 text-lg">No workers found for this project</p>
            <p className="text-gray-500 text-sm mt-2">
              Add workers to this project to mark attendance
            </p>
          </div>
        )}

        {/* No Project Selected */}
        {!initialLoading && !loading && !selectedProject && (
          <div className="text-center py-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl">
            <p className="text-gray-400 text-lg">Select a project to manage attendance</p>
            <p className="text-gray-500 text-sm mt-2">
              Choose a project from the dropdown above to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
