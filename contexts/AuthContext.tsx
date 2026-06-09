import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, Database } from '@/lib/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, phone: string, password: string) => Promise<{ data: any; error: any }>;
  signUp: (email: string, phone: string, password: string, role?: 'customer' | 'b2b' | 'supplier', name?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        }
        setLoading(false);
      })();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile not found, this might happen immediately after signup before trigger runs
          // We can retry or just wait.
          setProfile(null);
        } else {
          console.error('Error fetching profile:', error);
        }
      }

      if (data) {
        setProfile(data);
      }
    } catch (e) {
      console.error('Exception fetching profile:', e);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const signIn = async (email: string, phone: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error || !data.user) {
      return { data, error };
    }

    // Verify phone number matches the user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('phone')
      .eq('id', data.user.id)
      .single();

    if (!profile || profile.phone !== phone) {
      await supabase.auth.signOut();
      return { data: null, error: new Error('Phone number does not match our records.') };
    }

    return { data, error: null };
  };

  const signUp = async (email: string, phone: string, password: string, role: 'customer' | 'b2b' | 'supplier' = 'customer', name?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name || '', phone },
      },
    });

    if (data.user && !error) {
      const updateData: any = { role };
      if (name) updateData.full_name = name;
      if (phone) updateData.phone = phone;
      
      await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', data.user.id);

      await supabase.auth.signOut();
    }

    return { error };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setUser(null);
      setProfile(null);
      setSession(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
