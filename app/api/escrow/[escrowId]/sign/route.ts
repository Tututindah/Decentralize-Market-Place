import { NextRequest, NextResponse } from 'next/server'
import { escrowService } from '@/services/escrow.service'

// POST /api/escrow/[escrowId]/sign - Sign escrow release
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ escrowId: string }> }
) {
  try {
    const { escrowId } = await params
    const body = await request.json()
    const { signerRole } = body

    if (!signerRole || !['employer', 'freelancer', 'arbiter'].includes(signerRole)) {
      return NextResponse.json(
        { error: 'signerRole must be employer, freelancer, or arbiter' },
        { status: 400 }
      )
    }

    const escrow = await escrowService.signEscrowRelease(
      escrowId,
      signerRole as 'employer' | 'freelancer' | 'arbiter'
    )

    // Check if we can release now
    const canRelease = await escrowService.canReleaseEscrow(escrowId)

    return NextResponse.json({ escrow, canRelease })
  } catch (error: any) {
    console.error('Error signing escrow:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sign escrow' },
      { status: 500 }
    )
  }
}
