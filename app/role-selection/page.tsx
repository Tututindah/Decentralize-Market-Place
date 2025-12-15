'use client'

import { useRouter } from 'next/navigation'
import { useWallet } from '@/app/src/contexts/WalletContext'
import { useTheme } from '@/app/src/components/ThemeProvider'
import Header from '@/app/src/components/Header'
import { Footer } from '@/app/src/components/Footer'
import { toast } from 'react-hot-toast'
import { Building, User, CheckCircle, Briefcase, Code } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function RoleSelection() {
  const router = useRouter()
  const { setUserRole, address } = useWallet()
  const { theme } = useTheme()
  const isDarkMode = theme === 'dark'

  const handleSelectRole = async (role: 'employer' | 'freelancer') => {
    try {
      if (!address) {
        toast.error('Please connect your wallet first')
        router.push('/connect-wallet')
        return
      }

      await setUserRole(role)
      toast.success(`Role set to ${role}`)
      router.push('/kyc')
    } catch (error) {
      console.error('Error setting role:', error)
      toast.error('Failed to set role')
    }
  }

  return (
    <div className={`min-h-screen transition-colors ${
      isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
    }`}>
      <Header />
      <div className="flex items-center justify-center py-12 px-4 min-h-[80vh]">
        <div className="max-w-5xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Choose Your Role
          </h1>
          <p className={`text-xl ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Select how you want to participate in DecentGigs marketplace
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Employer Card */}
          <button
            onClick={() => handleSelectRole('employer')}
            className={`group p-8 rounded-2xl backdrop-blur-sm transition-all hover:scale-105 border-2 text-left ${
              isDarkMode
                ? 'bg-white/5 border-white/10 hover:border-primary hover:bg-white/10'
                : 'bg-gray-50 border-gray-200 hover:border-primary hover:bg-white'
            } shadow-lg hover:shadow-primary/20`}
          >
            <div className="mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
                <Building className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Employer
              </h2>
              <p className={`text-lg mb-6 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Post jobs, hire talent, and manage projects with blockchain-secured escrow
              </p>
            </div>
            <ul className="space-y-3">
              {[
                { icon: Briefcase, text: 'Post unlimited jobs' },
                { icon: CheckCircle, text: 'Escrow protection' },
                { icon: User, text: 'Access global talent' },
                { icon: CheckCircle, text: 'Dispute resolution' }
              ].map((item, idx) => {
                const Icon = item.icon
                return (
                  <li key={idx} className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                      {item.text}
                    </span>
                  </li>
                )
              })}
            </ul>
          </button>

          {/* Freelancer Card */}
          <button
            onClick={() => handleSelectRole('freelancer')}
            className={`group p-8 rounded-2xl backdrop-blur-sm transition-all hover:scale-105 border-2 text-left ${
              isDarkMode
                ? 'bg-white/5 border-white/10 hover:border-primary hover:bg-white/10'
                : 'bg-gray-50 border-gray-200 hover:border-primary hover:bg-white'
            } shadow-lg hover:shadow-primary/20`}
          >
            <div className="mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-secondary to-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-secondary/30 group-hover:scale-110 transition-transform">
                <Code className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                Freelancer
              </h2>
              <p className={`text-lg mb-6 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Find opportunities, build reputation, and get paid securely with crypto
              </p>
            </div>
            <ul className="space-y-3">
              {[
                { icon: Briefcase, text: 'Browse open jobs' },
                { icon: CheckCircle, text: 'Build on-chain reputation' },
                { icon: CheckCircle, text: 'Guaranteed payments' },
                { icon: User, text: 'Global opportunities' }
              ].map((item, idx) => {
                const Icon = item.icon
                return (
                  <li key={idx} className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-secondary flex-shrink-0" />
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                      {item.text}
                    </span>
                  </li>
                )
              })}
            </ul>
          </button>
        </div>
      </div>
      </div>
      <Footer isDarkMode={isDarkMode} />
    </div>
  )
}

