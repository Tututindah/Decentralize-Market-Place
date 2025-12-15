import { useState } from 'react'
import { useWallet } from '../contexts/WalletContext'
import { useCardano } from '../hooks/useCardano'
import { toast } from 'react-hot-toast'
import './CreateJobPage.css'

export default function CreateJobPage() {
  const { connected, address } = useWallet()
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
      // Get user's DID (in production, fetch from backend)
      const clientDid = localStorage.getItem('userDid') || 'did:prism:employer123'
      
      // Create job on blockchain
      const result = await createJob({
        title: formData.title,
        description: formData.description,
        budgetMin,
        budgetMax,
        deadline: new Date(formData.deadline),
        clientDid,
      })
      
      setTxHash(result.txHash)
      
      // Store job locally
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
        txHash: result.txHash,
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
      <div className="create-job-page">
        <div className="card">
          <h1>Create Job</h1>
          <p>Please connect your wallet to post a job</p>
          <button 
            className="btn btn-primary"
            onClick={() => window.location.href = '/connect-wallet'}
          >
            Connect Wallet
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="create-job-page">
      <h1>📝 Post a New Job</h1>

      {txHash && (
        <div className="card success-box">
          <h3>✅ Job Created Successfully!</h3>
          <p>Transaction Hash: <code>{txHash}</code></p>
          <a 
            href={`https://preprod.cardanoscan.io/transaction/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            View on Cardanoscan →
          </a>
        </div>
      )}

      <form onSubmit={handleSubmit} className="job-form card">
        <div className="form-group">
          <label className="form-label">Job Title *</label>
          <input
            type="text"
            name="title"
            className="form-input"
            placeholder="e.g. Build DeFi Dashboard"
            value={formData.title}
            onChange={handleChange}
            required
            disabled={creating || loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description *</label>
          <textarea
            name="description"
            className="form-textarea"
            rows={5}
            placeholder="Describe the job requirements, deliverables, and any specific technologies..."
            value={formData.description}
            onChange={handleChange}
            required
            disabled={creating || loading}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select
              name="category"
              className="form-select"
              value={formData.category}
              onChange={handleChange}
              required
              disabled={creating || loading}
            >
              <option value="Frontend">Frontend</option>
              <option value="Backend">Backend</option>
              <option value="Smart Contract">Smart Contract</option>
              <option value="Design">Design</option>
              <option value="Security">Security</option>
              <option value="Mobile">Mobile</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Minimum Budget (USDM) *</label>
            <input
              type="number"
              name="budgetMin"
              className="form-input"
              placeholder="5000"
              value={formData.budgetMin}
              onChange={handleChange}
              min="1"
              step="0.01"
              required
              disabled={creating || loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Maximum Budget (USDM) *</label>
            <input
              type="number"
              name="budgetMax"
              className="form-input"
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

        <div className="form-group">
          <label className="form-label">Deadline *</label>
          <input
            type="date"
            name="deadline"
            className="form-input"
            value={formData.deadline}
            onChange={handleChange}
            required
            disabled={creating || loading}
          />
        </div>

        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="kycRequired"
              checked={formData.kycRequired}
              onChange={handleChange}
              disabled={true}
            />
            <span>Require KYC verification (always enabled for security)</span>
          </label>
          <p className="form-help">
            KYC verification is enforced by smart contracts to ensure platform security
          </p>
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="btn btn-primary btn-large"
            disabled={creating || loading || !connected}
          >
            {creating || loading ? '⏳ Creating on Blockchain...' : '🚀 Create Job on Blockchain'}
          </button>
        </div>

        <div className="info-box">
          <h4>ℹ️ What happens next?</h4>
          <ol>
            <li>Your job will be posted on-chain with KYC enforcement</li>
            <li>Freelancers can apply to your job</li>
            <li>You select a freelancer and accept their bid</li>
            <li>Escrow is created automatically when you accept</li>
            <li>Multi-sig release when work is complete</li>
          </ol>
          <p><strong>Note:</strong> This creates a transparent, immutable job posting on Cardano blockchain</p>
        </div>
      </form>
    </div>
  )
}
