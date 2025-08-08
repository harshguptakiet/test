'use client'

import { BackendHealthCheck } from '@/components/debug/backend-health-check'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function BackendDebugPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/auth/login">
            <Button variant="outline" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Backend Debugging</h1>
          <p className="text-gray-600">
            Diagnose connectivity issues between frontend and backend
          </p>
        </div>

        {/* Health Check Component */}
        <BackendHealthCheck />

        {/* Additional Debug Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Troubleshooting Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">1. Check if your backend is running locally:</h4>
                <code className="block bg-gray-100 p-2 rounded">
                  cd curagenie-backend && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
                </code>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">2. Test backend directly in browser:</h4>
                <a 
                  href="http://localhost:8000/docs" 
                  target="_blank" 
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  http://localhost:8000/docs
                </a>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">3. For production deployment:</h4>
                <p>Update your <code>.env.local</code> file:</p>
                <code className="block bg-gray-100 p-2 rounded mt-1">
                  NEXT_PUBLIC_API_URL=https://your-deployed-backend.com
                </code>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">4. Check CORS configuration:</h4>
                <p>Ensure your backend allows requests from your frontend domain</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
