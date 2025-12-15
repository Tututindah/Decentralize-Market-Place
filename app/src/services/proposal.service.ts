import { supabase } from '@/app/src/lib/supabase';
import { Database } from '@/app/src/lib/database.types';

type Proposal = Database['public']['Tables']['proposals']['Row'];
type ProposalInsert = Database['public']['Tables']['proposals']['Insert'];
type ProposalUpdate = Database['public']['Tables']['proposals']['Update'];

export class ProposalService {
  async createProposal(proposalData: Omit<ProposalInsert, 'id' | 'created_at' | 'updated_at'>): Promise<Proposal> {
    const { data, error } = await supabase
      .from('proposals')
      .insert(proposalData as any)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create proposal: ${error.message}`);
    }

    return data!;
  }

  async getProposalById(proposalId: string): Promise<Proposal | null> {
    const { data, error } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', proposalId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get proposal: ${error.message}`);
    }

    return data;
  }

  async getProposalsByJob(jobId: string): Promise<Proposal[]> {
    const { data, error } = await supabase
      .from('proposals')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get proposals: ${error.message}`);
    }

    return data || [];
  }

  async getProposalsByFreelancer(freelancerId: string): Promise<Proposal[]> {
    const { data, error } = await supabase
      .from('proposals')
      .select('*')
      .eq('freelancer_id', freelancerId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get proposals: ${error.message}`);
    }

    return data || [];
  }

  async updateProposal(proposalId: string, updates: ProposalUpdate): Promise<Proposal> {
    const { data, error } = await supabase
      .from('proposals')
      .update(updates)
      .eq('id', proposalId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update proposal: ${error.message}`);
    }

    return data!;
  }

  async acceptProposal(proposalId: string): Promise<Proposal> {
    // First, get the proposal to find the job
    const proposal = await this.getProposalById(proposalId);
    if (!proposal) {
      throw new Error('Proposal not found');
    }

    // Reject all other proposals for this job
    await supabase
      .from('proposals')
      .update({ status: 'rejected' })
      .eq('job_id', proposal.job_id)
      .neq('id', proposalId);

    // Accept this proposal
    return this.updateProposal(proposalId, { status: 'accepted' });
  }

  async rejectProposal(proposalId: string): Promise<Proposal> {
    return this.updateProposal(proposalId, { status: 'rejected' });
  }

  async deleteProposal(proposalId: string): Promise<void> {
    const { error } = await supabase
      .from('proposals')
      .delete()
      .eq('id', proposalId);

    if (error) {
      throw new Error(`Failed to delete proposal: ${error.message}`);
    }
  }

  // Alias methods for backwards compatibility
  async getJobProposals(jobId: string): Promise<Proposal[]> {
    return this.getProposalsByJob(jobId);
  }

  async getFreelancerProposals(freelancerId: string): Promise<Proposal[]> {
    return this.getProposalsByFreelancer(freelancerId);
  }

  async submitProposal(proposalData: Omit<ProposalInsert, 'id' | 'created_at' | 'updated_at'>): Promise<Proposal> {
    return this.createProposal(proposalData);
  }

  // Withdraw proposal
  async withdrawProposal(proposalId: string): Promise<void> {
    return this.deleteProposal(proposalId);
  }
}

export const proposalService = new ProposalService();
