'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@/app/src/contexts/WalletContext'
import { useTheme } from '@/app/src/components/ThemeProvider'
import Header from '@/app/src/components/Header'
import { Footer } from '@/app/src/components/Footer'
import { Briefcase, MessageSquare, Clock, CheckCircle, Plus, TrendingUp } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface DashboardStats {
  activeJobs: number
  totalBids: number
  inProgress: number
  completed: number
}

export default function EmployerDashboard() {
  const { connected, role, address } = useWallet()
  const { isDarkMode } = useTheme()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    activeJobs: 0,
    totalBids: 0,
    inProgress: 0,
    completed: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!connected) {
      router.push('/connect-wallet')
    } else if (role !== 'EMPLOYER') {
      router.push('/role-selection')
    } else {
      fetchDashboardData()
    }
  }, [connected, role, router])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      // Fetch jobs data from API
      const response = await fetch(`/api/jobs?employer=${address}`)
      if (response.ok) {
        let jobs = await response.json()
        jobs = Array.isArray(jobs) ? jobs : []
        
        // Calculate stats
        const activeJobs = jobs.filter((j: any) => j.status === 'OPEN').length
        const inProgress = jobs.filter((j: any) => j.status === 'IN_PROGRESS').length
        const completed = jobs.filter((j: any) => j.status === 'COMPLETED').length
        const totalBids = jobs.reduce((sum: number, job: any) => sum + (job.bids?.length || 0), 0)

        setStats({ activeJobs, totalBids, inProgress, completed })
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
            Employer Dashboard
          </h1>
          <p className={`text-lg ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Manage your jobs, review bids, and track your hires
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
              }`}>Active Jobs</span>
              <Briefcase className="w-5 h-5 text-primary" />
            </div>
            <div className="text-3xl font-bold mb-2">
              {loading ? '...' : stats.activeJobs}
            </div>
            <div className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {stats.activeJobs === 0 ? 'No active jobs' : 'Currently open'}
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
              }`}>Total Bids</span>
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div className="text-3xl font-bold mb-2">
              {loading ? '...' : stats.totalBids}
            </div>
            <div className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {stats.totalBids === 0 ? 'No bids received' : 'Proposals received'}
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
              }`}>In Progress</span>
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div className="text-3xl font-bold mb-2">
              {loading ? '...' : stats.inProgress}
            </div>
            <div className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {stats.inProgress === 0 ? 'No active work' : 'Jobs in progress'}
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
        </div>

        {/* Empty State */}
        {!loading && stats.activeJobs === 0 && stats.inProgress === 0 && stats.completed === 0 && (
          <div className={`p-12 rounded-2xl backdrop-blur-sm text-center ${
            isDarkMode 
              ? 'bg-white/5 border border-white/10' 
              : 'bg-gray-50 border border-gray-200'
          }`}>
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-2xl font-bold mb-3">No Jobs Posted Yet</h3>
            <p className={`text-lg mb-6 max-w-2xl mx-auto ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Get started by posting your first job and connect with talented freelancers ready to bring your project to life!
            </p>
            <button
              onClick={() => router.push('/create-job')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              <Plus className="w-5 h-5" />
              Post Your First Job
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
          onClick={() => router.push('/create-job')}>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-primary to-secondary">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1">Post a New Job</h3>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Find the perfect freelancer for your project</p>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-2xl backdrop-blur-sm cursor-pointer transition-all duration-300 hover:scale-105 ${
            isDarkMode 
              ? 'bg-white/5 border border-white/10 hover:bg-white/10' 
              : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
          }`}
          onClick={() => router.push('/jobs')}>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-primary to-secondary">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1">Manage Jobs</h3>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>View and manage all your job postings</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer isDarkMode={isDarkMode} />
    </div>
  )
}

