'use client';

import React from 'react';
import { Chatbot } from '@/components/chatbot/chatbot';
import { Bot, Shield, Stethoscope } from 'lucide-react';

export default function ChatbotPage() {
  const userId = 'user123';

  return (
    <div className="space-y-8">
      <div className="relative bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 text-white rounded-2xl p-8 mb-8 overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-sm"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Bot className="h-8 w-8 text-purple-300" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              AI Genomics Assistant
            </h1>
          </div>
          <p className="text-purple-100 text-xl max-w-2xl leading-relaxed">
            Chat with our AI assistant to understand your genomic analysis results and get educational information about your health data.
          </p>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2 text-blue-200 bg-white/10 rounded-full px-3 py-1">
              <Shield className="h-4 w-4" />
              <span className="text-sm">HIPAA Compliant</span>
            </div>
            <div className="flex items-center gap-2 text-blue-200 bg-white/10 rounded-full px-3 py-1">
              <Stethoscope className="h-4 w-4" />
              <span className="text-sm">Educational Only</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-5xl mx-auto">
        <Chatbot userId={userId} />
      </div>
    </div>
  );
}
