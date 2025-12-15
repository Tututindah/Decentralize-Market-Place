'use client'
import { useState } from 'react'
import { useWallet } from '@/app/src/contexts/WalletContext'
import { useTheme } from '@/app/src/components/ThemeProvider'
import Header from '@/app/src/components/Header'
import { Footer } from '@/app/src/components/Footer'
import { User, Award, TrendingUp, Calendar, Wallet, Star } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function ProfilePage() {
  const { connected, address } = useWallet()
  const { isDarkMode } = useTheme()
  const [reputation] = useState({
    totalJobs: 15,
    completedJobs: 13,
    cancelledJobs: 2,
    disputeCount: 0,
    averageRating: 92,
    totalEarned: 15400,
    trustScore: 88
  })

  const completionRate = ((reputation.completedJobs / reputation.totalJobs) * 100).toFixed(1)
  const badge = reputation.trustScore >= 90 ? '🏆 Elite' 
    : reputation.trustScore >= 80 ? '⭐ Expert'
    : reputation.trustScore >= 70 ? '✅ Trusted'
    : reputation.trustScore >= 60 ? '👍 Good'
    : '🆕 New'

  if (!connected) {
    return (
      <div className={`min-h-screen transition-colors ${
        isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
      }`}>
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className={`max-w-md w-full mx-4 p-8 rounded-2xl backdrop-blur-sm transition-colors ${
            isDarkMode 
              ? 'bg-white/5 border border-white/10' 
              : 'bg-gray-50 border border-gray-200'
          }`}>
            <User className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h1 className="text-3xl font-bold text-center mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Profile
            </h1>
            <p className={`text-center ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Please connect your wallet to view your profile
            </p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors ${
      isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
    }`}>
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Your Profile
          </h1>
          <p className={`text-lg ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Manage your reputation and track your achievements
          </p>
        </div>

        {/* Profile Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Profile Info Card */}
          <div className={`p-6 rounded-2xl backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] ${
            isDarkMode 
              ? 'bg-white/5 border border-white/10 hover:bg-white/10' 
              : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
          }`}>
            <div className="flex items-start gap-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold">
                {address?.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">Freelancer</h2>
                <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold ${
                  isDarkMode 
                    ? 'bg-primary/20 text-primary border border-primary/30' 
                    : 'bg-primary/10 text-primary border border-primary/20'
                }`}>
                  {badge}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Wallet className={`w-5 h-5 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`} />
                <div className="flex-1">
                  <p className={`text-sm mb-1 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Wallet Address</p>
                  <p className="font-mono text-sm">
                    {address?.substring(0, 20)}...
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Star className={`w-5 h-5 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`} />
                <div className="flex-1">
                  <p className={`text-sm mb-1 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Trust Score</p>
                  <p className="text-2xl font-bold text-primary">
                    {reputation.trustScore}/100
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className={`w-5 h-5 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`} />
                <div className="flex-1">
                  <p className={`text-sm mb-1 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Member Since</p>
                  <p className="font-semibold">December 2024</p>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Card */}
          <div className={`p-6 rounded-2xl backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] ${
            isDarkMode 
              ? 'bg-white/5 border border-white/10 hover:bg-white/10' 
              : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
          }`}>
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-bold">Statistics</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Total Jobs
                </span>
                <span className="font-bold text-lg">{reputation.totalJobs}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Completed
                </span>
                <span className="font-bold text-lg text-green-500">
                  {reputation.completedJobs}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Cancelled
                </span>
                <span className="font-bold text-lg text-red-500">
                  {reputation.cancelledJobs}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Disputes
                </span>
                <span className="font-bold text-lg">{reputation.disputeCount}</span>
              </div>

              <div className={`flex justify-between items-center pt-3 border-t ${
                isDarkMode ? 'border-white/10' : 'border-gray-200'
              }`}>
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Completion Rate
                </span>
                <span className="font-bold text-lg text-green-500">
                  {completionRate}%
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Average Rating
                </span>
                <span className="font-bold text-lg">⭐ {reputation.averageRating}/100</span>
              </div>

              <div className={`flex justify-between items-center pt-3 mt-3 border-t ${
                isDarkMode ? 'border-white/10' : 'border-gray-200'
              }`}>
                <span className="font-semibold">Total Earned</span>
                <span className="font-bold text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  ${reputation.totalEarned.toLocaleString()} USDM
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Achievements Card */}
        <div className={`p-6 rounded-2xl backdrop-blur-sm mb-8 ${
          isDarkMode 
            ? 'bg-white/5 border border-white/10' 
            : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className="flex items-center gap-3 mb-6">
            <Award className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-bold">Achievements</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '🎯', name: 'First Job' },
              { icon: '⭐', name: '10 Completed' },
              { icon: '💎', name: '$10K Earned' },
              { icon: '✅', name: 'KYC Verified' }
            ].map((achievement, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl text-center transition-all duration-300 hover:scale-105 ${
                  isDarkMode 
                    ? 'bg-white/5 border border-white/10 hover:bg-white/10' 
                    : 'bg-white border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="text-4xl mb-2">{achievement.icon}</div>
                <div className="text-sm font-semibold">{achievement.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Reputation Timeline Card */}
        <div className={`p-6 rounded-2xl backdrop-blur-sm ${
          isDarkMode 
            ? 'bg-white/5 border border-white/10' 
            : 'bg-gray-50 border border-gray-200'
        }`}>
          <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-primary" />
            Reputation Timeline
          </h3>
          
          <div className="space-y-4">
            {[
              { date: 'Dec 10, 2024', content: '✅ Completed "Web3 Landing Page" - Rating: 95/100' },
              { date: 'Dec 5, 2024', content: '✅ Completed "Smart Contract Audit" - Rating: 98/100' },
              { date: 'Nov 28, 2024', content: '🆔 KYC Verification Completed - Advanced Level' }
            ].map((item, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border-l-4 border-primary transition-all duration-300 hover:translate-x-2 ${
                  isDarkMode 
                    ? 'bg-white/5 border-r border-t border-b border-white/10' 
                    : 'bg-white border-r border-t border-b border-gray-200'
                }`}
              >
                <div className={`text-sm mb-1 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {item.date}
                </div>
                <div className="font-medium">{item.content}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

