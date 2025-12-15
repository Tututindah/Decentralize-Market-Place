'use client'

import { useRouter } from 'next/navigation'
import { useWallet } from '@/app/src/contexts/WalletContext'
import { Landing } from '@/app/src/components/Landing'
import { useEffect } from 'react'

export const dynamic = 'force-dynamic'

export default function HomePage() {
  const router = useRouter()
  const { connected, address } = useWallet()

  // If wallet connected, check role and redirect
  useEffect(() => {
    if (connected && address) {
      const role = localStorage.getItem('decentgigs_role')
      if (role === 'EMPLOYER') {
        router.push('/employer/dashboard')
      } else if (role === 'FREELANCER') {
        router.push('/freelancer/dashboard')
      }
    }
  }, [connected, address, router])

  const handleGetStarted = () => {
    router.push('/connect-wallet')
  }

  const handleLearnMore = () => {
    // Scroll to features section
    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })
  }

  const handleShowProfile = () => {
    if (connected) {
      const role = localStorage.getItem('decentgigs_role')
      if (role === 'EMPLOYER') {
        router.push('/employer/profile')
      } else if (role === 'FREELANCER') {
        router.push('/freelancer/profile')
      } else {
        router.push('/role-selection')
      }
    } else {
      router.push('/connect-wallet')
    }
  }

  const handleSettingProfile = () => {
    if (connected) {
      router.push('/profile')
    } else {
      router.push('/connect-wallet')
    }
  }

  return (
    <Landing
      onGetStarted={handleGetStarted}
      onLearnMore={handleLearnMore}
      onShowProfile={handleShowProfile}
      onSettingProfile={handleSettingProfile}
    />
  )
}
