import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useState } from 'react'
import { ThemeProvider } from './components/ThemeProvider'
import { Landing } from './components/Landing'
import Header from './components/Header'
import Footer from './components/Footer'
import WalletConnectPage from './pages/WalletConnectPage'
import RoleSelectionPage from './pages/RoleSelectionPage'
import JobsListingPage from './pages/JobsListingPage'
import JobDetailPage from './pages/JobDetailPage'
import CreateJobPage from './pages/CreateJobPage'
import ManageJobsPage from './pages/ManageJobsPage'
import SubmitProposalPage from './pages/SubmitProposalPage'
import ManageBidsPage from './pages/ManageBidsPage'
import EscrowPage from './pages/EscrowPage'
import ProfilePage from './pages/ProfilePage'
import KYCPage from './pages/KYCPage'
import FreelancerDashboard from './pages/FreelancerDashboard'
import EmployerDashboard from './pages/EmployerDashboard'
import { WalletProvider } from './contexts/WalletContext'
import { ChatProvider } from './contexts/ChatContext'
import ChatButton from './components/ChatButton'
import './index.css'

function AppContent() {
  const [showLanding, setShowLanding] = useState(true)

  const handleGetStarted = () => {
    setShowLanding(false)
    window.location.href = '/jobs'
  }

  const handleShowProfile = () => {
    setShowLanding(false)
  }

  const handleLearnMore = () => {
    console.log('Learn more clicked')
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={showLanding ? (
            <Landing
              onGetStarted={handleGetStarted}
              onLearnMore={handleLearnMore}
              onShowProfile={handleShowProfile}
            />
          ) : <Navigate to="/jobs" replace />} />

          {/* Wallet Connection (no header) */}
          <Route path="/connect-wallet" element={<WalletConnectPage />} />

          {/* Role Selection (no header) */}
          <Route path="/role-selection" element={<RoleSelectionPage />} />

          {/* All other pages with Header and Footer */}
          <Route path="/*" element={
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="container mx-auto px-4 py-8 max-w-7xl flex-grow">
                <Routes>
                  {/* Public routes */}
                  <Route path="/jobs" element={<JobsListingPage />} />
                  <Route path="/jobs/:jobId" element={<JobDetailPage />} />
                  <Route path="/jobs/:jobId/bid" element={<SubmitProposalPage />} />
                  
                  {/* Employer routes */}
                  <Route path="/employer/dashboard" element={<EmployerDashboard />} />
                  <Route path="/employer/jobs" element={<ManageJobsPage />} />
                  <Route path="/employer/escrows" element={<EscrowPage />} />
                  <Route path="/create-job" element={<CreateJobPage />} />
                  
                  {/* Freelancer routes */}
                  <Route path="/freelancer/dashboard" element={<FreelancerDashboard />} />
                  <Route path="/freelancer/bids" element={<ManageBidsPage />} />
                  <Route path="/freelancer/escrows" element={<EscrowPage />} />
                  
                  {/* Common routes */}
                  <Route path="/escrow" element={<EscrowPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/kyc" element={<KYCPage />} />
                </Routes>
              </main>
              <Footer />
              
              {/* Global chat button */}
              <ChatButton />
            </div>
          } />
        </Routes>
        
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid #475569',
              borderRadius: '0.5rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </BrowserRouter>
  )
}

function App() {
  return (
    <ThemeProvider>
      <WalletProvider>
        <ChatProvider>
          <AppContent />
        </ChatProvider>
      </WalletProvider>
    </ThemeProvider>
  )
}

export default App
