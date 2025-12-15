import { NextRequest, NextResponse } from 'next/server'
import { jobService } from '@/services/job.service'

// GET /api/jobs/[jobId]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params
    const job = await jobService.getJobById(jobId)
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ job })
  } catch (error: any) {
    console.error('Error fetching job:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch job' },
      { status: 500 }
    )
  }
}

// PATCH /api/jobs/[jobId] - Update job status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json(
        { error: 'status is required' },
        { status: 400 }
      )
    }

    const job = await jobService.updateJobStatus(jobId, status)
    return NextResponse.json({ job })
  } catch (error: any) {
    console.error('Error updating job:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update job' },
      { status: 500 }
    )
  }
}
