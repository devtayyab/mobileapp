-- Drop ALL existing policies on profiles to ensure a clean slate
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles; -- In case this exists

-- Create simple, non-recursive policies for profiles

-- 1. View: Allow users to view their own profile. 
--    Also allow viewing other profiles if needed for UI (e.g. supplier info), 
--    but for now let's be permissive to unblock 'infinite recursion'.
--    Using 'true' for SELECT avoids recursion.
CREATE POLICY "Profiles are viewable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- 2. Update: Users can ONLY update their own profile.
--    This is non-recursive as it only checks auth.uid() vs id.
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. Insert: Users can insert their own profile (e.g. on signup trigger).
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
