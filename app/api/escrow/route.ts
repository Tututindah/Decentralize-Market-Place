import { NextRequest, NextResponse } from 'next/server'
import { escrowService } from '@/app/src/services/escrow.service'

// GET /api/escrow?jobId=xxx
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId is required' },
        { status: 400 }
      )
    }

    const escrow = await escrowService.getEscrowByJobId(jobId)

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
      employerId,
      freelancerId,
      amount,
      employerDid,
      freelancerDid,
      arbiterAddress,
      jobRef,
      policyId,
      assetName,
      scriptAddress
    } = body

    if (!txHash || !jobId || !employerId || !freelancerId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Default values for optional blockchain fields
    const USDM_POLICY_ID = "f96672ded25c90551d210e883099110f613e0e65012d5b88b68c51d0"
    const USDM_ASSET_NAME = "4d4f434b5f5553444d"

    const escrow = await escrowService.createEscrow({
      tx_hash: txHash,
      job_id: jobId,
      employer_id: employerId,
      employer_did: employerDid || `did:cardano:${employerId.substring(0, 16)}`,
      freelancer_id: freelancerId,
      freelancer_did: freelancerDid || `did:cardano:${freelancerId.substring(0, 16)}`,
      arbiter_address: arbiterAddress || '',
      job_ref: jobRef || jobId,
      amount,
      policy_id: policyId || USDM_POLICY_ID,
      asset_name: assetName || USDM_ASSET_NAME,
      script_address: scriptAddress || null,
      status: 'LOCKED'
    })

    return NextResponse.json({ escrow })
  } catch (error: any) {
    console.error('Error creating escrow:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create escrow' },
      { status: 500 }
    )
  }
}

