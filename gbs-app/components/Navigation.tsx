'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Banknote, Home, Users, Calendar, Building2, Receipt } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: <Home className="h-5 w-5" />,
    },
    {
      href: '/projects',
      label: 'Projects',
      icon: <Building2 className="h-5 w-5" />,
    },
    {
      href: '/attendance',
      label: 'Attendance',
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      href: '/workers',
      label: 'Workers',
      icon: <Users className="h-5 w-5" />,
    },
    {
      href: '/expenses',
      label: 'Expenses',
      icon: <Receipt className="h-5 w-5" />,
    },
    {
      href: '/salary-report',
      label: 'Salary Report',
      icon: <Banknote className="h-5 w-5" />,
    },
  ];

  return (
    <nav className="bg-slate-900 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-10-4 4-4-4-6 6z" />
              </svg>
            </div>
            <span className="ml-3 text-xl font-bold text-white">GBS ERP</span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                      isActive
                        ? 'bg-blue-600 text-white border-l-4 border-blue-400'
                        : 'text-gray-300 hover:bg-slate-800 hover:text-white hover:border-l-4 hover:border-gray-500'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:text-white hover:bg-slate-800"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden border-t border-slate-800">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 flex items-center gap-2 ${
                    isActive
                      ? 'bg-blue-600 text-white border-l-4 border-blue-400'
                      : 'text-gray-300 hover:bg-slate-800 hover:text-white hover:border-l-4 hover:border-gray-500'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
