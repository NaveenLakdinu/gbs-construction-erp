'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Plus, User } from 'lucide-react';

interface Worker {
  id: number;
  name: string;
  nic: string;
  phone: string;
  daily_rate: number;
}

interface WorkerSearchSelectProps {
  workers: Worker[];
  selectedWorker: Worker | null;
  onWorkerSelect: (worker: Worker) => void;
  onAddNewWorker: () => void;
  placeholder?: string;
}

export default function WorkerSearchSelect({
  workers,
  selectedWorker,
  onWorkerSelect,
  onAddNewWorker,
  placeholder = "Search worker by name or NIC..."
}: WorkerSearchSelectProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredWorkers = workers.filter(worker =>
    worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.nic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleWorkerClick = (worker: Worker) => {
    onWorkerSelect(worker);
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="absolute inset-y-0 right-0 flex items-center">
          {selectedWorker && (
            <div className="flex items-center mr-2">
              <User className="h-4 w-4 text-green-400 mr-1" />
              <span className="text-xs text-green-400">
                {selectedWorker.name}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={onAddNewWorker}
            className="p-1 text-blue-400 hover:text-blue-300 mr-2"
            title="Add new worker"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-600 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredWorkers.length === 0 ? (
            <div className="p-3 text-center text-gray-400">
              {searchTerm ? 'No workers found' : 'No workers available'}
            </div>
          ) : (
            filteredWorkers.map((worker) => (
              <div
                key={worker.id}
                onClick={() => handleWorkerClick(worker)}
                className="px-3 py-2 hover:bg-slate-700 cursor-pointer border-b border-slate-700 last:border-b-0"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">{worker.name}</div>
                    <div className="text-sm text-gray-400">{worker.nic}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-green-400">
                      {worker.daily_rate.toLocaleString()} LKR/day
                    </div>
                    <div className="text-xs text-gray-500">{worker.phone}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
