import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'
import crypto from 'crypto'

type Job = Database['public']['Tables']['jobs']['Row']
type JobInsert = Database['public']['Tables']['jobs']['Insert']
type JobUpdate = Database['public']['Tables']['jobs']['Update']

export const jobService = {
  // Create a new job (will be posted on blockchain)
  async createJob(
    employerId: string,
    employerDid: string,
    jobData: {
      title: string
      description: string
      category?: string
      skills?: string[]
      budget_min: number
      budget_max: number
      deadline?: string
      kyc_required?: boolean
    }
  ): Promise<Job> {
    const timestamp = Date.now()
    const jobId = `JOB-${timestamp}`
    const descriptionHash = crypto.createHash('sha256').update(jobData.description).digest('hex')

    const insertData: JobInsert = {
      employer_id: employerId,
      employer_did: employerDid,
      job_id: jobId,
      title: jobData.title,
      description: jobData.description,
      description_hash: descriptionHash,
      category: jobData.category,
      skills: jobData.skills,
      budget_min: jobData.budget_min,
      budget_max: jobData.budget_max,
      deadline: jobData.deadline,
      currency: 'USDM',
      status: 'OPEN',
      is_active: true,
      kyc_required: jobData.kyc_required !== false
    }

    const { data, error } = await (supabase
      .from('jobs') as any)
      .insert(insertData)
      .select()
      .single()

    if (error) throw error
    return data!
  },

  // Update job with blockchain transaction hash
  async updateJobBlockchainTx(jobId: string, txHash: string, utxoRef?: string, scriptAddress?: string): Promise<Job> {
    const updateData: JobUpdate = {
      tx_hash: txHash,
      utxo_ref: utxoRef,
      script_address: scriptAddress
    }

    const { data, error } = await (supabase
      .from('jobs') as any)
      .update(updateData)
      .eq('id', jobId)
      .select()
      .single()

    if (error) throw error
    return data!
  },

  // Get all jobs with filters
  async getJobs(filters?: {
    status?: string
    category?: string
    employerId?: string
  }): Promise<Job[]> {
    let query = supabase.from('jobs').select('*, users!jobs_employer_id_fkey(wallet_address, reputation_score)')

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.category) {
      query = query.eq('category', filters.category)
    }
    if (filters?.employerId) {
      query = query.eq('employer_id', filters.employerId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data as any[]
  },

  // Get job by ID
  async getJobById(jobId: string): Promise<Job | null> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*, users!jobs_employer_id_fkey(wallet_address, reputation_score, profile_data)')
      .eq('id', jobId)
      .single()

    if (error) return null
    return data as any
  },

  // Update job status
  async updateJobStatus(
    jobId: string,
    status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'CLOSED'
  ): Promise<Job> {
    const updateData: JobUpdate = {
      status,
      is_active: status === 'OPEN',
      closed_at: status === 'CLOSED' || status === 'COMPLETED' || status === 'CANCELLED' ? new Date().toISOString() : undefined
    }

    const { data, error } = await (supabase
      .from('jobs') as any)
      .update(updateData)
      .eq('id', jobId)
      .select()
      .single()

    if (error) throw error
    return data!
  },

  // Get jobs by employer
  async getEmployerJobs(employerId: string): Promise<Job[]> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('employer_id', employerId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Search jobs
  async searchJobs(searchTerm: string): Promise<Job[]> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .eq('status', 'open')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }
}
