'use client';

import React from 'react';
import { useAuthStore } from '@/store/auth-store';
import { ConsentManagement } from '@/components/settings/consent-management';
import { DataControlCenter } from '@/components/privacy/data-control-center';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Settings, User } from 'lucide-react';

export default function ConsentPage() {
  const { user } = useAuthStore();
  const userId = user?.id?.toString() || "1";

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-8">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Privacy & Settings</h1>
            <p className="text-blue-100 mt-2">
              Manage your data privacy, consent preferences, and account settings
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-4">
          <User className="h-4 w-4" />
          <span className="text-blue-100">Logged in as: {user?.username || 'User'}</span>
        </div>
      </div>

      {/* Consent Management */}
      <ConsentManagement userId={userId} />
      
      {/* Data Control Center */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Settings className="h-6 w-6 text-blue-600" />
          Data Control Center
        </h2>
        <DataControlCenter userId={userId} />
      </div>
    </div>
  );
}
