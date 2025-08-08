import LandingPage from '@/components/landing/landing-page'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CuraGenie - AI-Powered Healthcare Platform',
  description: 'Transform your healthcare experience with our intelligent medical platform featuring AI diagnostics, virtual consultations, and personalized health insights.',
  keywords: 'healthcare, AI, medical platform, health analytics, telemedicine, personalized medicine',
  authors: [{ name: 'Harsh Gupta', url: 'https://linkedin.com/in/harsh-gupta-kiet/' }],
  creator: 'Harsh Gupta',
  openGraph: {
    title: 'CuraGenie - AI-Powered Healthcare Platform',
    description: 'Revolutionary healthcare platform combining AI technology with personalized medicine',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CuraGenie - AI-Powered Healthcare Platform',
    description: 'Transform your healthcare experience with AI-powered medical insights',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function Landing() {
  return <LandingPage />
}
