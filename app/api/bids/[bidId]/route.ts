import { NextRequest, NextResponse } from 'next/server'
import { proposalService } from '@/app/src/services/proposal.service';

// GET /api/bids/[bidId]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ bidId: string }> }
) {
  try {
    const { bidId } = await params
    const bid = await proposalService.getProposalById(bidId)
    
    if (!bid) {
      return NextResponse.json(
        { error: 'Bid not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ bid })
  } catch (error: any) {
    console.error('Error fetching bid:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch bid' },
      { status: 500 }
    )
  }
}

// PATCH /api/bids/[bidId] - Accept/reject/withdraw bid
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ bidId: string }> }
) {
  try {
    const { bidId } = await params
    const body = await request.json()
    const { action } = body

    if (!action || !['accept', 'reject', 'withdraw'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be accept, reject, or withdraw' },
        { status: 400 }
      )
    }

    let bid
    if (action === 'accept') {
      bid = await proposalService.acceptProposal(bidId)
    } else if (action === 'reject') {
      bid = await proposalService.rejectProposal(bidId)
    } else {
      bid = await proposalService.withdrawProposal(bidId)
    }

    return NextResponse.json({ bid })
  } catch (error: any) {
    console.error('Error updating bid:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update bid' },
      { status: 500 }
    )
  }
}
