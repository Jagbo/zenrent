import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from './supabase';

// Define user type
export interface User {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
  };
}

// Define auth context type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// Create auth context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {}
});

// Mock user for development
const MOCK_USER: User = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'j.agbodo@gmail.com',
  user_metadata: {
    name: 'James Agbodo'
  }
};

// Auth provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In development mode, use the mock user
    if (process.env.NODE_ENV === 'development') {
      console.log('Using mock user for development');
      setUser(MOCK_USER);
      setLoading(false);
      return;
    }

    // In production, check for active session
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      
      if (data.session) {
        const { data: userData } = await supabase.auth.getUser();
        setUser(userData.user as User);
      }
      
      setLoading(false);
    };

    checkSession();

    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const { data: userData } = await supabase.auth.getUser();
        setUser(userData.user as User);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Mock sign in for development');
      setUser(MOCK_USER);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Mock sign out for development');
      // In development mode, we actually keep the user logged in
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Return provider with auth context
  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// Auth hook for components
export const useAuth = () => useContext(AuthContext);

// Temporary function to simulate authentication for testing (not needed anymore)
export const testAuth = async () => {
  console.log('testAuth is deprecated, using mock user instead');
}; 