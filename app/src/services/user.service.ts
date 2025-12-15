import { supabase } from '@/app/src/lib/supabase';
import { Database } from '@/app/src/lib/database.types';

type User = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];
type UserUpdate = Database['public']['Tables']['users']['Update'];

export class UserService {
  async getOrCreateUser(walletAddress: string, role: 'EMPLOYER' | 'FREELANCER'): Promise<User> {
    // Check if user exists
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (existingUser) {
      return existingUser;
    }

    // Debug logging
    console.log('Creating user with role:', role);
    console.log('Role type:', typeof role);
    console.log('Wallet address:', walletAddress);

    // Create new user if not found
    const newUser: UserInsert = {
      wallet_address: walletAddress,
      role: role,
      reputation_score: 0,
    };
    
    console.log('User insert data:', newUser);

    const { data: createdUser, error: createError } = await supabase
      .from('users')
      .insert(newUser)
      .select()
      .single();

    if (createError) {
      console.error('Create error details:', createError);
      console.error('Error code:', createError.code);
      console.error('Error hint:', createError.hint);
      console.error('Error details:', createError.details);
      throw new Error(`Failed to create user: ${createError.message} (Code: ${createError.code})`);
    }

    console.log('User created successfully:', createdUser);
    return createdUser!;
  }

  async getUserByAddress(walletAddress: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // User not found
      }
      throw new Error(`Failed to get user: ${error.message}`);
    }

    return data;
  }

  async getUserById(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get user: ${error.message}`);
    }

    return data;
  }

  async updateProfile(userId: string, updates: UserUpdate): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }

    return data!;
  }

  async updateReputation(userId: string, newScore: number): Promise<User> {
    return this.updateProfile(userId, { reputation_score: newScore });
  }

  async updateKYC(userId: string, kycData: { kyc_verified: boolean; kyc_did?: string }): Promise<User> {
    return this.updateProfile(userId, kycData);
  }

  async updateReputationNFT(userId: string, nftId: string): Promise<User> {
    return this.updateProfile(userId, { reputation_nft_id: nftId });
  }

  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get users: ${error.message}`);
    }

    return data || [];
  }

  // Update KYC status by wallet address
  async updateKYCStatus(walletAddress: string, verified: boolean): Promise<User> {
    const user = await this.getUserByAddress(walletAddress);
    if (!user) {
      throw new Error('User not found');
    }
    const status = verified ? 'APPROVED' : 'PENDING';
    return this.updateProfile(user.id, { 
      kyc_status: status,
      kyc_approved_at: verified ? new Date().toISOString() : null 
    });
  }
}

export const userService = new UserService();
