import { Link } from 'react-router-dom'
import { useWallet } from '../contexts/WalletContext'
import './HomePage.css'

export default function HomePage() {
  const { connected } = useWallet()

  return (
    <div className="min-h-screen bg-background">
      <section className="text-center py-20 px-4">
        <h1 className="text-6xl font-bold mb-6 text-gradient animate-pulse-slow">
          🚀 Welcome to DecentGigs
        </h1>
        <p className="text-3xl font-semibold mb-4 text-foreground">
          Decentralized Freelance Platform on Cardano
        </p>
        <p className="text-xl text-muted-foreground mb-12">
          Secure escrow • Multi-signature • KYC verification • On-chain reputation
        </p>

        <div className="flex gap-4 justify-center items-center flex-wrap">
          {!connected ? (
            <p className="text-xl text-warning animate-pulse">👆 Connect your wallet to get started</p>
          ) : (
            <>
              <Link 
                to="/jobs" 
                className="px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-all transform hover:scale-105 hover:shadow-xl"
              >
                Browse Jobs
              </Link>
              <Link 
                to="/create-job" 
                className="px-8 py-4 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold rounded-lg transition-all transform hover:scale-105 hover:shadow-xl"
              >
                Post a Job
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="features">
        <h2>Platform Features</h2>
        <div className="grid grid-3">
          <div className="feature-card card">
            <div className="feature-icon">🔒</div>
            <h3>Multi-Sig Escrow</h3>
            <p>Funds locked with 3-party control: Client, Freelancer, Arbiter</p>
            <ul>
              <li>✅ Release: Client + Freelancer</li>
              <li>↩️ Refund: Client + Arbiter</li>
              <li>⚖️ Arbiter Release: Freelancer + Arbiter</li>
            </ul>
          </div>

          <div className="feature-card card">
            <div className="feature-icon">🎯</div>
            <h3>On-Chain Reputation</h3>
            <p>Transparent reputation system stored on Cardano blockchain</p>
            <ul>
              <li>📊 Completion rate tracking</li>
              <li>⭐ Rating system</li>
              <li>🏆 Trust badges</li>
            </ul>
          </div>

          <div className="feature-card card">
            <div className="feature-icon">🆔</div>
            <h3>KYC with Atala PRISM</h3>
            <p>Decentralized identity verification using DIDs</p>
            <ul>
              <li>🔐 Self-sovereign identity</li>
              <li>✅ Verifiable credentials</li>
              <li>🌐 Privacy-preserving</li>
            </ul>
          </div>

          <div className="feature-card card">
            <div className="feature-icon">💎</div>
            <h3>USDM Payments</h3>
            <p>Stablecoin payments for predictable pricing</p>
            <ul>
              <li>💰 No volatility risk</li>
              <li>⚡ Fast settlements</li>
              <li>🌍 Global access</li>
            </ul>
          </div>

          <div className="feature-card card">
            <div className="feature-icon">📝</div>
            <h3>Smart Contracts</h3>
            <p>Automated escrow with Aiken validators</p>
            <ul>
              <li>🔒 Trustless execution</li>
              <li>⚡ Gas efficient</li>
              <li>🛡️ Battle-tested</li>
            </ul>
          </div>

          <div className="feature-card card">
            <div className="feature-icon">🌐</div>
            <h3>Decentralized</h3>
            <p>No central authority or intermediaries</p>
            <ul>
              <li>🔓 Open source</li>
              <li>🌍 Permissionless</li>
              <li>🚫 No platform fees</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="stats">
        <h2>Platform Statistics</h2>
        <div className="grid grid-3">
          <div className="stat-card card">
            <div className="stat-value">127</div>
            <div className="stat-label">Active Jobs</div>
          </div>
          <div className="stat-card card">
            <div className="stat-value">1,543</div>
            <div className="stat-label">Total Escrows</div>
          </div>
          <div className="stat-card card">
            <div className="stat-value">$2.4M</div>
            <div className="stat-label">Volume Processed</div>
          </div>
        </div>
      </section>
    </div>
  )
}
