'use client'

import { useRouter } from 'next/navigation'
import { useWallet } from '@/app/src/contexts/WalletContext'
import { Landing } from '@/app/src/components/Landing'
import { useEffect } from 'react'

export default function HomePage() {
  const router = useRouter()
  const { connected, address } = useWallet()

  useEffect(() => {
    if (connected && address) {
      const role = localStorage.getItem('decentgigs_role')
      if (role === 'employer') {
        router.push('/employer/dashboard')
      } else if (role === 'freelancer') {
        router.push('/freelancer/dashboard')
      }
    }
  }, [connected, address, router])

  const handleGetStarted = () => {
    router.push('/connect-wallet')
  }

  const handleLearnMore = () => {
    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })
  }

  const handleShowProfile = () => {
    if (connected) {
      const role = localStorage.getItem('decentgigs_role')
      if (role === 'employer') {
        router.push('/employer/profile')
      } else if (role === 'freelancer') {
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
