'use client';

import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const projectId = params.id;

  const handleBack = () => {
    router.push('/projects');
  };

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
              <h1 className="text-3xl font-bold text-white">Project Details</h1>
              <p className="text-gray-400 mt-1">View and manage project information</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Project ID Display */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">Project ID</h2>
            <div className="bg-slate-700 border border-slate-600 rounded-lg p-6 inline-block">
              <p className="text-4xl font-bold text-blue-400">{projectId}</p>
            </div>
            <p className="text-gray-400 mt-4">This is the dynamic project detail page for project #{projectId}</p>
          </div>
        </div>

        {/* Placeholder Content */}
        <div className="mt-8 bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Project Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-400 mb-2">Project Name</p>
              <p className="text-white">Loading...</p>
            </div>
            <div>
              <p className="text-gray-400 mb-2">Location</p>
              <p className="text-white">Loading...</p>
            </div>
            <div>
              <p className="text-gray-400 mb-2">Status</p>
              <p className="text-white">Loading...</p>
            </div>
            <div>
              <p className="text-gray-400 mb-2">Created Date</p>
              <p className="text-white">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
