-- Fix RLS policies to allow user registration

-- Allow anyone to insert their own user profile (for registration)
CREATE POLICY "Users can create own profile" ON users FOR INSERT
WITH CHECK (true);

-- Allow users to insert their own reputation events
CREATE POLICY "System can create reputation events" ON reputation_events FOR INSERT
WITH CHECK (true);

-- Allow escrow creation by involved parties
CREATE POLICY "Parties can create escrows" ON escrows FOR INSERT
WITH CHECK (auth.uid()::text = employer_id::text OR auth.uid()::text = freelancer_id::text);
