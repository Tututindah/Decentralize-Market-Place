'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/app/src/components/Header'
import { Footer } from '@/app/src/components/Footer';
import { useWallet } from '@/app/src/contexts/WalletContext'
import { useTheme } from '@/app/src/components/ThemeProvider'
import { Briefcase, DollarSign, Clock, Search, Filter } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Job {
  id: string
  title: string
  description: string
  category: string
  skills: string[]
  budget: string
  deadline: string | null
  status: string
  createdAt: string
  employer: {
    id: string
    walletAddress: string
    username: string | null
    reputation: number
    trustScore: number
  }
  _count?: {
    bids: number
  }
}

export default function JobsPage() {
  const { connected } = useWallet()
  const { theme } = useTheme()
  const isDarkMode = theme === 'dark'
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/jobs?status=OPEN')
      
      if (response.ok) {
        const data = await response.json()
        setJobs(data.jobs || [])
      } else {
        console.error('Failed to fetch jobs')
        setJobs([])
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  const filteredJobs = jobs
    .filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || job.category === categoryFilter
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      } else if (sortBy === 'budget-high') {
        return parseFloat(b.budget) - parseFloat(a.budget)
      } else if (sortBy === 'budget-low') {
        return parseFloat(a.budget) - parseFloat(b.budget)
      }
      return 0
    })

  const categories = ['all', ...Array.from(new Set(jobs.map(j => j.category)))]

  const formatBudget = (job: Job | any) => {
    // Handle both old format (budget string) and new format (budget_min/budget_max)
    if (typeof job.budget === 'string') {
      const amount = parseFloat(job.budget)
      return `${amount.toLocaleString()} USDM`
    }
    // For new jobs with budget_min and budget_max from database (stored in USDM)
    const budgetMin = job.budget_min
    const budgetMax = job.budget_max
    if (budgetMin !== undefined && budgetMax !== undefined) {
      return `${Number(budgetMin).toFixed(0)}-${Number(budgetMax).toFixed(0)} USDM`
    }
    return 'N/A'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className={`flex flex-col min-h-screen transition-colors ${
      isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
    }`}>
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-7xl flex-grow">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Browse Jobs
                </h1>
                <p className={`text-lg ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Find your next opportunity in our decentralized marketplace
                </p>
              </div>
              {connected && (
                <Link 
                  href="/create-job" 
                  className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold transition-all hover:scale-105 shadow-lg shadow-primary/20 flex items-center gap-2"
                >
                  <Briefcase size={20} />
                  Post a Job
                </Link>
              )}
            </div>

            <div className={`flex gap-4 mb-6 flex-wrap p-6 rounded-2xl backdrop-blur-sm transition-colors ${
              isDarkMode 
                ? 'bg-white/5 border border-white/10' 
                : 'bg-gray-50 border border-gray-200'
            }`}>
              <div className="flex-1 min-w-[250px] relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl transition-colors ${
                    isDarkMode
                      ? 'bg-white/5 border border-white/10 text-white placeholder-gray-400'
                      : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>

              <div className="flex gap-2 items-center">
                <Filter className={`w-5 h-5 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <select 
                  value={categoryFilter} 
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className={`px-4 py-3 rounded-xl transition-colors ${
                    isDarkMode
                      ? 'bg-white/5 border border-white/10 text-white'
                      : 'bg-white border border-gray-300 text-gray-900'
                  }`}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat} className="bg-gray-800 text-white">
                      {cat === 'all' ? 'All Categories' : cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 items-center">
                <Clock className={`w-5 h-5 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className={`px-4 py-3 rounded-xl transition-colors ${
                    isDarkMode
                      ? 'bg-white/5 border border-white/10 text-white'
                      : 'bg-white border border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="newest" className="bg-gray-800 text-white">Newest First</option>
                  <option value="budget-high" className="bg-gray-800 text-white">Highest Budget</option>
                  <option value="budget-low" className="bg-gray-800 text-white">Lowest Budget</option>
                </select>
              </div>
            </div>

            <div className="mb-6">
              <span className={`font-semibold ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>{filteredJobs.length} jobs found</span>
            </div>

            {loading && (
              <div className={`text-center py-12 rounded-2xl backdrop-blur-sm ${
                isDarkMode 
                  ? 'bg-white/5 border border-white/10' 
                  : 'bg-gray-50 border border-gray-200'
              }`}>
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Loading jobs...</p>
              </div>
            )}

            {!loading && filteredJobs.length === 0 && (
              <div className={`text-center py-16 rounded-2xl backdrop-blur-sm ${
                isDarkMode 
                  ? 'bg-white/5 border border-white/10' 
                  : 'bg-gray-50 border border-gray-200'
              }`}>
                <Briefcase className="w-16 h-16 text-primary mx-auto mb-4" />
                <h3 className={`text-2xl font-bold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>No jobs found</h3>
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Try adjusting your search or filters
                </p>
              </div>
            )}

            {!loading && filteredJobs.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredJobs.map(job => (
                  <Link 
                    href={`/jobs/${job.id}`} 
                    key={job.id} 
                    className={`block p-6 rounded-2xl backdrop-blur-sm transition-all hover:scale-105 border-2 hover:border-primary ${
                      isDarkMode 
                        ? 'bg-white/5 border-white/10' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className={`text-xl font-bold mb-2 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>{job.title}</h3>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-3 py-1 bg-gradient-to-r from-primary to-secondary text-white text-sm rounded-full font-semibold">
                            {job.category}
                          </span>
                          <span className={`text-sm ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>{formatDate(job.createdAt || (job as any).created_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-primary font-bold text-lg">
                        <DollarSign size={18} />
                        <span>{formatBudget(job)}</span>
                      </div>
                    </div>

                    <p className={`mb-4 line-clamp-3 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {job.description.length > 150 
                        ? `${job.description.substring(0, 150)}...` 
                        : job.description
                      }
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.skills && job.skills.length > 0 ? (
                        <>
                          {job.skills.slice(0, 4).map((skill, idx) => (
                            <span
                              key={idx}
                              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                                isDarkMode
                                  ? 'bg-white/10 text-gray-300 border border-white/10'
                                  : 'bg-white text-gray-700 border border-gray-200'
                              }`}
                            >
                              {skill}
                            </span>
                          ))}
                          {job.skills.length > 4 && (
                            <span className="px-3 py-1 rounded-lg text-sm font-medium text-primary bg-primary/10 border border-primary/20">
                              +{job.skills.length - 4} more
                            </span>
                          )}
                        </>
                      ) : (
                        <span className={`px-3 py-1 rounded-lg text-sm ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          No skills specified
                        </span>
                      )}
                    </div>

                    <div className={`flex items-center justify-between pt-4 border-t ${
                      isDarkMode ? 'border-white/10' : 'border-gray-200'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                          {job.employer?.username?.charAt(0).toUpperCase() || job.employer?.walletAddress?.substring(0, 2) || '?'}
                        </div>
                        <div>
                          <div className={`font-semibold ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {job.employer?.username || (job.employer?.walletAddress ? `${job.employer.walletAddress.substring(0, 8)}...` : 'Unknown')}
                          </div>
                          <div className={`text-sm ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            ⭐ {job.employer?.reputation || 0} • {(job.employer?.trustScore || 0).toFixed(0)}% trust
                          </div>
                        </div>
                      </div>

                      {job._count && (
                        <div className={`px-3 py-1 rounded-lg font-semibold ${
                          isDarkMode ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'
                        }`}>
                          {job._count.bids} {job._count.bids === 1 ? 'bid' : 'bids'}
                        </div>
                      )}
                    </div>

                    {job.deadline && (
                      <div className={`flex items-center gap-2 mt-3 pt-3 border-t text-sm ${
                        isDarkMode ? 'border-white/10 text-gray-400' : 'border-gray-200 text-gray-600'
                      }`}>
                        <Clock size={14} />
                        <span>Deadline: {formatDate(job.deadline)}</span>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer isDarkMode={isDarkMode} />
    </div>
  )
}

