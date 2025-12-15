import { supabase } from '@/app/src/lib/supabase';
import { Database } from '@/app/src/lib/database.types';

type Escrow = Database['public']['Tables']['escrows']['Row'];
type EscrowInsert = Database['public']['Tables']['escrows']['Insert'];
type EscrowUpdate = Database['public']['Tables']['escrows']['Update'];

export class EscrowService {
  async createEscrow(data: Omit<EscrowInsert, 'id' | 'created_at' | 'updated_at'>): Promise<Escrow> {
    const { data: escrow, error } = await supabase
      .from('escrows')
      .insert(data as any)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create escrow: ${error.message}`);
    }

    return escrow!;
  }

  async getEscrowById(id: string): Promise<Escrow | null> {
    const { data, error } = await supabase
      .from('escrows')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get escrow: ${error.message}`);
    }

    return data;
  }

  async getEscrowByJobId(jobId: string): Promise<Escrow | null> {
    const { data, error } = await supabase
      .from('escrows')
      .select('*')
      .eq('job_id', jobId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get escrow: ${error.message}`);
    }

    return data;
  }

  async signRelease(escrowId: string, signerId: string): Promise<Escrow> {
    const escrow = await this.getEscrowById(escrowId);
    if (!escrow) {
      throw new Error('Escrow not found');
    }

    // TODO: signatures and threshold fields not in database schema yet
    const currentSignatures: string[] = []; // escrow.signatures || [];
    if (currentSignatures.includes(signerId)) {
      throw new Error('Already signed');
    }

    const newSignatures = [...currentSignatures, signerId];
    const updateData: any = {
      // signatures: newSignatures,
    };

    // Check if threshold met (using default threshold of 2)
    const threshold = 2;
    if (newSignatures.length >= threshold) {
      updateData.status = 'RELEASED';
      updateData.released_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('escrows')
      .update(updateData)
      .eq('id', escrowId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to sign release: ${error.message}`);
    }

    return data!;
  }

  async updateEscrowStatus(escrowId: string, status: 'CREATED' | 'LOCKED' | 'RELEASED' | 'DISPUTED' | 'REFUNDED'): Promise<Escrow> {
    const updateData: any = { status };

    if (status === 'RELEASED') {
      updateData.released_at = new Date().toISOString();
    } else if (status === 'REFUNDED') {
      updateData.refunded_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('escrows')
      .update(updateData)
      .eq('id', escrowId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update escrow: ${error.message}`);
    }

    return data!;
  }

  async getEscrowsByEmployer(employerId: string): Promise<Escrow[]> {
    const { data, error } = await supabase
      .from('escrows')
      .select('*')
      .eq('employer_id', employerId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get escrows: ${error.message}`);
    }

    return data || [];
  }

  async getEscrowsByFreelancer(freelancerId: string): Promise<Escrow[]> {
    const { data, error } = await supabase
      .from('escrows')
      .select('*')
      .eq('freelancer_id', freelancerId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get escrows: ${error.message}`);
    }

    return data || [];
  }

  // Check if escrow can be released
  async canReleaseEscrow(escrowId: string, userId: string): Promise<boolean> {
    const escrow = await this.getEscrowById(escrowId);
    if (!escrow) return false;

    // For now, simple check - in production, implement proper multi-sig logic
    return escrow.status === 'LOCKED';
  }

  // Release escrow (alias for updateEscrowStatus)
  async releaseEscrow(escrowId: string): Promise<Escrow> {
    return this.updateEscrowStatus(escrowId, 'RELEASED');
  }

  // Sign escrow release (alias for signRelease)
  async signEscrowRelease(escrowId: string, signerId: string): Promise<Escrow> {
    return this.signRelease(escrowId, signerId);
  }
}

export const escrowService = new EscrowService();
