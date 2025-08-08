'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  FileText, 
  Download, 
  Calendar, 
  Clock,
  User,
  Activity,
  AlertTriangle,
  CheckCircle,
  Target,
  BarChart3,
  Stethoscope,
  Eye,
  Info,
  TrendingUp,
  Users,
  Shield
} from 'lucide-react';

interface MRIScanReportProps {
  userId: string;
  scanId?: string;
}

interface ScanMetadata {
  patientId: string;
  scanDate: string;
  scanTime: string;
  scanType: string;
  contrast: boolean;
  radiologist: string;
  aiAnalysisVersion: string;
}

interface Finding {
  id: string;
  type: 'tumor' | 'lesion' | 'abnormality' | 'normal';
  description: string;
  location: string;
  size: string;
  confidence: number;
  riskLevel: 'low' | 'moderate' | 'high';
  recommendations: string[];
}

interface AIAnalysis {
  overallScore: number;
  processingTime: string;
  algorithmsUsed: string[];
  confidenceLevel: number;
  findings: Finding[];
}

export function MRIScanReport({ userId, scanId = "MRI_20240807_001" }: MRIScanReportProps) {
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data - in real app, fetch from API
  const scanMetadata: ScanMetadata = {
    patientId: userId,
    scanDate: "2024-08-07",
    scanTime: "14:30:00",
    scanType: "T1-weighted MRI with Gadolinium",
    contrast: true,
    radiologist: "Dr. Sarah Johnson, MD",
    aiAnalysisVersion: "CuraGenie AI v2.1.0"
  };

  const aiAnalysis: AIAnalysis = {
    overallScore: 73.2,
    processingTime: "2.4 seconds",
    algorithmsUsed: ["DeepBrain CNN", "TumorNet v3", "Lesion Detection AI"],
    confidenceLevel: 87.5,
    findings: [
      {
        id: "finding_1",
        type: "tumor",
        description: "Irregular mass with heterogeneous enhancement pattern",
        location: "Left frontal lobe, anterior to precentral gyrus",
        size: "2.3 cm × 1.8 cm × 2.1 cm (estimated volume: 4.2 cm³)",
        confidence: 87.5,
        riskLevel: "high",
        recommendations: [
          "Immediate consultation with neurosurgery",
          "Consider biopsy for tissue diagnosis",
          "Monitor for neurological symptoms",
          "Follow-up MRI in 4-6 weeks if surgery delayed"
        ]
      },
      {
        id: "finding_2",
        type: "lesion",
        description: "Small hyperintense lesion on T2-weighted images",
        location: "Right parietal white matter",
        size: "0.8 cm × 0.6 cm × 0.7 cm (estimated volume: 0.2 cm³)",
        confidence: 65.2,
        riskLevel: "moderate",
        recommendations: [
          "Monitor with follow-up imaging in 6 months",
          "Consider correlation with clinical symptoms",
          "May represent small vessel disease or gliosis"
        ]
      },
      {
        id: "finding_3",
        type: "normal",
        description: "No significant abnormalities detected in remaining brain parenchyma",
        location: "Bilateral cerebral hemispheres",
        size: "N/A",
        confidence: 92.8,
        riskLevel: "low",
        recommendations: [
          "Routine follow-up as clinically indicated"
        ]
      }
    ]
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'destructive';
      case 'moderate': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getFindingIcon = (type: string) => {
    switch (type) {
      case 'tumor': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'lesion': return <Target className="h-4 w-4 text-yellow-600" />;
      case 'abnormality': return <Activity className="h-4 w-4 text-orange-600" />;
      case 'normal': return <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="h-8 w-8 text-blue-600" />
              <div>
                <CardTitle className="text-2xl">MRI Brain Scan Analysis Report</CardTitle>
                <p className="text-blue-700 mt-1">AI-Powered Diagnostic Imaging Analysis</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-blue-700 border-blue-300">
                Scan ID: {scanId}
              </Badge>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Medical Disclaimer */}
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>Important:</strong> This AI analysis is for educational and research purposes only. 
          Always consult with qualified medical professionals for diagnosis and treatment decisions. 
          This report should be reviewed by a certified radiologist.
        </AlertDescription>
      </Alert>

      {/* Report Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="findings" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Findings
          </TabsTrigger>
          <TabsTrigger value="ai-analysis" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Analysis
          </TabsTrigger>
          <TabsTrigger value="metadata" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Scan Details
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Overall Assessment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Overall Assessment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="text-3xl font-bold text-gray-900">
                    {aiAnalysis.overallScore.toFixed(1)}%
                  </div>
                  <Progress value={aiAnalysis.overallScore} className="h-2" />
                  <p className="text-sm text-gray-600">
                    AI Confidence Score
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Findings Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-orange-600" />
                  Findings Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['high', 'moderate', 'low'].map(risk => {
                    const count = aiAnalysis.findings.filter(f => f.riskLevel === risk).length;
                    const color = risk === 'high' ? 'text-red-600' : risk === 'moderate' ? 'text-yellow-600' : 'text-green-600';
                    return (
                      <div key={risk} className="flex justify-between items-center">
                        <span className={`text-sm font-medium ${color}`}>
                          {risk.charAt(0).toUpperCase() + risk.slice(1)} Risk
                        </span>
                        <Badge variant="outline" className={color}>
                          {count}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-5 w-5 text-purple-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Stethoscope className="h-4 w-4 mr-2" />
                  Consult Radiologist
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Follow-up
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Second Opinion
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Critical Findings Alert */}
          {aiAnalysis.findings.some(f => f.riskLevel === 'high') && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Critical Finding Detected:</strong> High-risk abnormality identified. 
                Immediate medical consultation recommended.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Findings Tab */}
        <TabsContent value="findings" className="space-y-4">
          {aiAnalysis.findings.map((finding, index) => (
            <Card key={finding.id} className={`border-l-4 ${getRiskColor(finding.riskLevel).split(' ').slice(1).join(' ')}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getFindingIcon(finding.type)}
                    <div>
                      <CardTitle className="text-lg">Finding #{index + 1}</CardTitle>
                      <p className="text-sm text-gray-600">{finding.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getRiskBadgeVariant(finding.riskLevel)}>
                      {finding.riskLevel.toUpperCase()}
                    </Badge>
                    <Badge variant="outline">
                      {finding.confidence}% confidence
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-sm text-gray-700">{finding.description}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Measurements</h4>
                    <p className="text-sm text-gray-700">{finding.size}</p>
                  </div>
                </div>

                {finding.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-blue-600" />
                      Clinical Recommendations
                    </h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {finding.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-blue-600 mt-1">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* AI Analysis Tab */}
        <TabsContent value="ai-analysis" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  AI Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Processing Time:</span>
                    <span className="text-sm font-medium">{aiAnalysis.processingTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Confidence Level:</span>
                    <span className="text-sm font-medium">{aiAnalysis.confidenceLevel}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">AI Version:</span>
                    <span className="text-sm font-medium">{scanMetadata.aiAnalysisVersion}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  Algorithms Used
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {aiAnalysis.algorithmsUsed.map((algorithm, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{algorithm}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                AI Analysis Disclaimer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="mb-2">
                  <strong>About AI Analysis:</strong>
                </p>
                <ul className="space-y-1 ml-4 list-disc">
                  <li>AI algorithms are trained on large datasets but may not capture all possible variations</li>
                  <li>Results should always be verified by qualified medical professionals</li>
                  <li>AI is designed to assist, not replace, clinical judgment</li>
                  <li>False positives and false negatives are possible</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metadata Tab */}
        <TabsContent value="metadata" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Patient ID:</span>
                  <span className="text-sm font-medium">{scanMetadata.patientId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Scan ID:</span>
                  <span className="text-sm font-medium">{scanId}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-600" />
                  Scan Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Date:</span>
                  <span className="text-sm font-medium">{scanMetadata.scanDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Time:</span>
                  <span className="text-sm font-medium">{scanMetadata.scanTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Type:</span>
                  <span className="text-sm font-medium">{scanMetadata.scanType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Contrast:</span>
                  <Badge variant={scanMetadata.contrast ? 'default' : 'secondary'}>
                    {scanMetadata.contrast ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-purple-600" />
                  Medical Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">{scanMetadata.radiologist}</p>
                    <p className="text-xs text-gray-600">Consulting Radiologist</p>
                  </div>
                  <Badge variant="outline" className="text-purple-700 border-purple-300">
                    Board Certified
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
