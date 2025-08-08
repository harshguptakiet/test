'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Lock, 
  Eye, 
  Download, 
  Trash2, 
  Key,
  Clock,
  AlertTriangle,
  CheckCircle,
  Database,
  Share,
  User,
  FileText
} from 'lucide-react';

interface DataControlCenterProps {
  userId: string;
}

export function DataControlCenter({ userId }: DataControlCenterProps) {
  const [sharingConsent, setSharingConsent] = useState(false);
  const [researchConsent, setResearchConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  // Mock data - in real app, fetch from API
  const securityStatus = {
    encryptionEnabled: true,
    lastBackup: '2024-08-07',
    accessLogs: 12,
    dataRetentionDays: 'Until deleted by you',
    totalSize: '45.2 MB'
  };

  const dataBreakdown = [
    { type: 'Genomic Data', size: '42.1 MB', files: 1, sensitive: true },
    { type: 'Analysis Results', size: '2.8 MB', files: 15, sensitive: true },
    { type: 'Account Data', size: '0.3 MB', files: 1, sensitive: false }
  ];

  const handleDataDownload = () => {
    alert('Data download initiated. You will receive a secure link via email.');
  };

  const handleDataDeletion = () => {
    const confirmed = window.confirm(
      'Are you absolutely sure you want to permanently delete all your data? This action cannot be undone.'
    );
    if (confirmed) {
      alert('Data deletion initiated. This may take up to 24 hours to complete.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Your Data Security Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <Lock className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="text-sm font-medium">Encryption</div>
                <Badge variant="outline" className="text-green-700 border-green-300">
                  AES-256 Active
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Database className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-medium">Storage</div>
                <div className="text-sm text-gray-600">{securityStatus.totalSize}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <Clock className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <div className="text-sm font-medium">Retention</div>
                <div className="text-sm text-gray-600">Your control</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-full">
                <Eye className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <div className="text-sm font-medium">Access Logs</div>
                <div className="text-sm text-gray-600">{securityStatus.accessLogs} this month</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            Your Data Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dataBreakdown.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${item.sensitive ? 'bg-red-100' : 'bg-blue-100'}`}>
                    {item.sensitive ? 
                      <Lock className="h-4 w-4 text-red-600" /> : 
                      <FileText className="h-4 w-4 text-blue-600" />
                    }
                  </div>
                  <div>
                    <div className="font-medium">{item.type}</div>
                    <div className="text-sm text-gray-600">
                      {item.files} file{item.files !== 1 ? 's' : ''} • {item.size}
                    </div>
                  </div>
                </div>
                {item.sensitive && (
                  <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50">
                    Highly Sensitive
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Privacy Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-purple-600" />
            Privacy Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="font-medium">Share with Healthcare Providers</div>
                <div className="text-sm text-gray-600">
                  Allow you to share your results with doctors or genetic counselors
                </div>
              </div>
              <Switch 
                checked={sharingConsent} 
                onCheckedChange={setSharingConsent}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="font-medium">Anonymous Research Participation</div>
                <div className="text-sm text-gray-600">
                  Help advance medical research with anonymized genetic data
                </div>
              </div>
              <Switch 
                checked={researchConsent} 
                onCheckedChange={setResearchConsent}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="font-medium">Product Updates & Educational Content</div>
                <div className="text-sm text-gray-600">
                  Receive emails about new features and health education
                </div>
              </div>
              <Switch 
                checked={marketingConsent} 
                onCheckedChange={setMarketingConsent}
              />
            </div>
          </div>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Your privacy settings have been saved. You can change these at any time.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Data Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-orange-600" />
            Data Management Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
              <div className="flex items-center gap-3 mb-3">
                <Download className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium">Download Your Data</div>
                  <div className="text-sm text-gray-600">Get a complete copy of all your data</div>
                </div>
              </div>
              <Button onClick={handleDataDownload} variant="outline" size="sm" className="w-full">
                Request Data Export
              </Button>
            </div>

            <div className="p-4 border border-red-200 rounded-lg bg-red-50">
              <div className="flex items-center gap-3 mb-3">
                <Trash2 className="h-5 w-5 text-red-600" />
                <div>
                  <div className="font-medium">Delete All Data</div>
                  <div className="text-sm text-gray-600">Permanently remove all your information</div>
                </div>
              </div>
              <Button 
                onClick={handleDataDeletion} 
                variant="destructive" 
                size="sm" 
                className="w-full"
              >
                Delete My Data
              </Button>
            </div>
          </div>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> Data deletion is permanent and cannot be undone. 
              Consider downloading your data first.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Need Help?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <div className="font-medium text-yellow-900 mb-2">
                  Have questions about your data privacy?
                </div>
                <p className="text-yellow-800 text-sm mb-3">
                  Our privacy team is available to help with any questions or concerns 
                  about how your data is handled.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Contact Privacy Team
                  </Button>
                  <Button variant="outline" size="sm">
                    View Privacy Policy
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
