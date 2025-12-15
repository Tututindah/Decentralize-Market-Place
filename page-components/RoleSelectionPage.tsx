'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '../contexts/WalletContext'
import { motion } from 'framer-motion'
import { Briefcase, UserCheck } from 'lucide-react'
import './RoleSelection.css'

export default function RoleSelectionPage() {
  const { connected, address, role, createUserProfile } = useWallet()
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<'employer' | 'freelancer' | null>(role)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRoleSelect = (userRole: 'employer' | 'freelancer') => {
    setSelectedRole(userRole)
  }

  const handleContinue = async () => {
    if (selectedRole && address) {
      setLoading(true)
      setError(null)
      try {
        // Create user profile in backend with selected role
        await createUserProfile(address, selectedRole)
        
        // Redirect based on role
        if (selectedRole === 'employer') {
          router.push('/employer/dashboard')
        } else {
          router.push('/freelancer/dashboard')
        }
      } catch (err) {
        console.error('Error creating profile:', err)
        setError('Failed to create profile. Please try again.')
      } finally {
        setLoading(false)
      }
    }
  }

  if (!connected) {
    router.push('/connect-wallet')
    return null
  }

  return (
    <div className="role-selection-page">
      <div className="role-selection-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="role-selection-content"
        >
          <h1 className="role-selection-title">Choose Your Role</h1>
          <p className="role-selection-subtitle">
            Select how you want to use DecentGigs. You can change this later in your profile settings.
          </p>

          <div className="role-cards">
            <motion.div
              className={`role-card ${selectedRole === 'employer' ? 'selected' : ''}`}
              onClick={() => handleRoleSelect('employer')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="role-icon employer">
                <Briefcase size={48} />
              </div>
              <h2 className="role-card-title">I'm an Employer</h2>
              <p className="role-card-description">
                Post jobs, hire freelancers, and manage projects with secure escrow payments.
              </p>
              <ul className="role-features">
                <li>✓ Post unlimited job listings</li>
                <li>✓ Review freelancer bids</li>
                <li>✓ Manage escrow payments</li>
                <li>✓ Track project progress</li>
              </ul>
            </motion.div>

            <motion.div
              className={`role-card ${selectedRole === 'freelancer' ? 'selected' : ''}`}
              onClick={() => handleRoleSelect('freelancer')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="role-icon freelancer">
                <UserCheck size={48} />
              </div>
              <h2 className="role-card-title">I'm a Freelancer</h2>
              <p className="role-card-description">
                Find jobs, submit bids, and get paid securely through smart contract escrow.
              </p>
              <ul className="role-features">
                <li>✓ Browse available jobs</li>
                <li>✓ Submit competitive bids</li>
                <li>✓ Secure escrow payments</li>
                <li>✓ Build your reputation</li>
              </ul>
            </motion.div>
          </div>

          {error && (
            <div className="error-message" style={{ color: 'red', textAlign: 'center', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <motion.button
            className="continue-button"
            onClick={handleContinue}
            disabled={!selectedRole || loading}
            whileHover={{ scale: selectedRole && !loading ? 1.05 : 1 }}
            whileTap={{ scale: selectedRole && !loading ? 0.95 : 1 }}
          >
            {loading ? 'Creating Profile...' : `Continue as ${selectedRole ? (selectedRole === 'employer' ? 'Employer' : 'Freelancer') : '...'}`}
          </motion.button>

          <button 
            className="skip-button"
            onClick={() => router.push('/jobs')}
          >
            Skip for now
          </button>
        </motion.div>
      </div>
    </div>
  )
}
