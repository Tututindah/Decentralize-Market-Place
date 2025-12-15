import { supabase } from '@/app/src/lib/supabase';
import { Database } from '@/app/src/lib/database.types';

type Job = Database['public']['Tables']['jobs']['Row'];
type JobInsert = Database['public']['Tables']['jobs']['Insert'];
type JobUpdate = Database['public']['Tables']['jobs']['Update'];

export class JobService {
  async createJob(jobData: Omit<JobInsert, 'id' | 'created_at' | 'updated_at'>): Promise<Job> {
    const { data, error } = await supabase
      .from('jobs')
      .insert(jobData as any)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create job: ${error.message}`);
    }

    return data!;
  }

  async getJobById(jobId: string): Promise<Job | null> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get job: ${error.message}`);
    }

    return data;
  }

  async getAllJobs(): Promise<any[]> {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        employer:users!employer_id (
          id,
          wallet_address,
          username,
          reputation_score,
          trust_score
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get jobs: ${error.message}`);
    }

    // Transform the data to match the expected format
    return (data || []).map(job => ({
      ...job,
      employer: job.employer ? {
        id: job.employer.id,
        walletAddress: job.employer.wallet_address,
        username: job.employer.username,
        reputation: job.employer.reputation_score || 0,
        trustScore: job.employer.trust_score || 0
      } : null
    }));
  }

  async getJobsByStatus(status: Job['status']): Promise<any[]> {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        employer:users!employer_id (
          id,
          wallet_address,
          username,
          reputation_score,
          trust_score
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get jobs: ${error.message}`);
    }

    // Transform the data to match the expected format
    return (data || []).map(job => ({
      ...job,
      employer: job.employer ? {
        id: job.employer.id,
        walletAddress: job.employer.wallet_address,
        username: job.employer.username,
        reputation: job.employer.reputation_score || 0,
        trustScore: job.employer.trust_score || 0
      } : null
    }));
  }

  async getJobsByEmployer(employerId: string): Promise<Job[]> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('employer_id', employerId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get jobs: ${error.message}`);
    }

    return data || [];
  }

  async getJobsByFreelancer(freelancerId: string): Promise<Job[]> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('freelancer_id', freelancerId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get jobs: ${error.message}`);
    }

    return data || [];
  }

  async updateJob(jobId: string, updates: JobUpdate): Promise<Job> {
    const { data, error } = await supabase
      .from('jobs')
      .update(updates)
      .eq('id', jobId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update job: ${error.message}`);
    }

    return data!;
  }

  async assignFreelancer(jobId: string, freelancerId: string): Promise<Job> {
    return this.updateJob(jobId, { 
      freelancer_id: freelancerId,
      status: 'in-progress'
    });
  }

  async updateJobStatus(
    jobId: string,
    status: Job['status'],
    freelancerId?: string,
    escrowTxHash?: string
  ): Promise<Job> {
    const updates: any = { status };

    if (freelancerId) {
      updates.freelancer_id = freelancerId;
    }

    if (escrowTxHash) {
      updates.tx_hash = escrowTxHash;
    }

    return this.updateJob(jobId, updates);
  }

  // Alias method for backwards compatibility
  async getJobs(): Promise<Job[]> {
    return this.getAllJobs();
  }

  async updateEscrowTxHash(jobId: string, txHash: string): Promise<Job> {
    return this.updateJob(jobId, { tx_hash: txHash });
  }

  async deleteJob(jobId: string): Promise<void> {
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId);

    if (error) {
      throw new Error(`Failed to delete job: ${error.message}`);
    }
  }
}

export const jobService = new JobService();
