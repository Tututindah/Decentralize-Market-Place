-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('freelancer', 'employer', 'both')),
    reputation_score INTEGER DEFAULT 0,
    total_jobs_completed INTEGER DEFAULT 0,
    total_jobs_posted INTEGER DEFAULT 0,
    kyc_verified BOOLEAN DEFAULT FALSE,
    profile_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jobs table
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employer_id UUID NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    budget NUMERIC(20, 2) NOT NULL,
    currency TEXT DEFAULT 'ADA',
    duration TEXT NOT NULL,
    skills_required TEXT[] DEFAULT ARRAY[]::TEXT[],
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
    blockchain_tx_hash TEXT,
    escrow_address TEXT,
    selected_proposal_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Proposals table
CREATE TABLE proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    freelancer_id UUID NOT NULL REFERENCES users(id),
    cover_letter TEXT NOT NULL,
    proposed_budget NUMERIC(20, 2) NOT NULL,
    estimated_duration TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    blockchain_tx_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(job_id, freelancer_id)
);

-- Escrows table
CREATE TABLE escrows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id),
    employer_id UUID NOT NULL REFERENCES users(id),
    freelancer_id UUID NOT NULL REFERENCES users(id),
    amount NUMERIC(20, 2) NOT NULL,
    currency TEXT DEFAULT 'ADA',
    status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'funded', 'released', 'refunded', 'disputed')),
    blockchain_address TEXT NOT NULL,
    funding_tx_hash TEXT,
    release_tx_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reputation events table
CREATE TABLE reputation_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    event_type TEXT NOT NULL CHECK (event_type IN ('job_completed', 'job_posted', 'positive_review', 'negative_review', 'kyc_verified')),
    points INTEGER NOT NULL,
    reference_id UUID,
    blockchain_tx_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_jobs_employer ON jobs(employer_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_proposals_job ON proposals(job_id);
CREATE INDEX idx_proposals_freelancer ON proposals(freelancer_id);
CREATE INDEX idx_escrows_job ON escrows(job_id);
CREATE INDEX idx_reputation_user ON reputation_events(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON proposals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_escrows_updated_at BEFORE UPDATE ON escrows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrows ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputation_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read all profiles but only update their own
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Jobs are publicly readable, only employers can create/update their own
CREATE POLICY "Jobs are publicly readable" ON jobs FOR SELECT USING (true);
CREATE POLICY "Employers can create jobs" ON jobs FOR INSERT WITH CHECK (auth.uid()::text = employer_id::text);
CREATE POLICY "Employers can update own jobs" ON jobs FOR UPDATE USING (auth.uid()::text = employer_id::text);

-- Proposals are visible to job owner and proposal creator
CREATE POLICY "View own proposals or job owner" ON proposals FOR SELECT 
    USING (auth.uid()::text = freelancer_id::text OR 
           auth.uid()::text IN (SELECT employer_id::text FROM jobs WHERE id = job_id));
CREATE POLICY "Freelancers can create proposals" ON proposals FOR INSERT 
    WITH CHECK (auth.uid()::text = freelancer_id::text);

-- Escrows visible to parties involved
CREATE POLICY "View escrows if involved" ON escrows FOR SELECT 
    USING (auth.uid()::text = employer_id::text OR auth.uid()::text = freelancer_id::text);

-- Reputation events are publicly readable
CREATE POLICY "Reputation events are public" ON reputation_events FOR SELECT USING (true);
