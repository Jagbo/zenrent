'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AccountCreationTest() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // Test data
  const testUserProfile = {
    title: 'mr',
    first_name: 'John',
    last_name: 'Doe',
    phone: '+447700900123',
    account_type: 'individual'
  }

  useEffect(() => {
    // For testing, use the test user ID
    setUserId('00000000-0000-0000-0000-000000000001')
  }, [])

  // Test creating a user profile
  async function testCreateUserProfile() {
    if (!userId) {
      setError('No user ID available')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setResult('')

      // Check if user_profiles table exists
      const { error: tableCheckError } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1)

      // Log the table check result
      console.log('Table check result:', tableCheckError)
      
      // If table doesn't exist, try to create it
      if (tableCheckError && tableCheckError.message.includes('relation "user_profiles" does not exist')) {
        console.log('Table does not exist, creating...')
        
        // Call the stored procedure to create the table
        const { error: createTableError } = await supabase.rpc('create_user_profiles_table')
        
        if (createTableError) {
          throw new Error(`Failed to create user_profiles table: ${createTableError.message}`)
        }
        
        console.log('Table created successfully')
      }

      // Insert the test profile data
      const { data, error: insertError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          ...testUserProfile,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()

      if (insertError) {
        throw new Error(`Failed to create profile: ${insertError.message}`)
      }

      // Fetch the profile to verify it was created
      const { data: profileData, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)

      if (fetchError) {
        throw new Error(`Failed to fetch profile: ${fetchError.message}`)
      }

      setResult(JSON.stringify(profileData, null, 2))
    } catch (error) {
      console.error('Error in test:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow">
      <h1 className="text-xl font-bold mb-4">Account Creation Test</h1>
      
      <div className="mb-4">
        <p>Test User ID: {userId || 'None'}</p>
      </div>
      
      <button
        onClick={testCreateUserProfile}
        disabled={loading || !userId}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Account Creation'}
      </button>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      {result && (
        <div className="mb-4">
          <p className="font-bold mb-2">Result:</p>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-80">
            {result}
          </pre>
        </div>
      )}
    </div>
  )
} 