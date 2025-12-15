export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          wallet_address: string
          did: string | null
          role: 'EMPLOYER' | 'FREELANCER'
          kyc_status: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED'
          kyc_submitted_at: string | null
          kyc_approved_at: string | null
          kyc_level: number
          reputation_nft_policy_id: string | null
          reputation_nft_asset_name: string | null
          reputation_nft_tx_hash: string | null
          reputation_utxo_ref: string | null
          reputation_score: number
          trust_score: number
          total_jobs: number
          completed_jobs: number
          cancelled_jobs: number
          dispute_count: number
          username: string | null
          email: string | null
          bio: string | null
          skills: string[] | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          wallet_address: string
          did?: string | null
          role: 'EMPLOYER' | 'FREELANCER'
          kyc_status?: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED'
          kyc_submitted_at?: string | null
          kyc_approved_at?: string | null
          kyc_level?: number
          reputation_nft_policy_id?: string | null
          reputation_nft_asset_name?: string | null
          reputation_nft_tx_hash?: string | null
          reputation_utxo_ref?: string | null
          reputation_score?: number
          trust_score?: number
          total_jobs?: number
          completed_jobs?: number
          cancelled_jobs?: number
          dispute_count?: number
          username?: string | null
          email?: string | null
          bio?: string | null
          skills?: string[] | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          wallet_address?: string
          did?: string | null
          role?: 'EMPLOYER' | 'FREELANCER'
          kyc_status?: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED'
          kyc_submitted_at?: string | null
          kyc_approved_at?: string | null
          kyc_level?: number
          reputation_nft_policy_id?: string | null
          reputation_nft_asset_name?: string | null
          reputation_nft_tx_hash?: string | null
          reputation_utxo_ref?: string | null
          reputation_score?: number
          trust_score?: number
          total_jobs?: number
          completed_jobs?: number
          cancelled_jobs?: number
          dispute_count?: number
          username?: string | null
          email?: string | null
          bio?: string | null
          skills?: string[] | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          tx_hash: string | null
          utxo_ref: string | null
          employer_id: string
          employer_did: string
          job_id: string
          title: string
          description: string
          description_hash: string
          category: string | null
          skills: string[] | null
          budget_min: number
          budget_max: number
          currency: string
          deadline: string | null
          status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'CLOSED'
          is_active: boolean
          kyc_required: boolean
          script_address: string | null
          created_at: string
          updated_at: string
          closed_at: string | null
        }
        Insert: {
          id?: string
          tx_hash?: string | null
          utxo_ref?: string | null
          employer_id: string
          employer_did: string
          job_id: string
          title: string
          description: string
          description_hash: string
          category?: string | null
          skills?: string[] | null
          budget_min: number
          budget_max: number
          currency?: string
          deadline?: string | null
          status?: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'CLOSED'
          is_active?: boolean
          kyc_required?: boolean
          script_address?: string | null
          created_at?: string
          updated_at?: string
          closed_at?: string | null
        }
        Update: {
          id?: string
          tx_hash?: string | null
          utxo_ref?: string | null
          employer_id?: string
          employer_did?: string
          job_id?: string
          title?: string
          description?: string
          description_hash?: string
          category?: string | null
          skills?: string[] | null
          budget_min?: number
          budget_max?: number
          currency?: string
          deadline?: string | null
          status?: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'CLOSED'
          is_active?: boolean
          kyc_required?: boolean
          script_address?: string | null
          created_at?: string
          updated_at?: string
          closed_at?: string | null
        }
      }
      bids: {
        Row: {
          id: string
          tx_hash: string | null
          job_id: string
          freelancer_id: string
          freelancer_did: string
          amount: number
          currency: string
          proposal: string
          delivery_time: number
          milestones: Json | null
          status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN'
          created_at: string
          updated_at: string
          accepted_at: string | null
          rejected_at: string | null
        }
        Insert: {
          id?: string
          tx_hash?: string | null
          job_id: string
          freelancer_id: string
          freelancer_did: string
          amount: number
          currency?: string
          proposal: string
          delivery_time: number
          milestones?: Json | null
          status?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN'
          created_at?: string
          updated_at?: string
          accepted_at?: string | null
          rejected_at?: string | null
        }
        Update: {
          id?: string
          tx_hash?: string | null
          job_id?: string
          freelancer_id?: string
          freelancer_did?: string
          amount?: number
          currency?: string
          proposal?: string
          delivery_time?: number
          milestones?: Json | null
          status?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN'
          created_at?: string
          updated_at?: string
          accepted_at?: string | null
          rejected_at?: string | null
        }
      }
      proposals: {
        Row: {
          id: string
          job_id: string
          freelancer_id: string
          amount: number
          proposal_text: string
          status: 'pending' | 'accepted' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          freelancer_id: string
          amount: number
          proposal_text: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          freelancer_id?: string
          amount?: number
          proposal_text?: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
      escrows: {
        Row: {
          id: string
          tx_hash: string
          utxo_ref: string | null
          employer_id: string
          employer_did: string
          freelancer_id: string
          freelancer_did: string
          arbiter_address: string
          job_id: string
          bid_id: string | null
          amount: number
          currency: string
          job_ref: string
          required_signatures: number
          employer_signed: boolean
          freelancer_signed: boolean
          arbiter_signed: boolean
          status: 'CREATED' | 'LOCKED' | 'RELEASED' | 'REFUNDED' | 'DISPUTED' | 'CANCELLED'
          script_address: string | null
          policy_id: string
          asset_name: string
          release_tx_hash: string | null
          refund_tx_hash: string | null
          created_at: string
          updated_at: string
          locked_at: string | null
          released_at: string | null
          disputed_at: string | null
        }
        Insert: {
          id?: string
          tx_hash: string
          utxo_ref?: string | null
          employer_id: string
          employer_did: string
          freelancer_id: string
          freelancer_did: string
          arbiter_address: string
          job_id: string
          bid_id?: string | null
          amount: number
          currency?: string
          job_ref: string
          required_signatures?: number
          employer_signed?: boolean
          freelancer_signed?: boolean
          arbiter_signed?: boolean
          status?: 'CREATED' | 'LOCKED' | 'RELEASED' | 'REFUNDED' | 'DISPUTED' | 'CANCELLED'
          script_address?: string | null
          policy_id: string
          asset_name: string
          release_tx_hash?: string | null
          refund_tx_hash?: string | null
          created_at?: string
          updated_at?: string
          locked_at?: string | null
          released_at?: string | null
          disputed_at?: string | null
        }
        Update: {
          id?: string
          tx_hash?: string
          utxo_ref?: string | null
          employer_id?: string
          employer_did?: string
          freelancer_id?: string
          freelancer_did?: string
          arbiter_address?: string
          job_id?: string
          bid_id?: string | null
          amount?: number
          currency?: string
          job_ref?: string
          required_signatures?: number
          employer_signed?: boolean
          freelancer_signed?: boolean
          arbiter_signed?: boolean
          status?: 'CREATED' | 'LOCKED' | 'RELEASED' | 'REFUNDED' | 'DISPUTED' | 'CANCELLED'
          script_address?: string | null
          policy_id?: string
          asset_name?: string
          release_tx_hash?: string | null
          refund_tx_hash?: string | null
          created_at?: string
          updated_at?: string
          locked_at?: string | null
          released_at?: string | null
          disputed_at?: string | null
        }
      }
      chat_rooms: {
        Row: {
          id: string
          room_id: string
          participant1_id: string
          participant2_id: string
          job_id: string | null
          last_message_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          room_id: string
          participant1_id: string
          participant2_id: string
          job_id?: string | null
          last_message_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          participant1_id?: string
          participant2_id?: string
          job_id?: string | null
          last_message_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          room_id: string
          sender_id: string
          sender_address: string
          content: string
          message_type: 'text' | 'system' | 'file'
          read_by_participant1: boolean
          read_by_participant2: boolean
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          sender_id: string
          sender_address: string
          content: string
          message_type?: 'text' | 'system' | 'file'
          read_by_participant1?: boolean
          read_by_participant2?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          sender_id?: string
          sender_address?: string
          content?: string
          message_type?: 'text' | 'system' | 'file'
          read_by_participant1?: boolean
          read_by_participant2?: boolean
          created_at?: string
        }
      }
      reputation_nfts: {
        Row: {
          id: string
          user_id: string
          policy_id: string
          asset_name: string
          tx_hash: string
          reputation_score: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          policy_id: string
          asset_name: string
          tx_hash: string
          reputation_score?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          policy_id?: string
          asset_name?: string
          tx_hash?: string
          reputation_score?: number
          created_at?: string
        }
      }
      reputation_updates: {
        Row: {
          id: string
          user_id: string
          tx_hash: string
          job_id: string | null
          rating: number | null
          amount: number | null
          completed: boolean | null
          previous_score: number | null
          new_score: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tx_hash: string
          job_id?: string | null
          rating?: number | null
          amount?: number | null
          completed?: boolean | null
          previous_score?: number | null
          new_score?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tx_hash?: string
          job_id?: string | null
          rating?: number | null
          amount?: number | null
          completed?: boolean | null
          previous_score?: number | null
          new_score?: number | null
          created_at?: string
        }
      }
    }
  }
}
