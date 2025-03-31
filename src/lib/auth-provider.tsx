'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase } from './supabase';
import { Session, User } from '@supabase/supabase-js';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ error: any, data: any }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Test user for development mode
const TEST_USER_EMAIL = 'j.agbodo@mail.com';
const TEST_USER_PASSWORD = 'password123';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for active session on mount
    const getSession = async () => {
      try {
        setLoading(true);
        
        // In development, try to sign in with test user automatically
        if (process.env.NODE_ENV === 'development') {
          console.log('Development mode: Attempting to use test user account');
          
          // Try to sign in with test credentials
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: TEST_USER_EMAIL,
            password: TEST_USER_PASSWORD,
          });
          
          if (!signInError && signInData.session) {
            console.log('Signed in as test user');
            setSession(signInData.session);
            setUser(signInData.user);
            setLoading(false);
            return;
          } else {
            console.log('Could not sign in as test user, falling back to normal session check');
          }
        }
        
        // Normal session check for production or if development login fails
        const { data, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        setSession(data.session);
        setUser(data.session?.user || null);
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      // In development, always use test user
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Using test user for sign in');
        const { error } = await supabase.auth.signInWithPassword({
          email: TEST_USER_EMAIL,
          password: TEST_USER_PASSWORD,
        });
        return { error };
      }
      
      // Normal sign in for production
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      return { error };
    } catch (error) {
      console.error('Error signing in:', error);
      return { error };
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string) => {
    try {
      // In development, use test user
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Using test user for sign up');
        // Simulate a successful sign up by signing in with test user
        const { data, error } = await supabase.auth.signInWithPassword({
          email: TEST_USER_EMAIL,
          password: TEST_USER_PASSWORD,
        });
        
        return { 
          data: { 
            user: data?.user || null, 
            session: data?.session || null
          }, 
          error 
        };
      }
      
      // Normal sign up for production
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/sign-up/account-creation`,
        },
      });
      
      return { data, error };
    } catch (error) {
      console.error('Error signing up:', error);
      return { data: null, error };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      // In development, just clear local state but don't actually sign out
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Simulating sign out');
        return;
      }
      
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    session,
    user,
    loading,
    signIn,
    signOut,
    signUp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 