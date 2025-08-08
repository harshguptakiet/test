'use client';

import React from 'react';
import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart3, FileText, Stethoscope, Settings, Users, Timeline, Bot, Shield, HelpCircle } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { UserMenu } from '@/components/auth/user-menu';

interface DashboardLayoutProps {
  children: ReactNode;
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    name: 'Genomic Analysis',
    href: '/dashboard/visualizations',
    icon: BarChart3,
  },
  {
    name: 'AI Health Assistant',
    href: '/dashboard/chatbot',
    icon: Bot,
  },
  {
    name: 'Health Reports',
    href: '/dashboard/reports',
    icon: FileText,
  },
  {
    name: 'Settings',
    href: '/dashboard/settings/consent',
    icon: Settings,
  },
  {
    name: 'Privacy Policy',
    href: '/dashboard/privacy-policy',
    icon: Shield,
  },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();

  return (
    <ProtectedRoute requiredRole="patient">
      <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <aside className="w-64 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col shadow-2xl border-r border-gray-700">
          <div className="p-6 border-b border-gray-700/50 bg-gradient-to-r from-gray-800 to-gray-700">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg animate-glow">
                <span className="text-white font-bold text-xl">C</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">CuraGenie</h1>
                <p className="text-xs text-blue-300 font-medium">AI Genomics Platform</p>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 p-4">
            <ul className="space-y-1">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`group flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
                          : 'text-gray-300 hover:bg-gray-700/50 hover:text-white hover:translate-x-1'
                      }`}
                    >
                      <item.icon className={`h-5 w-5 transition-transform duration-200 ${
                        isActive ? 'text-blue-100' : 'group-hover:scale-110'
                      }`} />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>
        
        <main className="flex-1 overflow-auto">
          <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-8 py-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {pathname === '/dashboard' ? 'Dashboard' : 
                 pathname === '/dashboard/visualizations' ? 'Genomic Analysis' :
                 pathname === '/dashboard/chatbot' ? 'AI Health Assistant' :
                 pathname === '/dashboard/reports' ? 'Health Reports' :
                 pathname === '/dashboard/privacy-policy' ? 'Privacy Policy' :
                 pathname.includes('/dashboard/settings') ? 'Settings' : 'Dashboard'}
              </h2>
              <UserMenu />
            </div>
          </header>
          
          <div className="p-8 animate-slide-up">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

