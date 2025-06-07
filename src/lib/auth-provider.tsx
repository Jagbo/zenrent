"use client";

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Session, User, AuthError, AuthResponse } from "@supabase/supabase-js";
import { MFAService } from "@/lib/services/mfa";

export async function getCurrentUserId(): Promise<string | null> {
  const supabase = createClientComponentClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user?.id || null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  mfaRequired: boolean;
  mfaVerified: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (
    email: string,
    password: string,
  ) => Promise<AuthResponse>;
  signInWithGoogle: () => Promise<{ error: unknown }>;
  signInWithFacebook: () => Promise<{ error: unknown }>;
  refreshMFAStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  mfaRequired: false,
  mfaVerified: false,
  signIn: async () => {},
  signOut: async () => {},
  signUp: async () => ({ data: { user: null, session: null }, error: null }),
  signInWithGoogle: async () => ({ error: null }),
  signInWithFacebook: async () => ({ error: null }),
  refreshMFAStatus: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaVerified, setMfaVerified] = useState(false);
  const supabase = createClientComponentClient();

  const checkMFAStatus = async (currentUser: User) => {
    try {
      // Only check MFA status if we have a valid user
      if (!currentUser) {
        setMfaRequired(false);
        setMfaVerified(true);
        return;
      }

      const mfaRequired = await MFAService.isMFARequired();
      const mfaStatus = await MFAService.getUserMFAStatus();
      
      setMfaRequired(mfaRequired);
      
      // Check if MFA verification is needed
      let mfaVerified = true;
      if (mfaRequired && mfaStatus.isEnrolled) {
        // Check if user has completed MFA recently
        const { data: preferences } = await supabase
          .from('user_mfa_preferences')
          .select('last_mfa_login')
          .eq('user_id', currentUser.id)
          .single();

        if (preferences?.last_mfa_login) {
          const lastMfaTime = new Date(preferences.last_mfa_login).getTime();
          const now = new Date().getTime();
          const sessionDuration = 8 * 60 * 60 * 1000; // 8 hours
          mfaVerified = now - lastMfaTime < sessionDuration;
        } else {
          mfaVerified = false;
        }
      }
      
      setMfaVerified(mfaVerified);
    } catch (error) {
      console.error('Error checking MFA status:', error);
      setMfaRequired(false);
      setMfaVerified(true);
    }
  };

  useEffect(() => {
    // Get initial session with error handling
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await checkMFAStatus(session.user);
      }
      
      setLoading(false);
    }).catch(error => {
      console.error("Error getting auth session:", error);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await checkMFAStatus(session.user);
      } else {
        setMfaRequired(false);
        setMfaVerified(false);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      return { error };
    } catch (error) {
      console.error("Error signing in with Google:", error);
      return { error };
    }
  };

  // Sign in with Facebook
  const signInWithFacebook = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "facebook",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          scopes: "email,public_profile",
        },
      });

      return { error };
    } catch (error) {
      console.error("Error signing in with Facebook:", error);
      return { error };
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/sign-up/email-verification`,
        },
      });

      return response;
    } catch (error) {
      console.error("Error during sign up:", error);
      return { data: { user: null, session: null }, error: error as AuthError };
    }
  };

  const refreshMFAStatus = async () => {
    if (user) {
      await checkMFAStatus(user);
    } else {
      // Reset MFA state when no user
      setMfaRequired(false);
      setMfaVerified(true);
    }
  };

  const value = {
    session,
    user,
    loading,
    mfaRequired,
    mfaVerified,
    signIn,
    signOut,
    signUp,
    signInWithGoogle,
    signInWithFacebook,
    refreshMFAStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
