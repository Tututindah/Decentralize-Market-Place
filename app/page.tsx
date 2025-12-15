'use client'

import { Landing } from '@/components/Landing'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  const handleGetStarted = () => {
    router.push('/jobs')
  }

  const handleShowProfile = () => {
    // Navigate to profile or handle show profile
  }

  const handleLearnMore = () => {
    console.log('Learn more clicked')
  }

  return (
    <Landing
      onGetStarted={handleGetStarted}
      onLearnMore={handleLearnMore}
      onShowProfile={handleShowProfile}
    />
  )
}
