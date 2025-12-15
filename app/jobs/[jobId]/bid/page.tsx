'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SubmitProposalPage from '@/page-components/SubmitProposalPage'

export default function BidPage({ params: _params }: { params: { jobId: string } }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-7xl flex-grow">
        <SubmitProposalPage />
      </main>
      <Footer />
    </div>
  )
}
