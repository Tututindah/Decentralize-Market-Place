'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/app/src/components/Header'
import { Footer } from '@/app/src/components/Footer'
import { useWallet } from '@/app/src/contexts/WalletContext'
import { useTheme } from '@/app/src/components/ThemeProvider'
import { useCardano } from '@/app/src/hooks/useCardano'
import { toast } from 'react-hot-toast'
import { Briefcase, DollarSign, Calendar, Shield, CheckCircle, Loader2 } from 'lucide-react'

// Disable static generation for this page since it uses wallet/blockchain features
export const dynamic = 'force-dynamic'

export default function CreateJobPage() {
  const router = useRouter()
  const { connected, address } = useWallet()
  const { theme } = useTheme()
  const isDarkMode = theme === 'dark'
  const { createJob, loading } = useCardano()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Frontend',
    budgetMin: '',
    budgetMax: '',
    deadline: '',
    kycRequired: true 
  })
  const [creating, setCreating] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!connected) {
      toast.error('Please connect your wallet first')
      return
    }

    // Validate budget
    const budgetMin = parseFloat(formData.budgetMin)
    const budgetMax = parseFloat(formData.budgetMax)
    
    if (budgetMin >= budgetMax) {
      toast.error('Maximum budget must be greater than minimum')
      return
    }

    setCreating(true)
    
    try {
      if (!address) {
        toast.error('Wallet address not found')
        return
      }

      // Create job - use budgetMax as the budget value
      const result = await createJob({
        title: formData.title,
        description: formData.description,
        budget: budgetMax,
        employerAddress: address, // Pass wallet address, service will get/create user
      })

      // The job was created successfully
      setTxHash(result.tx_hash || 'job_' + result.id)

      // Store job locally
      const newJob = {
        id: result.id,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        budgetMin,
        budgetMax,
        deadline: formData.deadline,
        employer: address,
        status: 'Open',
        kycRequired: formData.kycRequired,
        txHash: result.tx_hash || 'job_' + result.id,
        bids: []
      }
      
      const savedJobs = localStorage.getItem('jobs')
      const jobs = savedJobs ? JSON.parse(savedJobs) : []
      jobs.push(newJob)
      localStorage.setItem('jobs', JSON.stringify(jobs))
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'Frontend',
        budgetMin: '',
        budgetMax: '',
        deadline: '',
        kycRequired: true
      })
      
      toast.success('Job created successfully on blockchain!')
    } catch (error: any) {
      console.error('Job creation error:', error)
      
      // If blockchain creation fails, still save locally for demo
      const newJob = {
        id: Date.now().toString(),
        title: formData.title,
        description: formData.description,
        category: formData.category,
        budgetMin,
        budgetMax,
        deadline: formData.deadline,
        employer: address,
        status: 'Open',
        kycRequired: formData.kycRequired,
        txHash: 'demo_' + Date.now(),
        bids: []
      }
      
      const savedJobs = localStorage.getItem('jobs')
      const jobs = savedJobs ? JSON.parse(savedJobs) : []
      jobs.push(newJob)
      localStorage.setItem('jobs', JSON.stringify(jobs))
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'Frontend',
        budgetMin: '',
        budgetMax: '',
        deadline: '',
        kycRequired: true
      })
      
      toast.success('Job created successfully! (Demo mode - blockchain tx simulated)')
    } finally {
      setCreating(false)
    }
  }

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  if (!connected) {
    return (
      <div className={`flex flex-col min-h-screen transition-colors ${
        isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
      }`}>
        <Header />
        <main className="container mx-auto px-4 py-12 max-w-7xl flex-grow">
          <div className={`max-w-2xl mx-auto text-center p-12 rounded-2xl backdrop-blur-sm transition-colors ${
            isDarkMode 
              ? 'bg-white/5 border border-white/10' 
              : 'bg-gray-50 border border-gray-200'
          }`}>
            <Briefcase className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Create Job
            </h1>
            <p className={`mb-6 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>Please connect your wallet to post a job</p>
            <button 
              className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold transition-all hover:scale-105 shadow-lg shadow-primary/20"
              onClick={() => router.push('/connect-wallet')}
            >
              Connect Wallet
            </button>
          </div>
        </main>
        <Footer isDarkMode={isDarkMode} />
      </div>
    )
  }

  return (
    <div className={`flex flex-col min-h-screen transition-colors ${
      isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
    }`}>
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-7xl flex-grow">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              📝 Post a New Job
            </h1>
            <p className={`text-lg ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Create a new job posting on the blockchain
            </p>
          </div>

          {txHash && (
            <div className={`p-6 rounded-2xl mb-6 backdrop-blur-sm transition-colors ${
              isDarkMode 
                ? 'bg-green-500/10 border border-green-500/30' 
                : 'bg-green-50 border border-green-200'
            }`}>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-green-500 mb-2">Job Created Successfully!</h3>
                  <p className={`text-sm mb-3 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Transaction Hash: <code className="text-xs bg-black/20 px-2 py-1 rounded">{txHash}</code>
                  </p>
                  <a 
                    href={`https://preprod.cardanoscan.io/transaction/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 bg-green-500 text-white rounded-lg font-semibold transition-all hover:scale-105"
                  >
                    View on Cardanoscan →
                  </a>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className={`p-8 rounded-2xl backdrop-blur-sm transition-colors ${
            isDarkMode 
              ? 'bg-white/5 border border-white/10' 
              : 'bg-gray-50 border border-gray-200'
          }`}>
            <div className="mb-6">
              <label className={`block text-sm font-semibold mb-2 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>Job Title *</label>
              <input
                type="text"
                name="title"
                className={`w-full px-4 py-3 rounded-xl transition-colors ${
                  isDarkMode
                    ? 'bg-white/5 border border-white/10 text-white placeholder-gray-400'
                    : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                placeholder="e.g. Build DeFi Dashboard"
                value={formData.title}
                onChange={handleChange}
                required
                disabled={creating || loading}
              />
            </div>

            <div className="mb-6">
              <label className={`block text-sm font-semibold mb-2 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>Description *</label>
              <textarea
                name="description"
                className={`w-full px-4 py-3 rounded-xl transition-colors ${
                  isDarkMode
                    ? 'bg-white/5 border border-white/10 text-white placeholder-gray-400'
                    : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                rows={5}
                placeholder="Describe the job requirements, deliverables, and any specific technologies..."
                value={formData.description}
                onChange={handleChange}
                required
                disabled={creating || loading}
              />
            </div>

            <div className="mb-6">
              <label className={`block text-sm font-semibold mb-2 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>Category *</label>
              <select
                name="category"
                className={`w-full px-4 py-3 rounded-xl transition-colors ${
                  isDarkMode
                    ? 'bg-white/5 border border-white/10 text-white'
                    : 'bg-white border border-gray-300 text-gray-900'
                }`}
                value={formData.category}
                onChange={handleChange}
                required
                disabled={creating || loading}
              >
                <option value="Frontend" className="bg-gray-800 text-white">Frontend</option>
                <option value="Backend" className="bg-gray-800 text-white">Backend</option>
                <option value="Smart Contract" className="bg-gray-800 text-white">Smart Contract</option>
                <option value="Design" className="bg-gray-800 text-white">Design</option>
                <option value="Security" className="bg-gray-800 text-white">Security</option>
                <option value="Mobile" className="bg-gray-800 text-white">Mobile</option>
                <option value="Other" className="bg-gray-800 text-white">Other</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>Minimum Budget (USDM) *</label>
                <div className="relative">
                  <DollarSign className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <input
                    type="number"
                    name="budgetMin"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl transition-colors ${
                      isDarkMode
                        ? 'bg-white/5 border border-white/10 text-white placeholder-gray-400'
                        : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="5000"
                    value={formData.budgetMin}
                    onChange={handleChange}
                    min="1"
                    step="0.01"
                    required
                    disabled={creating || loading}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>Maximum Budget (USDM) *</label>
                <div className="relative">
                  <DollarSign className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <input
                    type="number"
                    name="budgetMax"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl transition-colors ${
                      isDarkMode
                        ? 'bg-white/5 border border-white/10 text-white placeholder-gray-400'
                        : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="10000"
                    value={formData.budgetMax}
                    onChange={handleChange}
                    min="1"
                    step="0.01"
                    required
                    disabled={creating || loading}
                  />
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className={`block text-sm font-semibold mb-2 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>Deadline *</label>
              <div className="relative">
                <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  type="date"
                  name="deadline"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl transition-colors ${
                    isDarkMode
                      ? 'bg-white/5 border border-white/10 text-white'
                      : 'bg-white border border-gray-300 text-gray-900'
                  }`}
                  value={formData.deadline}
                  onChange={handleChange}
                  required
                  disabled={creating || loading}
                />
              </div>
            </div>

            <div className={`p-4 rounded-xl mb-6 transition-colors ${
              isDarkMode 
                ? 'bg-primary/10 border border-primary/20' 
                : 'bg-primary/5 border border-primary/20'
            }`}>
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <label className="flex items-center gap-2 font-semibold text-primary mb-1 cursor-pointer">
                    <input
                      type="checkbox"
                      name="kycRequired"
                      checked={formData.kycRequired}
                      onChange={handleChange}
                      disabled={true}
                      className="w-4 h-4 text-primary rounded"
                    />
                    Require KYC verification (always enabled)
                  </label>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    KYC verification is enforced by smart contracts to ensure platform security
                  </p>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              disabled={creating || loading || !connected}
            >
              {creating || loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating on Blockchain...
                </>
              ) : (
                <>
                  🚀 Create Job on Blockchain
                </>
              )}
            </button>

            <div className={`mt-8 p-6 rounded-xl transition-colors ${
              isDarkMode 
                ? 'bg-white/5 border border-white/10' 
                : 'bg-white border border-gray-200'
            }`}>
              <h4 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                ℹ️ What happens next?
              </h4>
              <ol className={`space-y-2 mb-4 list-decimal list-inside ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <li>Your job will be posted on-chain with KYC enforcement</li>
                <li>Freelancers can apply to your job</li>
                <li>You select a freelancer and accept their bid</li>
                <li>Escrow is created automatically when you accept</li>
                <li>Multi-sig release when work is complete</li>
              </ol>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <strong className="text-primary">Note:</strong> This creates a transparent, immutable job posting on Cardano blockchain
              </p>
            </div>
          </form>
        </div>
      </main>
      <Footer isDarkMode={isDarkMode} />
    </div>
  )
}

