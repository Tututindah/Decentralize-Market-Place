'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import JobDetailPage from '@/page-components/JobDetailPage'

export default function JobDetail({ params: _params }: { params: { jobId: string } }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-7xl flex-grow">
        <JobDetailPage />
      </main>
      <Footer />
    </div>
  )
}
