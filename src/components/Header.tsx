import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useWallet } from '../contexts/WalletContext'
import WalletConnect from './WalletConnect'
import './Header.css'
import iconLogo from '../../icon.png'

export default function Header() {
  const { connected, address, balance, role } = useWallet()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  // Freelancer Navigation
  const freelancerNav = (
    <>
      <Link 
        to="/jobs" 
        className={`nav-link ${isActive('/jobs') ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      >
        Browse Jobs
      </Link>
      <Link 
        to="/freelancer/dashboard" 
        className={`nav-link ${isActive('/freelancer/dashboard') ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      >
        My Dashboard
      </Link>
      <Link 
        to="/freelancer/bids" 
        className={`nav-link ${isActive('/freelancer/bids') ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      >
        My Bids
      </Link>
      <Link 
        to="/freelancer/escrows" 
        className={`nav-link ${isActive('/freelancer/escrows') ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      >
        My Escrows
      </Link>
    </>
  )

  // Employer Navigation
  const employerNav = (
    <>
      <Link 
        to="/jobs" 
        className={`nav-link ${isActive('/jobs') ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      >
        Browse Talent
      </Link>
      <Link 
        to="/create-job" 
        className={`nav-link ${isActive('/create-job') ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      >
        Post Job
      </Link>
      <Link 
        to="/employer/dashboard" 
        className={`nav-link ${isActive('/employer/dashboard') ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      >
        My Dashboard
      </Link>
      <Link 
        to="/employer/jobs" 
        className={`nav-link ${isActive('/employer/jobs') ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      >
        My Jobs
      </Link>
      <Link 
        to="/employer/escrows" 
        className={`nav-link ${isActive('/employer/escrows') ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      >
        My Escrows
      </Link>
    </>
  )

  // Default Navigation (when not logged in or no role selected)
  const defaultNav = (
    <>
      <Link 
        to="/jobs" 
        className={`nav-link ${isActive('/jobs') ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      >
        Browse Jobs
      </Link>
      {connected && (
        <Link 
          to="/escrow" 
          className={`nav-link ${isActive('/escrow') ? 'active' : ''}`}
          onClick={() => setMobileMenuOpen(false)}
        >
          Escrows
        </Link>
      )}
    </>
  )

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          <img src={iconLogo} alt="DecentGigs" className="logo-icon" />
          <h1>DecentGigs</h1>
        </Link>

        <button 
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav className={`nav ${mobileMenuOpen ? 'nav-open' : ''}`}>
          {/* Show navigation based on role */}
          {connected && role === 'freelancer' && freelancerNav}
          {connected && role === 'employer' && employerNav}
          {(!connected || !role) && defaultNav}

          {/* Common links for all authenticated users */}
          {connected && (
            <>
              <Link 
                to="/profile" 
                className={`nav-link ${isActive('/profile') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Profile
              </Link>
              <Link 
                to="/kyc" 
                className={`nav-link ${isActive('/kyc') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                KYC Verification
              </Link>
            </>
          )}
        </nav>

        <div className="header-actions">
          {connected && (
            <>
              {role && (
                <div className="role-badge">
                  <span className={`role-indicator ${role}`}>
                    {role === 'employer' ? '👔 Employer' : '💼 Freelancer'}
                  </span>
                </div>
              )}
              <div className="wallet-info">
                <span className="balance">💎 {balance} ADA</span>
                <span className="address">{address?.substring(0, 10)}...</span>
              </div>
            </>
          )}
          <WalletConnect />
        </div>
      </div>
    </header>
  )
}
