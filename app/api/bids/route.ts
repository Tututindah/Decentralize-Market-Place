import { NextRequest, NextResponse } from 'next/server'
import { proposalService } from '@/services/proposal.service'

// GET /api/bids?jobId=xxx or freelancerId=xxx
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const jobId = searchParams.get('jobId')
    const freelancerId = searchParams.get('freelancerId')

    if (!jobId && !freelancerId) {
      return NextResponse.json(
        { error: 'jobId or freelancerId is required' },
        { status: 400 }
      )
    }

    const bids = jobId
      ? await proposalService.getJobProposals(jobId)
      : await proposalService.getFreelancerProposals(freelancerId!)

    return NextResponse.json({ bids })
  } catch (error: any) {
    console.error('Error fetching bids:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch bids' },
      { status: 500 }
    )
  }
}

// POST /api/bids - Submit bid
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobId, freelancerId, freelancerDid, proposalData } = body

    if (!jobId || !freelancerId || !freelancerDid || !proposalData) {
      return NextResponse.json(
        { error: 'jobId, freelancerId, freelancerDid, and proposalData are required' },
        { status: 400 }
      )
    }

    const bid = await proposalService.submitProposal(
      jobId,
      freelancerId,
      freelancerDid,
      proposalData
    )

    return NextResponse.json({ bid })
  } catch (error: any) {
    console.error('Error submitting bid:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to submit bid' },
      { status: 500 }
    )
  }
}
