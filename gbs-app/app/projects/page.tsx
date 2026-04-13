'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

interface Project {
  id: number;
  name: string;
  location: string | null;
  status: string;
  progress?: number;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { bar: string; badge: string; top: string }> = {
  Ongoing:   { top: 'bg-green-600',  bar: 'bg-green-600',  badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  Completed: { top: 'bg-blue-500',   bar: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'   },
  Planning:  { top: 'bg-amber-500',  bar: 'bg-amber-500',  badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  Paused:    { top: 'bg-gray-400',   bar: 'bg-gray-400',   badge: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'   },
};

const STATUSES = ['All', 'Ongoing', 'Planning', 'Paused', 'Completed'];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      setProjects(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const filtered = projects.filter(p => {
    const matchFilter = activeFilter === 'All' || p.status === activeFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.location ?? '').toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const statusCounts = STATUSES.slice(1).reduce((acc, s) => {
    acc[s] = projects.filter(p => p.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 dark:text-gray-400 text-sm">Loading projects...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-6 py-4 rounded-xl">Error: {error}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex justify-between items-start mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Construction Projects</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage and track all your active sites</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/attendance"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-medium py-2.5 px-5 rounded-lg transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M8 3v10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="8" cy="8" r="6" stroke="white" strokeWidth="1.5" fill="none"/>
              </svg>
              Attendance
            </Link>
            <Link
              href="/workers"
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 active:scale-95 text-white text-sm font-medium py-2.5 px-5 rounded-lg transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                <path d="M12 12L3 12M12 8L3 8M12 4L3 4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Workers
            </Link>
            <Link
              href="/projects/add"
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white text-sm font-medium py-2.5 px-5 rounded-lg transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v10M3 8h10" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              New Project
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <div className="w-7 h-1 bg-orange-500 rounded mb-2" />
            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Total</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{projects.length}</p>
          </div>
          {STATUSES.slice(1).map(s => (
            <div key={s} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <div className={`w-7 h-1 rounded mb-2 ${STATUS_CONFIG[s]?.bar}`} />
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">{s}</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{statusCounts[s] ?? 0}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 mb-4">
          <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <input
            className="flex-1 bg-transparent text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none"
            placeholder="Search projects or locations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap mb-6">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setActiveFilter(s)}
              className={`text-sm px-4 py-1.5 rounded-full border transition-all ${
                activeFilter === s
                  ? 'bg-orange-600 text-white border-transparent'
                  : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">??</p>
            <p className="text-gray-700 dark:text-gray-300 font-medium text-lg">No projects found</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Try adjusting your search or filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(project => {
              const sc = STATUS_CONFIG[project.status] ?? STATUS_CONFIG['Paused'];
              const progress = project.progress ?? 0;
              return (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:-translate-y-1 hover:border-gray-300 dark:hover:border-gray-600 transition-all cursor-pointer">
                    <div className={`h-1.5 ${sc.top}`} />
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                          #PROJ-{String(project.id).padStart(3, '0')}
                        </span>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${sc.badge}`}>
                          {project.status}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2 leading-snug">
                        {project.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mb-4">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 14 14" fill="none">
                          <path d="M7 1C4.79 1 3 2.79 3 5c0 3 4 8 4 8s4-5 4-8c0-2.21-1.79-4-4-4z" fill="currentColor" opacity="0.4"/>
                          <circle cx="7" cy="5" r="1.5" fill="white"/>
                        </svg>
                        {project.location || 'Location not specified'}
                      </div>
                      {/* Progress */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mb-1">
                          <span>Progress</span><span>{progress}%</span>
                        </div>
                        <div className="h-1 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                          <div className={`h-full rounded ${sc.bar} transition-all`} style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                      <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-700 pt-3">
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(project.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="text-xs font-medium text-orange-600 dark:text-orange-400">View details ?</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}