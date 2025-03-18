'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function SupabaseExample() {
  const [loading, setLoading] = useState(true)
  const [testData, setTestData] = useState<any[]>([])
  const [name, setName] = useState('')

  useEffect(() => {
    fetchTestData()
  }, [])

  async function fetchTestData() {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('test_table')
        .select('*')
      
      if (error) throw error
      
      if (data) {
        setTestData(data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function addTestData() {
    try {
      if (!name) return

      const { data, error } = await supabase
        .from('test_table')
        .insert([{ name }])
        .select()
      
      if (error) throw error
      
      setName('')
      fetchTestData()
    } catch (error) {
      console.error('Error adding data:', error)
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Supabase Example</h2>
      
      <div className="mb-6">
        <div className="flex mb-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter a name"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addTestData}
            className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add
          </button>
        </div>
      </div>
      
      <div>
        <h3 className="text-xl font-semibold mb-2">Data from test_table:</h3>
        {loading ? (
          <p>Loading...</p>
        ) : testData.length === 0 ? (
          <p>No data found. Add some data using the form above.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {testData.map((item) => (
              <li key={item.id} className="py-2">
                {item.id}: {item.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
} 