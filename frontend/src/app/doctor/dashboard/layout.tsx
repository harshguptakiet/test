'use client';

import React from 'react';
import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, FileText, Settings, BarChart3, Stethoscope } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { UserMenu } from '@/components/auth/user-menu';

interface DoctorLayoutProps {
  children: ReactNode;
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/doctor/dashboard',
    icon: Home,
  },
  {
    name: 'Patients',
    href: '/doctor/dashboard/patients',
    icon: Users,
  },
  {
    name: 'Reports',
    href: '/doctor/dashboard/reports',
    icon: FileText,
  },
  {
    name: 'Analytics',
    href: '/doctor/dashboard/analytics',
    icon: BarChart3,
  },
  {
    name: 'Settings',
    href: '/doctor/dashboard/settings',
    icon: Settings,
  },
];

export default function DoctorLayout({ children }: DoctorLayoutProps) {
  const pathname = usePathname();

  return (
    <ProtectedRoute requiredRole="doctor">
      <div className="flex h-screen bg-gray-50">
        <aside className="w-64 bg-blue-900 text-white flex flex-col">
          <div className="p-6 border-b border-blue-800">
            <h1 className="text-xl font-bold text-white">CuraGenie</h1>
            <p className="text-sm text-blue-200 mt-1">Doctor Portal</p>
          </div>
          
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-700 text-white'
                          : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          
          <div className="p-4 border-t border-blue-800">
            <UserMenu />
          </div>
        </aside>
        
        <main className="flex-1 overflow-auto">
          <header className="bg-white border-b border-gray-200 px-8 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {pathname === '/doctor/dashboard' ? 'Doctor Dashboard' : 
                 pathname === '/doctor/dashboard/patients' ? 'Patients' :
                 pathname === '/doctor/dashboard/reports' ? 'Reports' :
                 pathname === '/doctor/dashboard/analytics' ? 'Analytics' :
                 pathname === '/doctor/dashboard/settings' ? 'Settings' : 'Dashboard'}
              </h2>
              <UserMenu />
            </div>
          </header>
          
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
