'use client';

import React, { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Shield, FileText, CheckCircle } from 'lucide-react';

interface MedicalDisclaimerProps {
  variant?: 'banner' | 'modal' | 'inline';
  showAccept?: boolean;
  onAccept?: () => void;
}

export function MedicalDisclaimer({ variant = 'banner', showAccept = false, onAccept }: MedicalDisclaimerProps) {
  const [isAccepted, setIsAccepted] = useState(false);

  const handleAccept = () => {
    setIsAccepted(true);
    onAccept?.();
  };

  const disclaimerContent = (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-red-100 rounded-full">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-red-900">Important Medical Disclaimer</h3>
          <p className="text-sm text-red-700">Please read carefully before using CuraGenie</p>
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Not Medical Advice
          </h4>
          <p className="text-red-800">
            <strong>CuraGenie is for informational and educational purposes only.</strong> The results, predictions, 
            and recommendations provided by this platform are NOT medical diagnoses, medical advice, or treatment 
            recommendations from qualified healthcare professionals.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="font-semibold text-amber-900 mb-2">Consult Your Doctor</h4>
          <p className="text-amber-800">
            Always consult with qualified healthcare professionals before making any medical decisions. 
            Do not start, stop, or change any medical treatment based solely on CuraGenie results.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">AI Limitations</h4>
          <p className="text-blue-800">
            Our AI models are trained on available scientific data but are not perfect. Results may not 
            apply to your specific situation and should be interpreted by medical professionals familiar 
            with your health history.
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Your Responsibility</h4>
          <ul className="text-gray-700 space-y-1 ml-4 list-disc">
            <li>Share these results with your healthcare provider</li>
            <li>Do not use results to self-diagnose or self-treat</li>
            <li>Seek immediate medical attention for any health emergencies</li>
            <li>Understand that genetic risk does not guarantee disease development</li>
          </ul>
        </div>
      </div>

      {showAccept && !isAccepted && (
        <div className="border-t pt-4">
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="disclaimer-accept"
              className="mt-1"
              onChange={(e) => setIsAccepted(e.target.checked)}
            />
            <label htmlFor="disclaimer-accept" className="text-sm text-gray-700 flex-1 cursor-pointer">
              I understand that CuraGenie is for informational purposes only and is not a substitute 
              for professional medical advice, diagnosis, or treatment. I will consult with qualified 
              healthcare professionals before making any medical decisions based on these results.
            </label>
          </div>
          <Button
            onClick={handleAccept}
            disabled={!isAccepted}
            className="w-full mt-3"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            I Understand - Continue to Results
          </Button>
        </div>
      )}
    </div>
  );

  if (variant === 'banner') {
    return (
      <Alert className="border-red-200 bg-red-50 mb-6">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>Medical Disclaimer:</strong> This platform is for informational purposes only and is not a substitute 
          for professional medical advice. Always consult your healthcare provider before making medical decisions.{' '}
          <button className="underline font-medium hover:text-red-900">
            Read full disclaimer
          </button>
        </AlertDescription>
      </Alert>
    );
  }

  if (variant === 'modal') {
    return (
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-red-900">Medical Disclaimer</CardTitle>
        </CardHeader>
        <CardContent>
          {disclaimerContent}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      {disclaimerContent}
    </div>
  );
}

// Persistent disclaimer banner for all pages
export function GlobalMedicalDisclaimer() {
  return (
    <div className="bg-red-600 text-white p-2 text-center text-sm">
      <div className="container mx-auto flex items-center justify-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        <span>
          <strong>Medical Notice:</strong> This platform provides educational information only. 
          Always consult healthcare professionals for medical decisions.
        </span>
        <FileText className="h-4 w-4 ml-2" />
      </div>
    </div>
  );
}
