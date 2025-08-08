'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  HelpCircle, 
  Info, 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  Lightbulb,
  Target,
  TrendingUp,
  AlertCircle 
} from 'lucide-react';

interface ExplanationProps {
  term: string;
  children: React.ReactNode;
  variant?: 'tooltip' | 'expandable' | 'inline';
  showIcon?: boolean;
}

export function PlainEnglishExplainer({ term, children, variant = 'tooltip', showIcon = true }: ExplanationProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (variant === 'tooltip') {
    return (
      <div className="group relative inline-block">
        <span className="border-b border-dotted border-blue-500 cursor-help text-blue-600">
          {term}
        </span>
        {showIcon && <HelpCircle className="inline h-3 w-3 ml-1 text-blue-500" />}
        <div className="invisible group-hover:visible absolute z-10 w-64 p-3 mt-1 text-sm bg-white border border-gray-200 rounded-lg shadow-lg">
          {children}
        </div>
      </div>
    );
  }

  if (variant === 'expandable') {
    return (
      <div className="border border-blue-200 rounded-lg mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 text-left flex items-center justify-between bg-blue-50 hover:bg-blue-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-900">What does "{term}" mean?</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-blue-600" />
          ) : (
            <ChevronDown className="h-4 w-4 text-blue-600" />
          )}
        </button>
        {isExpanded && (
          <div className="p-4 bg-white border-t border-blue-200">
            {children}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        {showIcon && (
          <div className="flex-shrink-0 p-1 bg-blue-100 rounded-full">
            <Info className="h-4 w-4 text-blue-600" />
          </div>
        )}
        <div>
          <h4 className="font-medium text-blue-900 mb-2">What is {term}?</h4>
          <div className="text-sm text-blue-800">{children}</div>
        </div>
      </div>
    </div>
  );
}

// Specific medical term explanations
export function PRSExplainer() {
  return (
    <PlainEnglishExplainer term="Polygenic Risk Score (PRS)" variant="expandable">
      <div className="space-y-3">
        <p>
          <strong>In Simple Terms:</strong> A Polygenic Risk Score is like a "genetic report card" 
          that estimates your chance of developing certain health conditions based on your DNA.
        </p>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <h5 className="font-medium text-green-900 mb-2 flex items-center gap-2">
            <Target className="h-4 w-4" />
            How to Read Your Score
          </h5>
          <ul className="text-sm text-green-800 space-y-1 ml-4 list-disc">
            <li><strong>0.0 to 0.3:</strong> Lower genetic risk than average</li>
            <li><strong>0.4 to 0.6:</strong> Average genetic risk</li>
            <li><strong>0.7 to 1.0:</strong> Higher genetic risk than average</li>
          </ul>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <h5 className="font-medium text-yellow-900 mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Important Remember
          </h5>
          <p className="text-sm text-yellow-800">
            Having a high genetic risk does NOT mean you will definitely get the disease. 
            Lifestyle, environment, and other factors also play major roles in your health.
          </p>
        </div>
      </div>
    </PlainEnglishExplainer>
  );
}

export function VCFExplainer() {
  return (
    <PlainEnglishExplainer term="VCF File" variant="expandable">
      <div className="space-y-3">
        <p>
          <strong>VCF stands for "Variant Call Format"</strong> - it's a file that contains 
          information about differences in your DNA compared to a reference genome.
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h5 className="font-medium text-blue-900 mb-2">Think of it like:</h5>
          <p className="text-sm text-blue-800">
            Comparing two books and noting every word that's different. Your VCF file 
            shows where your DNA "spelling" differs from the standard version.
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <h5 className="font-medium text-gray-900 mb-2">Where to get VCF files:</h5>
          <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc">
            <li>Direct-to-consumer genetic testing companies (23andMe, AncestryDNA)</li>
            <li>Clinical genetic testing through your doctor</li>
            <li>Whole genome sequencing services</li>
          </ul>
        </div>
      </div>
    </PlainEnglishExplainer>
  );
}

export function RiskLevelExplainer({ level }: { level: 'low' | 'moderate' | 'high' }) {
  const getLevelInfo = () => {
    switch (level) {
      case 'low':
        return {
          color: 'green',
          title: 'Low Risk',
          meaning: 'Your genetic makeup suggests a lower chance of developing this condition compared to the average person.',
          action: 'Continue healthy lifestyle habits and routine medical checkups.'
        };
      case 'moderate':
        return {
          color: 'yellow',
          title: 'Moderate Risk',
          meaning: 'Your genetic risk is around average. Many factors beyond genetics affect your actual risk.',
          action: 'Discuss prevention strategies with your healthcare provider and maintain healthy habits.'
        };
      case 'high':
        return {
          color: 'red',
          title: 'Higher Risk',
          meaning: 'Your genetic makeup suggests a higher chance, but this does NOT mean you will definitely develop the condition.',
          action: 'Talk to your doctor about screening, prevention, and lifestyle changes that can help reduce your risk.'
        };
    }
  };

  const info = getLevelInfo();

  return (
    <div className={`bg-${info.color}-50 border border-${info.color}-200 rounded-lg p-4 mt-3`}>
      <h4 className={`font-medium text-${info.color}-900 mb-2 flex items-center gap-2`}>
        <TrendingUp className="h-4 w-4" />
        What does "{info.title}" mean?
      </h4>
      <p className={`text-sm text-${info.color}-800 mb-3`}>{info.meaning}</p>
      <div className={`bg-${info.color}-100 rounded-lg p-3`}>
        <h5 className={`font-medium text-${info.color}-900 mb-1`}>Recommended Action:</h5>
        <p className={`text-sm text-${info.color}-800`}>{info.action}</p>
      </div>
    </div>
  );
}

// Context provider for explanations
export function EducationalContext({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-2 bg-blue-100 rounded-full">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Understanding Your Results</h3>
              <p className="text-blue-800 text-sm mb-3">
                We've designed these results to be easy to understand. Look for the 
                <HelpCircle className="inline h-4 w-4 mx-1 text-blue-500" /> icons 
                to get plain English explanations of medical terms.
              </p>
              <Badge variant="outline" className="text-blue-700 border-blue-300">
                <Lightbulb className="h-3 w-3 mr-1" />
                Educational Content
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      {children}
    </div>
  );
}
