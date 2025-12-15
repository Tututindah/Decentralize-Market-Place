import { NextRequest, NextResponse } from 'next/server'
import { escrowService } from '@/services/escrow.service'

// POST /api/escrow/[escrowId]/release - Release escrow funds
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ escrowId: string }> }
) {
  try {
    const { escrowId } = await params
    const body = await request.json()
    const { releaseTxHash } = body

    if (!releaseTxHash) {
      return NextResponse.json(
        { error: 'releaseTxHash is required' },
        { status: 400 }
      )
    }

    // Check if escrow can be released
    const canRelease = await escrowService.canReleaseEscrow(escrowId)
    if (!canRelease) {
      return NextResponse.json(
        { error: 'Escrow does not have enough signatures to release' },
        { status: 400 }
      )
    }

    const escrow = await escrowService.releaseEscrow(escrowId, releaseTxHash)
    return NextResponse.json({ escrow })
  } catch (error: any) {
    console.error('Error releasing escrow:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to release escrow' },
      { status: 500 }
    )
  }
}
