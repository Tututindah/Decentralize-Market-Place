import { NextRequest, NextResponse } from 'next/server'
import { escrowService } from '@/services/escrow.service'

// GET /api/escrow?jobId=xxx or bidId=xxx
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const jobId = searchParams.get('jobId')
    const bidId = searchParams.get('bidId')

    if (!jobId && !bidId) {
      return NextResponse.json(
        { error: 'jobId or bidId is required' },
        { status: 400 }
      )
    }

    const escrow = jobId
      ? await escrowService.getEscrowByJobId(jobId)
      : await escrowService.getEscrowByBidId(bidId!)

    if (!escrow) {
      return NextResponse.json(
        { error: 'Escrow not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ escrow })
  } catch (error: any) {
    console.error('Error fetching escrow:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch escrow' },
      { status: 500 }
    )
  }
}

// POST /api/escrow - Create escrow
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      txHash,
      jobId,
      bidId,
      employerId,
      employerDid,
      freelancerId,
      freelancerDid,
      amount,
      policyId,
      assetName,
      arbiterAddress,
      jobRef
    } = body

    if (!txHash || !jobId || !bidId || !employerId || !employerDid || 
        !freelancerId || !freelancerDid || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const escrow = await escrowService.createEscrow(
      txHash,
      jobId,
      bidId,
      employerId,
      employerDid,
      freelancerId,
      freelancerDid,
      amount,
      policyId,
      assetName,
      arbiterAddress,
      jobRef
    )

    return NextResponse.json({ escrow })
  } catch (error: any) {
    console.error('Error creating escrow:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create escrow' },
      { status: 500 }
    )
  }
}
