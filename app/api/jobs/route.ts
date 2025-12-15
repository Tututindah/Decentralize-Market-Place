import { NextRequest, NextResponse } from 'next/server'
import { jobService } from '@/services/job.service'

// GET /api/jobs - Get all jobs with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const filters: any = {}

    if (searchParams.has('status')) filters.status = searchParams.get('status')
    if (searchParams.has('category')) filters.category = searchParams.get('category')
    if (searchParams.has('employerId')) filters.employerId = searchParams.get('employerId')
    if (searchParams.has('kycRequired')) filters.kycRequired = searchParams.get('kycRequired') === 'true'

    const jobs = await jobService.getJobs(filters)
    return NextResponse.json({ jobs })
  } catch (error: any) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch jobs' },
      { status: 500 }
    )
  }
}

// POST /api/jobs - Create job
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employerId, employerDid, jobData } = body

    if (!employerId || !employerDid || !jobData) {
      return NextResponse.json(
        { error: 'employerId, employerDid, and jobData are required' },
        { status: 400 }
      )
    }

    const job = await jobService.createJob(employerId, employerDid, jobData)
    return NextResponse.json({ job })
  } catch (error: any) {
    console.error('Error creating job:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create job' },
      { status: 500 }
    )
  }
}
