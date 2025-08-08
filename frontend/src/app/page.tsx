'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@/components/ui/button'
import { Loader2, AlertTriangle } from 'lucide-react'
import LandingPage from '@/components/landing/landing-page'

export default function Home() {
  const { isAuthenticated, isLoading } = useAuthStore()
  const router = useRouter()
  const [userWantsToLeave, setUserWantsToLeave] = useState(false)

  // Only redirect if user explicitly wants to go to dashboard
  // No automatic redirects - let users stay on landing page
  useEffect(() => {
    if (!isLoading && isAuthenticated && userWantsToLeave) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, isLoading, userWantsToLeave, router])

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-cyan-400" />
          <p className="text-gray-300">Loading CuraGenie...</p>
        </div>
      </div>
    )
  }

  // Always show landing page - let users decide when to navigate
  return <LandingPage />
}
