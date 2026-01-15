/*
  # Create Profile Trigger

  ## Purpose
  Automatically create a profile entry in the profiles table when a new user signs up via Supabase Auth.

  ## Changes
  1. Creates a trigger function that:
     - Extracts user data from auth.users
     - Inserts a new row into profiles table
     - Sets default role to 'customer'
  
  2. Attaches trigger to auth.users table on INSERT events

  ## Security
  - Function runs with security definer privileges
  - Only executes on new user creation
*/

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    'customer',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();