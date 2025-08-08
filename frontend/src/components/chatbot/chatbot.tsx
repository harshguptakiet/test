'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Send, Bot, User, Loader2, AlertTriangle, Shield, Stethoscope, ChevronDown, ChevronUp, Info, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatbotProps {
  userId: string;
}

interface ChatRequest {
  user_id: string;
  message: string;
  conversation_id?: string;
}

interface ChatResponse {
  response: string;
  success: boolean;
  conversation_id?: string;
  context_used: boolean;
}

// Use environment variable for API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// Real API function that calls the backend
const sendMessageToBot = async ({ user_id, message }: ChatRequest): Promise<ChatResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/chatbot/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id,
      message,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
};

export function Chatbot({ userId }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm your AI genomics educational assistant. 👋\n\nI can help you understand genetic analysis concepts, risk scores, and general health information. \n\nWhat would you like to learn about your genetic results?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: sendMessageToBot,
    onSuccess: (data) => {
      if (data.success) {
        const botMessage: Message = {
          id: Date.now().toString() + '_bot',
          content: data.response,
          isUser: false,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        toast.error('Failed to get response from AI assistant');
      }
    },
    onError: () => {
      toast.error('Failed to send message. Please try again.');
    },
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString() + '_user',
      content: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate({ user_id: userId, message: inputMessage });
    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="space-y-4">
      {/* Compact Info Bar with Collapsible Sections */}
      <div className="flex flex-wrap gap-2 items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-blue-700 bg-blue-100 rounded-full px-3 py-1 text-sm">
            <Shield className="h-3 w-3" />
            <span className="font-medium">Educational Only</span>
          </div>
          <div className="flex items-center gap-2 text-orange-700 bg-orange-100 rounded-full px-3 py-1 text-sm">
            <AlertTriangle className="h-3 w-3" />
            <span className="font-medium">Not Medical Advice</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowGuidelines(!showGuidelines)}
            className="text-blue-600 hover:bg-blue-100 rounded-full"
          >
            <HelpCircle className="h-4 w-4 mr-1" />
            Guidelines
            {showGuidelines ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowDisclaimer(!showDisclaimer)}
            className="text-orange-600 hover:bg-orange-100 rounded-full"
          >
            <Info className="h-4 w-4 mr-1" />
            Important Info
            {showDisclaimer ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
          </Button>
        </div>
      </div>

      {/* Collapsible Guidelines */}
      {showGuidelines && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm animate-slide-up">
          <CardContent className="p-4">
            <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              What I Can and Cannot Do
            </h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <h5 className="font-medium mb-2 text-green-700">✅ I CAN Help With:</h5>
                <ul className="space-y-1 text-xs">
                  <li>• Explaining genetic terms and concepts</li>
                  <li>• Understanding risk scores and statistics</li>
                  <li>• General health and genomics education</li>
                  <li>• Guidance on when to consult professionals</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium mb-2 text-red-700">❌ I CANNOT:</h5>
                <ul className="space-y-1 text-xs">
                  <li>• Diagnose medical conditions</li>
                  <li>• Provide medical treatment advice</li>
                  <li>• Replace professional healthcare</li>
                  <li>• Make definitive health predictions</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Collapsible Disclaimer */}
      {showDisclaimer && (
        <Alert className="border-orange-200 bg-gradient-to-r from-orange-50 to-red-50 shadow-sm animate-slide-up">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="space-y-2">
              <p><strong>Medical Disclaimer:</strong> This AI assistant provides educational information only and cannot give medical advice, diagnose conditions, or replace professional healthcare consultation.</p>
              <p><strong>Emergency:</strong> If you're experiencing a health emergency, contact emergency services immediately or visit your nearest hospital.</p>
            </div>
          </AlertDescription>
        </Alert>
      )}

    <Card className="h-[600px] flex flex-col shadow-2xl border border-gray-200 bg-white/90 backdrop-blur-sm animate-slide-up">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600" />
            AI Genomics Assistant
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-1">
            <Shield className="h-3 w-3" />
            Educational Use Only
          </div>
        </CardTitle>
        <CardDescription className="text-sm">
          Ask me about your genomic analysis, risk scores, and general health information
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4 custom-scrollbar">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 animate-slide-up ${
                  message.isUser ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <Avatar className="w-8 h-8 shadow-sm border border-white/50">
                  <AvatarFallback>
                    {message.isUser ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </AvatarFallback>
                </Avatar>
                
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-lg transition-all duration-200 hover:shadow-xl ${
                    message.isUser
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white ml-auto transform hover:scale-105'
                      : 'bg-gradient-to-r from-white to-gray-50 text-gray-900 border border-gray-200/50'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.isUser ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}
            
            {chatMutation.isPending && (
              <div className="flex items-start gap-3 animate-slide-up">
                <Avatar className="w-8 h-8 shadow-sm border border-white/50">
                  <AvatarFallback>
                    <Bot className="h-4 w-4 text-blue-600 animate-pulse" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl px-4 py-3 shadow-lg border border-blue-200/50">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm text-blue-700 font-medium">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <div className="border-t border-gray-200/50 p-4 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex gap-3">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about your genomic results..."
              disabled={chatMutation.isPending}
              className="flex-1 shadow-inner focus:ring-2 focus:ring-blue-300 rounded-xl border-gray-300 transition-all duration-200 focus:border-blue-400"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || chatMutation.isPending}
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 hover:shadow-lg hover:scale-105 rounded-xl"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}
