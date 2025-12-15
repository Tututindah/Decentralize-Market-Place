'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useWallet } from '@/app/src/contexts/WalletContext'
import { useCardano } from '@/app/src/hooks/useCardano'
import { useTheme } from '@/app/src/components/ThemeProvider'
import { toast } from 'react-hot-toast'
import { ArrowLeft, Calendar, DollarSign, Briefcase, CheckCircle } from 'lucide-react'

interface Bid {
  id: string
  jobId: string
  freelancerAddress: string
  amount: number
  deliveryDays: number
  proposal: string
  status: 'pending' | 'accepted' | 'rejected'
}

interface Job {
  id: string
  title: string
  description: string
  budgetMin: number
  budgetMax: number
  employer: string
  category: string
  status: 'Open' | 'In Progress' | 'Completed'
  kycRequired: boolean
  deadline: string
  bids?: Bid[]
  txHash?: string
}

export default function JobDetailPage() {
  const { jobId } = useParams()
  const router = useRouter()
  const { connected, address, role } = useWallet()
  const { theme } = useTheme()
  const isDarkMode = theme === 'dark'
  const { acceptBidAndCreateEscrow } = useCardano()
  const [job, setJob] = useState<Job | null>(null)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    const savedJobs = localStorage.getItem('jobs')
    if (savedJobs) {
      const jobs: Job[] = JSON.parse(savedJobs)
      const foundJob = jobs.find(j => j.id === jobId)
      setJob(foundJob || null)
    }
  }, [jobId])

  const handleAcceptBid = async (bid: Bid) => {
    if (!connected || !address) {
      toast.error('Please connect your wallet')
      return
    }

    if (role !== 'employer') {
      toast.error('Only employers can accept bids')
      return
    }

    if (job?.employer !== address) {
      toast.error('You can only accept bids on your own jobs')
      return
    }

    setAccepting(true)

    try {
      // Create escrow for the accepted bid
      const escrowAmount = bid.amount * 1_000_000 // Convert to lovelace
      
      // Get freelancer DID (in production, fetch from backend)
      const freelancerDid = 'did:prism:freelancer456' // Mock DID
      const clientDid = localStorage.getItem('userDid') || 'did:prism:employer123'
      const arbiterAddress = address // Use employer as arbiter for demo

      try {
        const result = await acceptBidAndCreateEscrow(
          bid.id,
          job!.id,
          bid.freelancerAddress,
          bid.amount
        )

        // Update job and bid status
        const savedJobs = localStorage.getItem('jobs')
        if (savedJobs) {
          const jobs: Job[] = JSON.parse(savedJobs)
          const updatedJobs = jobs.map(j => {
            if (j.id === job!.id) {
              return {
                ...j,
                status: 'In Progress' as const,
                bids: j.bids?.map(b => 
                  b.id === bid.id 
                    ? { ...b, status: 'accepted' as const }
                    : { ...b, status: 'rejected' as const }
                )
              }
            }
            return j
          })
          localStorage.setItem('jobs', JSON.stringify(updatedJobs))

          // Store escrow details
          const escrowData = {
            id: Date.now().toString(),
            jobId: job!.id,
            jobTitle: job!.title,
            amount: bid.amount,
            freelancerAddress: bid.freelancerAddress,
            employerAddress: address,
            status: 'active',
            txHash: result,
            createdAt: new Date().toISOString()
          }

          const savedEscrows = localStorage.getItem('escrows')
          const escrows = savedEscrows ? JSON.parse(savedEscrows) : []
          escrows.push(escrowData)
          localStorage.setItem('escrows', JSON.stringify(escrows))

          toast.success('Bid accepted and escrow created!')
          router.push('/escrow')
        }
      } catch (error) {
        console.error('Blockchain escrow error:', error)
        
        // Demo mode - simulate escrow creation
        const savedJobs = localStorage.getItem('jobs')
        if (savedJobs) {
          const jobs: Job[] = JSON.parse(savedJobs)
          const updatedJobs = jobs.map(j => {
            if (j.id === job!.id) {
              return {
                ...j,
                status: 'In Progress' as const,
                bids: j.bids?.map(b => 
                  b.id === bid.id 
                    ? { ...b, status: 'accepted' as const }
                    : { ...b, status: 'rejected' as const }
                )
              }
            }
            return j
          })
          localStorage.setItem('jobs', JSON.stringify(updatedJobs))

          // Store escrow details (demo)
          const escrowData = {
            id: Date.now().toString(),
            jobId: job!.id,
            jobTitle: job!.title,
            amount: bid.amount,
            freelancerAddress: bid.freelancerAddress,
            employerAddress: address,
            status: 'active',
            txHash: 'demo_escrow_' + Date.now(),
            createdAt: new Date().toISOString()
          }

          const savedEscrows = localStorage.getItem('escrows')
          const escrows = savedEscrows ? JSON.parse(savedEscrows) : []
          escrows.push(escrowData)
          localStorage.setItem('escrows', JSON.stringify(escrows))

          toast.success('Bid accepted! Escrow created (demo mode)')
          router.push('/escrow')
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to accept bid')
    } finally {
      setAccepting(false)
    }
  }

  const handleRejectBid = (bid: Bid) => {
    const savedJobs = localStorage.getItem('jobs')
    if (savedJobs) {
      const jobs: Job[] = JSON.parse(savedJobs)
      const updatedJobs = jobs.map(j => {
        if (j.id === job!.id) {
          return {
            ...j,
            bids: j.bids?.map(b => 
              b.id === bid.id ? { ...b, status: 'rejected' as const } : b
            )
          }
        }
        return j
      })
      localStorage.setItem('jobs', JSON.stringify(updatedJobs))
      setJob(updatedJobs.find(j => j.id === jobId) || null)
      toast.success('Bid rejected')
    }
  }

  if (!job) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors ${
        isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
      }`}>
        <div className={`max-w-md w-full p-8 rounded-2xl backdrop-blur-sm text-center ${
          isDarkMode
            ? 'bg-white/5 border border-white/10'
            : 'bg-gray-50 border border-gray-200'
        }`}>
          <h1 className="text-2xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Job not found
          </h1>
          <button
            onClick={() => router.push('/jobs')}
            className="w-full px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold transition-all hover:scale-105 shadow-lg shadow-primary/20"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    )
  }

  const isEmployer = role === 'EMPLOYER' && job.employer === address
  const pendingBids = job.bids?.filter(b => b.status === 'pending') || []
  const acceptedBid = job.bids?.find(b => b.status === 'accepted')

  return (
    <div className={`min-h-screen transition-colors ${
      isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
    }`}>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <button
          onClick={() => router.push('/jobs')}
          className={`mb-6 px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg inline-flex items-center gap-2 ${
            isDarkMode
              ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
              : 'bg-white border border-gray-200 text-gray-900 hover:bg-gray-50'
          }`}
        >
          ← Back to Jobs
        </button>

        <div className={`p-8 rounded-2xl backdrop-blur-sm transition-all mb-6 ${
          isDarkMode
            ? 'bg-white/5 border border-white/10'
            : 'bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20'
        }`}>
          <div className="flex justify-between items-start gap-4 mb-8 flex-wrap">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {job.title}
            </h1>
            <span className={`px-4 py-2 rounded-lg text-sm font-semibold uppercase tracking-wide ${
              job.status === 'Open'
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30'
                : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30'
            }`}>
              {job.status}
            </span>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6 rounded-xl backdrop-blur-sm mb-8 ${
            isDarkMode
              ? 'bg-white/5 border border-white/10'
              : 'bg-white/50 border border-primary/10'
          }`}>
            <div className="flex flex-col gap-2">
              <span className={`text-sm font-medium uppercase tracking-wide ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Budget Range
              </span>
              <span className="text-2xl font-bold bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
                ${job.budgetMin} - ${job.budgetMax} USDM
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <span className={`text-sm font-medium uppercase tracking-wide ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Category
              </span>
              <span className={`text-2xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {job.category}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <span className={`text-sm font-medium uppercase tracking-wide ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Deadline
              </span>
              <span className={`text-2xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {new Date(job.deadline).toLocaleDateString()}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <span className={`text-sm font-medium uppercase tracking-wide ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Total Bids
              </span>
              <span className={`text-2xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {job.bids?.length || 0}
              </span>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-4 text-primary">Description</h3>
            <p className={`leading-relaxed text-lg ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {job.description}
            </p>
          </div>

          {job.kycRequired && (
            <div className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold shadow-lg shadow-green-500/30">
              🆔 KYC Required
            </div>
          )}
        </div>

        {/* Accepted Bid Section */}
        {acceptedBid && (
          <div className={`p-8 rounded-2xl backdrop-blur-sm transition-all mb-6 border-2 shadow-lg ${
            isDarkMode
              ? 'bg-green-500/10 border-green-500 shadow-green-500/20'
              : 'bg-gradient-to-br from-green-500/5 to-green-600/5 border-green-500 shadow-green-500/20'
          }`}>
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
              ✅ Accepted Bid
            </h2>
            <div className={`p-6 rounded-xl transition-all ${
              isDarkMode
                ? 'bg-white/5 border border-white/10'
                : 'bg-white border border-green-200'
            }`}>
              <div className={`flex justify-between items-center mb-6 pb-4 flex-wrap gap-4 border-b ${
                isDarkMode ? 'border-white/10' : 'border-gray-200'
              }`}>
                <div className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                  <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                    Freelancer:
                  </strong>{' '}
                  {acceptedBid.freelancerAddress.slice(0, 20)}...
                </div>
                <div className="text-3xl font-extrabold bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
                  ${acceptedBid.amount} USDM
                </div>
              </div>
              <div className="space-y-3">
                <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                  <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                    Delivery:
                  </strong>{' '}
                  {acceptedBid.deliveryDays} days
                </p>
                <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                  <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                    Proposal:
                  </strong>
                </p>
                <p className={`p-6 rounded-xl leading-relaxed ${
                  isDarkMode
                    ? 'bg-white/5 border border-white/10 text-gray-300'
                    : 'bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10 text-gray-700'
                }`}>
                  {acceptedBid.proposal}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bids Section - Only visible to employer */}
        {isEmployer && pendingBids.length > 0 && (
          <div className={`p-8 rounded-2xl backdrop-blur-sm transition-all mb-6 ${
            isDarkMode
              ? 'bg-white/5 border border-white/10'
              : 'bg-white/80 border border-primary/15'
          }`}>
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              📋 Pending Bids ({pendingBids.length})
            </h2>
            <div className="flex flex-col gap-6">
              {pendingBids.map(bid => (
                <div
                  key={bid.id}
                  className={`p-6 rounded-xl transition-all hover:scale-[1.02] ${
                    isDarkMode
                      ? 'bg-white/5 border border-white/10 hover:border-primary'
                      : 'bg-white border border-gray-200 hover:border-primary shadow-lg hover:shadow-xl'
                  }`}
                >
                  <div className={`flex justify-between items-center mb-6 pb-4 flex-wrap gap-4 border-b ${
                    isDarkMode ? 'border-white/10' : 'border-gray-200'
                  }`}>
                    <div className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                      <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                        Freelancer:
                      </strong>{' '}
                      {bid.freelancerAddress.slice(0, 20)}...
                    </div>
                    <div className="text-3xl font-extrabold bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
                      ${bid.amount} USDM
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                      <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                        Delivery Time:
                      </strong>{' '}
                      {bid.deliveryDays} days
                    </p>
                    <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                      <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                        Proposal:
                      </strong>
                    </p>
                    <p className={`p-6 rounded-xl leading-relaxed ${
                      isDarkMode
                        ? 'bg-white/5 border border-white/10 text-gray-300'
                        : 'bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10 text-gray-700'
                    }`}>
                      {bid.proposal}
                    </p>
                  </div>

                  <div className={`flex gap-4 pt-4 border-t ${
                    isDarkMode ? 'border-white/10' : 'border-gray-200'
                  }`}>
                    <button
                      onClick={() => handleAcceptBid(bid)}
                      disabled={accepting}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold transition-all hover:scale-105 shadow-lg shadow-primary/30 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {accepting ? 'Creating Escrow...' : 'Accept & Create Escrow'}
                    </button>
                    <button
                      onClick={() => handleRejectBid(bid)}
                      disabled={accepting}
                      className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg ${
                        isDarkMode
                          ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                      } disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100`}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No bids message */}
        {isEmployer && pendingBids.length === 0 && !acceptedBid && (
          <div className={`p-8 rounded-2xl backdrop-blur-sm text-center ${
            isDarkMode
              ? 'bg-white/5 border border-white/10'
              : 'bg-gray-50 border border-gray-200'
          }`}>
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              No bids yet. Freelancers will start submitting proposals soon.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
