'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@/app/src/contexts/WalletContext'
import { useTheme } from '@/app/src/components/ThemeProvider'
import Header from '@/app/src/components/Header'
import { Footer } from '@/app/src/components/Footer'
import { FileText, Briefcase, CheckCircle, Star, Search, TrendingUp } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface DashboardStats {
  activeBids: number
  activeJobs: number
  completed: number
  reputation: number
}

export default function FreelancerDashboard() {
  const { connected, role, address } = useWallet()
  const { isDarkMode } = useTheme()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    activeBids: 0,
    activeJobs: 0,
    completed: 0,
    reputation: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!connected) {
      router.push('/connect-wallet')
    } else if (role !== 'FREELANCER') {
      router.push('/role-selection')
    } else {
      fetchDashboardData()
    }
  }, [connected, role, router])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch user profile with reputation
      const profileResponse = await fetch(`/api/users/profile/${address}`)
      if (profileResponse.ok) {
        const profile = await profileResponse.json()
        
        // Fetch bids
        const bidsResponse = await fetch(`/api/bids?freelancer=${address}`)
        let bids = bidsResponse.ok ? await bidsResponse.json() : []
        bids = Array.isArray(bids) ? bids : []
        
        // Fetch jobs where freelancer is assigned
        const jobsResponse = await fetch(`/api/jobs?freelancer=${address}`)
        let jobs = jobsResponse.ok ? await jobsResponse.json() : []
        jobs = Array.isArray(jobs) ? jobs : []

        const activeBids = bids.filter((b: any) => b.status === 'PENDING').length
        const activeJobs = jobs.filter((j: any) => j.status === 'IN_PROGRESS').length
        const completed = jobs.filter((j: any) => j.status === 'COMPLETED').length
        const reputation = profile.user?.reputation_score || 0

        setStats({ activeBids, activeJobs, completed, reputation })
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
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
            Freelancer Dashboard
          </h1>
          <p className={`text-lg ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Track your bids, manage active jobs, and grow your reputation
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={`p-6 rounded-2xl backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
            isDarkMode 
              ? 'bg-white/5 border border-white/10 hover:bg-white/10' 
              : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <span className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Active Bids</span>
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="text-3xl font-bold mb-2">
              {loading ? '...' : stats.activeBids}
            </div>
            <div className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {stats.activeBids === 0 ? 'No active bids' : 'Pending proposals'}
            </div>
          </div>

          <div className={`p-6 rounded-2xl backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
            isDarkMode 
              ? 'bg-white/5 border border-white/10 hover:bg-white/10' 
              : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <span className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Active Jobs</span>
              <Briefcase className="w-5 h-5 text-primary" />
            </div>
            <div className="text-3xl font-bold mb-2">
              {loading ? '...' : stats.activeJobs}
            </div>
            <div className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {stats.activeJobs === 0 ? 'No active work' : 'Jobs in progress'}
            </div>
          </div>

          <div className={`p-6 rounded-2xl backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
            isDarkMode 
              ? 'bg-white/5 border border-white/10 hover:bg-white/10' 
              : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <span className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Completed</span>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold mb-2">
              {loading ? '...' : stats.completed}
            </div>
            <div className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {stats.completed === 0 ? 'No completed jobs' : 'Successfully finished'}
            </div>
          </div>

          <div className={`p-6 rounded-2xl backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
            isDarkMode 
              ? 'bg-white/5 border border-white/10 hover:bg-white/10' 
              : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <span className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Reputation</span>
              <Star className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="text-3xl font-bold mb-2">
              {loading ? '...' : stats.reputation || '-'}
            </div>
            <div className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {stats.reputation === 0 ? 'Not rated yet' : 'Overall score'}
            </div>
          </div>
        </div>

        {/* Empty State */}
        {!loading && stats.activeBids === 0 && stats.activeJobs === 0 && stats.completed === 0 && (
          <div className={`p-12 rounded-2xl backdrop-blur-sm text-center ${
            isDarkMode 
              ? 'bg-white/5 border border-white/10' 
              : 'bg-gray-50 border border-gray-200'
          }`}>
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold mb-3">No Active Bids or Jobs</h3>
            <p className={`text-lg mb-6 max-w-2xl mx-auto ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Start browsing available jobs and submit your first bid to get started on your freelancing journey!
            </p>
            <button
              onClick={() => router.push('/jobs')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              <Search className="w-5 h-5" />
              Browse Jobs
            </button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className={`p-6 rounded-2xl backdrop-blur-sm cursor-pointer transition-all duration-300 hover:scale-105 ${
            isDarkMode 
              ? 'bg-white/5 border border-white/10 hover:bg-white/10' 
              : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
          }`}
          onClick={() => router.push('/jobs')}>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-primary to-secondary">
                <Search className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1">Browse Jobs</h3>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Find new opportunities to grow your career</p>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-2xl backdrop-blur-sm cursor-pointer transition-all duration-300 hover:scale-105 ${
            isDarkMode 
              ? 'bg-white/5 border border-white/10 hover:bg-white/10' 
              : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
          }`}
          onClick={() => router.push('/profile')}>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-primary to-secondary">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1">View Profile</h3>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Check your reputation and achievements</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer isDarkMode={isDarkMode} />
    </div>
  )
}

