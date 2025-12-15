import { NextRequest, NextResponse } from 'next/server'
import { jobService } from '@/app/src/services/job.service'

// GET /api/jobs - Get all jobs with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    // Get status filter
    const status = searchParams.get('status')
    if (status) {
      const jobs = await jobService.getJobsByStatus(status as any)
      return NextResponse.json({ jobs })
    }

    // Get employer jobs
    const employerId = searchParams.get('employerId')
    if (employerId) {
      const jobs = await jobService.getJobsByEmployer(employerId)
      return NextResponse.json({ jobs })
    }

    // Get freelancer jobs
    const freelancerId = searchParams.get('freelancerId')
    if (freelancerId) {
      const jobs = await jobService.getJobsByFreelancer(freelancerId)
      return NextResponse.json({ jobs })
    }

    // Get all jobs
    const jobs = await jobService.getJobs()
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
    const {
      title,
      description,
      budget_min,
      budget_max,
      employer_id,
      employer_did,
      job_id,
      description_hash,
      tx_hash,
      script_address
    } = body

    if (!title || !description || !budget_min || !budget_max || !employer_id) {
      return NextResponse.json(
        { error: 'title, description, budget_min, budget_max, and employer_id are required' },
        { status: 400 }
      )
    }

    const job = await jobService.createJob({
      title,
      description,
      budget_min,
      budget_max,
      employer_id,
      employer_did: employer_did || `did:cardano:${employer_id.substring(0, 16)}`,
      job_id: job_id || `JOB-${Date.now()}`,
      description_hash: description_hash || '',
      tx_hash: tx_hash || null,
      script_address: script_address || null,
      status: 'OPEN',
    })

    return NextResponse.json({ job })
  } catch (error: any) {
    console.error('Error creating job:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create job' },
      { status: 500 }
    )
  }
}

