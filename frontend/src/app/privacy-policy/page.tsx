'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Lock, 
  Eye, 
  Trash2, 
  Download, 
  UserCheck, 
  AlertTriangle,
  FileText,
  Clock,
  Globe,
  Database,
  Key
} from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Privacy & Data Security</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Your genetic information is extremely sensitive. Here's exactly how we protect, 
            use, and handle your data.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
              <Lock className="h-3 w-3 mr-1" />
              HIPAA-Level Security
            </Badge>
            <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50">
              <Shield className="h-3 w-3 mr-1" />
              Your Data, Your Control
            </Badge>
          </div>
        </div>

        {/* Quick Summary Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4 text-center">
              <Lock className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-green-900">Encrypted Storage</h3>
              <p className="text-sm text-green-700">Your DNA data is encrypted with military-grade security</p>
            </CardContent>
          </Card>
          
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4 text-center">
              <Eye className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-blue-900">No Sharing</h3>
              <p className="text-sm text-blue-700">We never sell or share your genetic information</p>
            </CardContent>
          </Card>
          
          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="p-4 text-center">
              <UserCheck className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-purple-900">Your Control</h3>
              <p className="text-sm text-purple-700">Delete your data anytime with one click</p>
            </CardContent>
          </Card>
          
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4 text-center">
              <FileText className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <h3 className="font-semibold text-orange-900">Transparent</h3>
              <p className="text-sm text-orange-700">Clear policies in plain English</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          {/* Data Collection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Database className="h-5 w-5 text-blue-600" />
                What Data We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    Genetic Information (Most Sensitive)
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc">
                    <li>VCF/FASTQ files you upload</li>
                    <li>Genetic variants and mutations</li>
                    <li>Polygenic risk scores we calculate</li>
                    <li>AI analysis results</li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    Basic Information
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc">
                    <li>Email address and username</li>
                    <li>Usage logs and preferences</li>
                    <li>Chat conversations with AI</li>
                    <li>Technical data (IP address, browser)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How We Protect Your Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Shield className="h-5 w-5 text-green-600" />
                How We Protect Your Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <Key className="h-6 w-6 text-green-600 mb-3" />
                  <h4 className="font-semibold text-green-900 mb-2">Encryption</h4>
                  <p className="text-sm text-green-800">
                    Your genetic data is encrypted using AES-256 encryption, 
                    the same standard used by banks and governments.
                  </p>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <Lock className="h-6 w-6 text-blue-600 mb-3" />
                  <h4 className="font-semibold text-blue-900 mb-2">Secure Storage</h4>
                  <p className="text-sm text-blue-800">
                    Data is stored on secure servers with multiple layers of 
                    protection, regular security audits, and access controls.
                  </p>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <UserCheck className="h-6 w-6 text-purple-600 mb-3" />
                  <h4 className="font-semibold text-purple-900 mb-2">Access Control</h4>
                  <p className="text-sm text-purple-800">
                    Only you and authorized medical professionals (if you choose) 
                    can access your genetic information.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Eye className="h-5 w-5 text-blue-600" />
                How We Use Your Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-3">✅ What We DO Use Your Data For:</h4>
                <ul className="text-sm text-blue-800 space-y-1 ml-4 list-disc">
                  <li>Generate your personalized risk scores and health insights</li>
                  <li>Provide AI-powered health recommendations</li>
                  <li>Improve our algorithms (using anonymized, aggregated data only)</li>
                  <li>Send you your results and important updates</li>
                  <li>Provide customer support when you contact us</li>
                </ul>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-900 mb-3">❌ What We NEVER Do With Your Data:</h4>
                <ul className="text-sm text-red-800 space-y-1 ml-4 list-disc">
                  <li>Sell your genetic information to anyone</li>
                  <li>Share your data with insurance companies</li>
                  <li>Use your data for marketing without permission</li>
                  <li>Give law enforcement access without a warrant</li>
                  <li>Share your information with employers</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Data Retention */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Clock className="h-5 w-5 text-orange-600" />
                Data Retention & Deletion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">How Long We Keep Your Data</h4>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></span>
                      <span><strong>Genetic Data:</strong> Until you delete it (indefinitely with your consent)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                      <span><strong>Account Data:</strong> Until you close your account</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mt-1.5 flex-shrink-0"></span>
                      <span><strong>Usage Logs:</strong> 2 years for security purposes</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <Trash2 className="h-6 w-6 text-red-600 mb-3" />
                  <h4 className="font-semibold text-red-900 mb-2">Your Right to Delete</h4>
                  <p className="text-sm text-red-800 mb-3">
                    You can permanently delete all your data at any time. Once deleted, 
                    it cannot be recovered and we cannot undo this action.
                  </p>
                  <Button variant="outline" size="sm" className="text-red-700 border-red-300 hover:bg-red-100">
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete My Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <UserCheck className="h-5 w-5 text-purple-600" />
                Your Data Rights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <Download className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-gray-900 mb-1">Download</h4>
                  <p className="text-xs text-gray-600">Get a copy of all your data</p>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <Eye className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-gray-900 mb-1">Access</h4>
                  <p className="text-xs text-gray-600">See what data we have about you</p>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <UserCheck className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-gray-900 mb-1">Correct</h4>
                  <p className="text-xs text-gray-600">Update incorrect information</p>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <Lock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-gray-900 mb-1">Restrict</h4>
                  <p className="text-xs text-gray-600">Limit how we use your data</p>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <Trash2 className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-gray-900 mb-1">Delete</h4>
                  <p className="text-xs text-gray-600">Permanently remove your data</p>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <Globe className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-gray-900 mb-1">Portability</h4>
                  <p className="text-xs text-gray-600">Transfer data to another service</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact & Updates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Questions & Updates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-2">Privacy Questions?</h4>
                <p className="text-sm text-yellow-800 mb-3">
                  If you have any questions about how we handle your data, please don't hesitate to contact us.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Contact Privacy Team
                  </Button>
                  <Button variant="outline" size="sm">
                    Report Privacy Concern
                  </Button>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Policy Updates</h4>
                <p className="text-sm text-blue-800">
                  We'll notify you via email about any significant changes to this privacy policy. 
                  You can also check back here for the latest version.
                </p>
                <p className="text-xs text-blue-700 mt-2">
                  <strong>Last Updated:</strong> January 2025
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Back to App */}
        <div className="text-center mt-8">
          <Link href="/dashboard">
            <Button className="px-8 py-3">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
